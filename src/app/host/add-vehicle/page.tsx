'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────
const STEPS = [
  { id: 0, label: 'Vehicle Details', icon: '🚗', color: '#3b82f6' },
  { id: 1, label: 'Photos',          icon: '📸', color: '#8b5cf6' },
  { id: 2, label: 'Features',        icon: '✨', color: '#06b6d4' },
  { id: 3, label: 'Pricing',         icon: '💰', color: '#10b981' },
  { id: 4, label: 'Review & Publish',icon: '🚀', color: '#f59e0b' },
]

const AU_STATES   = ['VIC','NSW','QLD','SA','WA','TAS','ACT','NT']
const BODY_TYPES  = ['Sedan','SUV','Hatchback','Ute / Pickup','Wagon','Coupe','Convertible','Van','People Mover','Sports Car']
const GEARBOXES   = ['Automatic','Manual','CVT','Dual-Clutch (DCT)']
const FUELS       = ['Petrol','Diesel','Hybrid','Electric','Plug-in Hybrid (PHEV)']
const SEAT_OPTS   = [2,4,5,6,7,8,9,12]
const MIN_DAYS_OPTS = [1,2,3,5,7]
const MIN_AGE_OPTS  = [18,19,21,25]
const LOCATIONS   = [
  'Melbourne CBD','Melbourne Airport (MEL)','Southbank','St Kilda','Richmond',
  'Docklands','Dandenong','Frankston','Geelong','Brunswick','Fitzroy',
  'Prahran','South Yarra','Toorak','Box Hill','Clayton','Moonee Ponds',
]
const FEATURES_BY_CAT = [
  { cat:'Technology', icon:'📱', items:['Apple CarPlay','Android Auto','Bluetooth','USB Charging','Wireless Charging','Navigation / GPS','Heads Up Display','Dashcam'] },
  { cat:'Comfort',    icon:'🛋️', items:['Heated Seats','Cooled Seats','Leather Seats','Sunroof / Moonroof','Ambient Lighting','Premium Audio','Massage Seats','Memory Seats'] },
  { cat:'Safety',     icon:'🛡️', items:['Reversing Camera','360° Camera','Parking Sensors','Blind Spot Monitor','Auto Emergency Braking','Lane Assist','Cross Traffic Alert','Forward Collision Warning'] },
  { cat:'Performance',icon:'⚙️', items:['AWD / 4WD','Cruise Control','Adaptive Cruise Control','Keyless Entry','Push Button Start','Remote Start','Automatic Headlights','Rain Sensing Wipers'] },
  { cat:'Extras',     icon:'🎒', items:['Tow Bar','Roof Rack','Child Seat Anchor','Pet Friendly','Toll Pass Included','EV Charging Cable','Spare Tyre','First Aid Kit'] },
]

const CY = new Date().getFullYear()

// ─────────────────────────────────────────────
// Mock REGO Lookup (Demo Data)
//
// ⚠️  TODO — REAL API INTEGRATION:
//   1. Create /api/rego/lookup route
//   2. POST { rego, state } to PPSR or VicRoads API
//      (https://ppsr.gov.au/api-documentation)
//   3. Parse response and return same shape as below
//   4. Replace the mockRegoData() call in
//      handleRegoLookup() with a fetch() call
// ─────────────────────────────────────────────
// Demo REGO lookup — replace with real API when ready
// ─────────────────────────────────────────────
function mockRegoData(rego: string): Partial<Form> {
  const r = rego.toUpperCase()
  if (r[0] === 'T' || r[0] === '1')
    return { make:'Toyota',        model:'Camry',      year:2022, colour:'Platinum White', body_type:'Sedan',        engine:'2.5L Hybrid 4-cyl',   transmission:'Automatic', fuel_type:'Hybrid',  seats:5 }
  if (r[0] === 'E' || r[0] === '9')
    return { make:'Tesla',         model:'Model 3',    year:2023, colour:'Pearl White',    body_type:'Sedan',        engine:'Dual Motor Electric', transmission:'Automatic', fuel_type:'Electric',seats:5 }
  if (r[0] === 'F' || r[0] === '4')
    return { make:'Ford',          model:'Ranger XLT', year:2023, colour:'Meteor Grey',    body_type:'Ute / Pickup', engine:'2.0L Bi-Turbo Diesel',transmission:'Automatic', fuel_type:'Diesel',  seats:5 }
  if (r[0] === 'B' || r[0] === '7')
    return { make:'BMW',           model:'X5',         year:2022, colour:'Carbon Black',   body_type:'SUV',          engine:'3.0L TwinPower Turbo',transmission:'Automatic', fuel_type:'Petrol',  seats:7 }
  if (r[0] === 'H' || r[0] === 'K')
    return { make:'Hyundai',       model:'i30',        year:2023, colour:'Ceramic White',  body_type:'Hatchback',    engine:'2.0L GDi',            transmission:'Automatic', fuel_type:'Petrol',  seats:5 }
  if (r[0] === 'M' || r[0] === '6')
    return { make:'Mercedes-Benz', model:'GLE 300d',   year:2022, colour:'Obsidian Black', body_type:'SUV',          engine:'2.0L Diesel Turbo',   transmission:'Automatic', fuel_type:'Diesel',  seats:7 }
  if (r[0] === 'N' || r[0] === '5')
    return { make:'Nissan',        model:'X-Trail',    year:2023, colour:'Gun Metallic',   body_type:'SUV',          engine:'1.5L VC-Turbo',       transmission:'Automatic', fuel_type:'Petrol',  seats:7 }
  return   { make:'Toyota',        model:'Corolla',    year:2021, colour:'Silver',          body_type:'Sedan',        engine:'2.0L Dynamic Force',  transmission:'Automatic', fuel_type:'Petrol',  seats:5 }
}

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface Form {
  rego: string; rego_state: string
  make: string; model: string; year: number; colour: string
  body_type: string; engine: string; transmission: string; fuel_type: string; seats: number
  photos: string[]
  features: string[]; description: string
  price_daily: number; price_weekly: number; price_monthly: number
  deposit_amount: number; min_days: number; min_age_years: number
  instant_book: boolean; delivery_available: boolean; delivery_fee: number
  location: string
}
type FieldErrors = Partial<Record<string, string>>

// ─────────────────────────────────────────────
// Per-step Validation
// ─────────────────────────────────────────────
function validateStep(step: number, form: Form): FieldErrors {
  const e: FieldErrors = {}
  if (step === 0) {
    if (!form.make.trim())                                   e.make   = 'Make is required'
    else if (!/^[a-zA-Z0-9 \-\.]+$/.test(form.make))       e.make   = 'Letters, numbers and hyphens only'
    else if (form.make.trim().length < 2)                   e.make   = 'At least 2 characters'

    if (!form.model.trim())                                  e.model  = 'Model is required'
    else if (form.model.trim().length < 1)                  e.model  = 'At least 1 character'

    if (!form.colour.trim())                                 e.colour = 'Colour is required'
    else if (!/^[a-zA-Z ]+$/.test(form.colour))             e.colour = 'Letters only (e.g. Platinum White)'

    if (!form.engine.trim())                                 e.engine = 'Engine spec required (e.g. 2.5L 4-cyl)'
    else if (form.engine.trim().length < 4)                 e.engine = 'Too short — enter full spec'

    if (!form.year || form.year < 2000 || form.year > CY+1) e.year   = `Must be 2000–${CY + 1}`

    if (!form.location.trim())                              e.location = 'Pickup location is required'

    if (form.rego && !/^[A-Z0-9]{2,7}$/.test(form.rego))   e.rego   = '2–7 alphanumeric chars (e.g. ABC123)'
  }
  if (step === 1) {
    if (form.photos.length < 5) e.photos = `Upload ${5 - form.photos.length} more photo(s) to continue`
  }
  if (step === 2) {
    if (form.description.trim() && form.description.trim().length < 30)
      e.description = 'Write at least 30 characters, or leave blank'
  }
  if (step === 3) {
    if (!form.price_daily || form.price_daily < 20)         e.price_daily     = 'Minimum rate is $20/day'
    if (form.price_daily > 2000)                            e.price_daily     = 'Maximum rate is $2,000/day'
    if (!form.deposit_amount || form.deposit_amount < 100)  e.deposit_amount  = 'Minimum bond is $100'
    if (form.deposit_amount > 5000)                         e.deposit_amount  = 'Maximum bond is $5,000'
    if (form.price_weekly && form.price_weekly < form.price_daily * 4)
      e.price_weekly = `Too low — suggested $${Math.round(form.price_daily * 5.5)}`
    if (form.delivery_available && (!form.delivery_fee || form.delivery_fee < 10))
      e.delivery_fee = 'Set a delivery fee of at least $10'
  }
  return e
}

// ─────────────────────────────────────────────
// Small UI helpers
// ─────────────────────────────────────────────
function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null
  return <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1"><span>⚠</span>{msg}</p>
}

function FieldOk({ show }: { show: boolean }) {
  if (!show) return null
  return <span className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-400 text-sm">✓</span>
}

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
      {children}{required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
  )
}

function inputCls(err?: string, ok?: boolean) {
  const base = 'w-full px-4 py-3 bg-zinc-800/80 border rounded-xl text-white placeholder-zinc-600 text-sm outline-none transition-all'
  if (err) return `${base} border-red-500/60 focus:border-red-500 focus:ring-1 focus:ring-red-500/30`
  if (ok)  return `${base} border-emerald-500/40 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20`
  return   `${base} border-zinc-700 hover:border-zinc-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30`
}

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────
export default function AddVehiclePage() {
  const router   = useRouter()
  const { user, profile, loading } = useAuth()
  const supabase = createClient()
  const fileRef  = useRef<HTMLInputElement>(null)
  const dragRef  = useRef<HTMLDivElement>(null)

  const [step,       setStep]       = useState(0)
  const [regoLoad,   setRegoLoad]   = useState(false)
  const [regoOk,     setRegoOk]     = useState(false)
  const [regoWarnings, setRegoWarnings] = useState<string[]>([])
  const [uploading,  setUploading]  = useState(false)
  const [uploadPct,  setUploadPct]  = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [submitted,  setSubmitted]  = useState(false)
  const [drag,       setDrag]       = useState(false)
  const [touched,    setTouched]    = useState<Record<string, boolean>>({})
  const [globalErr,  setGlobalErr]  = useState('')

  const [form, setForm] = useState<Form>({
    rego: '', rego_state: 'VIC',
    make: '', model: '', year: CY, colour: '',
    body_type: 'Sedan', engine: '', transmission: 'Automatic', fuel_type: 'Petrol', seats: 5,
    photos: [],
    features: [], description: '',
    price_daily: 80, price_weekly: 0, price_monthly: 0,
    deposit_amount: 500, min_days: 1, min_age_years: 21,
    instant_book: false, delivery_available: false, delivery_fee: 0,
    location: 'Melbourne CBD',
  })

  // Auth guard
  useEffect(() => {
    if (!loading) {
      if (!user) router.push('/login?redirectTo=/host/add-vehicle')
      else if (profile && profile.role !== 'host' && profile.role !== 'admin')
        router.push('/become-host')
    }
  }, [user, profile, loading, router])

  const set = <K extends keyof Form>(key: K, value: Form[K]) => {
    setForm(p => ({ ...p, [key]: value }))
    setTouched(p => ({ ...p, [key]: true }))
    setGlobalErr('')
  }

  // Real-time per-field validation — derived, no setState in effect
  const errors = useMemo(() => validateStep(step, form), [form, step])

  // ── REGO Lookup — demo mode ──────────────────
  // To activate real PPSR API later:
  // 1. Register at https://my.ppsr.gov.au
  // 2. Add PPSR_CLIENT_ID + PPSR_CLIENT_SECRET to Vercel env vars
  // 3. Switch the body of this function to call /api/rego/lookup
  const handleRegoLookup = async () => {
    const rego = form.rego.trim().toUpperCase()
    if (!rego) { setGlobalErr('Enter your registration number first.'); return }
    if (!/^[A-Z0-9]{2,7}$/.test(rego)) { setGlobalErr('REGO must be 2–7 alphanumeric characters.'); return }

    setRegoLoad(true)
    setGlobalErr('')
    setRegoOk(false)
    setRegoWarnings([])

    await new Promise(r => setTimeout(r, 1200))   // simulate network delay
    const filled = mockRegoData(rego)
    setForm(p => ({ ...p, ...filled }))
    setRegoOk(true)
    setRegoLoad(false)
  }

  // ── Photo Upload ─────────────────────────────
  const uploadFiles = async (files: File[]) => {
    if (!files.length) return
    const remaining = 20 - form.photos.length
    if (remaining <= 0) { setGlobalErr('Maximum 20 photos allowed.'); return }
    const batch = files.slice(0, remaining)

    setUploading(true)
    setGlobalErr('')
    const urls: string[] = []

    for (let i = 0; i < batch.length; i++) {
      const file = batch[i]
      setUploadPct(Math.round(((i) / batch.length) * 100))

      if (!file.type.startsWith('image/')) {
        setGlobalErr(`${file.name} is not an image file.`); continue
      }
      if (file.size > 10 * 1024 * 1024) {
        setGlobalErr(`${file.name} exceeds 10 MB limit.`); continue
      }

      const ext  = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const path = `${user!.id}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`

      const { error: upErr } = await supabase.storage.from('car-photos').upload(path, file, { upsert: false })
      if (upErr) {
        // Fallback: use object URL for preview (won't persist, but unblocks UX)
        urls.push(URL.createObjectURL(file))
        console.warn('Supabase upload error (using local preview):', upErr.message)
        continue
      }
      const { data: { publicUrl } } = supabase.storage.from('car-photos').getPublicUrl(path)
      urls.push(publicUrl)
    }

    setUploadPct(100)
    setForm(p => ({ ...p, photos: [...p.photos, ...urls] }))
    setTimeout(() => { setUploading(false); setUploadPct(0) }, 400)
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    uploadFiles(Array.from(e.target.files || []))
    e.target.value = ''
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDrag(false)
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'))
    if (!files.length) { setGlobalErr('Only image files are accepted.'); return }
    uploadFiles(files)
  }

  // ── Step Navigation ──────────────────────────
  const goNext = () => {
    const e = validateStep(step, form)
    if (Object.keys(e).length > 0) {
      // Mark all fields as touched so errors show
      setTouched(p => ({ ...p, ...Object.fromEntries(Object.keys(e).map(k => [k, true])) }))
      const first = Object.values(e)[0]
      setGlobalErr(first || 'Please fix the errors above before continuing.')
      return
    }
    setGlobalErr('')
    setStep(s => s + 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const goBack = () => {
    setGlobalErr('')
    setStep(s => s - 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // ── Submit ────────────────────────────────────
  const handleSubmit = async () => {
    // Final validation on all steps
    for (let s = 0; s <= 3; s++) {
      const e = validateStep(s, form)
      if (Object.keys(e).length > 0) {
        setGlobalErr(`Please go back and fix errors on step ${s + 1}.`)
        return
      }
    }
    setSubmitting(true)
    setGlobalErr('')

    const { error: err } = await supabase.from('cars').insert({
      host_id:           user!.id,
      rego:              form.rego.trim().toUpperCase() || null,
      rego_state:        form.rego_state,
      make:              form.make.trim(),
      model:             form.model.trim(),
      year:              form.year,
      colour:            form.colour.trim(),
      body_type:         form.body_type,
      engine:            form.engine.trim(),
      transmission:      form.transmission,
      fuel_type:         form.fuel_type,
      seats:             form.seats,
      photos:            form.photos,
      features:          form.features,
      description:       form.description.trim(),
      price_daily:       form.price_daily,
      price_weekly:      form.price_weekly  || Math.round(form.price_daily * 6),
      price_monthly:     form.price_monthly || Math.round(form.price_daily * 22),
      deposit_amount:    form.deposit_amount,
      min_days:          form.min_days,
      min_age_years:     form.min_age_years,
      instant_book:      form.instant_book,
      delivery_available:form.delivery_available,
      delivery_fee:      form.delivery_fee || 0,
      location_name:     form.location,
      latitude:          -37.8136,
      longitude:         144.9631,
      available:         true,
      status:            'active',
      title:             `${form.make} ${form.model}`,
      slug:              `${form.make}-${form.model}-${form.year}-${Date.now()}`.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    })

    setSubmitting(false)
    if (err) { setGlobalErr('Failed to publish: ' + err.message); return }
    setSubmitted(true)
    setTimeout(() => router.push('/host/dashboard?success=car_added'), 2000)
  }

  // ─────────────────────────────────────────────
  // Loading / Auth gates
  // ─────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#06090f' }}>
      <span className="w-8 h-8 border-2 border-zinc-700 border-t-blue-500 rounded-full animate-spin" />
    </div>
  )

  if (submitted) return (
    <div className="min-h-screen flex items-center justify-center flex-col gap-5" style={{ background: '#06090f' }}>
      <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-4xl animate-bounce">🎉</div>
      <h2 className="text-2xl font-bold text-white">Your listing is live!</h2>
      <p className="text-zinc-400 text-sm">Redirecting to dashboard...</p>
    </div>
  )

  // ─────────────────────────────────────────────
  // Derived helpers
  // ─────────────────────────────────────────────
  const isOk  = (key: string) => touched[key] && !errors[key]
  const isErr = (key: string) => !!(touched[key] && errors[key])
  const errMsg = (key: string) => touched[key] ? errors[key] : undefined

  const progressPct = (step / (STEPS.length - 1)) * 100

  // ─────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #06090f 0%, #0a1020 50%, #06090f 100%)', fontFamily: "'Inter', sans-serif" }}>

      {/* ── TOP NAV ── */}
      <div style={{ background: 'rgba(6,9,15,0.85)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.06)', position: 'sticky', top: 0, zIndex: 50, padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{ width: 34, height: 34, background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: 'white', fontSize: 16, boxShadow: '0 0 20px rgba(37,99,235,0.4)' }}>G</div>
          <span style={{ color: 'white', fontWeight: 700, fontSize: 16 }}>GlideGo</span>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {STEPS.map((s, i) => (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: i < step ? 'linear-gradient(135deg,#10b981,#059669)' : i === step ? `linear-gradient(135deg,${s.color},${s.color}cc)` : 'rgba(255,255,255,0.06)', border: i === step ? `2px solid ${s.color}` : '2px solid transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: i <= step ? 'white' : '#475569', transition: 'all 0.3s', boxShadow: i === step ? `0 0 12px ${s.color}60` : 'none' }}>
                  {i < step ? '✓' : i + 1}
                </div>
                {i < STEPS.length - 1 && <div style={{ width: 20, height: 2, background: i < step ? '#10b981' : 'rgba(255,255,255,0.08)', borderRadius: 2, transition: 'all 0.3s' }} />}
              </div>
            ))}
          </div>
          <Link href="/host/dashboard" style={{ padding: '7px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: '#94a3b8', fontSize: 12, textDecoration: 'none', transition: 'all 0.2s' }}>← Dashboard</Link>
        </div>
      </div>

      {/* ── MAIN ── */}
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '36px 20px 80px' }}>

        {/* ── STEP HEADER ── */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10 }}>
            <div style={{ width: 52, height: 52, borderRadius: 16, background: `linear-gradient(135deg, ${STEPS[step].color}22, ${STEPS[step].color}11)`, border: `1px solid ${STEPS[step].color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, boxShadow: `0 0 24px ${STEPS[step].color}30` }}>
              {STEPS[step].icon}
            </div>
            <div>
              <p style={{ fontSize: 11, fontWeight: 600, color: STEPS[step].color, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 3 }}>Step {step + 1} of {STEPS.length}</p>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: 'white', letterSpacing: '-0.5px' }}>{STEPS[step].label}</h1>
            </div>
          </div>
          {/* Progress bar */}
          <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progressPct}%`, background: `linear-gradient(90deg, #3b82f6, ${STEPS[step].color})`, borderRadius: 4, transition: 'width 0.5s ease' }} />
          </div>
        </div>

        {/* ── GLOBAL ERROR ── */}
        {globalErr && (
          <div style={{ marginBottom: 20, padding: '12px 16px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 14, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>⚠️</span>
            <p style={{ color: '#f87171', fontSize: 13, lineHeight: 1.5 }}>{globalErr}</p>
          </div>
        )}

        {/* ── FORM CARD ── */}
        <div style={{ background: 'rgba(13,17,26,0.9)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 24, padding: 32, boxShadow: '0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03)', backdropFilter: 'blur(20px)' }}>

          {/* ══════════════════════════════════════
              STEP 0 — VEHICLE DETAILS
          ══════════════════════════════════════ */}
          {step === 0 && (
            <div>
              {/* REGO Section */}
              <div style={{ background: 'linear-gradient(135deg, rgba(37,99,235,0.08), rgba(139,92,246,0.05))', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 18, padding: 20, marginBottom: 28 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 18 }}>🔍</span>
                  <p style={{ color: 'white', fontWeight: 700, fontSize: 14 }}>Auto-fill from Registration</p>
                  {regoOk && <span style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399', fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, border: '1px solid rgba(52,211,153,0.3)' }}>✓ Auto-filled!</span>}
                </div>
                <p style={{ color: '#64748b', fontSize: 12, marginBottom: 16 }}>Enter your plate number and we&apos;ll pre-fill your vehicle details automatically.</p>

                <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                  <div style={{ flex: 1, position: 'relative' }}>
                    <input
                      type="text"
                      value={form.rego}
                      onChange={e => { set('rego', e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')); setRegoOk(false) }}
                      placeholder="e.g. ABC123"
                      maxLength={7}
                      className={inputCls(errMsg('rego'), isOk('rego'))}
                      style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 15, letterSpacing: '0.1em', textTransform: 'uppercase', paddingRight: 36 }}
                    />
                    <FieldOk show={isOk('rego')} />
                  </div>
                  <select value={form.rego_state} onChange={e => set('rego_state', e.target.value)}
                    style={{ width: 80, padding: '12px 8px', background: 'rgba(30,40,60,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: 'white', fontSize: 13, fontWeight: 700, outline: 'none' }}>
                    {AU_STATES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <FieldError msg={errMsg('rego')} />

                <button
                  onClick={handleRegoLookup}
                  disabled={regoLoad || !form.rego}
                  style={{ width: '100%', padding: '11px', background: regoLoad ? 'rgba(59,130,246,0.1)' : 'linear-gradient(135deg, rgba(37,99,235,0.25), rgba(139,92,246,0.2))', border: '1px solid rgba(59,130,246,0.35)', borderRadius: 12, color: regoLoad ? '#64748b' : '#93c5fd', fontSize: 13, fontWeight: 600, cursor: regoLoad || !form.rego ? 'not-allowed' : 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: !form.rego ? 0.5 : 1 }}>
                  {regoLoad ? (
                    <><span style={{ width: 14, height: 14, border: '2px solid rgba(147,197,253,0.2)', borderTopColor: '#93c5fd', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />Looking up registration...</>
                  ) : (
                    <><span>🔍</span> Auto-fill from Registration</>
                  )}
                </button>
                <p style={{ color: '#334155', fontSize: 10, marginTop: 8, textAlign: 'center' }}>
                  Demo mode — real PPSR API ready to connect when needed
                </p>

                {/* PPSR Warnings (stolen / written-off / finance) */}
                {regoWarnings.length > 0 && (
                  <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {regoWarnings.map((w, i) => {
                      const isAlert = w.startsWith('⚠️')
                      return (
                        <div key={i} style={{ padding: '10px 14px', background: isAlert ? 'rgba(239,68,68,0.08)' : 'rgba(251,191,36,0.08)', border: `1px solid ${isAlert ? 'rgba(239,68,68,0.25)' : 'rgba(251,191,36,0.25)'}`, borderRadius: 10 }}>
                          <p style={{ color: isAlert ? '#f87171' : '#fbbf24', fontSize: 12, fontWeight: 600 }}>{w}</p>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Vehicle Details Grid */}
              <p style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 18 }}>Vehicle Details</p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 18 }}>
                {/* Make */}
                <div>
                  <Label required>Make</Label>
                  <div style={{ position: 'relative' }}>
                    <input type="text" value={form.make}
                      onChange={e => set('make', e.target.value)}
                      onBlur={() => setTouched(p => ({ ...p, make: true }))}
                      placeholder="Toyota"
                      className={inputCls(errMsg('make'), isOk('make'))}
                      style={{ paddingRight: 32 }} />
                    <FieldOk show={isOk('make')} />
                  </div>
                  <FieldError msg={errMsg('make')} />
                </div>

                {/* Model */}
                <div>
                  <Label required>Model</Label>
                  <div style={{ position: 'relative' }}>
                    <input type="text" value={form.model}
                      onChange={e => set('model', e.target.value)}
                      onBlur={() => setTouched(p => ({ ...p, model: true }))}
                      placeholder="Camry"
                      className={inputCls(errMsg('model'), isOk('model'))}
                      style={{ paddingRight: 32 }} />
                    <FieldOk show={isOk('model')} />
                  </div>
                  <FieldError msg={errMsg('model')} />
                </div>

                {/* Colour */}
                <div>
                  <Label required>Colour</Label>
                  <div style={{ position: 'relative' }}>
                    <input type="text" value={form.colour}
                      onChange={e => set('colour', e.target.value.replace(/[^a-zA-Z ]/g, ''))}
                      onBlur={() => setTouched(p => ({ ...p, colour: true }))}
                      placeholder="Platinum White"
                      className={inputCls(errMsg('colour'), isOk('colour'))}
                      style={{ paddingRight: 32 }} />
                    <FieldOk show={isOk('colour')} />
                  </div>
                  <FieldError msg={errMsg('colour')} />
                </div>

                {/* Engine */}
                <div>
                  <Label required>Engine</Label>
                  <div style={{ position: 'relative' }}>
                    <input type="text" value={form.engine}
                      onChange={e => set('engine', e.target.value)}
                      onBlur={() => setTouched(p => ({ ...p, engine: true }))}
                      placeholder="2.5L Hybrid 4-cyl"
                      className={inputCls(errMsg('engine'), isOk('engine'))}
                      style={{ paddingRight: 32 }} />
                    <FieldOk show={isOk('engine')} />
                  </div>
                  <FieldError msg={errMsg('engine')} />
                </div>

                {/* Year */}
                <div>
                  <Label required>Year</Label>
                  <div style={{ position: 'relative' }}>
                    <input type="number" value={form.year}
                      onChange={e => set('year', parseInt(e.target.value) || CY)}
                      onBlur={() => setTouched(p => ({ ...p, year: true }))}
                      min={2000} max={CY + 1}
                      className={inputCls(errMsg('year'), isOk('year'))}
                      style={{ paddingRight: 32 }} />
                    <FieldOk show={isOk('year')} />
                  </div>
                  <FieldError msg={errMsg('year')} />
                </div>

                {/* Seats */}
                <div>
                  <Label required>Seats</Label>
                  <select value={form.seats} onChange={e => set('seats', parseInt(e.target.value))}
                    style={{ width: '100%', padding: '12px 16px', background: 'rgba(30,40,60,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: 'white', fontSize: 14, outline: 'none' }}>
                    {SEAT_OPTS.map(n => <option key={n} value={n}>{n} seats</option>)}
                  </select>
                </div>

                {/* Body Type */}
                <div>
                  <Label required>Body Type</Label>
                  <select value={form.body_type} onChange={e => set('body_type', e.target.value)}
                    style={{ width: '100%', padding: '12px 16px', background: 'rgba(30,40,60,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: 'white', fontSize: 14, outline: 'none' }}>
                    {BODY_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>

                {/* Transmission */}
                <div>
                  <Label required>Transmission</Label>
                  <select value={form.transmission} onChange={e => set('transmission', e.target.value)}
                    style={{ width: '100%', padding: '12px 16px', background: 'rgba(30,40,60,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: 'white', fontSize: 14, outline: 'none' }}>
                    {GEARBOXES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              {/* Fuel Type — full width */}
              <div style={{ marginBottom: 18 }}>
                <Label required>Fuel Type</Label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {FUELS.map(f => {
                    const fuelIcons: Record<string,string> = { Petrol:'⛽', Diesel:'🛢️', Hybrid:'🌿', Electric:'⚡', 'Plug-in Hybrid (PHEV)':'🔌' }
                    const active = form.fuel_type === f
                    return (
                      <button key={f} onClick={() => set('fuel_type', f)}
                        style={{ padding: '9px 16px', borderRadius: 12, border: active ? '1px solid #3b82f6' : '1px solid rgba(255,255,255,0.08)', background: active ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.03)', color: active ? '#93c5fd' : '#64748b', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 5 }}>
                        <span>{fuelIcons[f] || '⛽'}</span>{f}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Pickup Location */}
              <div>
                <Label required>Pickup Location</Label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 15, pointerEvents: 'none' }}>📍</span>
                  <select value={form.location} onChange={e => { set('location', e.target.value); setTouched(p => ({ ...p, location: true })) }}
                    style={{ width: '100%', padding: '12px 16px 12px 40px', background: isOk('location') ? 'rgba(16,185,129,0.05)' : 'rgba(30,40,60,0.8)', border: isOk('location') ? '1px solid rgba(16,185,129,0.4)' : isErr('location') ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: 'white', fontSize: 14, outline: 'none' }}>
                    {LOCATIONS.map(l => <option key={l}>{l}</option>)}
                  </select>
                </div>
                <FieldError msg={errMsg('location')} />
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════
              STEP 1 — PHOTOS
          ══════════════════════════════════════ */}
          {step === 1 && (
            <div>
              <p style={{ color: '#94a3b8', fontSize: 13, marginBottom: 4, lineHeight: 1.7 }}>
                Upload clear, high-quality photos. <strong style={{ color: 'white' }}>Minimum 5 required.</strong>
              </p>
              <p style={{ color: '#475569', fontSize: 12, marginBottom: 20 }}>
                Include: front exterior, rear exterior, driver side, interior cabin, dashboard, odometer, and any unique features.
              </p>

              {/* Drag-drop zone */}
              <div
                ref={dragRef}
                onDragOver={e => { e.preventDefault(); setDrag(true) }}
                onDragLeave={() => setDrag(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
                style={{ border: `2px dashed ${drag ? '#3b82f6' : 'rgba(255,255,255,0.1)'}`, borderRadius: 18, padding: '40px 24px', textAlign: 'center', cursor: 'pointer', background: drag ? 'rgba(59,130,246,0.06)' : 'rgba(255,255,255,0.02)', transition: 'all 0.25s', marginBottom: 20 }}>
                {uploading ? (
                  <div>
                    <div style={{ fontSize: 36, marginBottom: 10 }}>⏫</div>
                    <p style={{ color: 'white', fontWeight: 600, marginBottom: 8 }}>Uploading photos...</p>
                    <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden', maxWidth: 200, margin: '0 auto' }}>
                      <div style={{ height: '100%', width: `${uploadPct}%`, background: 'linear-gradient(90deg,#3b82f6,#8b5cf6)', borderRadius: 4, transition: 'width 0.3s' }} />
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{ fontSize: 40, marginBottom: 10 }}>{drag ? '📂' : '📸'}</div>
                    <p style={{ color: 'white', fontWeight: 700, fontSize: 15, marginBottom: 4 }}>
                      {drag ? 'Drop photos here' : 'Drag & drop or click to upload'}
                    </p>
                    <p style={{ color: '#475569', fontSize: 12 }}>{form.photos.length}/20 uploaded · JPG, PNG, WEBP · Max 10 MB each</p>
                  </>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleFileInput} className="hidden" />

              {/* Photo count indicator */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                {[1,2,3,4,5].map(n => (
                  <div key={n} style={{ width: 32, height: 4, borderRadius: 4, background: form.photos.length >= n ? '#10b981' : 'rgba(255,255,255,0.08)', transition: 'all 0.3s' }} />
                ))}
                <span style={{ fontSize: 11, color: form.photos.length >= 5 ? '#34d399' : '#64748b', fontWeight: 600 }}>
                  {form.photos.length >= 5 ? '✓ Minimum met' : `${form.photos.length}/5 minimum`}
                </span>
              </div>

              {errors.photos && touched.photos_check && (
                <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, marginBottom: 16 }}>
                  <p style={{ color: '#f87171', fontSize: 12 }}>⚠ {errors.photos}</p>
                </div>
              )}

              {/* Photo grid */}
              {form.photos.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                  {form.photos.map((url, i) => (
                    <div key={i} style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', aspectRatio: '16/10', background: '#0d1117', border: i === 0 ? '2px solid #3b82f6' : '1px solid rgba(255,255,255,0.06)' }}
                      onMouseEnter={e => { const btn = e.currentTarget.querySelector('.del-btn') as HTMLElement; if (btn) btn.style.opacity = '1' }}
                      onMouseLeave={e => { const btn = e.currentTarget.querySelector('.del-btn') as HTMLElement; if (btn) btn.style.opacity = '0' }}>
                      <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0)', transition: 'all 0.2s' }} />
                      {i === 0 && (
                        <span style={{ position: 'absolute', bottom: 8, left: 8, background: 'rgba(37,99,235,0.9)', color: 'white', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 8 }}>COVER</span>
                      )}
                      <button className="del-btn" onClick={() => set('photos', form.photos.filter((_, j) => j !== i))}
                        style={{ position: 'absolute', top: 6, right: 6, width: 24, height: 24, background: 'rgba(239,68,68,0.85)', border: 'none', borderRadius: 8, color: 'white', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }}>
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════
              STEP 2 — FEATURES
          ══════════════════════════════════════ */}
          {step === 2 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <p style={{ color: '#94a3b8', fontSize: 13 }}>Select all features your car has. More features = more bookings.</p>
                <span style={{ background: 'rgba(59,130,246,0.15)', color: '#93c5fd', fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 20, border: '1px solid rgba(59,130,246,0.3)' }}>
                  {form.features.length} selected
                </span>
              </div>

              {FEATURES_BY_CAT.map(({ cat, icon, items }) => (
                <div key={cat} style={{ marginBottom: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                    <span style={{ fontSize: 16 }}>{icon}</span>
                    <p style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 13 }}>{cat}</p>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                    {items.map(feat => {
                      const active = form.features.includes(feat)
                      return (
                        <button key={feat}
                          onClick={() => set('features', active ? form.features.filter(f => f !== feat) : [...form.features, feat])}
                          style={{ padding: '7px 13px', borderRadius: 10, border: active ? '1px solid rgba(59,130,246,0.5)' : '1px solid rgba(255,255,255,0.07)', background: active ? 'rgba(59,130,246,0.12)' : 'rgba(255,255,255,0.03)', color: active ? '#93c5fd' : '#64748b', fontSize: 12, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 5 }}>
                          {active && <span style={{ color: '#34d399', fontSize: 10 }}>✓</span>}
                          {feat}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}

              <div style={{ marginTop: 8 }}>
                <Label>Description <span style={{ color: '#475569', fontWeight: 400, textTransform: 'none', fontSize: 11 }}>(optional, 30+ characters)</span></Label>
                <textarea value={form.description}
                  onChange={e => set('description', e.target.value)}
                  onBlur={() => setTouched(p => ({ ...p, description: true }))}
                  rows={4} placeholder="What makes your car special? Ideal use cases, notable features, any guest instructions..."
                  style={{ width: '100%', padding: '14px 16px', background: 'rgba(30,40,60,0.8)', border: isErr('description') ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.08)', borderRadius: 14, color: 'white', fontSize: 13, outline: 'none', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6, boxSizing: 'border-box' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <FieldError msg={errMsg('description')} />
                  <p style={{ fontSize: 11, color: form.description.length >= 30 ? '#34d399' : '#475569', marginTop: 4, marginLeft: 'auto' }}>
                    {form.description.length} chars {form.description.length > 0 && form.description.length < 30 && `(${30 - form.description.length} more needed)`}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════
              STEP 3 — PRICING
          ══════════════════════════════════════ */}
          {step === 3 && (
            <div>
              {/* Daily rate (most important) */}
              <div style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(5,150,105,0.05))', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 18, padding: 20, marginBottom: 24 }}>
                <Label required>Daily Rate</Label>
                <div style={{ position: 'relative', marginBottom: 4 }}>
                  <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#10b981', fontWeight: 700, fontSize: 14 }}>AUD $</span>
                  <input type="number" value={form.price_daily || ''}
                    onChange={e => { const v = parseFloat(e.target.value) || 0; set('price_daily', v); if (!form.price_weekly) set('price_weekly', Math.round(v * 6)); if (!form.price_monthly) set('price_monthly', Math.round(v * 22)) }}
                    onBlur={() => setTouched(p => ({ ...p, price_daily: true }))}
                    min={20} max={2000} placeholder="80"
                    className={inputCls(errMsg('price_daily'), isOk('price_daily'))}
                    style={{ paddingLeft: 68, paddingRight: 36, fontSize: 22, fontWeight: 800 }} />
                  <FieldOk show={isOk('price_daily')} />
                </div>
                <FieldError msg={errMsg('price_daily')} />
                {form.price_daily >= 20 && (
                  <p style={{ color: '#34d399', fontSize: 11, marginTop: 6 }}>
                    💡 Suggested weekly: <strong>${Math.round(form.price_daily * 6)}</strong> · Monthly: <strong>${Math.round(form.price_daily * 22)}</strong>
                  </p>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                {[
                  { label:'Weekly Rate', key:'price_weekly', hint:'~6× daily' },
                  { label:'Monthly Rate', key:'price_monthly', hint:'~22× daily' },
                ].map(({ label, key, hint }) => (
                  <div key={key}>
                    <Label>{label} <span style={{ color: '#334155', fontWeight: 400, textTransform: 'none', fontSize: 10 }}>({hint})</span></Label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#475569', fontWeight: 600, fontSize: 12 }}>AUD $</span>
                      <input type="number" value={form[key as keyof Form] as number || ''}
                        onChange={e => set(key as keyof Form, parseFloat(e.target.value) || 0 as any)}
                        onBlur={() => setTouched(p => ({ ...p, [key]: true }))}
                        placeholder={String(key === 'price_weekly' ? Math.round(form.price_daily * 6) : Math.round(form.price_daily * 22))}
                        className={inputCls(errMsg(key), isOk(key))}
                        style={{ paddingLeft: 58, paddingRight: 32 }} />
                      <FieldOk show={isOk(key)} />
                    </div>
                    <FieldError msg={errMsg(key)} />
                  </div>
                ))}

                <div>
                  <Label required>Security Bond</Label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#475569', fontWeight: 600, fontSize: 12 }}>AUD $</span>
                    <input type="number" value={form.deposit_amount || ''}
                      onChange={e => set('deposit_amount', parseFloat(e.target.value) || 0)}
                      onBlur={() => setTouched(p => ({ ...p, deposit_amount: true }))}
                      min={100} max={5000} placeholder="500"
                      className={inputCls(errMsg('deposit_amount'), isOk('deposit_amount'))}
                      style={{ paddingLeft: 58, paddingRight: 32 }} />
                    <FieldOk show={isOk('deposit_amount')} />
                  </div>
                  <FieldError msg={errMsg('deposit_amount')} />
                </div>

                <div />
              </div>

              {/* Min days / Min age */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                <div>
                  <Label required>Minimum Days</Label>
                  <select value={form.min_days} onChange={e => set('min_days', parseInt(e.target.value))}
                    style={{ width: '100%', padding: '12px 16px', background: 'rgba(30,40,60,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: 'white', fontSize: 14, outline: 'none' }}>
                    {MIN_DAYS_OPTS.map(n => <option key={n} value={n}>{n} day{n > 1 ? 's' : ''}</option>)}
                  </select>
                </div>
                <div>
                  <Label required>Minimum Driver Age</Label>
                  <select value={form.min_age_years} onChange={e => set('min_age_years', parseInt(e.target.value))}
                    style={{ width: '100%', padding: '12px 16px', background: 'rgba(30,40,60,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: 'white', fontSize: 14, outline: 'none' }}>
                    {MIN_AGE_OPTS.map(n => <option key={n} value={n}>{n}+ years</option>)}
                  </select>
                </div>
              </div>

              {/* Toggles */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { key:'instant_book',       label:'Instant Book',       desc:'Guests book without approval needed',          icon:'⚡' },
                  { key:'delivery_available', label:'Delivery Available', desc:'You deliver the car to airports, hotels, etc.', icon:'🚚' },
                ].map(({ key, label, desc, icon }) => {
                  const active = form[key as keyof Form] as boolean
                  return (
                    <button key={key} onClick={() => set(key as keyof Form, !active as any)}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px', background: active ? 'rgba(59,130,246,0.06)' : 'rgba(255,255,255,0.02)', border: active ? '1px solid rgba(59,130,246,0.3)' : '1px solid rgba(255,255,255,0.06)', borderRadius: 16, cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontSize: 20 }}>{icon}</span>
                        <div>
                          <p style={{ color: 'white', fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{label}</p>
                          <p style={{ color: '#475569', fontSize: 12 }}>{desc}</p>
                        </div>
                      </div>
                      <div style={{ width: 44, height: 24, borderRadius: 12, background: active ? '#2563eb' : 'rgba(255,255,255,0.08)', transition: 'all 0.3s', position: 'relative', flexShrink: 0, marginLeft: 16 }}>
                        <span style={{ position: 'absolute', top: 3, left: active ? 23 : 3, width: 18, height: 18, background: 'white', borderRadius: '50%', transition: 'all 0.3s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }} />
                      </div>
                    </button>
                  )
                })}

                {form.delivery_available && (
                  <div style={{ marginTop: 4 }}>
                    <Label required>Delivery Fee</Label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#475569', fontWeight: 600, fontSize: 12 }}>AUD $</span>
                      <input type="number" value={form.delivery_fee || ''}
                        onChange={e => set('delivery_fee', parseFloat(e.target.value) || 0)}
                        onBlur={() => setTouched(p => ({ ...p, delivery_fee: true }))}
                        min={10} placeholder="50"
                        className={inputCls(errMsg('delivery_fee'), isOk('delivery_fee'))}
                        style={{ paddingLeft: 58, paddingRight: 32 }} />
                      <FieldOk show={isOk('delivery_fee')} />
                    </div>
                    <FieldError msg={errMsg('delivery_fee')} />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════
              STEP 4 — REVIEW & PUBLISH
          ══════════════════════════════════════ */}
          {step === 4 && (
            <div>
              {/* Cover photo */}
              {form.photos[0] && (
                <div style={{ borderRadius: 18, overflow: 'hidden', aspectRatio: '16/8', marginBottom: 24, position: 'relative' }}>
                  <img src={form.photos[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)' }} />
                  <div style={{ position: 'absolute', bottom: 16, left: 20 }}>
                    <p style={{ color: 'white', fontWeight: 800, fontSize: 22 }}>{form.year} {form.make} {form.model}</p>
                    <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>📍 {form.location} · {form.fuel_type} · {form.seats} seats</p>
                  </div>
                  <div style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(16,185,129,0.9)', color: 'white', fontWeight: 800, fontSize: 18, padding: '6px 14px', borderRadius: 12 }}>
                    ${form.price_daily}/day
                  </div>
                </div>
              )}

              {/* Summary grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
                {[
                  ['Make & Model',   `${form.make} ${form.model}`],
                  ['Year & Colour',  `${form.year} · ${form.colour}`],
                  ['Body Type',      form.body_type],
                  ['Engine',         form.engine],
                  ['Transmission',   form.transmission],
                  ['Fuel Type',      form.fuel_type],
                  ['Seats',          `${form.seats} seats`],
                  ['Location',       form.location],
                  ['Daily Rate',     `AUD $${form.price_daily}`],
                  ['Weekly Rate',    `AUD $${form.price_weekly || Math.round(form.price_daily * 6)}`],
                  ['Security Bond',  `AUD $${form.deposit_amount}`],
                  ['Min Age',        `${form.min_age_years}+ years`],
                  ['Min Days',       `${form.min_days} day${form.min_days > 1 ? 's' : ''}`],
                  ['Instant Book',   form.instant_book ? '✅ Enabled' : '❌ Disabled'],
                  ['Photos',         `${form.photos.length} uploaded`],
                  ['Features',       `${form.features.length} selected`],
                ].map(([label, value]) => (
                  <div key={label} style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12 }}>
                    <p style={{ color: '#475569', fontSize: 11, marginBottom: 3 }}>{label}</p>
                    <p style={{ color: 'white', fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</p>
                  </div>
                ))}
              </div>

              {/* Terms */}
              <div style={{ padding: '16px 18px', background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: 16, marginBottom: 8 }}>
                <p style={{ color: '#60a5fa', fontWeight: 700, fontSize: 12, marginBottom: 10 }}>📋 Before you publish</p>
                <ul style={{ color: '#475569', fontSize: 12, lineHeight: 2 }}>
                  <li>• Your vehicle must have valid current Australian registration</li>
                  <li>• GlideGo deducts a <strong style={{ color: '#94a3b8' }}>20% platform fee</strong> from each booking payout</li>
                  <li>• You must respond to booking requests within <strong style={{ color: '#94a3b8' }}>24 hours</strong></li>
                  <li>• Your car will be reviewed by GlideGo within <strong style={{ color: '#94a3b8' }}>24–48 hours</strong></li>
                </ul>
              </div>
            </div>
          )}

          {/* ── NAVIGATION BUTTONS ── */}
          <div style={{ display: 'flex', gap: 12, marginTop: 32, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            {step > 0 && (
              <button onClick={goBack}
                style={{ flex: 1, padding: '13px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, color: '#94a3b8', fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>
                ← Back
              </button>
            )}
            {step < STEPS.length - 1 ? (
              <button onClick={goNext}
                style={{ flex: step === 0 ? 1 : 2, padding: '13px', background: `linear-gradient(135deg, ${STEPS[step + 1].color}, ${STEPS[step + 1].color}cc)`, border: 'none', borderRadius: 14, color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', boxShadow: `0 4px 20px ${STEPS[step + 1].color}40` }}>
                Continue → {STEPS[step + 1].label}
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={submitting}
                style={{ flex: 2, padding: '14px', background: submitting ? 'rgba(16,185,129,0.2)' : 'linear-gradient(135deg, #059669, #10b981)', border: 'none', borderRadius: 14, color: 'white', fontSize: 15, fontWeight: 800, cursor: submitting ? 'not-allowed' : 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 24px rgba(16,185,129,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: submitting ? 0.7 : 1 }}>
                {submitting ? (
                  <><span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />Publishing your listing...</>
                ) : (
                  <><span>🚀</span> Publish Listing</>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        select option { background: #0d1117; color: white; }
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
      `}</style>
    </div>
  )
}
