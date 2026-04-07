'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'

const STEPS = [
  { id: 0, label: 'Vehicle Details' },
  { id: 1, label: 'Photos' },
  { id: 2, label: 'Features' },
  { id: 3, label: 'Pricing' },
  { id: 4, label: 'Review & Submit' },
]

const FEATURES_LIST = [
  'Apple CarPlay', 'Android Auto', 'Bluetooth', 'USB Charging', 'Wireless Charging',
  'Sunroof / Moonroof', 'Heated Seats', 'Cooled Seats', 'Leather Seats', 'Massage Seats',
  'AWD / 4WD', 'Cruise Control', 'Adaptive Cruise Control', 'Lane Assist', 'Auto Emergency Braking',
  'Reversing Camera', '360° Camera', 'Parking Sensors', 'Blind Spot Monitor', 'Cross Traffic Alert',
  'Navigation / GPS', 'Heads Up Display', 'Keyless Entry', 'Push Button Start', 'Remote Start',
  'Automatic Headlights', 'Rain Sensing Wipers', 'Ambient Lighting', 'Premium Audio',
  'Tow Bar', 'Roof Rack', 'Child Seat Anchor', 'Pet Friendly', 'Toll Pass Included',
  'EV Charging Cable', 'Spare Tyre', 'First Aid Kit',
]

const BODY_TYPES = ['Sedan', 'SUV', 'Hatchback', 'Ute / Pickup', 'Wagon', 'Coupe', 'Convertible', 'Van', 'People Mover', 'Sports Car', 'Luxury', 'Electric']

interface Form {
  rego: string; rego_state: string
  make: string; model: string; year: number; colour: string
  body_type: string; engine: string; transmission: string; fuel_type: string; seats: number
  photos: string[]
  features: string[]; description: string
  price_daily: number; price_weekly: number; price_monthly: number
  deposit_amount: number; min_days: number; min_age_years: number
  instant_book: boolean; delivery_available: boolean; delivery_fee: number
  location_name: string; latitude: number; longitude: number
}

export default function AddVehiclePage() {
  const router = useRouter()
  const { user, profile, loading } = useAuth()
  const supabase = createClient()
  const photoInputRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState(0)
  const [regoLoading, setRegoLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState<Form>({
    rego: '', rego_state: 'VIC',
    make: '', model: '', year: new Date().getFullYear(), colour: '',
    body_type: 'Sedan', engine: '', transmission: 'Automatic', fuel_type: 'Petrol', seats: 5,
    photos: [],
    features: [], description: '',
    price_daily: 80, price_weekly: 450, price_monthly: 1500,
    deposit_amount: 500, min_days: 1, min_age_years: 21,
    instant_book: false, delivery_available: false, delivery_fee: 0,
    location_name: 'Melbourne, VIC', latitude: -37.8136, longitude: 144.9631,
  })

  useEffect(() => {
    if (!loading) {
      if (!user) router.push('/login?redirectTo=/host/add-vehicle')
      if (profile && profile.role !== 'host' && profile.role !== 'admin') router.push('/become-host')
    }
  }, [user, profile, loading])

  const set = (key: keyof Form, value: any) => setForm(p => ({ ...p, [key]: value }))

  const handleRegoLookup = async () => {
    if (!form.rego) { setError('Enter your registration number first.'); return }
    setRegoLoading(true)
    setError('')
    // Simulate API call — replace with real PPSR API route
    await new Promise(r => setTimeout(r, 1200))
    setError('REGO auto-fill API is being integrated. Please fill in the vehicle details manually for now.')
    setRegoLoading(false)
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    if (form.photos.length + files.length > 20) { setError('Maximum 20 photos allowed.'); return }

    setUploading(true)
    setError('')
    const urls: string[] = []

    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) { setError(`${file.name} exceeds 10MB limit.`); continue }
      const ext = file.name.split('.').pop()
      const path = `${user!.id}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`

      const { error: upErr } = await supabase.storage.from('car-photos').upload(path, file)
      if (upErr) { setError('Upload failed: ' + upErr.message); continue }

      const { data: { publicUrl } } = supabase.storage.from('car-photos').getPublicUrl(path)
      urls.push(publicUrl)
    }

    set('photos', [...form.photos, ...urls])
    setUploading(false)
  }

  const handleSubmit = async () => {
    setError('')
    if (!form.make || !form.model) { setError('Make and model are required.'); return }
    if (form.photos.length < 5) { setError('A minimum of 5 photos is required.'); return }
    if (form.price_daily < 1) { setError('Please set a daily price.'); return }

    setSubmitting(true)
    const { error: insertErr } = await supabase.from('cars').insert({
      host_id: user!.id,
      rego: form.rego || null,
      rego_state: form.rego_state,
      make: form.make, model: form.model, year: form.year,
      colour: form.colour, body_type: form.body_type, engine: form.engine,
      transmission: form.transmission, fuel_type: form.fuel_type, seats: form.seats,
      photos: form.photos, features: form.features, description: form.description,
      price_daily: form.price_daily, price_weekly: form.price_weekly || null, price_monthly: form.price_monthly || null,
      deposit_amount: form.deposit_amount, min_days: form.min_days, min_age_years: form.min_age_years,
      instant_book: form.instant_book, delivery_available: form.delivery_available, delivery_fee: form.delivery_fee,
      location_name: form.location_name, latitude: form.latitude, longitude: form.longitude,
      available: true, status: 'active',
    })

    setSubmitting(false)
    if (insertErr) { setError('Failed to create listing: ' + insertErr.message); return }
    router.push('/host/dashboard?success=car_added')
  }

  if (loading) {
    return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center"><span className="w-6 h-6 border-2 border-zinc-700 border-t-blue-500 rounded-full animate-spin" /></div>
  }

  const nextStep = () => {
    setError('')
    if (step === 0 && (!form.make || !form.model)) { setError('Make and model are required to continue.'); return }
    if (step === 1 && form.photos.length < 5) { setError('Please upload at least 5 photos to continue.'); return }
    setStep(s => s + 1)
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-600/4 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-2xl mx-auto px-4 py-10 relative z-10">
        {/* Header */}
        <div className="mb-8">
          <p className="text-zinc-500 text-sm mb-1">Step {step + 1} of {STEPS.length}</p>
          <h1 className="text-2xl font-bold text-white">{STEPS[step].label}</h1>
        </div>

        {/* Progress */}
        <div className="flex gap-1.5 mb-8">
          {STEPS.map((s, i) => (
            <div key={s.id} className={`flex-1 h-1 rounded-full transition-all duration-300 ${i <= step ? 'bg-blue-600' : 'bg-zinc-800'}`} />
          ))}
        </div>

        {error && (
          <div className="mb-5 flex items-start gap-3 p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl">
            <span className="text-red-400 text-sm">⚠</span>
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-7 shadow-2xl">

          {/* ── STEP 0: VEHICLE DETAILS ── */}
          {step === 0 && (
            <div className="space-y-5">
              {/* REGO lookup */}
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Registration Number</label>
                  <input
                    type="text"
                    value={form.rego}
                    onChange={e => set('rego', e.target.value.toUpperCase())}
                    placeholder="ABC123"
                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 hover:border-zinc-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 rounded-xl text-white placeholder-zinc-600 text-sm outline-none transition-all font-mono"
                  />
                </div>
                <div className="w-24">
                  <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">State</label>
                  <select value={form.rego_state} onChange={e => set('rego_state', e.target.value)}
                    className="w-full px-3 py-3 bg-zinc-800 border border-zinc-700 focus:border-blue-500 rounded-xl text-white text-sm outline-none transition-all">
                    {['VIC','NSW','QLD','SA','WA','TAS','ACT','NT'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <button onClick={handleRegoLookup} disabled={regoLoading}
                className="w-full flex items-center justify-center gap-2 border border-blue-500/30 hover:border-blue-500/60 bg-blue-600/5 hover:bg-blue-600/10 text-blue-400 py-3 rounded-xl text-sm font-medium transition-all disabled:opacity-40">
                {regoLoading ? <span className="w-3.5 h-3.5 border border-blue-400/30 border-t-blue-400 rounded-full animate-spin" /> : '🔍'}
                {regoLoading ? 'Looking up registration...' : 'Auto-fill from registration'}
              </button>

              <div className="border-t border-zinc-800 pt-5">
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-4">Vehicle Details</p>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Make', key: 'make', placeholder: 'Toyota' },
                    { label: 'Model', key: 'model', placeholder: 'Camry' },
                    { label: 'Colour', key: 'colour', placeholder: 'White' },
                    { label: 'Engine', key: 'engine', placeholder: '2.5L 4-cyl' },
                  ].map(({ label, key, placeholder }) => (
                    <div key={key}>
                      <label className="block text-xs font-medium text-zinc-500 mb-1.5">{label}</label>
                      <input type="text" value={form[key as keyof Form] as string}
                        onChange={e => set(key as keyof Form, e.target.value)}
                        placeholder={placeholder}
                        className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 hover:border-zinc-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 rounded-xl text-white placeholder-zinc-600 text-sm outline-none transition-all" />
                    </div>
                  ))}

                  <div>
                    <label className="block text-xs font-medium text-zinc-500 mb-1.5">Year</label>
                    <input type="number" value={form.year} onChange={e => set('year', parseInt(e.target.value))}
                      min={2000} max={new Date().getFullYear() + 1}
                      className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 rounded-xl text-white text-sm outline-none transition-all" />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-500 mb-1.5">Seats</label>
                    <select value={form.seats} onChange={e => set('seats', parseInt(e.target.value))}
                      className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 focus:border-blue-500 rounded-xl text-white text-sm outline-none transition-all">
                      {[2,4,5,6,7,8,9,12].map(n => <option key={n} value={n}>{n} seats</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-500 mb-1.5">Body Type</label>
                    <select value={form.body_type} onChange={e => set('body_type', e.target.value)}
                      className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 focus:border-blue-500 rounded-xl text-white text-sm outline-none transition-all">
                      {BODY_TYPES.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-500 mb-1.5">Transmission</label>
                    <select value={form.transmission} onChange={e => set('transmission', e.target.value)}
                      className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 focus:border-blue-500 rounded-xl text-white text-sm outline-none transition-all">
                      {['Automatic','Manual','CVT','DCT'].map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-500 mb-1.5">Fuel Type</label>
                    <select value={form.fuel_type} onChange={e => set('fuel_type', e.target.value)}
                      className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 focus:border-blue-500 rounded-xl text-white text-sm outline-none transition-all">
                      {['Petrol','Diesel','Hybrid','Electric','Plug-in Hybrid'].map(f => <option key={f}>{f}</option>)}
                    </select>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-xs font-medium text-zinc-500 mb-1.5">Pickup Location</label>
                  <input type="text" value={form.location_name} onChange={e => set('location_name', e.target.value)}
                    placeholder="CBD Melbourne, VIC"
                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 hover:border-zinc-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 rounded-xl text-white placeholder-zinc-600 text-sm outline-none transition-all" />
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 1: PHOTOS ── */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <p className="text-zinc-400 text-sm">Upload high-quality photos of your car. Minimum 5 required — include front, rear, interior, dashboard, and odometer.</p>
              </div>

              <button onClick={() => photoInputRef.current?.click()} disabled={uploading || form.photos.length >= 20}
                className="w-full border-2 border-dashed border-zinc-700 hover:border-zinc-500 rounded-xl p-10 text-center transition-all disabled:opacity-40 group">
                <div className="text-3xl mb-2">📸</div>
                <p className="font-medium text-zinc-300 group-hover:text-white transition-colors text-sm">
                  {uploading ? 'Uploading...' : 'Click to upload photos'}
                </p>
                <p className="text-zinc-600 text-xs mt-1">{form.photos.length}/20 photos · JPG, PNG · Max 10MB each</p>
              </button>
              <input ref={photoInputRef} type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="hidden" />

              {form.photos.length > 0 && (
                <div className="grid grid-cols-3 gap-3">
                  {form.photos.map((url, i) => (
                    <div key={i} className="relative aspect-video rounded-xl overflow-hidden group">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all" />
                      <button onClick={() => set('photos', form.photos.filter((_, j) => j !== i))}
                        className="absolute top-2 right-2 w-6 h-6 bg-red-600 rounded-lg flex items-center justify-center text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                        ✕
                      </button>
                      {i === 0 && <span className="absolute bottom-2 left-2 bg-blue-600/90 text-white text-xs px-2 py-0.5 rounded-md font-medium">Cover</span>}
                    </div>
                  ))}
                </div>
              )}

              {form.photos.length > 0 && form.photos.length < 5 && (
                <p className="text-amber-400 text-xs flex items-center gap-1.5">
                  <span>⚠</span> {5 - form.photos.length} more photo{5 - form.photos.length !== 1 ? 's' : ''} required
                </p>
              )}
            </div>
          )}

          {/* ── STEP 2: FEATURES ── */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">Vehicle Features ({form.features.length} selected)</p>
                <div className="flex flex-wrap gap-2">
                  {FEATURES_LIST.map(feature => (
                    <button key={feature}
                      onClick={() => set('features', form.features.includes(feature) ? form.features.filter(f => f !== feature) : [...form.features, feature])}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all border ${
                        form.features.includes(feature)
                          ? 'bg-blue-600/10 border-blue-500/40 text-blue-400'
                          : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-300'
                      }`}>
                      {feature}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Description (optional)</label>
                <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={4}
                  placeholder="Describe your car — what makes it special, ideal use cases, any important notes for guests..."
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 hover:border-zinc-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 rounded-xl text-white placeholder-zinc-600 text-sm outline-none transition-all resize-none" />
              </div>
            </div>
          )}

          {/* ── STEP 3: PRICING ── */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-4">
                {[
                  { label: 'Daily Rate', key: 'price_daily', placeholder: '80', required: true },
                  { label: 'Weekly Rate (optional)', key: 'price_weekly', placeholder: '450', required: false },
                  { label: 'Monthly Rate (optional)', key: 'price_monthly', placeholder: '1500', required: false },
                  { label: 'Security Bond', key: 'deposit_amount', placeholder: '500', required: true },
                ].map(({ label, key, placeholder, required }) => (
                  <div key={key}>
                    <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">{label}</label>
                    <div className="relative">
                      <span className="absolute left-4 top-3.5 text-zinc-500 text-sm">AUD $</span>
                      <input type="number" value={form[key as keyof Form] as number || ''}
                        onChange={e => set(key as keyof Form, parseFloat(e.target.value) || 0)}
                        required={required} placeholder={placeholder}
                        className="w-full pl-16 pr-4 py-3 bg-zinc-800 border border-zinc-700 hover:border-zinc-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 rounded-xl text-white placeholder-zinc-600 text-sm outline-none transition-all" />
                    </div>
                  </div>
                ))}

                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Minimum Days', key: 'min_days', options: [1,2,3,5,7].map(n => ({ value: n, label: `${n} day${n > 1 ? 's' : ''}` })) },
                    { label: 'Minimum Age', key: 'min_age_years', options: [18,19,21,25].map(n => ({ value: n, label: `${n}+ years` })) },
                  ].map(({ label, key, options }) => (
                    <div key={key}>
                      <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">{label}</label>
                      <select value={form[key as keyof Form] as number} onChange={e => set(key as keyof Form, parseInt(e.target.value))}
                        className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 focus:border-blue-500 rounded-xl text-white text-sm outline-none transition-all">
                        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3 pt-1">
                {[
                  { label: 'Instant Book', desc: 'Guests can book without requiring your approval', key: 'instant_book' },
                  { label: 'Delivery Available', desc: 'Offer delivery to airports, hotels, or custom locations', key: 'delivery_available' },
                ].map(({ label, desc, key }) => (
                  <label key={key} className="flex items-center justify-between p-4 bg-zinc-800/50 border border-zinc-800 hover:border-zinc-700 rounded-xl cursor-pointer transition-all">
                    <div>
                      <p className="font-medium text-white text-sm">{label}</p>
                      <p className="text-zinc-500 text-xs mt-0.5">{desc}</p>
                    </div>
                    <div
                      onClick={() => set(key as keyof Form, !(form[key as keyof Form] as boolean))}
                      className={`relative w-11 h-6 rounded-full transition-all flex-shrink-0 ml-4 cursor-pointer ${form[key as keyof Form] ? 'bg-blue-600' : 'bg-zinc-700'}`}
                    >
                      <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${form[key as keyof Form] ? 'translate-x-6' : 'translate-x-1'}`} />
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* ── STEP 4: REVIEW ── */}
          {step === 4 && (
            <div className="space-y-5">
              {form.photos[0] && (
                <img src={form.photos[0]} alt="" className="w-full aspect-video object-cover rounded-xl" />
              )}

              <div className="grid grid-cols-2 gap-3">
                {[
                  ['Vehicle', `${form.year} ${form.make} ${form.model}`],
                  ['Location', form.location_name],
                  ['Daily Rate', `AUD $${form.price_daily}`],
                  ['Security Bond', `AUD $${form.deposit_amount}`],
                  ['Transmission', form.transmission],
                  ['Fuel Type', form.fuel_type],
                  ['Seats', `${form.seats} seats`],
                  ['Photos', `${form.photos.length} uploaded`],
                  ['Features', `${form.features.length} selected`],
                  ['Instant Book', form.instant_book ? 'Enabled' : 'Disabled'],
                ].map(([label, value]) => (
                  <div key={label} className="bg-zinc-800/50 border border-zinc-800 rounded-xl p-3.5">
                    <p className="text-zinc-500 text-xs">{label}</p>
                    <p className="font-medium text-white text-sm mt-0.5 truncate">{value}</p>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-blue-600/5 border border-blue-500/20 rounded-xl">
                <p className="text-blue-400 text-xs font-medium mb-2">Before you publish</p>
                <ul className="space-y-1 text-zinc-500 text-xs">
                  <li>• Your vehicle must have valid Australian registration</li>
                  <li>• GlideGo takes a 20% platform fee per booking</li>
                  <li>• You must respond to booking requests within 24 hours</li>
                </ul>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 mt-8 pt-6 border-t border-zinc-800">
            {step > 0 && (
              <button onClick={() => { setStep(s => s - 1); setError('') }}
                className="flex-1 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 py-3 rounded-xl text-sm font-medium transition-all">
                ← Back
              </button>
            )}

            {step < STEPS.length - 1 ? (
              <button onClick={nextStep} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-blue-600/20">
                Continue →
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={submitting}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-40">
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Publishing listing...
                  </span>
                ) : '🚀 Publish Listing'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
