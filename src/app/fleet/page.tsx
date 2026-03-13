'use client';
import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { CARS } from '@/lib/cars';
import { fetchCars } from '@/lib/db-cars';

const CATEGORIES = ['All', 'Economy', 'Compact', 'SUV', 'Luxury', 'Van'];
const FUEL_TYPES = ['All', 'Petrol', 'Hybrid', 'Electric', 'Diesel'];
const TRANSMISSIONS = ['All', 'Automatic', 'Manual'];
const SORT_OPTIONS = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'trips', label: 'Most Popular' },
];

const FEATURES_FILTER = ['Apple CarPlay', 'Heated Seats', 'Sunroof', 'AWD/4WD', 'Backup Camera', 'Bluetooth', 'Cruise Control'];

export default function FleetPage() {
  const { user, toggleFavourite } = useAuth();
  const [darkMode, setDarkMode] = useState(true);
  const [category, setCategory] = useState('All');
  const [fuel, setFuel] = useState('All');
  const [transmission, setTransmission] = useState('All');
  const [sort, setSort] = useState('recommended');
  const [priceRange, setPriceRange] = useState([0, 300]);
  const [seats, setSeats] = useState(0);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [instantOnly, setInstantOnly] = useState(false);
  const [allCars, setAllCars] = useState(CARS as any[]);

  useEffect(() => {
    fetchCars().then(dbCars => {
      if (dbCars && dbCars.length > 0) setAllCars(dbCars);
    });
  }, []);
  const [availableOnly, setAvailableOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [searchQ, setSearchQ] = useState('');

  const dm = darkMode;
  const bg = dm ? '#070d1a' : '#f0f4f8';
  const surface = dm ? '#0d1528' : '#ffffff';
  const surface2 = dm ? '#111d35' : '#f8fafc';
  const border = dm ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)';
  const text = dm ? '#f1f5f9' : '#0f172a';
  const muted = dm ? '#64748b' : '#94a3b8';
  const accent = '#10b981';

  const filtered = useMemo(() => {
    let cars = CARS;
    if (searchQ) cars = cars.filter(c => c.name.toLowerCase().includes(searchQ.toLowerCase()) || c.category.toLowerCase().includes(searchQ.toLowerCase()));
    if (category !== 'All') cars = cars.filter(c => c.category === category);
    if (fuel !== 'All') cars = cars.filter(c => c.fuel === fuel);
    if (transmission !== 'All') cars = cars.filter(c => c.transmission === transmission);
    if (availableOnly) cars = cars.filter(c => c.available);
    cars = cars.filter(c => c.price >= priceRange[0] && c.price <= priceRange[1]);
    if (seats > 0) cars = cars.filter(c => c.seats >= seats);
    if (selectedFeatures.length > 0) cars = cars.filter(c => selectedFeatures.every(f => c.allFeatures?.includes(f)));

    switch (sort) {
      case 'price_asc': return [...cars].sort((a, b) => a.price - b.price);
      case 'price_desc': return [...cars].sort((a, b) => b.price - a.price);
      case 'rating': return [...cars].sort((a, b) => b.rating - a.rating);
      case 'trips': return [...cars].sort((a, b) => b.trips - a.trips);
      default: return cars;
    }
  }, [category, fuel, transmission, sort, priceRange, seats, selectedFeatures, availableOnly, searchQ]);

  const toggleFeature = (f: string) => setSelectedFeatures(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);
  const clearFilters = () => { setCategory('All'); setFuel('All'); setTransmission('All'); setSeats(0); setSelectedFeatures([]); setPriceRange([0, 300]); setAvailableOnly(false); setInstantOnly(false); setSearchQ(''); };
  const activeFilterCount = [category !== 'All', fuel !== 'All', transmission !== 'All', seats > 0, selectedFeatures.length > 0, priceRange[0] > 0 || priceRange[1] < 300, availableOnly].filter(Boolean).length;

  return (
    <div style={{ minHeight: '100vh', background: bg, fontFamily: "'Syne','Inter',sans-serif", color: text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Inter:wght@400;500;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:#1e3a5f;border-radius:4px}
        .car-card{background:${surface};border:1px solid ${border};border-radius:18px;overflow:hidden;transition:all 0.25s;cursor:pointer}
        .car-card:hover{transform:translateY(-4px);box-shadow:0 16px 48px rgba(0,0,0,0.2);border-color:rgba(16,185,129,0.3)}
        .fchip{padding:6px 14px;border-radius:20px;font-size:11px;font-weight:600;cursor:pointer;border:1px solid ${border};background:${dm ? 'rgba(255,255,255,0.04)' : '#f1f5f9'};color:${muted};transition:all 0.15s}
        .fchip.on{background:rgba(16,185,129,0.12);border-color:#10b981;color:#10b981}
        .range-input{width:100%;height:4px;-webkit-appearance:none;appearance:none;background:linear-gradient(90deg,#10b981,#3b82f6);border-radius:2px;outline:none;cursor:pointer}
        .range-input::-webkit-slider-thumb{-webkit-appearance:none;width:18px;height:18px;border-radius:50%;background:white;box-shadow:0 2px 8px rgba(0,0,0,0.3);cursor:pointer}
        .heart-btn{position:absolute;top:12px;right:12px;width:34px;height:34px;border-radius:50%;background:rgba(0,0,0,0.4);border:none;cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px);transition:all 0.2s}
        .heart-btn:hover{background:rgba(0,0,0,0.6);transform:scale(1.1)}
        @keyframes fi{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        .fi{animation:fi 0.3s ease}
      `}</style>

      {/* HEADER */}
      <div style={{ background: surface, borderBottom: `1px solid ${border}`, padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 40, backdropFilter: 'blur(20px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Link href="/" style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: muted, textDecoration: 'none' }}>←</Link>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.5px' }}>Browse Fleet</h1>
            <p style={{ fontSize: 11, color: muted }}>{filtered.length} vehicles available in Melbourne</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Search cars..." style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${border}`, borderRadius: 10, padding: '8px 14px', fontSize: 12, color: text, outline: 'none', width: 180 }} />
          <button onClick={() => setShowFilters(!showFilters)} style={{ padding: '8px 14px', background: showFilters ? 'rgba(16,185,129,0.1)' : dm ? 'rgba(255,255,255,0.05)' : '#f1f5f9', border: `1px solid ${showFilters ? accent : border}`, borderRadius: 10, fontSize: 12, fontWeight: 600, color: showFilters ? accent : muted, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            ⊟ Filters {activeFilterCount > 0 && <span style={{ background: accent, color: 'white', fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 10 }}>{activeFilterCount}</span>}
          </button>
          <div style={{ display: 'flex', border: `1px solid ${border}`, borderRadius: 10, overflow: 'hidden' }}>
            {(['grid', 'list'] as const).map(v => (
              <button key={v} onClick={() => setView(v)} style={{ padding: '8px 12px', background: view === v ? `rgba(16,185,129,0.1)` : 'transparent', border: 'none', cursor: 'pointer', color: view === v ? accent : muted, fontSize: 14 }}>{v === 'grid' ? '⊞' : '≡'}</button>
            ))}
          </div>
          <button onClick={() => setDarkMode(!dm)} style={{ width: 40, height: 22, borderRadius: 11, background: dm ? 'linear-gradient(135deg,#1d4ed8,#059669)' : '#e2e8f0', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.3s', flexShrink: 0 }}>
            <div style={{ position: 'absolute', width: 16, height: 16, borderRadius: '50%', background: 'white', top: 3, left: dm ? 21 : 3, transition: 'left 0.25s' }} />
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', maxWidth: 1400, margin: '0 auto' }}>
        {/* FILTER SIDEBAR */}
        {showFilters && (
          <div className="fi" style={{ width: 260, flexShrink: 0, padding: '24px 20px', overflowY: 'auto', height: 'calc(100vh - 66px)', position: 'sticky', top: 66, borderRight: `1px solid ${border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>Filters</div>
              {activeFilterCount > 0 && <button onClick={clearFilters} style={{ fontSize: 11, fontWeight: 600, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>Clear all</button>}
            </div>

            {/* Availability */}
            <div style={{ marginBottom: 22 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: muted, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Availability</div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 8 }}>
                <input type="checkbox" checked={availableOnly} onChange={e => setAvailableOnly(e.target.checked)} style={{ accentColor: accent }} />
                <span style={{ fontSize: 12, color: text }}>Available only</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={instantOnly} onChange={e => setInstantOnly(e.target.checked)} style={{ accentColor: accent }} />
                <span style={{ fontSize: 12, color: text }}>⚡ Instant Book</span>
              </label>
            </div>

            {/* Price Range */}
            <div style={{ marginBottom: 22 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: muted, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Price Range</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: accent }}>${priceRange[0]}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: accent }}>${priceRange[1]}/day</span>
              </div>
              <input type="range" min={0} max={300} value={priceRange[1]} onChange={e => setPriceRange([priceRange[0], Number(e.target.value)])} className="range-input" style={{ marginBottom: 8 }} />
            </div>

            {/* Category */}
            <div style={{ marginBottom: 22 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: muted, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Category</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {CATEGORIES.map(c => <button key={c} className={`fchip${category === c ? ' on' : ''}`} onClick={() => setCategory(c)}>{c}</button>)}
              </div>
            </div>

            {/* Fuel */}
            <div style={{ marginBottom: 22 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: muted, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Fuel Type</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {FUEL_TYPES.map(f => <button key={f} className={`fchip${fuel === f ? ' on' : ''}`} onClick={() => setFuel(f)}>{f}</button>)}
              </div>
            </div>

            {/* Transmission */}
            <div style={{ marginBottom: 22 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: muted, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Transmission</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {TRANSMISSIONS.map(t => <button key={t} className={`fchip${transmission === t ? ' on' : ''}`} onClick={() => setTransmission(t)}>{t}</button>)}
              </div>
            </div>

            {/* Seats */}
            <div style={{ marginBottom: 22 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: muted, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Min Seats</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {[0, 2, 4, 5, 7].map(s => <button key={s} className={`fchip${seats === s ? ' on' : ''}`} onClick={() => setSeats(s)} style={{ minWidth: 38, textAlign: 'center' }}>{s === 0 ? 'Any' : `${s}+`}</button>)}
              </div>
            </div>

            {/* Features */}
            <div style={{ marginBottom: 22 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: muted, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Features</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {FEATURES_FILTER.map(f => <button key={f} className={`fchip${selectedFeatures.includes(f) ? ' on' : ''}`} onClick={() => toggleFeature(f)} style={{ fontSize: 10 }}>{f}</button>)}
              </div>
            </div>
          </div>
        )}

        {/* CAR GRID */}
        <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
          {/* Sort Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div style={{ fontSize: 13, color: muted }}><span style={{ fontWeight: 700, color: text }}>{filtered.length}</span> vehicles found</div>
            <select value={sort} onChange={e => setSort(e.target.value)} style={{ background: dm ? 'rgba(255,255,255,0.05)' : '#f1f5f9', border: `1px solid ${border}`, borderRadius: 10, padding: '8px 14px', fontSize: 12, color: text, outline: 'none', cursor: 'pointer', fontFamily: "'Syne',sans-serif", fontWeight: 600 }}>
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>No cars found</div>
              <div style={{ fontSize: 13, color: muted, marginBottom: 20 }}>Try adjusting your filters</div>
              <button onClick={clearFilters} style={{ padding: '10px 24px', background: 'linear-gradient(135deg,#10b981,#059669)', color: 'white', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Clear All Filters</button>
            </div>
          ) : view === 'grid' ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 20 }} className="fi">
              {filtered.map(car => {
                const isFav = user?.favourites?.includes(String(car.id));
                return (
                  <div key={car.id} className="car-card">
                    <div style={{ position: 'relative' }}>
                      <img src={car.image} alt={car.name} style={{ width: '100%', height: 180, objectFit: 'cover' }} />
                      {!car.available && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ background: '#ef4444', color: 'white', padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>UNAVAILABLE</span></div>}
                      <button onClick={e => { e.preventDefault(); if (user) toggleFavourite(String(car.id)); }} className="heart-btn">{isFav ? '❤️' : '🤍'}</button>
                      <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', gap: 5 }}>
                        <span style={{ background: 'rgba(0,0,0,0.6)', color: 'white', fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 20, backdropFilter: 'blur(4px)' }}>{car.category}</span>
                        <span style={{ background: car.fuelColor + '33', color: car.fuelColor, fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 20, backdropFilter: 'blur(4px)', border: `1px solid ${car.fuelColor}44` }}>{car.fuel}</span>
                      </div>
                    </div>
                    <div style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                        <div>
                          <div style={{ fontSize: 15, fontWeight: 700, color: text }}>{car.name}</div>
                          <div style={{ fontSize: 11, color: muted, marginTop: 2 }}>{car.year} · {car.transmission} · {car.seats} seats</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 18, fontWeight: 800, color: accent }}>${car.price}</div>
                          <div style={{ fontSize: 10, color: muted }}>per day</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                        <span style={{ fontSize: 11, color: '#f59e0b' }}>{'★'.repeat(Math.round(car.rating))}</span>
                        <span style={{ fontSize: 11, color: muted }}>{car.rating} · {car.trips} trips</span>
                      </div>
                      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 12 }}>
                        {car.features.slice(0, 2).map(f => <span key={f} style={{ fontSize: 10, background: dm ? 'rgba(255,255,255,0.05)' : '#f1f5f9', color: muted, padding: '3px 8px', borderRadius: 6 }}>{f}</span>)}
                      </div>
                      <Link href={`/cars/${car.id}`} style={{ display: 'block', textAlign: 'center', padding: '9px', background: car.available ? 'linear-gradient(135deg,#10b981,#059669)' : dm ? 'rgba(255,255,255,0.05)' : '#f1f5f9', color: car.available ? 'white' : muted, borderRadius: 10, fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>
                        {car.available ? 'View & Book' : 'Notify Me'}
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }} className="fi">
              {filtered.map(car => {
                const isFav = user?.favourites?.includes(String(car.id));
                return (
                  <div key={car.id} style={{ background: surface, border: `1px solid ${border}`, borderRadius: 16, display: 'flex', gap: 16, padding: 16, transition: 'all 0.2s' }}>
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <img src={car.image} alt={car.name} style={{ width: 160, height: 110, borderRadius: 12, objectFit: 'cover' }} />
                      {!car.available && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ color: 'white', fontSize: 10, fontWeight: 700 }}>UNAVAILABLE</span></div>}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontSize: 16, fontWeight: 700, color: text }}>{car.name}</div>
                          <div style={{ fontSize: 11, color: muted, marginTop: 3 }}>{car.year} · {car.category} · {car.fuel} · {car.seats} seats</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 5 }}>
                            <span style={{ fontSize: 12, color: '#f59e0b' }}>★ {car.rating}</span>
                            <span style={{ fontSize: 11, color: muted }}>{car.trips} trips</span>
                            <span style={{ fontSize: 11, color: muted }}>📍 {car.location}</span>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 22, fontWeight: 800, color: accent }}>${car.price}</div>
                          <div style={{ fontSize: 11, color: muted }}>per day</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 5, marginTop: 10, flexWrap: 'wrap' }}>
                        {car.features.map(f => <span key={f} style={{ fontSize: 10, background: dm ? 'rgba(255,255,255,0.05)' : '#f1f5f9', color: muted, padding: '3px 8px', borderRadius: 6 }}>{f}</span>)}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, justifyContent: 'center', flexShrink: 0 }}>
                      <button onClick={() => toggleFavourite(String(car.id))} style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: `1px solid ${border}`, cursor: 'pointer', fontSize: 16 }}>{isFav ? '❤️' : '🤍'}</button>
                      <Link href={`/cars/${car.id}`} style={{ padding: '9px 18px', background: 'linear-gradient(135deg,#10b981,#059669)', color: 'white', borderRadius: 10, fontSize: 12, fontWeight: 700, textDecoration: 'none', textAlign: 'center', whiteSpace: 'nowrap' }}>Book Now</Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
