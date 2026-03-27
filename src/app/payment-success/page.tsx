'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/auth-context';

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('bookingId');
  const [updated, setUpdated] = useState(false);

  useEffect(() => {
    if (!bookingId) return;

    // Update booking status to confirmed
    const updateBooking = async () => {
      const isUuid = /^[0-9a-f-]{36}$/i.test(bookingId);
      if (!isUuid) return;

      const { error } = await supabase
        .from('bookings')
        .update({ status: 'confirmed', updated_at: new Date().toISOString() })
        .eq('id', bookingId);

      if (!error) setUpdated(true);
    };

    updateBooking();
  }, [bookingId]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ background: 'white', borderRadius: 24, padding: 48, textAlign: 'center', maxWidth: 440, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>Booking Confirmed!</h1>
        <p style={{ fontSize: 15, color: '#64748b', marginBottom: 24, lineHeight: 1.6 }}>Your car has been booked successfully. A confirmation email will be sent shortly.</p>
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: 16, marginBottom: 24 }}>
          <p style={{ color: '#15803d', fontWeight: 600, fontSize: 14 }}>✅ Payment successful</p>
          <p style={{ color: '#16a34a', fontSize: 12, marginTop: 4 }}>Bond pre-authorised — will be released on return</p>
        </div>
        <a href="/" style={{ display: 'block', background: 'linear-gradient(135deg,#1d4ed8,#059669)', color: 'white', padding: '14px 24px', borderRadius: 12, textDecoration: 'none', fontWeight: 700, fontSize: 15 }}>
          Back to Home
        </a>
      </div>
    </div>
  );
}

export default function PaymentSuccess() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 40, height: 40, border: '4px solid #1d4ed8', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}
