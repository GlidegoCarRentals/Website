'use client';
import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/auth-context';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const mode = searchParams.get('mode'); // 'request' or 'reset'
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const requestReset = async () => {
    if (!email) return setError('Please enter your email.');
    setLoading(true); setError('');
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password?mode=reset`,
    });
    setLoading(false);
    if (err) return setError(err.message);
    setDone(true);
    setMsg('Password reset link sent! Check your email inbox.');
  };

  const updatePassword = async () => {
    if (!password) return setError('Please enter a new password.');
    if (password.length < 6) return setError('Password must be at least 6 characters.');
    if (password !== confirm) return setError('Passwords do not match.');
    setLoading(true); setError('');
    const { error: err } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (err) return setError(err.message);
    setDone(true);
    setMsg('Password updated successfully!');
    setTimeout(() => router.push('/login'), 2000);
  };

  const isReset = mode === 'reset';

  return (
    <div style={{ minHeight: '100vh', background: '#070d1a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter',sans-serif", padding: 24 }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');*{box-sizing:border-box}.inp{background:rgba(255,255,255,0.05);border:1.5px solid rgba(255,255,255,0.08);border-radius:12px;padding:13px 16px;font-size:14px;color:#f1f5f9;outline:none;font-family:'Inter',sans-serif;width:100%;transition:border-color 0.2s}.inp:focus{border-color:#10b981}.inp::placeholder{color:rgba(255,255,255,0.25)}.btn{width:100%;padding:14px;background:linear-gradient(135deg,#10b981,#059669);color:white;border:none;border-radius:12px;font-size:15px;font-weight:700;cursor:pointer;font-family:'Inter',sans-serif;transition:all 0.2s}.btn:disabled{opacity:0.6;cursor:not-allowed}`}</style>
      
      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <a href="/" style={{ fontSize: 28, fontWeight: 800, color: '#10b981', textDecoration: 'none' }}>GlideGo</a>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 32 }}>
          
          {done ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>{isReset ? '🔐' : '📧'}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#f1f5f9', marginBottom: 12 }}>
                {isReset ? 'Password Updated!' : 'Check Your Email'}
              </div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>{msg}</div>
              {!isReset && (
                <button onClick={() => router.push('/login')} className="btn" style={{ marginTop: 24 }}>
                  Back to Sign In
                </button>
              )}
            </div>
          ) : (
            <>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9', marginBottom: 8 }}>
                {isReset ? '🔐 Set New Password' : '🔑 Reset Password'}
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 24 }}>
                {isReset ? 'Enter your new password below.' : 'Enter your email and we\'ll send a reset link.'}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {!isReset ? (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.4)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email Address</div>
                    <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="you@example.com" className="inp" onKeyDown={e => e.key === 'Enter' && requestReset()} />
                  </div>
                ) : (
                  <>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.4)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>New Password</div>
                      <input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="Min 6 characters" className="inp" />
                    </div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.4)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Confirm Password</div>
                      <input value={confirm} onChange={e => setConfirm(e.target.value)} type="password" placeholder="Repeat password" className="inp" onKeyDown={e => e.key === 'Enter' && updatePassword()} />
                    </div>
                  </>
                )}

                {error && (
                  <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '11px 14px', fontSize: 13, color: '#f87171' }}>
                    ⚠️ {error}
                  </div>
                )}

                <button onClick={isReset ? updatePassword : requestReset} disabled={loading} className="btn">
                  {loading ? '...' : isReset ? 'Update Password' : 'Send Reset Link'}
                </button>

                <button onClick={() => router.push('/login')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 13, cursor: 'pointer', fontFamily: "'Inter',sans-serif", padding: 8 }}>
                  ← Back to Sign In
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#070d1a' }} />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
