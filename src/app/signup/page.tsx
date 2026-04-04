'use client'

import { useState, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

function SignupContent() {
  const router = useRouter()
  const supabase = createClient()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const passwordStrength = (pwd: string) => {
    let score = 0
    if (pwd.length >= 8) score++
    if (/[A-Z]/.test(pwd)) score++
    if (/[0-9]/.test(pwd)) score++
    if (/[^A-Za-z0-9]/.test(pwd)) score++
    return score
  }

  const strength = passwordStrength(password)
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][strength]
  const strengthColor = ['', 'bg-red-500', 'bg-amber-500', 'bg-yellow-400', 'bg-emerald-500'][strength]

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!fullName.trim()) { setError('Please enter your full name.'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return }

    setLoading(true)

    const { error: signupError } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: { full_name: fullName.trim() },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (signupError) {
      setError(getFriendlyError(signupError.message))
      setLoading(false)
      return
    }

    // ✅ DO NOT manually upsert — the DB trigger handles profile creation automatically
    // Manual upsert was causing the hang due to RLS blocking the insert

    setSuccess(true)
    setLoading(false)
  }

  const handleGoogleSignup = async () => {
    setGoogleLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    })
    if (error) { setError(error.message); setGoogleLoading(false) }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-emerald-600/8 rounded-full blur-[120px] pointer-events-none" />
        <div className="w-full max-w-md relative z-10 text-center">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-10 shadow-2xl">
            <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Check your email</h2>
            <p className="text-zinc-400 text-sm leading-relaxed mb-1">
              We&apos;ve sent a verification link to
            </p>
            <p className="text-white font-medium text-sm mb-5">{email}</p>
            <p className="text-zinc-500 text-xs mb-7">
              Click the link in your email to activate your account. Check your spam folder if you don&apos;t see it within a few minutes.
            </p>
            <button
              onClick={async () => {
                await supabase.auth.resend({
                  type: 'signup',
                  email,
                  options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
                })
                alert('Verification email resent. Check your inbox.')
              }}
              className="w-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 text-sm py-3 rounded-xl font-medium transition-all mb-3"
            >
              Resend verification email
            </button>
            <Link href="/login" className="block text-sm text-blue-400 hover:text-blue-300 transition-colors">
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-indigo-600/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-600/30">G</div>
            <span className="text-2xl font-bold text-white tracking-tight">GlideGo</span>
          </Link>
          <p className="text-zinc-500 mt-3 text-sm">Start your journey with GlideGo</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl">
          <h1 className="text-xl font-semibold text-white mb-1">Create your account</h1>
          <p className="text-zinc-500 text-sm mb-7">Join thousands of drivers across Melbourne</p>

          {error && (
            <div className="mb-5 flex items-start gap-3 p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl">
              <span className="text-red-400 mt-0.5 text-sm">⚠</span>
              <p className="text-red-400 text-sm leading-relaxed">{error}</p>
            </div>
          )}

          <button
            onClick={handleGoogleSignup}
            disabled={googleLoading || loading}
            className="w-full flex items-center justify-center gap-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-zinc-600 text-white rounded-xl py-3 px-4 text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed mb-5"
          >
            {googleLoading ? (
              <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
                <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/>
                <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2.01c-.72.48-1.63.76-2.7.76-2.07 0-3.83-1.4-4.46-3.28H1.85v2.07A8 8 0 0 0 8.98 17z"/>
                <path fill="#FBBC05" d="M4.52 10.53c-.16-.48-.25-.99-.25-1.53s.09-1.05.25-1.53V5.4H1.85A8 8 0 0 0 .98 9c0 1.29.31 2.51.87 3.6l2.67-2.07z"/>
                <path fill="#EA4335" d="M8.98 3.72c1.16 0 2.2.4 3.02 1.19l2.26-2.26A8 8 0 0 0 8.98 1 8 8 0 0 0 1.85 5.4l2.67 2.13c.63-1.88 2.39-3.28 4.46-3.28z"/>
              </svg>
            )}
            Continue with Google
          </button>

          <div className="relative mb-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-800" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 bg-zinc-900 text-zinc-600 text-xs">or sign up with email</span>
            </div>
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Full name</label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                required
                autoComplete="name"
                placeholder="Alex Johnson"
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 hover:border-zinc-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 rounded-xl text-white placeholder-zinc-600 text-sm outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Email address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@example.com"
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 hover:border-zinc-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 rounded-xl text-white placeholder-zinc-600 text-sm outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  placeholder="Min. 8 characters"
                  className="w-full px-4 py-3 pr-11 bg-zinc-800 border border-zinc-700 hover:border-zinc-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 rounded-xl text-white placeholder-zinc-600 text-sm outline-none transition-all"
                />
                <button type="button" onClick={() => setShowPassword(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors text-xs">
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              {password && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1,2,3,4].map(i => (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= strength ? strengthColor : 'bg-zinc-700'}`} />
                    ))}
                  </div>
                  <p className="text-xs text-zinc-500">{strengthLabel} password</p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Confirm password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
                placeholder="Repeat your password"
                className={`w-full px-4 py-3 bg-zinc-800 border rounded-xl text-white placeholder-zinc-600 text-sm outline-none transition-all ${
                  confirmPassword && confirmPassword !== password
                    ? 'border-red-500/50 focus:border-red-500'
                    : confirmPassword && confirmPassword === password
                    ? 'border-emerald-500/50 focus:border-emerald-500'
                    : 'border-zinc-700 hover:border-zinc-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50'
                }`}
              />
              {confirmPassword && confirmPassword !== password && (
                <p className="text-xs text-red-400 mt-1.5">Passwords don&apos;t match</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed text-sm shadow-lg shadow-blue-600/20 mt-1"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating account...
                </span>
              ) : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-zinc-600 mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">Sign in</Link>
          </p>
        </div>

        <p className="text-center text-xs text-zinc-700 mt-6">
          By creating an account, you agree to our{' '}
          <Link href="/terms" className="hover:text-zinc-500 transition-colors">Terms of Service</Link>
          {' '}and{' '}
          <Link href="/privacy" className="hover:text-zinc-500 transition-colors">Privacy Policy</Link>
        </p>
      </div>
    </div>
  )
}

function getFriendlyError(msg: string): string {
  if (msg.includes('already registered') || msg.includes('already been registered'))
    return 'An account with this email already exists. Sign in or reset your password.'
  if (msg.includes('Password should be at least'))
    return 'Password must be at least 6 characters.'
  if (msg.includes('Unable to validate email'))
    return 'Please enter a valid email address.'
  return msg
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <span className="w-6 h-6 border-2 border-zinc-700 border-t-blue-500 rounded-full animate-spin" />
      </div>
    }>
      <SignupContent />
    </Suspense>
  )
}
