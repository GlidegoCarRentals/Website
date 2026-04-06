'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'

export default function BecomeHostPage() {
  const router = useRouter()
  const { user, profile, loading } = useAuth()
  const supabase = createClient()

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [agreed, setAgreed] = useState(false)

  useEffect(() => {
    if (!loading) {
      if (!user) router.push('/login?redirectTo=/become-host')
      if (profile?.role === 'host' || profile?.role === 'admin') router.push('/host/dashboard')
    }
  }, [loading, user, profile]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleBecomeHost = async () => {
    if (!agreed) { setError('Please agree to the Host Terms to continue.'); return }
    setSubmitting(true)
    setError('')

    const { error } = await supabase
      .from('users')
      .update({ role: 'host', updated_at: new Date().toISOString() })
      .eq('id', user!.id)

    if (error) { setError('Something went wrong: ' + error.message); setSubmitting(false); return }

    router.push('/host/add-vehicle')
    router.refresh()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <span className="w-6 h-6 border-2 border-zinc-700 border-t-blue-500 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[130px] pointer-events-none" />

      <div className="max-w-3xl mx-auto px-4 py-16 relative z-10">
        {/* Header */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-blue-600/10 border border-blue-500/20 rounded-full px-4 py-1.5 text-blue-400 text-xs font-medium mb-6">
            🚗 Host Program
          </div>
          <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">
            Earn money with your car
          </h1>
          <p className="text-zinc-400 text-lg max-w-xl mx-auto">
            Join Melbourne&apos;s fastest-growing car sharing platform. List your car and start earning today.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-14">
          {[
            { value: 'AUD $800–1,500', label: 'Average monthly earnings' },
            { value: '$5M', label: 'Liability coverage' },
            { value: '24h', label: 'Payout after trip ends' },
          ].map(stat => (
            <div key={stat.label} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 text-center">
              <p className="text-xl font-bold text-white mb-1">{stat.value}</p>
              <p className="text-zinc-500 text-xs">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          {[
            { icon: '💰', title: 'Competitive earnings', desc: 'Set your own price. Keep 80% of every booking.' },
            { icon: '🛡️', title: 'Full protection', desc: 'Comprehensive insurance on every trip, automatically.' },
            { icon: '📊', title: 'Smart dashboard', desc: 'Track bookings, earnings, and guest messages in one place.' },
          ].map(item => (
            <div key={item.title} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <div className="text-2xl mb-3">{item.icon}</div>
              <h3 className="font-semibold text-white mb-1.5 text-sm">{item.title}</h3>
              <p className="text-zinc-500 text-xs leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* How it works */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-7 mb-6">
          <h2 className="font-semibold text-white mb-5">How it works</h2>
          <div className="space-y-4">
            {[
              { n: '01', title: 'List your car', desc: 'Add photos, set your availability, and choose your price.' },
              { n: '02', title: 'Accept bookings', desc: 'Review guest requests and confirm trips with one tap.' },
              { n: '03', title: 'Hand over the keys', desc: 'Meet the guest, complete the check-in inspection.' },
              { n: '04', title: 'Get paid', desc: 'Earnings hit your bank account 24 hours after trip completion.' },
            ].map(step => (
              <div key={step.n} className="flex items-start gap-4">
                <span className="text-xs font-mono text-zinc-600 mt-0.5 w-6 flex-shrink-0">{step.n}</span>
                <div>
                  <p className="font-medium text-white text-sm">{step.title}</p>
                  <p className="text-zinc-500 text-xs mt-0.5">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Agreement */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-7 mb-6">
          <h2 className="font-semibold text-white mb-4">Host Agreement</h2>
          <div className="space-y-2 text-xs text-zinc-500 mb-6">
            <p>• GlideGo charges a 20% platform fee per booking (you keep 80%)</p>
            <p>• Your vehicle must have valid Australian registration</p>
            <p>• A minimum of 5 photos are required per listing</p>
            <p>• You must respond to booking requests within 24 hours</p>
            <p>• All GlideGo Host Terms of Service apply</p>
          </div>

          {error && (
            <div className="mb-4 p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <label className="flex items-start gap-3 cursor-pointer group">
            <div
              onClick={() => setAgreed(a => !a)}
              className={`w-4 h-4 mt-0.5 rounded border flex items-center justify-center flex-shrink-0 transition-all cursor-pointer ${
                agreed ? 'bg-blue-600 border-blue-600' : 'border-zinc-600 hover:border-zinc-400'
              }`}
            >
              {agreed && (
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                  <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
            <span className="text-zinc-400 text-sm leading-relaxed group-hover:text-zinc-300 transition-colors">
              I agree to the{' '}
              <Link href="/host-terms" className="text-blue-400 hover:text-blue-300">Host Terms of Service</Link>
              {' '}and confirm that my vehicle has a valid Australian registration.
            </span>
          </label>
        </div>

        <button
          onClick={handleBecomeHost}
          disabled={submitting || !agreed}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-2xl text-base transition-all shadow-lg shadow-blue-600/20"
        >
          {submitting ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Setting up your host account...
            </span>
          ) : 'Become a Host — List Your Car'}
        </button>

        <p className="text-center text-xs text-zinc-700 mt-4">
          No commitment required. You can deactivate or remove listings at any time.
        </p>
      </div>
    </div>
  )
}
