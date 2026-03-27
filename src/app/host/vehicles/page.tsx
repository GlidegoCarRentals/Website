'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { fetchCarsByHostId, updateCarPrice, updateCarStatus, deleteCarById } from '@/lib/db-cars';

function hashToInt(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  available: { bg: '#f0fdf4', color: '#15803d' },
  booked: { bg: '#eff6ff', color: '#1d4ed8' },
  maintenance: { bg: '#fffbeb', color: '#d97706' },
  inactive: { bg: '#f8fafc', color: '#94a3b8' },
};

export default function HostVehiclesPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const isHostUser = user?.role === 'host' || user?.role === 'admin';

  useEffect(() => {
    if (authLoading) return;
    if (!isHostUser) {
      router.replace(`/login?redirect=/host/vehicles`);
      return;
    }

    (async () => {
      setLoading(true);
      const cars = await fetchCarsByHostId(user.id);
      setVehicles(
        cars.map(c => {
          const idStr = String(c.id);
          const h = hashToInt(idStr);
          return {
            ...c,
            id: idStr,
            status: c.available ? 'available' : 'inactive',
            trips30d: (h % 15) + 2,
            earnings30d: (h % 2000) + 400,
          };
        })
      );
      setLoading(false);
    })();
  }, [authLoading, isHostUser, router, user?.id]);

  const filtered = vehicles.filter(v => {
    const matchSearch = v.name.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || v.status === filter;
    return matchSearch && matchFilter;
  });

  const startEdit = (v: typeof vehicles[0]) => {
    setEditingId(String(v.id));
    setEditPrice(String(v.price));
  };

  const saveEdit = async (id: string) => {
    const newPrice = Number(editPrice);
    setVehicles(vs => vs.map(v => String(v.id) === id ? { ...v, price: newPrice } : v));
    setEditingId(null);
    await updateCarPrice(id, newPrice);
  };

  const toggleStatus = async (id: string) => {
    const next: Record<string, string> = { available: 'maintenance', maintenance: 'inactive', inactive: 'available', booked: 'available' };
    let newStatus = 'available';
    setVehicles(vs => vs.map(v => {
      if (String(v.id) !== id) return v;
      newStatus = next[v.status] || 'available';
      return { ...v, status: newStatus };
    }));
    await updateCarStatus(id, newStatus);
  };

  const deleteVehicle = async (id: string) => {
    setVehicles(vs => vs.filter(v => v.id !== id));
    setDeleteConfirm(null);
    await deleteCarById(id);
  };

  const totalEarnings = vehicles.reduce((s, v) => s + v.earnings30d, 0);

  if (loading) {
    return (
      <div style={{ fontFamily: "'Inter',-apple-system,sans-serif", minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontWeight: 800 }}>
        Loading your vehicles...
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'Inter',-apple-system,sans-serif", minHeight: '100vh', background: '#f8fafc' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .playfair { font-family: 'Playfair Display', serif; }
        .card { background: white; border-radius: 16px; border: 1px solid #f1f5f9; box-shadow: 0 1px 4px rgba(0,0,0,0.04); }
        .action-btn { padding: 7px 14px; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer; border: none; transition: all 0.18s; }
        .inp { border: 1.5px solid #e2e8f0; border-radius: 9px; padding: 9px 13px; font-size: 14px; outline: none; color: #0f172a; background: white; }
        .inp:focus { border-color: #1d4ed8; }
        .vehicle-row { display: grid; grid-template-columns: 90px 1fr 110px 90px 100px 110px 140px; align-items: center; gap: 16px; padding: 16px 20px; border-bottom: 1px solid #f8fafc; transition: background 0.15s; }
        .vehicle-row:hover { background: #fafbfc; }
        .vehicle-row:last-child { border-bottom: none; }
        .status-pill { font-size: 11px; font-weight: 700; padding: 4px 11px; border-radius: 20px; cursor: pointer; user-select: none; }
        .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 200; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px); }
        .modal { background: white; border-radius: 20px; padding: 32px; max-width: 420px; width: 90%; box-shadow: 0 32px 80px rgba(0,0,0,0.25); animation: popIn 0.2s ease; }
        @keyframes popIn { from { opacity:0;transform:scale(0.94); } to { opacity:1;transform:scale(1); } }
      `}</style>

      {/* Header */}
      <div style={{ background: '#0a0f1e', padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <Link href="/host/dashboard" style={{ textDecoration: 'none' }}>
            <Image src="/logo.png" alt="GlideGo" width={100} height={23} style={{ objectFit: 'contain', filter: 'brightness(1.2)' }} />
          </Link>
          <Link href="/host/dashboard" style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, textDecoration: 'none' }}>Dashboard</Link>
          <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>/</span>
          <span style={{ color: 'white', fontSize: 13, fontWeight: 600 }}>My Vehicles</span>
        </div>
        <Link href="/host/add-vehicle" style={{ background: 'linear-gradient(135deg,#1d4ed8,#059669)', color: 'white', textDecoration: 'none', padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
          + Add Vehicle
        </Link>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 28 }}>
          {[
            { label: 'Total Vehicles', val: vehicles.length, icon: '🚗', color: '#1d4ed8', bg: '#eff6ff' },
            { label: 'Active / Booked', val: vehicles.filter(v => v.status === 'available' || v.status === 'booked').length, icon: '✅', color: '#059669', bg: '#f0fdf4' },
            { label: '30-Day Trips', val: vehicles.reduce((s, v) => s + v.trips30d, 0), icon: '📅', color: '#7c3aed', bg: '#f5f3ff' },
            { label: '30-Day Earnings', val: `$${totalEarnings.toLocaleString()}`, icon: '💰', color: '#d97706', bg: '#fffbeb' },
          ].map(s => (
            <div key={s.label} className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{s.icon}</div>
              <div>
                <div className="playfair" style={{ fontSize: 24, fontWeight: 800, color: '#0f172a' }}>{s.val}</div>
                <div style={{ fontSize: 12, color: '#64748b' }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters + Search */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          <input className="inp" value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍  Search vehicles..." style={{ width: 240 }} />
          <div style={{ display: 'flex', gap: 6 }}>
            {['all', 'available', 'booked', 'maintenance', 'inactive'].map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{ padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none', background: filter === f ? '#0f172a' : '#f8fafc', color: filter === f ? 'white' : '#64748b', textTransform: 'capitalize' }}>
                {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          <div style={{ marginLeft: 'auto', fontSize: 13, color: '#94a3b8' }}>{filtered.length} vehicle{filtered.length !== 1 ? 's' : ''}</div>
        </div>

        {/* Table */}
        <div className="card" style={{ overflow: 'hidden' }}>
          {/* Table Header */}
          <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr 110px 90px 100px 110px 140px', gap: 16, padding: '12px 20px', background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
            {['Photo', 'Vehicle', 'Price/day', 'Rating', 'Status', '30d Earnings', 'Actions'].map(h => (
              <div key={h} style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.06em' }}>{h}</div>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🚗</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#0f172a', marginBottom: 6 }}>No vehicles found</div>
              <div style={{ fontSize: 13 }}>Try a different search or filter</div>
            </div>
          ) : (
            filtered.map(v => {
              const s = STATUS_COLORS[v.status] || STATUS_COLORS.available;
              return (
                <div key={v.id} className="vehicle-row">
                  {/* Photo */}
                  <div style={{ width: 80, height: 56, borderRadius: 10, overflow: 'hidden', flexShrink: 0 }}>
                    <img src={v.image} alt={v.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).src = 'data:image/svg+xml,...'; }} />
                  </div>

                  {/* Name + details */}
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 3 }}>{v.name}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>{(v as any).category || 'Car'} · {(v as any).fuel || 'Petrol'} · {v.trips} total trips</div>
                  </div>

                  {/* Price */}
                  {editingId === v.id ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', alignSelf: 'center' }}>$</span>
                        <input className="inp" style={{ width: 60, padding: '6px 8px', fontSize: 14 }} value={editPrice} onChange={e => setEditPrice(e.target.value)} autoFocus onKeyDown={e => e.key === 'Enter' && saveEdit(v.id)} />
                      </div>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button onClick={() => saveEdit(v.id)} className="action-btn" style={{ background: '#f0fdf4', color: '#15803d', padding: '4px 10px' }}>✓</button>
                        <button onClick={() => setEditingId(null)} className="action-btn" style={{ background: '#f8fafc', color: '#94a3b8', padding: '4px 10px' }}>✕</button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', cursor: 'pointer' }} onClick={() => startEdit(v)} title="Click to edit">
                      ${v.price}<span style={{ fontSize: 11, fontWeight: 400, color: '#94a3b8' }}>/d</span>
                    </div>
                  )}

                  {/* Rating */}
                  <div style={{ fontSize: 13 }}>
                    <span style={{ fontWeight: 700, color: '#0f172a' }}>⭐ {v.rating}</span>
                    <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>{v.trips} trips</div>
                  </div>

                  {/* Status toggle */}
                  <button onClick={() => toggleStatus(v.id)} className="status-pill" style={{ background: s.bg, color: s.color, border: `1px solid ${s.color}22` }} title="Click to change status">
                    {v.status.charAt(0).toUpperCase() + v.status.slice(1)}
                  </button>

                  {/* Earnings */}
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#059669' }}>${v.earnings30d.toLocaleString()}</div>
                    <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>{v.trips30d} bookings</div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <Link href={`/cars/${v.id}`} className="action-btn" style={{ background: '#eff6ff', color: '#1d4ed8', textDecoration: 'none' }}>View</Link>
                    <button onClick={() => startEdit(v)} className="action-btn" style={{ background: '#f5f3ff', color: '#7c3aed' }}>Edit</button>
                    <button onClick={() => setDeleteConfirm(v.id)} className="action-btn" style={{ background: '#fef2f2', color: '#dc2626' }}>🗑</button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Bulk Actions */}
        <div style={{ display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap' }}>
          <button style={{ padding: '9px 18px', background: 'white', border: '1px solid #e2e8f0', borderRadius: 9, fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer' }}>
            📥 Export CSV
          </button>
          <button style={{ padding: '9px 18px', background: 'white', border: '1px solid #e2e8f0', borderRadius: 9, fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer' }}>
            🔄 Sync Calendar
          </button>
          <Link href="/host/add-vehicle" style={{ padding: '9px 18px', background: 'linear-gradient(135deg,#1d4ed8,#059669)', color: 'white', borderRadius: 9, fontSize: 13, fontWeight: 700, textDecoration: 'none', display: 'inline-block' }}>
            + List New Vehicle
          </Link>
        </div>
      </div>

      {/* Delete Confirm Modal */}
      {deleteConfirm !== null && (
        <div className="overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 36, marginBottom: 16, textAlign: 'center' }}>🗑️</div>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginBottom: 8, textAlign: 'center' }}>Remove Vehicle?</h3>
            <p style={{ fontSize: 14, color: '#64748b', textAlign: 'center', lineHeight: 1.6, marginBottom: 24 }}>
              This will remove <strong>{vehicles.find(v => v.id === deleteConfirm)?.name}</strong> from your fleet. Existing bookings won&apos;t be affected.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setDeleteConfirm(null)} style={{ flex: 1, padding: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer', color: '#374151' }}>Cancel</button>
              <button onClick={() => deleteVehicle(deleteConfirm)} style={{ flex: 1, padding: '12px', background: '#ef4444', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', color: 'white' }}>Remove</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
