'use client';
import { useState, Suspense, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

function LoginForm() {
  const { login, signup, loginWithGoogle } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Handle implicit OAuth flow — token in URL hash
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hash = window.location.hash;
    if (hash && hash.includes('access_token')) {
      // Supabase client will auto-detect and handle this
      // Just redirect to home after a brief moment
      setTimeout(() => router.push('/'), 500);
    }
  }, [router]);
  const [mode, setMode] = useState<'login' | 'signup'>(searchParams.get('mode') === 'signup' ? 'signup' : 'login');
  const [role, setRole] = useState<'guest' | 'host'>('guest');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const redirect = searchParams.get('redirect') || '/';

  const handleSubmit = async () => {
    setError(''); setSuccess(''); setLoading(true);
    try {
      if (mode === 'login') {
        const { ok, error: err } = await login(email, password);
        if (ok) router.push(redirect);
        else setError(err || 'Login failed');
      } else {
        const { ok, error: err } = await signup(name, email, password, role);
        if (ok) {
          setSuccess('Account created! Check your email to verify, then sign in.');
          setMode('login');
        } else {
          setError(err || 'Signup failed');
        }
      }
    } catch {
      setError('Something went wrong. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#070d1a', display: 'flex', fontFamily: "'Inter',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        .inp{background:rgba(255,255,255,0.05);border:1.5px solid rgba(255,255,255,0.08);border-radius:12px;padding:13px 16px;font-size:14px;color:#f1f5f9;outline:none;font-family:'Inter',sans-serif;width:100%;transition:border-color 0.2s}
        .inp:focus{border-color:#10b981;background:rgba(16,185,129,0.06)}
        .inp::placeholder{color:rgba(255,255,255,0.25)}
        .sbtn{width:100%;padding:14px;background:linear-gradient(135deg,#10b981,#059669);color:white;border:none;border-radius:12px;font-size:15px;font-weight:700;cursor:pointer;font-family:'Inter',sans-serif;transition:all 0.2s}
        .sbtn:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 8px 24px rgba(16,185,129,0.4)}
        .sbtn:disabled{opacity:0.6;cursor:not-allowed}
        @keyframes spin{to{transform:rotate(360deg)}}
        .spin{animation:spin 0.8s linear infinite;display:inline-block;width:18px;height:18px;border:2px solid rgba(255,255,255,0.3);border-top-color:white;border-radius:50%}
        @media(max-width:768px){.left-panel{display:none!important}}
      `}</style>

      {/* Left branding panel */}
      <div className="left-panel" style={{ flex:1, background:'linear-gradient(135deg,#060d1e,#0a1628,#071a10)', display:'flex', flexDirection:'column', justifyContent:'space-between', padding:'48px', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:'30%', left:'20%', width:300, height:300, background:'radial-gradient(circle,rgba(16,185,129,0.08),transparent 70%)', borderRadius:'50%', pointerEvents:'none' }} />
        <Link href="/" style={{ fontSize:28, fontWeight:800, color:'#10b981', textDecoration:'none', letterSpacing:'-0.5px' }}>GlideGo</Link>
        <div>
          <div style={{ fontSize:42, fontWeight:800, color:'#f1f5f9', letterSpacing:'-1.5px', lineHeight:1.15, marginBottom:16, maxWidth:420 }}>
            The smarter way to<br />
            <span style={{ background:'linear-gradient(90deg,#10b981,#3b82f6)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>rent a car</span> in Melbourne.
          </div>
          <p style={{ fontSize:15, color:'rgba(255,255,255,0.5)', lineHeight:1.7, maxWidth:380 }}>
            Skip the rental counter. Choose from premium cars, book instantly, and drive away with confidence.
          </p>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {[
            { icon:'⚡', label:'Instant booking — no waiting', color:'#10b981' },
            { icon:'🛡️', label:'Full insurance included on every trip', color:'#3b82f6' },
            { icon:'⭐', label:'4.9★ rated by 3,000+ customers', color:'#f59e0b' },
          ].map(f => (
            <div key={f.label} style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ width:36, height:36, borderRadius:10, background:f.color+'20', border:`1px solid ${f.color}33`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>{f.icon}</div>
              <span style={{ fontSize:13, color:'rgba(255,255,255,0.65)' }}>{f.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right form panel */}
      <div style={{ width:'100%', maxWidth:480, display:'flex', flexDirection:'column', justifyContent:'center', padding:'48px 40px', overflowY:'auto' }}>
        
        {/* Mode toggle */}
        <div style={{ display:'flex', background:'rgba(255,255,255,0.04)', borderRadius:14, padding:4, marginBottom:32 }}>
          {(['login','signup'] as const).map(m => (
            <button key={m} onClick={() => { setMode(m); setError(''); setSuccess(''); }}
              style={{ flex:1, padding:'11px', borderRadius:10, border:'none', cursor:'pointer', fontSize:14, fontWeight:700, fontFamily:"'Inter',sans-serif", background: mode===m ? 'linear-gradient(135deg,#10b981,#059669)' : 'transparent', color: mode===m ? 'white' : 'rgba(255,255,255,0.4)', transition:'all 0.2s' }}>
              {m === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          ))}
        </div>

        <div style={{ fontSize:26, fontWeight:800, color:'#f1f5f9', marginBottom:6, letterSpacing:'-0.5px' }}>
          {mode === 'login' ? 'Welcome back' : 'Join GlideGo'}
        </div>
        <div style={{ fontSize:13, color:'rgba(255,255,255,0.4)', marginBottom:28 }}>
          {mode === 'login' ? 'Sign in to access your account' : 'Create your free account today'}
        </div>

        {/* Role selector (signup only) */}
        {mode === 'signup' && (
          <div style={{ display:'flex', gap:10, marginBottom:20 }}>
            {([{ val:'guest', icon:'🧳', label:'Rent a Car', sub:'I want to book' }, { val:'host', icon:'🚗', label:'List My Car', sub:'I want to earn' }] as const).map(r => (
              <button key={r.val} onClick={() => setRole(r.val)}
                style={{ flex:1, padding:'14px 12px', borderRadius:14, border:`2px solid ${role===r.val ? '#10b981' : 'rgba(255,255,255,0.08)'}`, background: role===r.val ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.03)', cursor:'pointer', textAlign:'center', transition:'all 0.2s' }}>
                <div style={{ fontSize:24, marginBottom:4 }}>{r.icon}</div>
                <div style={{ fontSize:12, fontWeight:700, color: role===r.val ? '#10b981' : 'rgba(255,255,255,0.7)' }}>{r.label}</div>
                <div style={{ fontSize:10, color:'rgba(255,255,255,0.3)', marginTop:2 }}>{r.sub}</div>
              </button>
            ))}
          </div>
        )}

        {/* Fields */}
        <div style={{ display:'flex', flexDirection:'column', gap:14, marginBottom:20 }}>
          {mode === 'signup' && (
            <div>
              <div style={{ fontSize:11, fontWeight:600, color:'rgba(255,255,255,0.4)', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.05em' }}>Full Name</div>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Alex Johnson" className="inp" />
            </div>
          )}
          <div>
            <div style={{ fontSize:11, fontWeight:600, color:'rgba(255,255,255,0.4)', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.05em' }}>Email Address</div>
            <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="you@example.com" className="inp" />
          </div>
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
              <div style={{ fontSize:11, fontWeight:600, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'0.05em' }}>Password</div>
              {mode === 'login' && <button style={{ background:'none', border:'none', cursor:'pointer', fontSize:11, color:'#10b981', fontFamily:"'Inter',sans-serif" }}>Forgot password?</button>}
            </div>
            <div style={{ position:'relative' }}>
              <input value={password} onChange={e => setPassword(e.target.value)} type={showPass ? 'text' : 'password'} placeholder="••••••••" className="inp" onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
              <button type="button" onClick={() => setShowPass(!showPass)} style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.3)', fontSize:16 }}>{showPass ? '🙈' : '👁️'}</button>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:10, padding:'11px 14px', fontSize:13, color:'#f87171', marginBottom:14 }}>
            ⚠️ {error}
          </div>
        )}

        {/* Success */}
        {success && (
          <div style={{ background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.2)', borderRadius:10, padding:'11px 14px', fontSize:13, color:'#34d399', marginBottom:14 }}>
            ✅ {success}
          </div>
        )}

        {/* Remember Me */}
        {mode === 'login' && (
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
            <div onClick={() => setRememberMe(!rememberMe)} style={{ width:20, height:20, borderRadius:6, border:`2px solid ${rememberMe ? '#10b981' : 'rgba(255,255,255,0.2)'}`, background: rememberMe ? '#10b981' : 'transparent', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'all 0.2s' }}>
              {rememberMe && <span style={{ color:'white', fontSize:12, fontWeight:700 }}>✓</span>}
            </div>
            <span style={{ fontSize:13, color:'rgba(255,255,255,0.5)', cursor:'pointer' }} onClick={() => setRememberMe(!rememberMe)}>
              Remember me for 30 days
            </span>
          </div>
        )}

        {/* Submit */}
        <button onClick={handleSubmit} disabled={loading} className="sbtn" style={{ marginBottom:16 }}>
          {loading ? <span className="spin" /> : mode === 'login' ? 'Sign In →' : 'Create Account →'}
        </button>

        {/* Divider */}
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
          <div style={{ flex:1, height:1, background:'rgba(255,255,255,0.07)' }} />
          <span style={{ fontSize:11, color:'rgba(255,255,255,0.25)' }}>OR</span>
          <div style={{ flex:1, height:1, background:'rgba(255,255,255,0.07)' }} />
        </div>

        {/* Google */}
        <button onClick={loginWithGoogle}
          style={{ width:'100%', background:'rgba(255,255,255,0.05)', border:'1.5px solid rgba(255,255,255,0.1)', borderRadius:12, padding:'13px', color:'white', fontSize:14, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:10, fontFamily:"'Inter',sans-serif", transition:'all 0.2s', marginBottom:24 }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.09)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}>
          <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Continue with Google
        </button>

        <p style={{ textAlign:'center', fontSize:12, color:'rgba(255,255,255,0.25)' }}>
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setSuccess(''); }}
            style={{ background:'none', border:'none', color:'#10b981', fontWeight:600, cursor:'pointer', fontSize:12, fontFamily:"'Inter',sans-serif" }}>
            {mode === 'login' ? 'Create one' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight:'100vh', background:'#070d1a', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div style={{ width:40, height:40, border:'3px solid rgba(255,255,255,0.1)', borderTopColor:'#10b981', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
