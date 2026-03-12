'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/auth-context';
import { CARS } from '@/lib/cars';
import Navbar from '@/components/Navbar';

const FEATURES = ['Apple CarPlay','Android Auto','Heated Seats','Sunroof','AWD','Backup Camera','GPS Navigation'];
const CATEGORIES = ['All','Economy','Compact','SUV','Luxury','Sports','Electric','Van'];
const SORT_OPTIONS = ['Recommended','Price: Low to High','Price: High to Low','Top Rated','Most Popular'];

export default function FleetPage() {
  const { user, toggleFavourite } = useAuth();
  const [darkMode, setDarkMode] = useState(false);
  const [view, setView] = useState<'grid'|'list'>('grid');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [sort, setSort] = useState('Recommended');
  const [priceRange, setPriceRange] = useState([0, 300]);
  const [transmission, setTransmission] = useState<string[]>([]);
  const [features, setFeatures] = useState<string[]>([]);
  const [seatsMin, setSeatsMin] = useState(1);
  const [instantOnly, setInstantOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  const [compareList, setCompareList] = useState<number[]>([]);

  const dm = darkMode;
  const bg = dm ? '#0a0f1e' : '#f8fafc';
  const cardBg = dm ? '#0f1b35' : 'white';
  const textMain = dm ? 'white' : '#0f172a';
  const textMuted = dm ? 'rgba(255,255,255,0.5)' : '#64748b';
  const border = dm ? 'rgba(255,255,255,0.07)' : '#f1f5f9';
  const inputBg = dm ? 'rgba(255,255,255,0.05)' : 'white';
  const inputBorder = dm ? 'rgba(255,255,255,0.1)' : '#e2e8f0';

  const toggleTransmission = (t: string) => setTransmission(p => p.includes(t) ? p.filter(x => x !== t) : [...p, t]);
  const toggleFeature = (f: string) => setFeatures(p => p.includes(f) ? p.filter(x => x !== f) : [...p, f]);
  const toggleCompare = (id: number) => setCompareList(p => p.includes(id) ? p.filter(x => x !== id) : p.length < 3 ? [...p, id] : p);

  let filtered = CARS.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || (c as any).category?.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === 'All' || (c as any).category === category || (category === 'Electric' && (c as any).fuel === 'Electric');
    const matchPrice = c.price >= priceRange[0] && c.price <= priceRange[1];
    const matchTrans = transmission.length === 0 || transmission.includes((c as any).transmission || 'Automatic');
    const matchInstant = !instantOnly || c.available;
    return matchSearch && matchCat && matchPrice && matchTrans && matchInstant;
  });

  if (sort === 'Price: Low to High') filtered = [...filtered].sort((a, b) => a.price - b.price);
  if (sort === 'Price: High to Low') filtered = [...filtered].sort((a, b) => b.price - a.price);
  if (sort === 'Top Rated') filtered = [...filtered].sort((a, b) => b.rating - a.rating);
  if (sort === 'Most Popular') filtered = [...filtered].sort((a, b) => b.trips - a.trips);

  const isFav = (id: number | string) => user?.favourites?.includes(String(id));

  return (
    <div style={{ fontFamily: "'Inter',-apple-system,sans-serif", minHeight: '100vh', background: bg, transition: 'background 0.3s' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .playfair { font-family: 'Playfair Display', serif; }
        .car-card { border-radius: 18px; overflow: hidden; transition: all 0.25s; cursor: pointer; position: relative; }
        .car-card:hover { transform: translateY(-4px); box-shadow: 0 20px 48px rgba(0,0,0,${dm ? '0.4' : '0.1'}); }
        .fav-btn { position: absolute; top: 12px; right: 12px; width: 36px; height: 36px; border-radius: 50%; background: rgba(0,0,0,0.45); backdrop-filter: blur(6px); border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 15px; transition: all 0.2s; z-index: 2; }
        .fav-btn:hover { transform: scale(1.15); background: rgba(0,0,0,0.6); }
        .compare-btn { position: absolute; top: 12px; left: 12px; padding: 4px 10px; background: rgba(0,0,0,0.45); backdrop-filter: blur(6px); border: none; cursor: pointer; border-radius: 20px; font-size: 10px; font-weight: 700; color: white; transition: all 0.2s; z-index: 2; }
        .filter-chip { padding: 7px 14px; border-radius: 20px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s; border: 1.5px solid; }
        .chip-off { background: ${inputBg}; border-color: ${inputBorder}; color: ${textMuted}; }
        .chip-on { background: rgba(29,78,216,0.12); border-color: #1d4ed8; color: #1d4ed8; }
        .book-btn { background: linear-gradient(135deg,#1d4ed8,#059669); color: white; border: none; border-radius: 10px; padding: 10px; font-size: 13px; font-weight: 700; cursor: pointer; width: 100%; transition: all 0.2s; }
        .book-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(29,78,216,0.35); }
        input[type=range] { -webkit-appearance: none; width: 100%; height: 4px; border-radius: 2px; background: linear-gradient(to right, #1d4ed8 0%, #1d4ed8 ${(priceRange[1] / 300) * 100}%, ${inputBorder} ${(priceRange[1] / 300) * 100}%, ${inputBorder} 100%); }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 18px; height: 18px; border-radius: 50%; background: #1d4ed8; cursor: pointer; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.2); }
        .available-dot { width: 7px; height: 7px; border-radius: 50%; display: inline-block; flex-shrink: 0; }
      `}</style>

      <Navbar darkMode={dm} onDarkModeToggle={() => setDarkMode(!dm)} />

      {/* Hero bar */}
      <div style={{ paddingTop: 68, background: dm ? 'linear-gradient(135deg,#020817,#0c1a3a)' : 'linear-gradient(135deg,#0a0f1e,#0c2c1a)', padding: '80px 24px 40px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          <h1 className="playfair" style={{ fontSize: 44, fontWeight: 800, color: 'white', marginBottom: 16 }}>
            Find Your Perfect Drive
          </h1>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.55)', marginBottom: 28 }}>
            {CARS.length}+ premium vehicles in Melbourne — from $59/day
          </p>
          <div style={{ background: dm ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16, padding: '14px', display: 'flex', gap: 10, alignItems: 'center', maxWidth: 600, margin: '0 auto' }}>
            <input style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 15, color: 'white', padding: '2px 8px' }} placeholder="🔍  Search by make, model, or type..." value={search} onChange={e => setSearch(e.target.value)} />
            {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 16 }}>✕</button>}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '28px 24px', display: 'flex', gap: 28, alignItems: 'flex-start' }}>
        {/* Filters Sidebar */}
        {showFilters && (
          <div style={{ width: 260, flexShrink: 0, background: cardBg, borderRadius: 18, border: `1px solid ${border}`, padding: 22, position: 'sticky', top: 88 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: textMain, marginBottom: 18, display: 'flex', justifyContent: 'space-between' }}>
              Filters
              <button onClick={() => { setCategory('All'); setPriceRange([0,300]); setTransmission([]); setFeatures([]); setInstantOnly(false); }} style={{ fontSize: 11, color: '#1d4ed8', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>Reset</button>
            </div>

            {/* Category */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: textMuted, letterSpacing: '0.08em', marginBottom: 10 }}>CATEGORY</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {CATEGORIES.map(c => (
                  <button key={c} onClick={() => setCategory(c)} className={`filter-chip ${category === c ? 'chip-on' : 'chip-off'}`}>{c}</button>
                ))}
              </div>
            </div>

            {/* Price range */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: textMuted, letterSpacing: '0.08em', marginBottom: 10, display: 'flex', justifyContent: 'space-between' }}>
                PRICE / DAY <span style={{ color: '#1d4ed8', fontWeight: 700 }}>Up to ${priceRange[1]}</span>
              </div>
              <input type="range" min={20} max={300} step={5} value={priceRange[1]} onChange={e => setPriceRange([0, Number(e.target.value)])} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: textMuted, marginTop: 4 }}>
                <span>$20</span><span>$300</span>
              </div>
            </div>

            {/* Transmission */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: textMuted, letterSpacing: '0.08em', marginBottom: 10 }}>TRANSMISSION</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {['Automatic', 'Manual'].map(t => (
                  <button key={t} onClick={() => toggleTransmission(t)} className={`filter-chip ${transmission.includes(t) ? 'chip-on' : 'chip-off'}`}>{t}</button>
                ))}
              </div>
            </div>

            {/* Features */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: textMuted, letterSpacing: '0.08em', marginBottom: 10 }}>FEATURES</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {FEATURES.map(f => (
                  <label key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <div style={{ width: 16, height: 16, borderRadius: 4, border: `1.5px solid ${features.includes(f) ? '#1d4ed8' : inputBorder}`, background: features.includes(f) ? '#1d4ed8' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s', flexShrink: 0 }} onClick={() => toggleFeature(f)}>
                      {features.includes(f) && <span style={{ color: 'white', fontSize: 10, fontWeight: 800 }}>✓</span>}
                    </div>
                    <span style={{ fontSize: 13, color: textMain }}>{f}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Instant Book */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderTop: `1px solid ${border}` }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: textMain }}>⚡ Available Only</div>
                <div style={{ fontSize: 11, color: textMuted, marginTop: 2 }}>Skip unavailable cars</div>
              </div>
              <button onClick={() => setInstantOnly(!instantOnly)} style={{ width: 40, height: 22, borderRadius: 11, border: 'none', cursor: 'pointer', background: instantOnly ? 'linear-gradient(135deg,#1d4ed8,#059669)' : inputBorder, position: 'relative', transition: 'background 0.2s' }}>
                <div style={{ position: 'absolute', width: 16, height: 16, borderRadius: '50%', background: 'white', top: 3, left: instantOnly ? '21px' : '3px', transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
              </button>
            </div>
          </div>
        )}

        {/* Main content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button onClick={() => setShowFilters(!showFilters)} style={{ padding: '8px 14px', background: cardBg, border: `1px solid ${border}`, borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', color: textMuted }}>
                {showFilters ? '✕ Hide' : '⚙️ Show'} Filters
              </button>
              <span style={{ fontSize: 14, color: textMuted, fontWeight: 500 }}>{filtered.length} cars found</span>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <select value={sort} onChange={e => setSort(e.target.value)} style={{ border: `1px solid ${border}`, borderRadius: 10, padding: '8px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: textMain, background: cardBg, outline: 'none' }}>
                {SORT_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <div style={{ display: 'flex', border: `1px solid ${border}`, borderRadius: 10, overflow: 'hidden' }}>
                {(['grid', 'list'] as const).map(v => (
                  <button key={v} onClick={() => setView(v)} style={{ padding: '8px 12px', border: 'none', background: view === v ? '#0f172a' : cardBg, color: view === v ? 'white' : textMuted, cursor: 'pointer', fontSize: 14 }}>
                    {v === 'grid' ? '⊞' : '☰'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Cars grid/list */}
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 24px', background: cardBg, borderRadius: 18, border: `1px solid ${border}` }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: textMain, marginBottom: 8 }}>No cars found</div>
              <div style={{ fontSize: 14, color: textMuted, marginBottom: 20 }}>Try adjusting your filters or search terms</div>
              <button onClick={() => { setSearch(''); setCategory('All'); setPriceRange([0,300]); }} style={{ background: 'linear-gradient(135deg,#1d4ed8,#059669)', color: 'white', border: 'none', borderRadius: 12, padding: '12px 24px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Clear All Filters</button>
            </div>
          ) : (
            <div style={{ display: view === 'grid' ? 'grid' : 'flex', gridTemplateColumns: view === 'grid' ? 'repeat(auto-fill,minmax(280px,1fr))' : undefined, flexDirection: view === 'list' ? 'column' : undefined, gap: 20 }}>
              {filtered.map(car => (
                view === 'grid' ? (
                  // Grid Card
                  <div key={car.id} className="car-card" style={{ background: cardBg, border: `1px solid ${border}`, boxShadow: dm ? '0 4px 20px rgba(0,0,0,0.3)' : '0 1px 6px rgba(0,0,0,0.06)' }}>
                    <button className="fav-btn" onClick={e => { e.preventDefault(); if (user) toggleFavourite(car.id); else window.location.href = '/login'; }}>
                      {isFav(String(car.id)) ? '❤️' : '🤍'}
                    </button>
                    <button className="compare-btn" onClick={e => { e.preventDefault(); toggleCompare(car.id); }} style={{ background: compareList.includes(String(car.id)) ? 'rgba(29,78,216,0.8)' : 'rgba(0,0,0,0.45)' }}>
                      {compareList.includes(String(car.id)) ? '✓ Compare' : '+ Compare'}
                    </button>
                    <div style={{ height: 190, overflow: 'hidden', position: 'relative' }}>
                      <img src={car.image} alt={car.name} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s' }} onMouseEnter={e => (e.target as HTMLImageElement).style.transform = 'scale(1.06)'} onMouseLeave={e => (e.target as HTMLImageElement).style.transform = ''} />
                      {!car.available && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: 'white', letterSpacing: '0.12em' }}>UNAVAILABLE</div>}
                    </div>
                    <div style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                        <h3 style={{ fontSize: 15, fontWeight: 700, color: textMain, lineHeight: 1.3 }}>{car.name}</h3>
                        <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 8 }}>
                          <div style={{ fontSize: 20, fontWeight: 800, color: textMain }}>${car.price}</div>
                          <div style={{ fontSize: 10, color: textMuted }}>per day</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#d97706' }}>⭐ {car.rating}</span>
                        <span style={{ fontSize: 11, color: textMuted }}>· {car.trips} trips</span>
                        <div className="available-dot" style={{ background: car.available ? '#22c55e' : '#f59e0b', marginLeft: 'auto' }} />
                        <span style={{ fontSize: 11, color: car.available ? '#15803d' : '#d97706', fontWeight: 600 }}>{car.available ? 'Available' : 'Booked'}</span>
                      </div>
                      <Link href={`/cars/${car.id}`} style={{ textDecoration: 'none' }}>
                        <button className="book-btn" disabled={!car.available}>
                          {car.available ? 'Book Now →' : 'View Details'}
                        </button>
                      </Link>
                    </div>
                  </div>
                ) : (
                  // List Card
                  <div key={car.id} style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 16, display: 'flex', gap: 0, overflow: 'hidden', transition: 'all 0.2s', boxShadow: dm ? '0 4px 20px rgba(0,0,0,0.2)' : '0 1px 6px rgba(0,0,0,0.04)' }}>
                    <div style={{ width: 200, position: 'relative', flexShrink: 0 }}>
                      <img src={car.image} alt={car.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      {!car.available && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: 'white', letterSpacing: '0.1em' }}>UNAVAILABLE</div>}
                    </div>
                    <div style={{ flex: 1, padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 20 }}>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ fontSize: 17, fontWeight: 700, color: textMain, marginBottom: 4 }}>{car.name}</h3>
                        <div style={{ fontSize: 12, color: textMuted, marginBottom: 8 }}>⭐ {car.rating} · {car.trips} trips · {(car as any).category || 'Car'} · {(car as any).fuel || 'Petrol'}</div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {['✓ Instant Book', '🚗 Free Delivery', '🛡️ Insured'].map(tag => (
                            <span key={tag} style={{ fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 6, background: dm ? 'rgba(255,255,255,0.06)' : '#f8fafc', color: textMuted }}>{tag}</span>
                          ))}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: 26, fontWeight: 800, color: textMain }}>${car.price}<span style={{ fontSize: 12, fontWeight: 400, color: textMuted }}>/day</span></div>
                        <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'flex-end' }}>
                          <button onClick={() => toggleFavourite(car.id)} style={{ padding: '8px 12px', background: dm ? 'rgba(255,255,255,0.06)' : '#f8fafc', border: `1px solid ${border}`, borderRadius: 9, cursor: 'pointer', fontSize: 14 }}>{isFav(String(car.id)) ? '❤️' : '🤍'}</button>
                          <Link href={`/cars/${car.id}`} style={{ textDecoration: 'none' }}>
                            <button className="book-btn" style={{ width: 'auto', padding: '9px 20px' }} disabled={!car.available}>
                              {car.available ? 'Book →' : 'View'}
                            </button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Compare bar */}
      {compareList.length > 0 && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#0a0f1e', borderTop: '1px solid rgba(255,255,255,0.1)', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 16, zIndex: 100 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'white' }}>Compare ({compareList.length}/3):</span>
          {compareList.map(id => {
            const car = CARS.find(c => c.id === id);
            return car ? (
              <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: '6px 12px' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'white' }}>{car.name}</span>
                <button onClick={() => toggleCompare(id)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 13 }}>✕</button>
              </div>
            ) : null;
          })}
          {compareList.length >= 2 && (
            <button style={{ marginLeft: 'auto', background: 'linear-gradient(135deg,#1d4ed8,#059669)', color: 'white', border: 'none', borderRadius: 10, padding: '10px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              Compare Now →
            </button>
          )}
          <button onClick={() => setCompareList([])} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', borderRadius: 10, padding: '10px 16px', fontSize: 13, cursor: 'pointer' }}>Clear</button>
        </div>
      )}
    </div>
  );
}
