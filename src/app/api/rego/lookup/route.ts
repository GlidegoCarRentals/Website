/**
 * GlideGo — REGO Lookup API Route
 * POST /api/rego/lookup
 *
 * Body: { rego: string, state: string }
 *
 * Returns vehicle details from PPSR + NHTSA vPIC, or an error object.
 */
import { NextRequest, NextResponse } from 'next/server'
import { lookupRego } from '@/lib/rego/provider'

// Australian state registration plate patterns
const PLATE_PATTERNS: Record<string, RegExp> = {
  VIC: /^[A-Z0-9]{1,6}$/,        // e.g. ABC123, 1AB23C
  NSW: /^[A-Z0-9]{1,6}$/,
  QLD: /^[A-Z0-9]{1,7}$/,
  SA:  /^[A-Z0-9]{1,6}$/,
  WA:  /^[A-Z0-9]{1,7}$/,
  TAS: /^[A-Z0-9]{1,6}$/,
  ACT: /^[A-Z0-9]{1,6}$/,
  NT:  /^[A-Z0-9]{1,6}$/,
}

const AU_STATES = ['VIC','NSW','QLD','SA','WA','TAS','ACT','NT']

export async function POST(req: NextRequest) {
  // ── Parse body ──────────────────────────────
  let body: { rego?: string; state?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.', code: 'INVALID_REGO' }, { status: 400 })
  }

  const rego  = (body.rego  || '').toString().trim().toUpperCase().replace(/\s/g, '')
  const state = (body.state || 'VIC').toString().trim().toUpperCase()

  // ── Validate plate ──────────────────────────
  if (!rego) {
    return NextResponse.json({ error: 'Registration number is required.', code: 'INVALID_REGO' }, { status: 400 })
  }

  if (!AU_STATES.includes(state)) {
    return NextResponse.json({ error: `Invalid state "${state}". Must be one of: ${AU_STATES.join(', ')}.`, code: 'INVALID_REGO' }, { status: 400 })
  }

  const pattern = PLATE_PATTERNS[state]
  if (!pattern.test(rego)) {
    return NextResponse.json({
      error:  `"${rego}" does not look like a valid ${state} registration plate. Check for spaces or special characters.`,
      code:   'INVALID_REGO',
    }, { status: 400 })
  }

  // ── Run lookup ──────────────────────────────
  const result = await lookupRego(rego, state)

  // ── Return ──────────────────────────────────
  if ('error' in result) {
    const statusMap: Record<string, number> = {
      NO_CREDENTIALS: 503,
      NOT_FOUND:      404,
      PPSR_ERROR:     502,
      DECODE_FAILED:  422,
      RATE_LIMITED:   429,
      INVALID_REGO:   400,
    }
    const status = statusMap[result.code] ?? 500
    return NextResponse.json(result, { status })
  }

  // Warn host if vehicle has issues
  const warnings: string[] = []
  if (result.data.stolen)        warnings.push('⚠️ STOLEN: This vehicle has an active stolen report in PPSR.')
  if (result.data.written_off)   warnings.push('⚠️ WRITTEN-OFF: This vehicle is recorded as written off.')
  if (result.data.finance_owing) warnings.push('ℹ️ Finance recorded against this vehicle in PPSR.')

  return NextResponse.json({ ...result, warnings })
}
