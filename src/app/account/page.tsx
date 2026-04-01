'use client'

// src/app/account/page.tsx

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'

export default function AccountPage() {
  const router = useRouter()
  const { user, profile, loading, signOut, refreshProfile } = useAuth()
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications'>('profile')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    phone: profile?.phone || '',
  })

  // Update formData when profile loads
  useState(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
      })
    }
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (!user || !profile) {
    router.push('/login')
    return null
  }

  const handleSaveProfile = async () => {
    setSaving(true)
    setError('')

    const { error } = await supabase
      .from('users')
      .update({
        full_name: formData.full_name,
        phone: formData.phone,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (error) {
      setError('Save nahi hua: ' + error.message)
    } else {
      setMessage('Profile update ho gaya! ✅')
      setEditing(false)
      await refreshProfile()
      setTimeout(() => setMessage(''), 3000)
    }

    setSaving(false)
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      setError('Image 5MB se chhoti honi chahiye')
      return
    }

    setUploadingAvatar(true)
    setError('')

    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}/avatar.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, { upsert: true })

    if (uploadError) {
      setError('Upload failed: ' + uploadError.message)
      setUploadingAvatar(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName)

    await supabase
      .from('users')
      .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
      .eq('id', user.id)

    await refreshProfile()
    setMessage('Photo update ho gayi! ✅')
    setTimeout(() => setMessage(''), 3000)
    setUploadingAvatar(false)
  }

  const handleResendVerification = async () => {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: user.email!,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })

    if (error) {
      setError('Email nahi bheja: ' + error.message)
    } else {
      setMessage('Verification email bhej diya! Inbox check karo.')
      setTimeout(() => setMessage(''), 5000)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
    router.refresh()
  }

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      'Account delete karna chahte ho? Yeh action undo nahi ho sakta. Saara data remove ho jayega.'
    )
    if (!confirmed) return

    const doubleConfirm = window.confirm(
      'Last chance! Pakka delete karna hai? Saari bookings aur data permanently remove ho jayegi.'
    )
    if (!doubleConfirm) return

    // Soft delete — anonymise data
    await supabase
      .from('users')
      .update({
        full_name: 'Deleted User',
        phone: null,
        avatar_url: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    await supabase.auth.signOut()
    router.push('/?deleted=true')
  }

  const initials = profile.full_name
    ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : profile.email[0].toUpperCase()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Account</h1>
          {profile.role === 'host' && (
            <Link
              href="/host/dashboard"
              className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Host Dashboard →
            </Link>
          )}
          {profile.role === 'guest' && (
            <Link
              href="/become-host"
              className="border border-blue-600 text-blue-600 px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-50 transition-colors"
            >
              Become a Host
            </Link>
          )}
        </div>

        {/* Messages */}
        {message && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
            {message}
          </div>
        )}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Email Verification Banner */}
        {!profile.email_verified && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-yellow-800">📧 Email verify karo</p>
                <p className="text-sm text-yellow-600 mt-1">
                  Booking karne ke liye email verification zaroori hai
                </p>
              </div>
              <button
                onClick={handleResendVerification}
                className="bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-yellow-700 transition-colors flex-shrink-0"
              >
                Resend Email
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left: Avatar + Quick Stats */}
          <div className="space-y-4">
            {/* Avatar */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm text-center">
              <div className="relative inline-block mb-4">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.full_name}
                    className="w-24 h-24 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-bold">
                    {initials}
                  </div>
                )}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="absolute bottom-0 right-0 w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center text-white text-xs hover:bg-gray-700 transition-colors"
                >
                  {uploadingAvatar ? '...' : '✏️'}
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
              <h2 className="font-bold text-gray-900 dark:text-white">{profile.full_name || 'Name set nahi'}</h2>
              <p className="text-sm text-gray-500">{profile.email}</p>

              {/* Role Badge */}
              <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium ${
                profile.role === 'admin' ? 'bg-red-100 text-red-700' :
                profile.role === 'host' ? 'bg-green-100 text-green-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {profile.role === 'admin' ? '🔑 Admin' :
                 profile.role === 'host' ? '🏠 Host' : '👤 Guest'}
              </span>

              {/* Email Verified Badge */}
              <div className="mt-2">
                {profile.email_verified ? (
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                    ✅ Email Verified
                  </span>
                ) : (
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                    ⚠️ Email Not Verified
                  </span>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Total Trips</span>
                  <span className="font-medium text-gray-900 dark:text-white">{profile.total_trips || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Trust Score</span>
                  <span className="font-medium text-gray-900 dark:text-white">{profile.trust_score}/100</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Promo Credits</span>
                  <span className="font-medium text-green-600">AUD ${profile.promo_credits || 0}</span>
                </div>
                {profile.referral_code && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Referral Code</span>
                    <span className="font-mono text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                      {profile.referral_code}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Sign Out */}
            <button
              onClick={handleSignOut}
              className="w-full border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
            >
              Sign Out
            </button>
          </div>

          {/* Right: Tabs */}
          <div className="md:col-span-2">
            {/* Tab Bar */}
            <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 mb-6">
              {(['profile', 'security', 'notifications'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors capitalize ${
                    activeTab === tab
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-bold text-gray-900 dark:text-white">Personal Information</h2>
                  {!editing && (
                    <button
                      onClick={() => {
                        setEditing(true)
                        setFormData({
                          full_name: profile.full_name || '',
                          phone: profile.phone || '',
                        })
                      }}
                      className="text-blue-600 text-sm font-medium hover:underline"
                    >
                      Edit
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Full Name</label>
                    {editing ? (
                      <input
                        type="text"
                        value={formData.full_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-gray-900 dark:text-white py-2">{profile.full_name || '—'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
                    <p className="text-gray-900 dark:text-white py-2">{profile.email}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Phone</label>
                    {editing ? (
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="+61 4XX XXX XXX"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-gray-900 dark:text-white py-2">{profile.phone || '— Not added'}</p>
                    )}
                  </div>

                  {editing && (
                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={handleSaveProfile}
                        disabled={saving}
                        className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                      >
                        {saving ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button
                        onClick={() => setEditing(false)}
                        className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-3 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>

                {/* Danger Zone */}
                <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="font-medium text-red-600 mb-3">Danger Zone</h3>
                  <button
                    onClick={handleDeleteAccount}
                    className="text-sm text-red-600 border border-red-200 px-4 py-2 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    Delete Account
                  </button>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
                <h2 className="font-bold text-gray-900 dark:text-white mb-6">Security</h2>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-xl">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Password</p>
                      <p className="text-sm text-gray-500">Last changed: unknown</p>
                    </div>
                    <button
                      onClick={async () => {
                        await supabase.auth.resetPasswordForEmail(user.email!, {
                          redirectTo: `${window.location.origin}/reset-password`,
                        })
                        setMessage('Password reset link bhej diya!')
                        setTimeout(() => setMessage(''), 3000)
                      }}
                      className="text-blue-600 text-sm font-medium hover:underline"
                    >
                      Change
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-xl">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Email Verification</p>
                      <p className="text-sm text-gray-500">{profile.email}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      profile.email_verified
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {profile.email_verified ? '✅ Verified' : '⚠️ Not Verified'}
                    </span>
                  </div>

                  {!profile.email_verified && (
                    <button
                      onClick={handleResendVerification}
                      className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors"
                    >
                      Resend Verification Email
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
                <h2 className="font-bold text-gray-900 dark:text-white mb-6">Notification Preferences</h2>

                <div className="space-y-4">
                  {[
                    { key: 'booking_updates', label: 'Booking Updates', desc: 'Confirmation, status changes, reminders' },
                    { key: 'messages', label: 'New Messages', desc: 'When host or guest sends a message' },
                    { key: 'promotions', label: 'Promotions', desc: 'Special offers and discount codes' },
                  ].map((pref) => {
                    const prefs = (profile.email_prefs as any) || {}
                    const isEnabled = prefs[pref.key] ?? true

                    return (
                      <div
                        key={pref.key}
                        className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-xl"
                      >
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{pref.label}</p>
                          <p className="text-sm text-gray-500">{pref.desc}</p>
                        </div>
                        <button
                          onClick={async () => {
                            const newPrefs = { ...prefs, [pref.key]: !isEnabled }
                            await supabase
                              .from('users')
                              .update({ email_prefs: newPrefs, updated_at: new Date().toISOString() })
                              .eq('id', user.id)
                            await refreshProfile()
                          }}
                          className={`relative w-12 h-6 rounded-full transition-colors ${
                            isEnabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                          }`}
                        >
                          <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                            isEnabled ? 'translate-x-7' : 'translate-x-1'
                          }`} />
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
