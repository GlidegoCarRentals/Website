'use client'
// src/app/reset-password/page.tsx

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const router = useRouter()
  const supabase = createClient()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [sessionReady, setSessionReady] = useState(false)

  useEffect(() => {
    // Check if we already have a valid session (from callback redirect)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setSessionReady(true)
    })
    // Also listen for PASSWORD_RECOVERY event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setSessionReady(true)
    })
    return () => subscription.unsubscribe()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (error) { setError(error.message); return }
    setSuccess(true)
    setTimeout(() => router.push('/account'), 2500)
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-10 shadow-2xl">
            <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Password updated!</h2>
            <p className="text-zinc-400 text-sm">Redirecting you to your account...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[250px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-600/30">G</div>
            <span className="text-2xl font-bold text-white tracking-tight">GlideGo</span>
          </Link>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl">
          <h1 className="text-xl font-semibold text-white mb-1">Set new password</h1>
          <p className="text-zinc-500 text-sm mb-7">Choose a strong password for your account</p>

          {error && (
            <div className="mb-5 p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {!sessionReady && (
            <div className="mb-5 p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <p className="text-amber-400 text-sm">Loading your session... If this persists, click the reset link in your email again.</p>
            </div>
          )}

          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">New password</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required minLength={8}
                  placeholder="Min. 8 characters"
                  className="w-full px-4 py-3 pr-14 bg-zinc-800 border border-zinc-700 hover:border-zinc-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 rounded-xl text-white placeholder-zinc-600 text-sm outline-none transition-all" />
                <button type="button" onClick={() => setShowPassword(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 text-xs transition-colors px-1">
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Confirm password</label>
              <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required
                placeholder="Repeat your password"
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 hover:border-zinc-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 rounded-xl text-white placeholder-zinc-600 text-sm outline-none transition-all" />
              {confirmPassword && confirmPassword !== password && <p className="text-xs text-red-400 mt-1.5">Passwords don&apos;t match</p>}
            </div>
            <button type="submit" disabled={loading || !sessionReady}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed text-sm shadow-lg shadow-blue-600/20 mt-1">
              {loading
                ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Updating...</span>
                : 'Update Password'}
            </button>
          </form>

          <p className="text-center mt-6">
            <Link href="/login" className="text-blue-400 hover:text-blue-300 text-sm transition-colors">← Back to Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
