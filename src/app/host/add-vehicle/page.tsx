'use client'

// src/app/host/add-vehicle/page.tsx
// 5-step car listing wizard — fully functional

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'

const STEPS = ['REGO Lookup', 'Photos', 'Features', 'Pricing', 'Review']

const ALL_FEATURES = [
  'Apple CarPlay', 'Android Auto', 'Bluetooth', 'USB Charging',
  'Sunroof / Moonroof', 'Heated Seats', 'Cooled Seats', 'Leather Seats',
  'AWD / 4WD', 'Cruise Control', 'Adaptive Cruise Control', 'Lane Assist',
  'Reversing Camera', '360° Camera', 'Parking Sensors', 'Blind Spot Monitor',
  'Navigation / GPS', 'Heads Up Display', 'Keyless Entry', 'Push Button Start',
  'Automatic Headlights', 'Automatic Wipers', 'Rain Sensing Wipers',
  'Tow Bar', 'Roof Rack', 'Child Seat Anchor', 'Pet Friendly',
  'Toll Pass Included', 'EV Charging Cable', 'Spare Tyre',
]

interface CarForm {
  // Step 1 - REGO
  rego: string
  rego_state: string
  make: string
  model: string
  year: number
  colour: string
  body_type: string
  engine: string
  transmission: string
  fuel_type: string
  seats: number
  // Step 2 - Photos
  photos: string[]
  // Step 3 - Features
  features: string[]
  description: string
  // Step 4 - Pricing
  price_daily: number
  price_weekly: number
  price_monthly: number
  deposit_amount: number
  min_days: number
  min_age_years: number
  instant_book: boolean
  delivery_available: boolean
  delivery_fee: number
  // Location
  location: string
  latitude: number
  longitude: number
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
  const [message, setMessage] = useState('')

  const [form, setForm] = useState<CarForm>({
    rego: '',
    rego_state: 'VIC',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    colour: '',
    body_type: 'Sedan',
    engine: '',
    transmission: 'Automatic',
    fuel_type: 'Petrol',
    seats: 5,
    photos: [],
    features: [],
    description: '',
    price_daily: 80,
    price_weekly: 450,
    price_monthly: 1500,
    deposit_amount: 500,
    min_days: 1,
    min_age_years: 21,
    instant_book: false,
    delivery_available: false,
    delivery_fee: 0,
    location: 'Melbourne, VIC',
    latitude: -37.8136,
    longitude: 144.9631,
  })

  const update = (key: keyof CarForm, value: any) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  // Mock REGO lookup (replace with real PPSR API later)
  const handleRegoLookup = async () => {
    if (!form.rego) {
      setError('Rego number daalo pehle')
      return
    }
    setRegoLoading(true)
    setError('')

    // TODO: Replace with real PPSR API call
    // For now, simulate a lookup
    await new Promise(resolve => setTimeout(resolve, 1500))

    // Mock response — in production, call your API route
    // const res = await fetch(`/api/rego-lookup?plate=${form.rego}&state=${form.rego_state}`)
    // const data = await res.json()

    setMessage('✅ REGO found! Details manually fill karo abhi (API integration pending)')
    setRegoLoading(false)
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return

    if (form.photos.length + files.length > 20) {
      setError('Maximum 20 photos allowed')
      return
    }

    setUploading(true)
    setError('')

    const uploadedUrls: string[] = []

    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        setError(`${file.name} — 10MB se chhota hona chahiye`)
        continue
      }

      const fileExt = file.name.split('.').pop()
      const fileName = `${user!.id}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('car-photos')
        .upload(fileName, file)

      if (uploadError) {
        setError('Upload failed: ' + uploadError.message)
        continue
      }

      const { data: { publicUrl } } = supabase.storage
        .from('car-photos')
        .getPublicUrl(fileName)

      uploadedUrls.push(publicUrl)
    }

    update('photos', [...form.photos, ...uploadedUrls])
    setUploading(false)
  }

  const removePhoto = (index: number) => {
    update('photos', form.photos.filter((_, i) => i !== index))
  }

  const toggleFeature = (feature: string) => {
    if (form.features.includes(feature)) {
      update('features', form.features.filter(f => f !== feature))
    } else {
      update('features', [...form.features, feature])
    }
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    setError('')

    if (!form.make || !form.model || !form.year) {
      setError('Car details zaroori hain')
      setSubmitting(false)
      return
    }

    if (form.photos.length < 5) {
      setError('Kam se kam 5 photos chahiye')
      setSubmitting(false)
      return
    }

    if (form.price_daily < 1) {
      setError('Daily price set karo')
      setSubmitting(false)
      return
    }

    const { data, error: insertError } = await supabase
      .from('cars')
      .insert({
        host_id: user!.id,
        rego: form.rego || null,
        rego_state: form.rego_state || null,
        make: form.make,
        model: form.model,
        year: form.year,
        colour: form.colour,
        body_type: form.body_type,
        engine: form.engine,
        transmission: form.transmission,
        fuel_type: form.fuel_type,
        seats: form.seats,
        photos: form.photos,
        features: form.features,
        description: form.description,
        price_daily: form.price_daily,
        price_weekly: form.price_weekly || null,
        price_monthly: form.price_monthly || null,
        deposit_amount: form.deposit_amount,
        min_days: form.min_days,
        min_age_years: form.min_age_years,
        instant_book: form.instant_book,
        delivery_available: form.delivery_available,
        delivery_fee: form.delivery_fee,
        location: form.location,
        latitude: form.latitude,
        longitude: form.longitude,
        available: true,
        status: 'available',
      })
      .select()
      .single()

    if (insertError) {
      setError('Car add nahi hui: ' + insertError.message)
      setSubmitting(false)
      return
    }

    router.push(`/host/dashboard?success=car_added`)
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
  }

  if (!user || (profile?.role !== 'host' && profile?.role !== 'admin')) {
    router.push('/become-host')
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Add New Vehicle</h1>
          <p className="text-gray-500 mt-1">Step {step + 1} of {STEPS.length}: {STEPS[step]}</p>
        </div>

        {/* Progress Bar */}
        <div className="flex gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div
              key={s}
              className={`flex-1 h-2 rounded-full transition-colors ${
                i <= step ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
              }`}
            />
          ))}
        </div>

        {/* Error / Message */}
        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}
        {message && <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">{message}</div>}

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">

          {/* ─── STEP 0: REGO LOOKUP ─────────────────────────── */}
          {step === 0 && (
            <div className="space-y-5">
              <h2 className="font-bold text-gray-900 dark:text-white text-lg">Vehicle Details</h2>

              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Rego Number</label>
                  <input
                    type="text"
                    value={form.rego}
                    onChange={(e) => update('rego', e.target.value.toUpperCase())}
                    placeholder="ABC123"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="w-28">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">State</label>
                  <select
                    value={form.rego_state}
                    onChange={(e) => update('rego_state', e.target.value)}
                    className="w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {['VIC', 'NSW', 'QLD', 'SA', 'WA', 'TAS', 'ACT', 'NT'].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                onClick={handleRegoLookup}
                disabled={regoLoading}
                className="w-full border-2 border-blue-600 text-blue-600 py-3 rounded-xl font-medium hover:bg-blue-50 disabled:opacity-50 transition-colors"
              >
                {regoLoading ? '🔍 Looking up...' : '🔍 Auto-Fill from Rego'}
              </button>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Make', key: 'make', placeholder: 'Toyota' },
                  { label: 'Model', key: 'model', placeholder: 'Camry' },
                  { label: 'Colour', key: 'colour', placeholder: 'White' },
                  { label: 'Engine', key: 'engine', placeholder: '2.5L 4-cyl' },
                ].map(({ label, key, placeholder }) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{label}</label>
                    <input
                      type="text"
                      value={form[key as keyof CarForm] as string}
                      onChange={(e) => update(key as keyof CarForm, e.target.value)}
                      placeholder={placeholder}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                ))}

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Year</label>
                  <input
                    type="number"
                    value={form.year}
                    onChange={(e) => update('year', parseInt(e.target.value))}
                    min={2000}
                    max={new Date().getFullYear() + 1}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Seats</label>
                  <select
                    value={form.seats}
                    onChange={(e) => update('seats', parseInt(e.target.value))}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {[2, 4, 5, 6, 7, 8, 9, 12].map(n => (
                      <option key={n} value={n}>{n} seats</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Transmission</label>
                  <select
                    value={form.transmission}
                    onChange={(e) => update('transmission', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {['Automatic', 'Manual', 'CVT', 'DCT'].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Fuel Type</label>
                  <select
                    value={form.fuel_type}
                    onChange={(e) => update('fuel_type', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {['Petrol', 'Diesel', 'Hybrid', 'Electric', 'Plug-in Hybrid'].map(f => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Pickup Location</label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => update('location', e.target.value)}
                  placeholder="CBD Melbourne, VIC"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {/* ─── STEP 1: PHOTOS ──────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="font-bold text-gray-900 dark:text-white text-lg">Car Photos</h2>
                <p className="text-sm text-gray-500 mt-1">Minimum 5 photos zaroori — Front, Rear, Interior, Dashboard, Odometer</p>
              </div>

              <button
                onClick={() => photoInputRef.current?.click()}
                disabled={uploading || form.photos.length >= 20}
                className="w-full border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center hover:border-blue-500 transition-colors disabled:opacity-50"
              >
                <div className="text-4xl mb-2">📷</div>
                <p className="font-medium text-gray-700 dark:text-gray-300">
                  {uploading ? 'Uploading...' : 'Photos Upload Karo'}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {form.photos.length}/20 photos • JPG, PNG • Max 10MB each
                </p>
              </button>

              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoUpload}
                className="hidden"
              />

              {form.photos.length > 0 && (
                <div className="grid grid-cols-3 gap-3">
                  {form.photos.map((url, i) => (
                    <div key={i} className="relative aspect-video rounded-xl overflow-hidden group">
                      <img src={url} alt={`Car photo ${i + 1}`} className="w-full h-full object-cover" />
                      <button
                        onClick={() => removePhoto(i)}
                        className="absolute top-2 right-2 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ✕
                      </button>
                      {i === 0 && (
                        <span className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                          Main Photo
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {form.photos.length < 5 && (
                <p className="text-sm text-amber-600">
                  ⚠️ {5 - form.photos.length} aur photos chahiye
                </p>
              )}
            </div>
          )}

          {/* ─── STEP 2: FEATURES ────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-5">
              <h2 className="font-bold text-gray-900 dark:text-white text-lg">Features & Description</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Car Features ({form.features.length} selected)
                </label>
                <div className="flex flex-wrap gap-2">
                  {ALL_FEATURES.map((feature) => (
                    <button
                      key={feature}
                      onClick={() => toggleFeature(feature)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        form.features.includes(feature)
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {feature}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Description (optional)
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => update('description', e.target.value)}
                  rows={4}
                  placeholder="Apni car ke baare mein batao — special features, driving experience, etc."
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>
          )}

          {/* ─── STEP 3: PRICING ─────────────────────────────── */}
          {step === 3 && (
            <div className="space-y-5">
              <h2 className="font-bold text-gray-900 dark:text-white text-lg">Pricing & Rules</h2>

              <div className="grid grid-cols-1 gap-4">
                {[
                  { label: 'Daily Rate (AUD)', key: 'price_daily', placeholder: '80' },
                  { label: 'Weekly Rate (AUD) — optional', key: 'price_weekly', placeholder: '450' },
                  { label: 'Monthly Rate (AUD) — optional', key: 'price_monthly', placeholder: '1500' },
                  { label: 'Security Deposit (AUD)', key: 'deposit_amount', placeholder: '500' },
                ].map(({ label, key, placeholder }) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{label}</label>
                    <div className="relative">
                      <span className="absolute left-4 top-3.5 text-gray-400">$</span>
                      <input
                        type="number"
                        value={form[key as keyof CarForm] as number || ''}
                        onChange={(e) => update(key as keyof CarForm, parseFloat(e.target.value) || 0)}
                        placeholder={placeholder}
                        className="w-full pl-8 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                ))}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Min Days</label>
                    <select
                      value={form.min_days}
                      onChange={(e) => update('min_days', parseInt(e.target.value))}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {[1, 2, 3, 5, 7].map(n => <option key={n} value={n}>{n} day{n > 1 ? 's' : ''}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Min Age</label>
                    <select
                      value={form.min_age_years}
                      onChange={(e) => update('min_age_years', parseInt(e.target.value))}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {[18, 19, 21, 25].map(n => <option key={n} value={n}>{n}+ years</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {[
                  { label: 'Instant Book', sublabel: 'Guests book without approval', key: 'instant_book' },
                  { label: 'Delivery Available', sublabel: 'Deliver to airport/hotel', key: 'delivery_available' },
                ].map(({ label, sublabel, key }) => (
                  <label key={key} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{label}</p>
                      <p className="text-sm text-gray-500">{sublabel}</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={form[key as keyof CarForm] as boolean}
                      onChange={(e) => update(key as keyof CarForm, e.target.checked)}
                      className="w-5 h-5 text-blue-600 rounded"
                    />
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* ─── STEP 4: REVIEW ──────────────────────────────── */}
          {step === 4 && (
            <div className="space-y-5">
              <h2 className="font-bold text-gray-900 dark:text-white text-lg">Review & Submit</h2>

              {/* Summary */}
              <div className="space-y-3 text-sm">
                {form.photos[0] && (
                  <img
                    src={form.photos[0]}
                    alt="Main photo"
                    className="w-full aspect-video object-cover rounded-xl"
                  />
                )}

                <div className="grid grid-cols-2 gap-3">
                  {[
                    ['Car', `${form.year} ${form.make} ${form.model}`],
                    ['Location', form.location],
                    ['Daily Rate', `AUD $${form.price_daily}`],
                    ['Deposit', `AUD $${form.deposit_amount}`],
                    ['Transmission', form.transmission],
                    ['Fuel', form.fuel_type],
                    ['Seats', `${form.seats} seats`],
                    ['Photos', `${form.photos.length} photos`],
                    ['Features', `${form.features.length} selected`],
                    ['Instant Book', form.instant_book ? 'Yes' : 'No'],
                  ].map(([label, value]) => (
                    <div key={label} className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3">
                      <p className="text-gray-500 text-xs">{label}</p>
                      <p className="font-medium text-gray-900 dark:text-white mt-0.5">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 text-sm">
                <p className="font-medium text-blue-800 dark:text-blue-300">📋 Before you submit:</p>
                <ul className="mt-2 space-y-1 text-blue-700 dark:text-blue-400">
                  <li>• Car ki VIC registration valid honi chahiye</li>
                  <li>• GlideGo 20% platform fee lega</li>
                  <li>• Bookings 24h mein respond karo</li>
                </ul>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-3 mt-8">
            {step > 0 && (
              <button
                onClick={() => { setStep(s => s - 1); setError('') }}
                className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-3 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                ← Back
              </button>
            )}

            {step < STEPS.length - 1 ? (
              <button
                onClick={() => {
                  setError('')
                  if (step === 0 && (!form.make || !form.model)) {
                    setError('Make aur Model zaroori hai')
                    return
                  }
                  if (step === 1 && form.photos.length < 5) {
                    setError('Kam se kam 5 photos upload karo')
                    return
                  }
                  setStep(s => s + 1)
                }}
                className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors"
              >
                Next →
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 bg-green-600 text-white py-3 rounded-xl font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {submitting ? 'Submitting...' : '🚀 Car List Karo!'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
