export default function PaymentSuccess() {
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