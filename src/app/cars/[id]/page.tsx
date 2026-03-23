'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { CARS } from '@/lib/cars';
import { fetchCarBySlugOrId } from '@/lib/db-cars';

const CAR_FALLBACK: Record<string, string> = {
  'SUV': '🚙', 'Electric': '⚡', 'Van': '🛻', 'Luxury': '🚗', 'Compact': '🚗', 'Economy': '🚗'
};

export default function CarDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [car, setCar] = useState<any>(CARS.find(c => c.id === Number(params.id)) || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = params.id as string;
    setLoading(true);
    fetchCarBySlugOrId(id).then(dbCar => {
      if (dbCar) setCar(dbCar);
      else {
        // fallback to static
        const staticCar = CARS.find(c => c.id === Number(id));
        if (staticCar) setCar(staticCar);
      }
      setLoading(false);
    });
  }, [params.id]);

  const [pickupDate, setPickupDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [pickupLocation, setPickupLocation] = useState('Melbourne Airport (MEL)');
  const [imgError, setImgError] = useState(false);

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
      <div style={{ fontSize: 40 }}>🚗</div>
    </div>
  );

  const LOCATIONS = ['Melbourne Airport (MEL)', 'Melbourne CBD', 'Tullamarine', 'Southbank', 'St Kilda', 'Richmond', 'Docklands', 'Dandenong', 'Frankston'];

  if (!car) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter,sans-serif', background: '#f8fafc' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🚗</div>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>Car not found</h2>
        <Link href="/" style={{ color: '#1d4ed8', textDecoration: 'none', fontWeight: 600, fontSize: 15 }}>← Back to Fleet</Link>
      </div>
    </div>
  );

  const days = pickupDate && returnDate
    ? Math.max(1, Math.ceil((new Date(returnDate).getTime() - new Date(pickupDate).getTime()) / (1000 * 60 * 60 * 24)))
    : 1;
  const subtotal = car.price * days;
  const serviceFee = Math.round(subtotal * 0.12);
  const total = subtotal + serviceFee;

  const handleBook = () => {
    if (!pickupDate || !returnDate) { alert('Please select pickup and return dates'); return; }
    if (!car.available) { alert('This car is currently unavailable. Please choose another vehicle.'); return; }
    router.push(`/checkout?carId=${car.id}&amount=${total}`);
  };

  return (
    <div style={{ fontFamily: "'Inter',-apple-system,sans-serif", backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Inter:wght@300;400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .playfair { font-family: 'Playfair Display', Georgia, serif; }
        .book-btn {
          width: 100%; background: linear-gradient(135deg, #1d4ed8, #059669);
          color: white; border: none; border-radius: 12px; padding: 16px;
          font-size: 16px; font-weight: 700; cursor: pointer; transition: all 0.3s;
        }
        .book-btn:hover { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(29,78,216,0.35); }
        .book-btn:disabled { background: #e2e8f0; color: #94a3b8; cursor: not-allowed; transform: none; box-shadow: none; }
        .form-input {
          width: 100%; border: 1.5px solid #e2e8f0; border-radius: 10px;
          padding: 11px 14px; font-size: 14px; color: #0f172a; outline: none;
          background: white; appearance: none; cursor: pointer; transition: border-color 0.2s;
        }
        .form-input:focus { border-color: #1d4ed8; }
        .spec-box { background: #f8fafc; border-radius: 12px; padding: 16px; text-align: center; border: 1px solid #f1f5f9; }
        .feat-tag {
          display: flex; align-items: center; gap: 8px; padding: 10px 0;
          border-bottom: 1px solid #f1f5f9; font-size: 14px; color: #374151;
        }
        .feat-tag:last-child { border-bottom: none; }
        .included-row { display: flex; align-items: center; gap: 10px; padding: 8px 0; font-size: 13px; color: #374151; }
        select option { background: white; }
      `}</style>

      {/* NAV */}
      <nav style={{ background: 'white', borderBottom: '1px solid #f1f5f9', padding: '14px 24px', position: 'sticky', top: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <Image src="/logo.png" alt="GlideGo" width={110} height={25} style={{ objectFit: 'contain' }} />
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#64748b' }}>
          <Link href="/" style={{ color: '#64748b', textDecoration: 'none' }}>Home</Link>
          <span>/</span>
          <Link href="/#fleet" style={{ color: '#64748b', textDecoration: 'none' }}>Fleet</Link>
          <span>/</span>
          <span style={{ color: '#0f172a', fontWeight: 600 }}>{car.name}</span>
        </div>
        <Link href="/admin" style={{ fontSize: 13, color: '#cbd5e1', textDecoration: 'none' }}>Admin</Link>
      </nav>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 390px', gap: 40, alignItems: 'start' }}>

          {/* ═══ LEFT ═══ */}
          <div>
            {/* Main Image */}
            <div style={{ borderRadius: 20, overflow: 'hidden', marginBottom: 24, position: 'relative', height: 380, background: 'linear-gradient(135deg,#e0f2fe,#dcfce7)' }}>
              {!imgError ? (
                <img src={car.image} alt={car.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} onError={() => setImgError(true)} />
              ) : (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 120 }}>
                  {CAR_FALLBACK[car.category] || '🚗'}
                </div>
              )}
              {!car.available && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ background: 'white', color: '#0f172a', fontWeight: 800, fontSize: 16, padding: '12px 28px', borderRadius: 50, letterSpacing: '0.06em' }}>UNAVAILABLE</span>
                </div>
              )}
              <div style={{ position: 'absolute', top: 16, left: 16, display: 'flex', gap: 8 }}>
                <span style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', color: 'white', fontSize: 12, fontWeight: 700, padding: '5px 12px', borderRadius: 8, letterSpacing: '0.05em' }}>{car.badge.toUpperCase()}</span>
                <span style={{ background: car.fuelColor, color: 'white', fontSize: 12, fontWeight: 700, padding: '5px 12px', borderRadius: 8 }}>{car.fuelBadge}</span>
              </div>
              {car.available && (
                <div style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)', borderRadius: 10, padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ color: '#fbbf24', fontSize: 14 }}>★</span>
                  <span style={{ color: 'white', fontSize: 13, fontWeight: 700 }}>{car.rating}</span>
                  <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>({car.trips} trips)</span>
                </div>
              )}
            </div>

            {/* Title */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
                <span style={{ background: '#eff6ff', color: '#1d4ed8', fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 6, border: '1px solid #bfdbfe' }}>{car.category}</span>
                <span style={{ background: '#f0fdf4', color: '#15803d', fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 6, border: '1px solid #bbf7d0' }}>{car.year}</span>
              </div>
              <h1 className="playfair" style={{ fontSize: 'clamp(26px,3.5vw,38px)', fontWeight: 800, color: '#0f172a', marginBottom: 10, letterSpacing: '-0.02em' }}>{car.name}</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ color: '#fbbf24', fontSize: 16 }}>★</span>
                  <span style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>{car.rating}</span>
                  <span style={{ color: '#94a3b8', fontSize: 13 }}>({car.trips} trips)</span>
                </div>
                <span style={{ color: '#e2e8f0' }}>|</span>
                <span style={{ fontSize: 13, color: '#64748b' }}>📍 {car.location}</span>
              </div>
            </div>

            {/* About */}
            <div style={{ background: 'white', borderRadius: 16, padding: '24px', marginBottom: 20, border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <h2 className="playfair" style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>About this car</h2>
              <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.8 }}>{car.description}</p>
            </div>

            {/* Specs */}
            <div style={{ background: 'white', borderRadius: 16, padding: '24px', marginBottom: 20, border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <h2 className="playfair" style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', marginBottom: 18 }}>Specifications</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
                {[
                  { icon: '⚙️', label: 'Engine', val: car.specs.engine },
                  { icon: '💪', label: 'Power', val: car.specs.power },
                  { icon: '🔧', label: 'Torque', val: car.specs.torque },
                  { icon: '⚡', label: '0–100 km/h', val: car.specs.acceleration },
                  { icon: '🏎️', label: 'Top Speed', val: car.specs.topSpeed },
                  { icon: '⛽', label: 'Efficiency', val: car.specs.fuel },
                ].map((s: any) => (
                  <div key={s.label} className="spec-box">
                    <div style={{ fontSize: 24, marginBottom: 6 }}>{s.icon}</div>
                    <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, letterSpacing: '0.08em', marginBottom: 4 }}>{s.label.toUpperCase()}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{s.val}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Features */}
            <div style={{ background: 'white', borderRadius: 16, padding: '24px', marginBottom: 20, border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <h2 className="playfair" style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>Features & Amenities</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
                {car.allFeatures.map((f: any) => (
                  <div key={f} className="feat-tag">
                    <span style={{ width: 22, height: 22, borderRadius: '50%', background: '#eff6ff', border: '1px solid #bfdbfe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#1d4ed8', flexShrink: 0 }}>✓</span>
                    {f}
                  </div>
                ))}
              </div>
            </div>

            {/* What's Included */}
            <div style={{ background: 'white', borderRadius: 16, padding: '24px', marginBottom: 20, border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <h2 className="playfair" style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', marginBottom: 14 }}>What's Included</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
                {car.included.map((i: any) => (
                  <div key={i} className="included-row">
                    <span style={{ fontSize: 16, flexShrink: 0 }}>✅</span> {i}
                  </div>
                ))}
              </div>
            </div>

            {/* Host */}
            <div style={{ background: 'white', borderRadius: 16, padding: '24px', marginBottom: 20, border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <h2 className="playfair" style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', marginBottom: 18 }}>Meet Your Host</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'linear-gradient(135deg,#1d4ed8,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, color: 'white', flexShrink: 0 }}>
                  {car.host.avatar}
                </div>
                <div>
                  <div className="playfair" style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>{car.host.name}</div>
                  <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
                    ★ {car.host.rating} · {car.host.trips} trips · Member since {car.host.joined}
                  </div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
                {[
                  { icon: '⏱️', label: 'Response time', val: car.host.responseTime },
                  { icon: '✅', label: 'Trips completed', val: String(car.host.trips) },
                  { icon: '⭐', label: 'Host rating', val: String(car.host.rating) },
                ].map((s: any) => (
                  <div key={s.label} style={{ textAlign: 'center', background: '#f8fafc', borderRadius: 10, padding: '14px 8px', border: '1px solid #f1f5f9' }}>
                    <div style={{ fontSize: 22, marginBottom: 6 }}>{s.icon}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 3, fontWeight: 600 }}>{s.label}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{s.val}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Reviews */}
            <div style={{ background: 'white', borderRadius: 16, padding: '24px', border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <h2 className="playfair" style={{ fontSize: 20, fontWeight: 700, color: '#0f172a' }}>Reviews</h2>
                <div style={{ background: '#fefce8', border: '1px solid #fde68a', borderRadius: 8, padding: '4px 12px', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ color: '#fbbf24' }}>★</span>
                  <span style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>{car.rating}</span>
                  <span style={{ fontSize: 12, color: '#64748b' }}>({car.trips} trips)</span>
                </div>
              </div>
              {car.reviews.map((r, i) => (
                <div key={i} style={{ background: '#f8fafc', borderRadius: 12, padding: '18px', border: '1px solid #f1f5f9', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg,#eff6ff,#f0fdf4)', border: '1px solid #bfdbfe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#1d4ed8' }}>
                        {r.name.split(' ').map((n: any) => n[0]).join('')}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>{r.name}</div>
                        <div style={{ fontSize: 12, color: '#94a3b8' }}>{r.date}</div>
                      </div>
                    </div>
                    <div style={{ color: '#fbbf24', fontSize: 14 }}>{'★'.repeat(r.rating)}</div>
                  </div>
                  <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.7 }}>{r.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ═══ RIGHT - STICKY BOOKING ═══ */}
          <div style={{ position: 'sticky', top: 80 }}>
            <div style={{ background: 'white', borderRadius: 20, padding: '28px', boxShadow: '0 8px 40px rgba(0,0,0,0.1)', border: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 16 }}>
                <span className="playfair" style={{ fontSize: 36, fontWeight: 800, color: '#0f172a' }}>${car.price}</span>
                <span style={{ fontSize: 15, color: '#94a3b8' }}>/day</span>
                <span style={{ marginLeft: 'auto', fontSize: 13, color: '#64748b', fontWeight: 500 }}>${car.weeklyPrice}/week</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 22, padding: '10px 14px', background: '#f0fdf4', borderRadius: 10, border: '1px solid #bbf7d0' }}>
                <span style={{ color: '#fbbf24', fontSize: 14 }}>★</span>
                <span style={{ fontWeight: 700, fontSize: 13, color: '#0f172a' }}>{car.rating}</span>
                <span style={{ fontSize: 12, color: '#64748b' }}>· {car.trips} trips</span>
                <span style={{ marginLeft: 'auto', fontSize: 11, color: '#15803d', fontWeight: 700, background: '#dcfce7', padding: '3px 8px', borderRadius: 6 }}>Top Rated</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 18 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.1em', display: 'block', marginBottom: 7 }}>PICKUP LOCATION</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 13, pointerEvents: 'none' }}>📍</span>
                    <select value={pickupLocation} onChange={e => setPickupLocation(e.target.value)} className="form-input" style={{ paddingLeft: 34 }}>
                      {LOCATIONS.map((l: any) => <option key={l} value={l}>{l}</option>)}
                    </select>
                    <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#94a3b8', fontSize: 11 }}>▾</span>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {[{ label: 'PICKUP DATE', val: pickupDate, set: setPickupDate }, { label: 'RETURN DATE', val: returnDate, set: setReturnDate }].map((f: any) => (
                    <div key={f.label}>
                      <label style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.1em', display: 'block', marginBottom: 7 }}>{f.label}</label>
                      <div style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 12, pointerEvents: 'none' }}>📅</span>
                        <input type="date" value={f.val} onChange={e => f.set(e.target.value)} className="form-input" style={{ paddingLeft: 28, fontSize: 13 }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Price Breakdown */}
              <div style={{ background: '#f8fafc', borderRadius: 12, padding: '16px', marginBottom: 18, border: '1px solid #f1f5f9' }}>
                {[
                  { label: `$${car.price} × ${days} day${days > 1 ? 's' : ''}`, val: `$${subtotal.toLocaleString()}` },
                  { label: 'Service fee (12%)', val: `$${serviceFee}` },
                  { label: `Bond (refunded after trip)`, val: `$${car.deposit}` },
                ].map((r: any) => (
                  <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#374151', marginBottom: 10 }}>
                    <span>{r.label}</span><span style={{ fontWeight: 600 }}>{r.val}</span>
                  </div>
                ))}
                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 10, display: 'flex', justifyContent: 'space-between' }}>
                  <span className="playfair" style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>Total</span>
                  <span className="playfair" style={{ fontSize: 17, fontWeight: 800, color: '#0f172a' }}>${total.toLocaleString()}</span>
                </div>
              </div>

              <button onClick={handleBook} className="book-btn" disabled={!car.available}>
                {car.available ? `Book Now — $${total.toLocaleString()}` : 'Currently Unavailable'}
              </button>

              <p style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center', marginTop: 12 }}>
                🔒 Free cancellation · Secure payment via Stripe
              </p>

              <div style={{ marginTop: 20, paddingTop: 18, borderTop: '1px solid #f1f5f9' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.1em', marginBottom: 12 }}>REQUIREMENTS</div>
                {[
                  { label: 'Minimum age', val: `${car.minAge} years` },
                  { label: 'Minimum rental', val: `${car.minDays} day${car.minDays > 1 ? 's' : ''}` },
                  { label: 'Valid licence', val: 'Required' },
                ].map((r: any) => (
                  <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#64748b', marginBottom: 8 }}>
                    <span>{r.label}</span><span style={{ fontWeight: 600, color: '#374151' }}>{r.val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Similar Cars */}
            <div style={{ marginTop: 20, background: 'white', borderRadius: 16, padding: '20px', border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <h3 className="playfair" style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 14 }}>Similar Cars</h3>
              {CARS
                .filter(c => c.id !== car.id)
                .slice(0, 3)
                .map((c: any) => (
                  <Link key={c.id} href={`/cars/${c.id}`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #f8fafc' }}>
                    <div style={{ width: 50, height: 50, borderRadius: 10, overflow: 'hidden', flexShrink: 0, background: '#f1f5f9' }}>
                      <img src={c.image} alt={c.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>★ {c.rating} · {c.trips} trips</div>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', flexShrink: 0 }}>${c.price}/day</div>
                  </Link>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}