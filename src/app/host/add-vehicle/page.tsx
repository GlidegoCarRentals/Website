'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

const STEPS = ['Basic Info', 'Features', 'Photos', 'Pricing', 'Availability'];
const CATEGORIES = ['Economy', 'Compact', 'SUV', 'Luxury', 'Sports', 'Van', 'Electric', 'Ute'];
const FUELS = ['Petrol', 'Diesel', 'Electric', 'Hybrid', 'Plug-in Hybrid'];
const TRANSMISSIONS = ['Automatic', 'Manual'];
const FEATURES_LIST = [
  'Apple CarPlay', 'Android Auto', 'Bluetooth', 'Backup Camera', 'GPS Navigation',
  'Wireless Charging', 'Heated Seats', 'Ventilated Seats', 'Sunroof / Moonroof',
  'Panoramic Roof', 'Adaptive Cruise Control', 'Lane Keep Assist', 'Blind Spot Warning',
  'Parking Sensors', 'All-Wheel Drive', '4WD / Off-Road', 'Tow Package',
  'Child Seat Anchor', 'Premium Audio', 'USB Ports', 'Ambient Lighting',
  'Heads-Up Display', 'Keyless Entry', 'Push Start', 'Fast Charging (EV)',
  'Autopilot / Driver Assist',
];
const LOCATIONS = ['Melbourne Airport (MEL)', 'Melbourne CBD', 'Tullamarine', 'Southbank', 'St Kilda', 'Richmond', 'Docklands', 'Dandenong', 'Frankston', 'Geelong'];

type FormState = {
  make: string;
  model: string;
  year: string;
  category: string;
  fuel: string;
  transmission: string;
  seats: string;
  color: string;
  rego: string;
  description: string;
  features: string[];
  photos: string[];
  pricePerDay: string;
  weeklyDiscount: string;
  location: string;
  minDays: string;
  minAge: string;
  instantBook: boolean;
  deliveryAvailable: boolean;
  deliveryFee: string;
  bondAmount: string;
};

const INITIAL_FORM: FormState = {
  make: '',
  model: '',
  year: '2024',
  category: 'SUV',
  fuel: 'Petrol',
  transmission: 'Automatic',
  seats: '5',
  color: '',
  rego: '',
  description: '',
  features: [],
  photos: [],
  pricePerDay: '',
  weeklyDiscount: '10',
  location: 'Melbourne Airport (MEL)',
  minDays: '1',
  minAge: '21',
  instantBook: true,
  deliveryAvailable: false,
  deliveryFee: '0',
  bondAmount: '500',
};

export default function AddVehiclePage() {
  const router = useRouter();
  const { user, isLoading, refreshUser } = useAuth();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [lookupMessage, setLookupMessage] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [form, setForm] = useState<FormState>(INITIAL_FORM);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login?redirect=/host/add-vehicle');
    }
  }, [isLoading, router, user]);

  const update = <K extends keyof FormState>(key: K, value: FormState[K], markTouched = true) => {
    setForm((current) => ({ ...current, [key]: value }));
    if (markTouched) {
      setTouched((current) => ({ ...current, [key]: true }));
    }
  };

  const toggleFeature = (feature: string) => {
    update(
      'features',
      form.features.includes(feature)
        ? form.features.filter((item) => item !== feature)
        : [...form.features, feature]
    );
  };

  const stepValid = useMemo(() => {
    if (step === 0) return Boolean(form.make && form.model && form.year && form.rego && form.location);
    if (step === 3) return Boolean(form.pricePerDay) && Number(form.pricePerDay) >= 20;
    return true;
  }, [form.location, form.make, form.model, form.pricePerDay, form.rego, form.year, step]);

  const runRegoLookup = async () => {
    const rego = form.rego.trim().toUpperCase();
    if (!rego) {
      setLookupMessage('Pehle registration plate enter karo.');
      return;
    }

    setLookupLoading(true);
    setLookupMessage('');
    setError('');

    try {
      const response = await fetch(`/api/rego/lookup?rego=${encodeURIComponent(rego)}`);
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'REGO lookup failed.');

      setForm((current) => {
        const updated = { ...current };
        const nextData = result.data || {};
        if (nextData.make && (!touched.make || !current.make)) updated.make = String(nextData.make);
        if (nextData.model && (!touched.model || !current.model)) updated.model = String(nextData.model);
        if (nextData.year && (!touched.year || !current.year)) updated.year = String(nextData.year);
        if (nextData.color && (!touched.color || !current.color)) updated.color = String(nextData.color);
        if (nextData.fuel && (!touched.fuel || !current.fuel)) updated.fuel = String(nextData.fuel);
        if (nextData.transmission && (!touched.transmission || !current.transmission)) updated.transmission = String(nextData.transmission);
        if (nextData.seats && (!touched.seats || !current.seats)) updated.seats = String(nextData.seats);
        if (nextData.category && (!touched.category || !current.category)) updated.category = String(nextData.category);
        updated.rego = rego;
        return updated;
      });

      setLookupMessage(`REGO lookup complete. Source: ${result.source.replace(/_/g, ' ')}.`);
    } catch (err) {
      setLookupMessage(err instanceof Error ? err.message : 'REGO lookup failed.');
    } finally {
      setLookupLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!user) return;

    setSubmitting(true);
    setError('');

    try {
      const priceDaily = Number(form.pricePerDay);
      const weeklyDiscount = Number(form.weeklyDiscount || 0);
      const priceWeekly = Math.max(0, Math.round(priceDaily * 7 * (1 - weeklyDiscount / 100)));

      const response = await fetch('/api/host/cars/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          make: form.make,
          model: form.model,
          year: Number(form.year),
          body_type: form.category,
          fuel_type: form.fuel,
          transmission: form.transmission,
          seats: Number(form.seats),
          colour: form.color,
          rego: form.rego,
          description: form.description,
          features: form.features,
          photos: form.photos,
          price_daily: priceDaily,
          price_weekly: priceWeekly,
          location_name: form.location,
          min_days: Number(form.minDays),
          min_age_years: Number(form.minAge),
          instant_book: form.instantBook,
          delivery_available: form.deliveryAvailable,
          delivery_fee: Number(form.deliveryFee),
          deposit_amount: Number(form.bondAmount),
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Vehicle create nahi ho paya.');

      await refreshUser();
      router.push('/host/vehicles');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Vehicle publish karte waqt problem aayi.');
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading || !user) return null;

  return (
    <div style={{ fontFamily: "'Inter',-apple-system,sans-serif", minHeight: '100vh', background: '#f8fafc' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Inter:wght@300;400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .playfair { font-family: 'Playfair Display', serif; }
        .inp { width: 100%; border: 1.5px solid #e2e8f0; border-radius: 10px; padding: 11px 14px; font-size: 14px; color: #0f172a; outline: none; background: white; }
        .inp:focus { border-color: #1d4ed8; }
        .feat-btn { padding: 8px 14px; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer; border: 1.5px solid #e2e8f0; background: white; color: #64748b; }
        .feat-btn.on { background: #eff6ff; border-color: #bfdbfe; color: #1d4ed8; }
        .next-btn { background: linear-gradient(135deg,#1d4ed8,#059669); color: white; border: none; border-radius: 12px; padding: 14px 32px; font-size: 15px; font-weight: 700; cursor: pointer; }
        .next-btn:disabled { opacity: .5; cursor: not-allowed; }
        .back-btn { background: #f8fafc; color: #64748b; border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 14px 24px; font-size: 15px; font-weight: 600; cursor: pointer; }
        .step-dot { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 800; }
      `}</style>

      <div style={{ background: '#0a0f1e', padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/host/dashboard" style={{ textDecoration: 'none' }}>
          <Image src="/logo.png" alt="GlideGo" width={100} height={23} style={{ objectFit: 'contain', filter: 'brightness(1.2)' }} />
        </Link>
        <div style={{ color: 'white', fontSize: 14, fontWeight: 600 }}>List Your Vehicle</div>
        <Link href="/host/dashboard" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none', fontSize: 13 }}>Back to Dashboard</Link>
      </div>

      <div style={{ background: 'white', borderBottom: '1px solid #f1f5f9', padding: '20px 32px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {STEPS.map((label, index) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, flex: index < STEPS.length - 1 ? 1 : 'auto' }}>
              <div className="step-dot" style={{ background: index === step ? 'linear-gradient(135deg,#1d4ed8,#059669)' : index < step ? '#059669' : '#f1f5f9', color: index <= step ? 'white' : '#94a3b8' }}>
                {index < step ? '✓' : index + 1}
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: index === step ? '#0f172a' : index < step ? '#059669' : '#94a3b8', whiteSpace: 'nowrap' }}>{label}</span>
              {index < STEPS.length - 1 && <div style={{ flex: 1, height: 2, background: index < step ? '#059669' : '#f1f5f9', margin: '0 8px', borderRadius: 1 }} />}
            </div>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 24px' }}>
        {error && <div style={{ marginBottom: 20, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: '14px 16px', color: '#b91c1c', fontSize: 13, fontWeight: 600 }}>{error}</div>}
        {lookupMessage && <div style={{ marginBottom: 20, background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 12, padding: '14px 16px', color: '#1d4ed8', fontSize: 13, fontWeight: 600 }}>{lookupMessage}</div>}

        {step === 0 && (
          <div>
            <h2 className="playfair" style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>Basic Vehicle Info</h2>
            <p style={{ fontSize: 14, color: '#64748b', marginBottom: 28 }}>Tell us about your vehicle.</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 7, fontSize: 12, fontWeight: 700, color: '#64748b' }}>REGISTRATION PLATE</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input className="inp" value={form.rego} onChange={(e) => update('rego', e.target.value.toUpperCase())} placeholder="e.g. ABC123" />
                  <button type="button" onClick={runRegoLookup} disabled={lookupLoading} style={{ borderRadius: 10, border: '1px solid #bfdbfe', background: '#eff6ff', color: '#1d4ed8', padding: '0 16px', fontWeight: 700, cursor: 'pointer' }}>
                    {lookupLoading ? '...' : 'Lookup'}
                  </button>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 7, fontSize: 12, fontWeight: 700, color: '#64748b' }}>MAKE / BRAND</label>
                <input className="inp" value={form.make} onChange={(e) => update('make', e.target.value)} placeholder="e.g. Toyota" />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 7, fontSize: 12, fontWeight: 700, color: '#64748b' }}>MODEL</label>
                <input className="inp" value={form.model} onChange={(e) => update('model', e.target.value)} placeholder="e.g. Camry" />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 7, fontSize: 12, fontWeight: 700, color: '#64748b' }}>COLOR</label>
                <input className="inp" value={form.color} onChange={(e) => update('color', e.target.value)} placeholder="e.g. White" />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 7, fontSize: 12, fontWeight: 700, color: '#64748b' }}>YEAR</label>
                <select className="inp" value={form.year} onChange={(e) => update('year', e.target.value)}>
                  {Array.from({ length: 15 }, (_, index) => 2026 - index).map((year) => <option key={year} value={year}>{year}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 7, fontSize: 12, fontWeight: 700, color: '#64748b' }}>CATEGORY</label>
                <select className="inp" value={form.category} onChange={(e) => update('category', e.target.value)}>
                  {CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 7, fontSize: 12, fontWeight: 700, color: '#64748b' }}>FUEL TYPE</label>
                <select className="inp" value={form.fuel} onChange={(e) => update('fuel', e.target.value)}>
                  {FUELS.map((fuel) => <option key={fuel} value={fuel}>{fuel}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 7, fontSize: 12, fontWeight: 700, color: '#64748b' }}>TRANSMISSION</label>
                <select className="inp" value={form.transmission} onChange={(e) => update('transmission', e.target.value)}>
                  {TRANSMISSIONS.map((transmission) => <option key={transmission} value={transmission}>{transmission}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 7, fontSize: 12, fontWeight: 700, color: '#64748b' }}>SEATS</label>
                <select className="inp" value={form.seats} onChange={(e) => update('seats', e.target.value)}>
                  {[2, 4, 5, 6, 7, 8, 9].map((count) => <option key={count} value={count}>{count} seats</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 7, fontSize: 12, fontWeight: 700, color: '#64748b' }}>PICKUP LOCATION</label>
                <select className="inp" value={form.location} onChange={(e) => update('location', e.target.value)}>
                  {LOCATIONS.map((location) => <option key={location} value={location}>{location}</option>)}
                </select>
              </div>
            </div>
            <div style={{ marginTop: 18 }}>
              <label style={{ display: 'block', marginBottom: 7, fontSize: 12, fontWeight: 700, color: '#64748b' }}>VEHICLE DESCRIPTION</label>
              <textarea className="inp" value={form.description} onChange={(e) => update('description', e.target.value)} placeholder="Tell guests what makes your car special." rows={4} style={{ resize: 'vertical' }} />
            </div>
          </div>
        )}

        {step === 1 && <div><h2 className="playfair" style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>Features & Amenities</h2><p style={{ fontSize: 14, color: '#64748b', marginBottom: 24 }}>Select all features your vehicle has.</p><div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>{FEATURES_LIST.map((feature) => <button type="button" key={feature} onClick={() => toggleFeature(feature)} className={`feat-btn${form.features.includes(feature) ? ' on' : ''}`}>{form.features.includes(feature) ? '✓ ' : ''}{feature}</button>)}</div></div>}
        {step === 2 && <div><h2 className="playfair" style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>Upload Photos</h2><p style={{ fontSize: 14, color: '#64748b', marginBottom: 24 }}>Photo uploader abhi placeholder mode me hai, isliye listing default cover image ke saath create hogi.</p><div style={{ border: '2px dashed #e2e8f0', borderRadius: 14, padding: 32, textAlign: 'center', background: 'white' }}><div style={{ fontSize: 48, marginBottom: 16 }}>📷</div><div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>Photo uploader next pass me wire hoga</div><div style={{ fontSize: 13, color: '#64748b' }}>Abhi ke liye listing create ho jayegi aur aap baad me images attach kar sakte hain.</div></div></div>}
        {step === 3 && <div><h2 className="playfair" style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>Set Your Pricing</h2><p style={{ fontSize: 14, color: '#64748b', marginBottom: 28 }}>Competitive pricing gets more bookings.</p><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 24 }}><div><label style={{ display: 'block', marginBottom: 7, fontSize: 12, fontWeight: 700, color: '#64748b' }}>DAILY PRICE (AUD)</label><input className="inp" type="number" value={form.pricePerDay} onChange={(e) => update('pricePerDay', e.target.value)} placeholder="89" min={20} /></div><div><label style={{ display: 'block', marginBottom: 7, fontSize: 12, fontWeight: 700, color: '#64748b' }}>BOND AMOUNT (AUD)</label><input className="inp" type="number" value={form.bondAmount} onChange={(e) => update('bondAmount', e.target.value)} placeholder="500" /></div><div><label style={{ display: 'block', marginBottom: 7, fontSize: 12, fontWeight: 700, color: '#64748b' }}>WEEKLY DISCOUNT (%)</label><input className="inp" type="number" value={form.weeklyDiscount} onChange={(e) => update('weeklyDiscount', e.target.value)} placeholder="10" min={0} max={50} /></div><div><label style={{ display: 'block', marginBottom: 7, fontSize: 12, fontWeight: 700, color: '#64748b' }}>DELIVERY FEE (AUD)</label><input className="inp" type="number" value={form.deliveryFee} onChange={(e) => update('deliveryFee', e.target.value)} placeholder="0" min={0} /></div></div><div style={{ background: 'white', borderRadius: 14, border: '1px solid #f1f5f9', padding: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}><div><label style={{ display: 'block', marginBottom: 7, fontSize: 12, fontWeight: 700, color: '#64748b' }}>MINIMUM RENTAL DAYS</label><select className="inp" value={form.minDays} onChange={(e) => update('minDays', e.target.value)}>{[1, 2, 3, 5, 7].map((days) => <option key={days} value={days}>{days} day{days > 1 ? 's' : ''}</option>)}</select></div><div><label style={{ display: 'block', marginBottom: 7, fontSize: 12, fontWeight: 700, color: '#64748b' }}>MINIMUM DRIVER AGE</label><select className="inp" value={form.minAge} onChange={(e) => update('minAge', e.target.value)}>{[18, 21, 23, 25].map((age) => <option key={age} value={age}>{age} years</option>)}</select></div></div></div>}
        {step === 4 && <div><h2 className="playfair" style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>Availability</h2><p style={{ fontSize: 14, color: '#64748b', marginBottom: 24 }}>Publishing ke baad advanced calendar controls host dashboard me manage honge.</p><div style={{ background: '#f0fdf4', borderRadius: 14, border: '1px solid #bbf7d0', padding: 20 }}><div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>Ready to publish</div><div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{[`${form.make} ${form.model} ${form.year}`, `Location: ${form.location}`, `$${form.pricePerDay || '0'}/day`, form.instantBook ? 'Instant Book enabled' : 'Manual approval'].map((item, index) => <div key={index} style={{ fontSize: 13, color: '#166534', display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ color: '#059669' }}>•</span> {item}</div>)}</div></div></div>}

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 36 }}>
          <button type="button" onClick={() => setStep((current) => Math.max(0, current - 1))} className="back-btn" style={{ display: step === 0 ? 'none' : 'block' }}>Back</button>
          {step < STEPS.length - 1 ? <button type="button" onClick={() => { setError(''); setStep((current) => current + 1); }} className="next-btn" disabled={!stepValid} style={{ marginLeft: 'auto' }}>Continue</button> : <button type="button" onClick={handleSubmit} className="next-btn" disabled={submitting} style={{ marginLeft: 'auto' }}>{submitting ? 'Publishing...' : 'Publish Listing'}</button>}
        </div>
      </div>
    </div>
  );
}
