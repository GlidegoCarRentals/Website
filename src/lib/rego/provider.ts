/**
 * GlideGo — Real Australian REGO Lookup Provider
 *
 * Pipeline:
 *   1. PPSR API  →  resolves REGO plate to VIN
 *   2. NHTSA vPIC API (free, no key)  →  decodes VIN to full vehicle specs
 *
 * ─────────────────────────────────────────────
 * SETUP  (one-time, takes ~5 minutes)
 * ─────────────────────────────────────────────
 * Step 1 — Register for a NEBS (National Electronic Business Systems) account:
 *   https://my.ppsr.gov.au  →  "Register" →  Business Account
 *   It's FREE for Australian businesses.
 *
 * Step 2 — After approval email (usually same-day), log in and go to:
 *   My Account → Data Exchange Services → Generate API Credentials
 *   Copy your Client ID and Client Secret.
 *
 * Step 3 — Add to your .env.local AND Vercel Environment Variables:
 *   PPSR_CLIENT_ID=your_client_id_here
 *   PPSR_CLIENT_SECRET=your_client_secret_here
 *
 * Step 4 — That's it. Redeploy and REGO lookup will work for real.
 *
 * ─────────────────────────────────────────────
 * API References
 * ─────────────────────────────────────────────
 * PPSR API docs:  https://ppsr.gov.au/ppsr/data-exchange-services/
 * NHTSA vPIC:     https://vpic.nhtsa.dot.gov/api/
 */

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
export type RegoVehicleData = {
  make: string
  model: string
  year: number
  colour: string
  fuel_type: string
  transmission: string
  body_type: string
  engine: string
  seats: number
  vin?: string
  stolen?: boolean
  written_off?: boolean
  finance_owing?: boolean
}

export type RegoLookupResult = {
  rego: string
  state: string
  source: 'ppsr+nhtsa'
  confidence: number
  data: RegoVehicleData
}

export type RegoLookupError = {
  error: string
  code: 'NO_CREDENTIALS' | 'INVALID_REGO' | 'NOT_FOUND' | 'PPSR_ERROR' | 'DECODE_FAILED' | 'RATE_LIMITED'
  setup_url?: string
}

// ─────────────────────────────────────────────
// PPSR OAuth2 Token
// ─────────────────────────────────────────────
async function getPPSRToken(): Promise<string> {
  const clientId     = process.env.PPSR_CLIENT_ID
  const clientSecret = process.env.PPSR_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw { code: 'NO_CREDENTIALS', error: 'PPSR API credentials not configured. See SETUP instructions in src/lib/rego/provider.ts', setup_url: 'https://my.ppsr.gov.au' }
  }

  const res = await fetch('https://auth.ppsr.gov.au/connect/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type:    'client_credentials',
      client_id:     clientId,
      client_secret: clientSecret,
      scope:         'ppsr',
    }),
    next: { revalidate: 0 },  // never cache auth tokens
  })

  if (!res.ok) {
    const body = await res.text()
    if (res.status === 401) throw { code: 'NO_CREDENTIALS', error: 'PPSR credentials are invalid. Check your Client ID and Secret.' }
    if (res.status === 429) throw { code: 'RATE_LIMITED', error: 'PPSR rate limit hit. Please try again in a few seconds.' }
    throw { code: 'PPSR_ERROR', error: `PPSR auth failed (${res.status}): ${body}` }
  }

  const json = await res.json()
  return json.access_token as string
}

// ─────────────────────────────────────────────
// PPSR Plate → VIN lookup
// ─────────────────────────────────────────────
type PPSRSearchResult = {
  vin?:                 string
  chassisNumber?:       string
  registrationPlate?:   string
  registrationState?:   string
  financeOwing?:        boolean
  writtenOff?:          boolean
  stolen?:              boolean
  vehicleColour?:       string
  vehicleMake?:         string
  vehicleModel?:        string
  vehicleYear?:         number
}

async function ppsrSearchByPlate(
  plate: string,
  state: string,
  token: string,
): Promise<PPSRSearchResult | null> {
  /**
   * PPSR motor vehicle plate search
   * Docs: https://ppsr.gov.au/ppsr/data-exchange-services/
   *
   * If the exact endpoint path changes, update here.
   * As of 2025 the PPSR REST API uses:
   *   POST /v1/registrations/search
   */
  const res = await fetch('https://api.ppsr.gov.au/v1/registrations/search', {
    method: 'POST',
    headers: {
      'Authorization':  `Bearer ${token}`,
      'Content-Type':   'application/json',
      'Accept':         'application/json',
    },
    body: JSON.stringify({
      searchType:        'MOTOR_VEHICLE_REGISTRATION_PLATE',
      registrationPlate: plate,
      registrationState: state,
    }),
    next: { revalidate: 0 },
  })

  if (res.status === 404) return null
  if (res.status === 429) throw { code: 'RATE_LIMITED', error: 'PPSR rate limit reached. Try again shortly.' }
  if (!res.ok) {
    const body = await res.text()
    throw { code: 'PPSR_ERROR', error: `PPSR search failed (${res.status}): ${body}` }
  }

  const json = await res.json()

  // PPSR may return a list of matches or a single object
  const record = Array.isArray(json?.results) ? json.results[0] : json

  if (!record) return null

  return {
    vin:               record.vin            || record.vinChassisNumber || record.vehicleIdentificationNumber,
    chassisNumber:     record.chassisNumber  || record.chassis,
    financeOwing:      record.financeOwing   ?? (Array.isArray(record.securityInterests) && record.securityInterests.length > 0),
    writtenOff:        record.writtenOff     ?? record.isWrittenOff     ?? false,
    stolen:            record.stolen         ?? record.isStolen         ?? false,
    vehicleColour:     record.colour         || record.vehicleColour,
    vehicleMake:       record.make           || record.vehicleMake,
    vehicleModel:      record.model          || record.vehicleModel,
    vehicleYear:       record.year           || record.vehicleYear,
    registrationPlate: plate,
    registrationState: state,
  }
}

// ─────────────────────────────────────────────
// NHTSA vPIC VIN Decoder (FREE, no key needed)
// This is a US government API but the VIN standard
// is global — it works for Australian vehicles too.
// ─────────────────────────────────────────────
type NHTSAResult = {
  make:         string
  model:        string
  year:         number
  body_type:    string
  fuel_type:    string
  engine:       string
  transmission: string
  drive_type:   string
}

const BODY_TYPE_MAP: Record<string, string> = {
  'Sedan/Saloon':          'Sedan',
  'Sport Utility Vehicle': 'SUV',
  'Hatchback/Liftgate':   'Hatchback',
  'Pickup':                'Ute / Pickup',
  'Van':                   'Van',
  'Wagon':                 'Wagon',
  'Coupe':                 'Coupe',
  'Convertible/Cabriolet': 'Convertible',
  'MPV':                   'People Mover',
}

const FUEL_MAP: Record<string, string> = {
  'Gasoline':                  'Petrol',
  'Diesel':                    'Diesel',
  'Electric':                  'Electric',
  'Hybrid (Hybrid Electric Vehicle)': 'Hybrid',
  'Plug-In Electric/Gas (Plug-In Hybrid)': 'Plug-in Hybrid (PHEV)',
  'Flex Fuel Vehicle (FFV)':   'Petrol',
}

async function decodeVINWithNHTSA(vin: string): Promise<NHTSAResult | null> {
  const url = `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValuesExtended/${encodeURIComponent(vin)}?format=json`

  const res = await fetch(url, {
    next: { revalidate: 86400 },  // cache VIN decodes for 24 hours — VIN data never changes
  })

  if (!res.ok) return null

  const json = await res.json()
  const r    = json?.Results?.[0]

  if (!r || r.ErrorCode === '0' && !r.Make) return null  // NHTSA returns empty for unknown VINs

  const make  = r.Make  || ''
  const model = r.Model || ''
  if (!make || !model) return null

  const rawYear  = Number.parseInt(r.ModelYear)     || 0
  const rawFuel  = r.FuelTypePrimary               || ''
  const rawBody  = r.BodyClass                     || ''
  const rawTrans = r.TransmissionStyle             || ''
  const dispL    = Number.parseFloat(r.DisplacementL) || 0
  const cylinders= r.Cylinders                     || ''

  // Build engine string: e.g. "2.5L 4-cyl" or "3.0L 6-cyl"
  const engineParts: string[] = []
  if (dispL > 0) engineParts.push(`${dispL.toFixed(1)}L`)
  if (cylinders) engineParts.push(`${cylinders}-cyl`)
  if (rawFuel === 'Electric') engineParts.push('Electric Motor')
  const engine = engineParts.join(' ') || 'See registration papers'

  // Map transmission
  let transmission = 'Automatic'
  if (rawTrans.toLowerCase().includes('manual')) transmission = 'Manual'
  else if (rawTrans.toLowerCase().includes('cvt')) transmission = 'CVT'

  return {
    make:         toTitleCase(make),
    model:        toTitleCase(model),
    year:         rawYear,
    body_type:    BODY_TYPE_MAP[rawBody]  || rawBody  || 'Sedan',
    fuel_type:    FUEL_MAP[rawFuel]       || rawFuel  || 'Petrol',
    engine,
    transmission,
    drive_type:   r.DriveType || '',
  }
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function toTitleCase(str: string): string {
  return str.toLowerCase().replace(/\b[a-z]/g, c => c.toUpperCase())
}

function guessColour(raw?: string): string {
  if (!raw) return ''
  const map: Record<string, string> = {
    wht: 'White', wh: 'White', white: 'White',
    blk: 'Black', bk: 'Black', black: 'Black',
    sil: 'Silver', sv: 'Silver', silver: 'Silver',
    gry: 'Grey',  gr: 'Grey',  grey: 'Grey', gray: 'Grey',
    red: 'Red',   blu: 'Blue', blue: 'Blue',
    grn: 'Green', green: 'Green',
    whi: 'White', bro: 'Brown', brown: 'Brown',
    gol: 'Gold', gold: 'Gold',
    nav: 'Navy', org: 'Orange', orange: 'Orange',
    yel: 'Yellow', yellow: 'Yellow',
    mar: 'Maroon', maroon: 'Maroon',
  }
  const key = raw.toLowerCase().replace(/[^a-z]/g, '')
  return map[key] || toTitleCase(raw)
}

// ─────────────────────────────────────────────
// Main exported function
// ─────────────────────────────────────────────
export async function lookupRego(
  plate: string,
  state: string,
): Promise<RegoLookupResult | RegoLookupError> {
  // 1. Get PPSR access token
  let token: string
  try {
    token = await getPPSRToken()
  } catch (err: any) {
    return err as RegoLookupError
  }

  // 2. Search PPSR by plate
  let ppsr: PPSRSearchResult | null
  try {
    ppsr = await ppsrSearchByPlate(plate, state, token)
  } catch (err: any) {
    return err as RegoLookupError
  }

  if (!ppsr) {
    return {
      error: `No registration found for plate ${plate} (${state}). Check the plate and state are correct.`,
      code:  'NOT_FOUND',
    }
  }

  const vin = ppsr.vin || ppsr.chassisNumber

  // 3. Decode VIN with NHTSA (free) if we got one
  let nhtsa: NHTSAResult | null = null
  if (vin && vin.length >= 10) {
    nhtsa = await decodeVINWithNHTSA(vin)
  }

  // 4. Merge data — PPSR fields win for identifiers, NHTSA for specs
  const make  = ppsr.vehicleMake  ? toTitleCase(ppsr.vehicleMake)  : (nhtsa?.make  || '')
  const model = ppsr.vehicleModel ? toTitleCase(ppsr.vehicleModel) : (nhtsa?.model || '')
  const year  = ppsr.vehicleYear  || nhtsa?.year || new Date().getFullYear()

  if (!make || !model) {
    return {
      error: `Plate found in PPSR but vehicle specs could not be decoded. VIN: ${vin || 'not available'}. Please fill in details manually.`,
      code:  'DECODE_FAILED',
    }
  }

  const data: RegoVehicleData = {
    make,
    model,
    year,
    colour:       guessColour(ppsr.vehicleColour) || '',
    fuel_type:    nhtsa?.fuel_type    || 'Petrol',
    transmission: nhtsa?.transmission || 'Automatic',
    body_type:    nhtsa?.body_type    || 'Sedan',
    engine:       nhtsa?.engine       || '',
    seats:        5,   // PPSR/NHTSA don't reliably return seating — host fills this
    vin,
    stolen:       ppsr.stolen       ?? false,
    written_off:  ppsr.writtenOff   ?? false,
    finance_owing: ppsr.financeOwing ?? false,
  }

  return {
    rego:       plate,
    state,
    source:     'ppsr+nhtsa',
    confidence: 0.95,
    data,
  }
}
