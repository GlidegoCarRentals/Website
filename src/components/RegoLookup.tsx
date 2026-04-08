'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

export type CarDetails = {
  make: string;
  model: string;
  year: string;
  color: string;
  bodyType?: string;
  engine?: string;
  transmission?: string;
  fuelType?: string;
  odometerKm?: number;
  stolenCheck?: { status: string; message: string };
  encumbranceCheck?: { status: string; message: string };
  nevdisData?: { status: string; checkedAt: string };
  confidence?: { level: string; score: number };
};

export default function RegoLookup({
  rego,
  onRegChange,
  onCarDetails,
}: Readonly<{
  rego: string;
  onRegChange: (next: string) => void;
  onCarDetails: (details: CarDetails) => void;
}>) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [details, setDetails] = useState<CarDetails | null>(null);
  const lastFetchedRegoRef = useRef<string>('');

  const regoTrimmed = useMemo(() => rego.trim().toUpperCase(), [rego]);

  const normalizeRego = (raw: string) => raw.replace(/[\s-]/g, '').toUpperCase();

  const isValidRegoFormat = (normalized: string) => {
    if (!normalized) return false;
    // Simple, platform-agnostic heuristic:
    // - 3-8 alphanumeric chars
    // - at least one letter
    // - at least one digit
    return /^[A-Z0-9]{3,8}$/.test(normalized) && /[A-Z]/.test(normalized) && /\d/.test(normalized);
  };

  const normalizedRego = useMemo(() => normalizeRego(regoTrimmed), [regoTrimmed]);
  const regoFormatError = useMemo(() => {
    if (!regoTrimmed.trim()) return null;
    if (!isValidRegoFormat(normalizedRego)) return 'Enter a valid rego (e.g. ABC123).';
    return null;
  }, [normalizedRego, regoTrimmed]);

  const fetchCarDetails = async (opts?: { source?: 'button' | 'debounce' }) => {
    const nextRego = normalizedRego;

    if (!nextRego) {
      setError('Please enter a rego number.');
      setSuccess(null);
      return;
    }

    if (!isValidRegoFormat(nextRego)) {
      setError('Please enter a valid rego number.');
      setSuccess(null);
      return;
    }

    // Prevent refetch loops when normalization updates the parent's rego value.
    if (lastFetchedRegoRef.current === nextRego && opts?.source !== 'button') return;

    setError(null);
    setSuccess(null);
    setDetails(null);
    setLoading(true);
    try {
      const res = await fetch('/api/rego-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rego: nextRego }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to fetch car details');
      }

      onCarDetails({
        make: String(data.make || ''),
        model: String(data.model || ''),
        year: String(data.year || ''),
        color: String(data.color || ''),
        bodyType: String(data.bodyType || ''),
        engine: String(data.engine || ''),
        transmission: String(data.transmission || ''),
        fuelType: String(data.fuelType || ''),
        odometerKm: Number(data.odometerKm || 0),
        stolenCheck: data.stolenCheck,
        encumbranceCheck: data.encumbranceCheck,
        nevdisData: data.nevdisData,
        confidence: data.confidence,
      });

      const nextDetails: CarDetails = {
        make: String(data.make || ''),
        model: String(data.model || ''),
        year: String(data.year || ''),
        color: String(data.color || ''),
        bodyType: String(data.bodyType || ''),
        engine: String(data.engine || ''),
        transmission: String(data.transmission || ''),
        fuelType: String(data.fuelType || ''),
        odometerKm: Number(data.odometerKm || 0),
        stolenCheck: data.stolenCheck,
        encumbranceCheck: data.encumbranceCheck,
        nevdisData: data.nevdisData,
        confidence: data.confidence,
      };
      setDetails(nextDetails);
      onRegChange(nextRego);
      lastFetchedRegoRef.current = nextRego;
      const confLevel = data?.confidence?.level ? String(data.confidence.level) : 'Manual Entry';
      setSuccess(`Found ${data.make || ''} ${data.model || ''} (${data.year || ''}) · ${confLevel}.`);
    } catch (err: any) {
      setError(err?.message || 'Something went wrong');
      setSuccess(null);
      setDetails(null);
    } finally {
      setLoading(false);
    }
  };

  // Debounced auto-lookup while typing.
  useEffect(() => {
    const canLookup = normalizedRego && isValidRegoFormat(normalizedRego);
    if (!canLookup) return;
    if (loading) return;

    const t = setTimeout(() => {
      fetchCarDetails({ source: 'debounce' });
    }, 650);

    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [normalizedRego]);

  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: 14,
        padding: '14px 14px',
        boxShadow: '0 1px 0 rgba(15, 23, 42, 0.02)',
      }}
    >
      <label
        htmlFor="rego-lookup-input"
        style={{
          fontSize: 12,
          fontWeight: 800,
          color: '#64748b',
          display: 'block',
          marginBottom: 9,
          letterSpacing: '0.08em',
        }}
      >
        REGISTRATION (REGO)
      </label>

      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <input
          id="rego-lookup-input"
          value={rego}
          onChange={(e) => {
            setSuccess(null);
            setError(null);
            setDetails(null);
            onRegChange(e.target.value);
          }}
          placeholder="e.g. ABC123"
          aria-invalid={!!regoFormatError}
          style={{
            flex: 1,
            border: regoFormatError ? '1.5px solid #fca5a5' : '1.5px solid #e2e8f0',
            borderRadius: 10,
            padding: '11px 14px',
            fontSize: 14,
            color: '#0f172a',
            outline: 'none',
            background: 'white',
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !loading) fetchCarDetails({ source: 'button' });
          }}
        />

        <button
          type="button"
          onClick={() => fetchCarDetails({ source: 'button' })}
          disabled={loading || !!regoFormatError}
          style={{
            whiteSpace: 'nowrap',
            background: loading
              ? '#cbd5e1'
              : 'linear-gradient(135deg,#1d4ed8,#059669)',
            color: 'white',
            border: 'none',
            borderRadius: 12,
            padding: '12px 14px',
            fontSize: 13,
            fontWeight: 800,
            cursor: loading || !!regoFormatError ? 'not-allowed' : 'pointer',
            opacity: loading || !!regoFormatError ? 0.75 : 1,
            boxShadow: loading || !!regoFormatError ? 'none' : '0 8px 24px rgba(29,78,216,0.18)',
          }}
        >
          {loading ? 'Looking up...' : 'Fetch Car Details'}
        </button>
      </div>

      {regoFormatError && (
        <div style={{ marginTop: 8, fontSize: 12, color: '#dc2626', fontWeight: 700 }}>
          {regoFormatError}
        </div>
      )}

      {success && !loading && (
        <div
          style={{
            marginTop: 8,
            fontSize: 12,
            color: '#166534',
            fontWeight: 800,
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            padding: '8px 10px',
            borderRadius: 12,
          }}
        >
          {success}
        </div>
      )}

      {error && (
        <div style={{ marginTop: 8, fontSize: 12, color: '#dc2626', fontWeight: 700 }}>
          {error}
        </div>
      )}

      {details && !loading && (
        <div style={{ marginTop: 12, padding: '12px 12px', borderRadius: 12, border: '1px solid #e5e7eb', background: '#f8fafc' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 900, color: '#0f172a', marginBottom: 2 }}>Auto-fill Results</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>
                You can edit the fields below before publishing.
              </div>
            </div>
            {details.confidence?.level && (
              <div style={{ fontSize: 12, fontWeight: 900, padding: '6px 10px', borderRadius: 999, background: (() => {
                const lv = details.confidence?.level || '';
                if (lv === 'Verified') return '#dcfce7';
                if (lv === 'Partially Verified') return '#fef3c7';
                return '#e5e7eb';
              })(), color: (() => {
                const lv = details.confidence?.level || '';
                if (lv === 'Verified') return '#15803d';
                if (lv === 'Partially Verified') return '#b45309';
                return '#111827';
              })(), border: '1px solid rgba(0,0,0,0.04)' }}>
                {details.confidence.level} · {Math.round((details.confidence.score || 0) * 100)}%
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#0f172a' }}>Body type</div>
            <div style={{ fontSize: 12, color: '#64748b' }}>{details.bodyType || '—'}</div>

            <div style={{ fontSize: 12, fontWeight: 800, color: '#0f172a' }}>Fuel type</div>
            <div style={{ fontSize: 12, color: '#64748b' }}>{details.fuelType || '—'}</div>

            <div style={{ fontSize: 12, fontWeight: 800, color: '#0f172a' }}>Transmission</div>
            <div style={{ fontSize: 12, color: '#64748b' }}>{details.transmission || '—'}</div>

            <div style={{ fontSize: 12, fontWeight: 800, color: '#0f172a' }}>Engine</div>
            <div style={{ fontSize: 12, color: '#64748b' }}>{details.engine || '—'}</div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 900, padding: '7px 10px', borderRadius: 999, background: '#fff', border: '1px solid #e5e7eb', color: '#111827' }}>
              Odometer: {Number(details.odometerKm || 0).toLocaleString()} km
            </div>
            <div style={{ fontSize: 12, fontWeight: 900, padding: '7px 10px', borderRadius: 999, background: '#fff', border: '1px solid #e5e7eb', color: '#111827' }}>
              Stolen: {details.stolenCheck?.status || '—'}
            </div>
            <div style={{ fontSize: 12, fontWeight: 900, padding: '7px 10px', borderRadius: 999, background: '#fff', border: '1px solid #e5e7eb', color: '#111827' }}>
              Finance: {details.encumbranceCheck?.status || '—'}
            </div>
            <div style={{ fontSize: 12, fontWeight: 900, padding: '7px 10px', borderRadius: 999, background: '#fff', border: '1px solid #e5e7eb', color: '#111827' }}>
              NEVDIS: {details.nevdisData?.status || '—'} · {details.nevdisData?.checkedAt || '—'}
            </div>
          </div>

          <div style={{ marginTop: 10, fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>
            <div>Stolen check: {details.stolenCheck?.message || '—'}</div>
            <div>Finance check: {details.encumbranceCheck?.message || '—'}</div>
            <div>NEVDIS: {details.nevdisData?.status || '—'} (checked {details.nevdisData?.checkedAt || '—'})</div>
          </div>
        </div>
      )}

      <div style={{ marginTop: 8, fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>
        Auto-fill runs after you pause typing (debounced) and supports mock REGO checks.
      </div>
    </div>
  );
}

