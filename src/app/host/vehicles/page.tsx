'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { fetchHostCars } from '@/lib/db-cars';

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  available: { bg: '#f0fdf4', color: '#15803d' },
  booked: { bg: '#eff6ff', color: '#1d4ed8' },
  maintenance: { bg: '#fffbeb', color: '#d97706' },
  inactive: { bg: '#f8fafc', color: '#94a3b8' },
  active: { bg: '#f0fdf4', color: '#15803d' },
};

export default function HostVehiclesPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login?redirect=/host/vehicles');
      return;
    }

    if (!isLoading && user) {
      fetchHostCars(user.id)
        .then((cars) => setVehicles(cars.map((car: any) => ({ ...car, id: String(car.id) }))))
        .catch(() => setLoadError('Vehicles load nahi ho paaye.'))
        .finally(() => setPageLoading(false));
    }
  }, [isLoading, router, user]);

  if (isLoading || !user) return null;

  const filtered = vehicles.filter((vehicle) => {
    const matchSearch = vehicle.name.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || vehicle.status === filter;
    return matchSearch && matchFilter;
  });

  const persistVehicle = async (id: string, body: Record<string, unknown>) => {
    const response = await fetch(`/api/host/cars/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Vehicle update failed.');
    return result.car;
  };

  const startEdit = (vehicle: any) => {
    setActionError('');
    setEditingId(vehicle.id);
    setEditPrice(String(vehicle.price));
  };

  const saveEdit = async (id: string) => {
    try {
      const updated = await persistVehicle(id, { price_daily: Number(editPrice) });
      setVehicles((items) => items.map((vehicle) => vehicle.id === id ? { ...vehicle, price: updated.price_daily } : vehicle));
      setEditingId(null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Vehicle price save nahi ho paya.');
    }
  };

  const toggleStatus = async (id: string) => {
    const current = vehicles.find((vehicle) => vehicle.id === id);
    if (!current) return;
    const nextStatus: Record<string, string> = { available: 'maintenance', maintenance: 'inactive', inactive: 'active', booked: 'active', active: 'maintenance' };

    try {
      const updated = await persistVehicle(id, { status: nextStatus[current.status] || 'active' });
      setVehicles((items) => items.map((vehicle) => vehicle.id === id ? { ...vehicle, status: updated.status, available: updated.available } : vehicle));
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Vehicle status update nahi ho paya.');
    }
  };

  const deleteVehicle = async (id: string) => {
    try {
      const response = await fetch(`/api/host/cars/${id}`, { method: 'DELETE' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Vehicle delete failed.');
      setVehicles((items) => items.filter((vehicle) => vehicle.id !== id));
      setDeleteConfirm(null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Vehicle delete nahi ho paya.');
    }
  };

  const totalEarnings = vehicles.reduce((sum, vehicle) => sum + (vehicle.earnings30d || 0), 0);

  return (
    <div style={{ fontFamily: "'Inter',-apple-system,sans-serif", minHeight: '100vh', background: '#f8fafc' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .playfair { font-family: 'Playfair Display', serif; }
        .card { background: white; border-radius: 16px; border: 1px solid #f1f5f9; box-shadow: 0 1px 4px rgba(0,0,0,.04); }
        .action-btn { padding: 7px 14px; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer; border: none; }
        .inp { border: 1.5px solid #e2e8f0; border-radius: 9px; padding: 9px 13px; font-size: 14px; outline: none; color: #0f172a; background: white; }
        .vehicle-row { display: grid; grid-template-columns: 90px 1fr 110px 90px 100px 110px 140px; align-items: center; gap: 16px; padding: 16px 20px; border-bottom: 1px solid #f8fafc; }
        .status-pill { font-size: 11px; font-weight: 700; padding: 4px 11px; border-radius: 20px; cursor: pointer; }
        .overlay { position: fixed; inset: 0; background: rgba(0,0,0,.5); z-index: 200; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px); }
        .modal { background: white; border-radius: 20px; padding: 32px; max-width: 420px; width: 90%; box-shadow: 0 32px 80px rgba(0,0,0,.25); }
      `}</style>

      <div style={{ background: '#0a0f1e', padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <Link href="/host/dashboard" style={{ textDecoration: 'none' }}>
            <Image src="/logo.png" alt="GlideGo" width={100} height={23} style={{ objectFit: 'contain', filter: 'brightness(1.2)' }} />
          </Link>
          <Link href="/host/dashboard" style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, textDecoration: 'none' }}>Dashboard</Link>
          <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>/</span>
          <span style={{ color: 'white', fontSize: 13, fontWeight: 600 }}>My Vehicles</span>
        </div>
        <Link href="/host/add-vehicle" style={{ background: 'linear-gradient(135deg,#1d4ed8,#059669)', color: 'white', textDecoration: 'none', padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 700 }}>
          + Add Vehicle
        </Link>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
        {loadError && <div style={{ marginBottom: 20, background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', borderRadius: 12, padding: '14px 16px', fontSize: 13, fontWeight: 600 }}>{loadError}</div>}
        {actionError && <div style={{ marginBottom: 20, background: '#fff7ed', border: '1px solid #fdba74', color: '#c2410c', borderRadius: 12, padding: '14px 16px', fontSize: 13, fontWeight: 600 }}>{actionError}</div>}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 28 }}>
          {[{ label: 'Total Vehicles', val: vehicles.length, icon: '🚗', bg: '#eff6ff' }, { label: 'Active / Booked', val: vehicles.filter((vehicle) => ['available', 'booked', 'active'].includes(vehicle.status)).length, icon: '✅', bg: '#f0fdf4' }, { label: '30-Day Trips', val: vehicles.reduce((sum, vehicle) => sum + (vehicle.trips30d || 0), 0), icon: '📅', bg: '#f5f3ff' }, { label: '30-Day Earnings', val: `$${totalEarnings.toLocaleString()}`, icon: '💰', bg: '#fffbeb' }].map((item) => <div key={item.label} className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: 14 }}><div style={{ width: 44, height: 44, borderRadius: 12, background: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{item.icon}</div><div><div className="playfair" style={{ fontSize: 24, fontWeight: 800, color: '#0f172a' }}>{item.val}</div><div style={{ fontSize: 12, color: '#64748b' }}>{item.label}</div></div></div>)}
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          <input className="inp" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search vehicles..." style={{ width: 240 }} />
          <div style={{ display: 'flex', gap: 6 }}>{['all', 'available', 'booked', 'maintenance', 'inactive'].map((status) => <button key={status} onClick={() => setFilter(status)} style={{ padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none', background: filter === status ? '#0f172a' : '#f8fafc', color: filter === status ? 'white' : '#64748b', textTransform: 'capitalize' }}>{status === 'all' ? 'All' : status}</button>)}</div>
          <div style={{ marginLeft: 'auto', fontSize: 13, color: '#94a3b8' }}>{filtered.length} vehicle{filtered.length !== 1 ? 's' : ''}</div>
        </div>

        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr 110px 90px 100px 110px 140px', gap: 16, padding: '12px 20px', background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>{['Photo', 'Vehicle', 'Price/day', 'Rating', 'Status', '30d Earnings', 'Actions'].map((heading) => <div key={heading} style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.06em' }}>{heading}</div>)}</div>
          {pageLoading ? <div style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}><div style={{ fontSize: 36, marginBottom: 12 }}>⏳</div><div style={{ fontSize: 15, fontWeight: 600, color: '#0f172a', marginBottom: 6 }}>Loading your vehicles</div></div> : filtered.length === 0 ? <div style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}><div style={{ fontSize: 36, marginBottom: 12 }}>🚗</div><div style={{ fontSize: 15, fontWeight: 600, color: '#0f172a', marginBottom: 6 }}>No vehicles found</div><div style={{ fontSize: 13 }}>Add your first car to start hosting.</div></div> : filtered.map((vehicle) => { const statusConfig = STATUS_COLORS[vehicle.status] || STATUS_COLORS.available; return <div key={vehicle.id} className="vehicle-row"><div style={{ width: 80, height: 56, borderRadius: 10, overflow: 'hidden' }}><img src={vehicle.image} alt={vehicle.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div><div><div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 3 }}>{vehicle.name}</div><div style={{ fontSize: 11, color: '#94a3b8' }}>{vehicle.category || 'Car'} · {vehicle.fuel || 'Petrol'} · {vehicle.trips} total trips</div></div>{editingId === vehicle.id ? <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}><input className="inp" style={{ width: 80, padding: '6px 8px', fontSize: 14 }} value={editPrice} onChange={(e) => setEditPrice(e.target.value)} autoFocus onKeyDown={(e) => e.key === 'Enter' && saveEdit(vehicle.id)} /><div style={{ display: 'flex', gap: 4 }}><button onClick={() => saveEdit(vehicle.id)} className="action-btn" style={{ background: '#f0fdf4', color: '#15803d', padding: '4px 10px' }}>✓</button><button onClick={() => setEditingId(null)} className="action-btn" style={{ background: '#f8fafc', color: '#94a3b8', padding: '4px 10px' }}>✕</button></div></div> : <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', cursor: 'pointer' }} onClick={() => startEdit(vehicle)}>${vehicle.price}<span style={{ fontSize: 11, fontWeight: 400, color: '#94a3b8' }}>/d</span></div>}<div style={{ fontSize: 13 }}><span style={{ fontWeight: 700, color: '#0f172a' }}>⭐ {vehicle.rating}</span><div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>{vehicle.trips} trips</div></div><button onClick={() => toggleStatus(vehicle.id)} className="status-pill" style={{ background: statusConfig.bg, color: statusConfig.color, border: `1px solid ${statusConfig.color}22` }}>{vehicle.status.charAt(0).toUpperCase() + vehicle.status.slice(1)}</button><div><div style={{ fontSize: 14, fontWeight: 700, color: '#059669' }}>${(vehicle.earnings30d || 0).toLocaleString()}</div><div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>{vehicle.trips30d || 0} bookings</div></div><div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}><Link href={`/cars/${vehicle.slug || vehicle.id}`} className="action-btn" style={{ background: '#eff6ff', color: '#1d4ed8', textDecoration: 'none' }}>View</Link><button onClick={() => startEdit(vehicle)} className="action-btn" style={{ background: '#f5f3ff', color: '#7c3aed' }}>Edit</button><button onClick={() => setDeleteConfirm(vehicle.id)} className="action-btn" style={{ background: '#fef2f2', color: '#dc2626' }}>🗑</button></div></div>; })}
        </div>
      </div>

      {deleteConfirm !== null && <div className="overlay" onClick={() => setDeleteConfirm(null)}><div className="modal" onClick={(event) => event.stopPropagation()}><div style={{ fontSize: 36, marginBottom: 16, textAlign: 'center' }}>🗑️</div><h3 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginBottom: 8, textAlign: 'center' }}>Remove Vehicle?</h3><p style={{ fontSize: 14, color: '#64748b', textAlign: 'center', lineHeight: 1.6, marginBottom: 24 }}>This will remove <strong>{vehicles.find((vehicle) => vehicle.id === deleteConfirm)?.name}</strong> from your fleet. Existing bookings are not touched.</p><div style={{ display: 'flex', gap: 12 }}><button onClick={() => setDeleteConfirm(null)} style={{ flex: 1, padding: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer', color: '#374151' }}>Cancel</button><button onClick={() => deleteVehicle(deleteConfirm)} style={{ flex: 1, padding: '12px', background: '#ef4444', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', color: 'white' }}>Remove</button></div></div></div>}
    </div>
  );
}
