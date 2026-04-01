'use client'

// src/app/become-host/page.tsx
// Guests land here when they try to access host routes
// They can upgrade their role to 'host' here

import { useState } from 'react'
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

  const handleBecomeHost = async () => {
    if (!user) {
      router.push('/login?redirectTo=/become-host')
      return
    }

    if (!agreed) {
      setError('Terms agree karo pehle')
      return
    }

    setSubmitting(true)
    setError('')

    const { error: updateError } = await supabase
      .from('users')
      .update({ role: 'host', updated_at: new Date().toISOString() })
      .eq('id', user.id)

    if (updateError) {
      setError('Kuch error aaya: ' + updateError.message)
      setSubmitting(false)
      return
    }

    // Redirect to host dashboard
    router.push('/host/add-vehicle')
    router.refresh()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (!user) {
    router.push('/login?redirectTo=/become-host')
    return null
  }

  if (profile?.role === 'host' || profile?.role === 'admin') {
    router.push('/host/dashboard')
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-3xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="text-5xl">🚗</span>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mt-4 mb-3">
            Apni Car Se Paise Kamao
          </h1>
          <p className="text-xl text-gray-500">
            GlideGo host bano aur Melbourne mein apni car rent pe do
          </p>
        </div>

        {/* Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {[
            { icon: '💰', title: 'Acchi Earning', desc: 'Average AUD $800-1500/month per car' },
            { icon: '🛡️', title: 'Full Protection', desc: '$5M liability + damage protection' },
            { icon: '📱', title: 'Easy Management', desc: 'Dashboard se saari bookings manage karo' },
          ].map((item) => (
            <div
              key={item.title}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 text-center shadow-sm"
            >
              <div className="text-3xl mb-3">{item.icon}</div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-1">{item.title}</h3>
              <p className="text-sm text-gray-500">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* How it works */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Kaise Kaam Karta Hai?</h2>
          <div className="space-y-4">
            {[
              { step: '1', text: 'Apni car ki details aur photos add karo' },
              { step: '2', text: 'Price set karo aur availability calendar update karo' },
              { step: '3', text: 'Booking requests aayenge — accept ya decline karo' },
              { step: '4', text: 'Trip complete hone ke 24h baad payment milegi' },
            ].map((item) => (
              <div key={item.step} className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                  {item.step}
                </div>
                <p className="text-gray-700 dark:text-gray-300">{item.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Terms */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Host Agreement</h2>
          <div className="text-sm text-gray-500 space-y-2 mb-6">
            <p>• GlideGo 20% platform fee leta hai (80% aapko milta hai)</p>
            <p>• Aapki car ka valid VIC/AUS registration hona chahiye</p>
            <p>• Har listing mein kam se kam 5 photos zaroori hain</p>
            <p>• Guest ko 24h mein response dena hoga</p>
            <p>• GlideGo ke saare Terms of Service apply honge</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="w-4 h-4 mt-0.5 text-blue-600 rounded"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Main agree karta/karti hoon{' '}
              <Link href="/terms" className="text-blue-600 hover:underline">
                Host Terms of Service
              </Link>{' '}
              se aur confirm karta/karti hoon ki meri car legally registered hai
            </span>
          </label>
        </div>

        <button
          onClick={handleBecomeHost}
          disabled={submitting || !agreed}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 px-8 rounded-2xl text-lg transition-colors"
        >
          {submitting ? 'Setting up your host account...' : '🚀 Host Bano — Car Add Karo'}
        </button>

        <p className="text-center text-sm text-gray-400 mt-4">
          Koi commitment nahi — kabhi bhi listing remove kar sakte ho
        </p>
      </div>
    </div>
  )
}
