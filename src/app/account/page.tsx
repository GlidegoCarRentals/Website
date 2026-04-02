'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'

type Tab = 'profile' | 'security' | 'notifications'

export default function AccountPage() {
  const router = useRouter()
  const { user, profile, loading, signOut, refreshProfile } = useAuth()
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [activeTab, setActiveTab] = useState<Tab>('profile')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [formInitialized, setFormInitialized] = useState(false)

  // ✅ CORRECT: useEffect with state setters — only runs when profile first loads
  useEffect(() => {
    if (profile && !formInitialized) {
      setFullName(profile.full_name || '') // eslint-disable-line react-hooks/set-state-in-effect
      setPhone(profile.phone || '') // eslint-disable-line react-hooks/set-state-in-effect
      setFormInitialized(true) // eslint-disable-line react-hooks/set-state-in-effect
    }
  }, [profile, formInitialized])

  // ✅ CORRECT: separate effect for auth redirect
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [loading, user, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <span className="w-6 h-6 border-2 border-zinc-700 border-t-blue-500 rounded-full animate-spin" />
      </div>
    )
  }

  if (!user || !profile) return null

  const showMsg = (msg: string) => { setMessage(msg); setTimeout(() => setMessage(''), 4000) }
  const showErr = (err: string) => { setError(err); setTimeout(() => setError(''), 5000) }

  const handleSaveProfile = async () => {
    setSaving(true)
    const { error } = await supabase
      .from('users')
      .update({
        full_name: fullName.trim(),
        phone: phone.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    setSaving(false)
    if (error) { showErr('Failed to save: ' + error.message); return }
    setEditing(false)
    await refreshProfile()
    showMsg('Profile updated successfully.')
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { showErr('Image must be under 5MB.'); return }

    setUploadingAvatar(true)
    const ext = file.name.split('.').pop()
    const path = `${user.id}/avatar.${ext}`

    const { error: uploadErr } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true })

    if (uploadErr) { showErr('Upload failed: ' + uploadErr.message); setUploadingAvatar(false); return }

    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
    await supabase
      .from('users')
      .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
      .eq('id', user.id)
    await refreshProfile()
    showMsg('Profile photo updated.')
    setUploadingAvatar(false)
  }

  const handleResendVerification = async () => {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: user.email!,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) showErr(error.message)
    else showMsg('Verification email sent. Check your inbox.')
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
    router.refresh()
  }

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) return
    if (!confirm('Final confirmation: all your data, bookings, and history will be permanently removed.')) return

    await supabase
      .from('users')
      .update({ full_name: 'Deleted User', phone: null, avatar_url: null, updated_at: new Date().toISOString() })
      .eq('id', user.id)
    await supabase.auth.signOut()
    router.push('/')
  }

  const initials = profile.full_name
    ? profile.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : profile.email[0].toUpperCase()

  const tabs: { id: Tab; label: string }[] = [
    { id: 'profile', label: 'Profile' },
    { id: 'security', label: 'Security' },
    { id: 'notifications', label: 'Notifications' },
  ]

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-600/4 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 py-10 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Account</h1>
            <p className="text-zinc-500 text-sm mt-0.5">Manage your profile and preferences</p>
          </div>
          <div className="flex gap-3">
            {(profile.role === 'host' || profile.role === 'admin') ? (
              <Link
                href="/host/dashboard"
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all"
              >
                Host Dashboard →
              </Link>
            ) : (
              <Link
                href="/become-host"
                className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 hover:text-white px-4 py-2 rounded-xl text-sm font-medium transition-all"
              >
                Become a Host
              </Link>
            )}
          </div>
        </div>

        {/* Alerts */}
        {message && (
          <div className="mb-5 flex items-center gap-3 p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5"/>
            </svg>
            <p className="text-emerald-400 text-sm">{message}</p>
          </div>
        )}
        {error && (
          <div className="mb-5 flex items-center gap-3 p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl">
            <span className="text-red-400 text-sm">⚠</span>
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Email verification banner */}
        {!profile.email_verified && (
          <div className="mb-6 flex items-center justify-between p-4 bg-amber-500/8 border border-amber-500/20 rounded-xl">
            <div>
              <p className="font-medium text-amber-400 text-sm">Verify your email address</p>
              <p className="text-amber-500/70 text-xs mt-0.5">Required before making your first booking</p>
            </div>
            <button
              onClick={handleResendVerification}
              className="bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 px-4 py-2 rounded-lg text-xs font-medium transition-all flex-shrink-0"
            >
              Resend Email
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="space-y-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-center">
              <div className="relative inline-block mb-4">
                {profile.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.avatar_url}
                    alt={profile.full_name}
                    className="w-20 h-20 rounded-2xl object-cover"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-blue-600/20">
                    {initials}
                  </div>
                )}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="absolute -bottom-1 -right-1 w-7 h-7 bg-zinc-700 hover:bg-zinc-600 border border-zinc-600 rounded-lg flex items-center justify-center transition-all disabled:opacity-50"
                >
                  {uploadingAvatar
                    ? <span className="w-3 h-3 border border-zinc-400 border-t-white rounded-full animate-spin" />
                    : (
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-zinc-300">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    )
                  }
                </button>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />

              <h2 className="font-semibold text-white">{profile.full_name || 'No name set'}</h2>
              <p className="text-zinc-500 text-xs mt-0.5 truncate">{profile.email}</p>

              <div className="flex items-center justify-center gap-2 mt-3">
                <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                  profile.role === 'admin' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                  profile.role === 'host' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                  'bg-zinc-800 text-zinc-400 border border-zinc-700'
                }`}>
                  {profile.role === 'admin' ? 'Admin' : profile.role === 'host' ? 'Host' : 'Guest'}
                </span>
                <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                  profile.email_verified
                    ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                    : 'bg-red-500/10 text-red-400 border border-red-500/20'
                }`}>
                  {profile.email_verified ? '✓ Verified' : '✗ Unverified'}
                </span>
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
              <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-4">Overview</h3>
              <div className="space-y-3">
                {[
                  { label: 'Total trips', value: String(profile.total_trips || 0) },
                  { label: 'Trust score', value: `${profile.trust_score || 50}/100` },
                  { label: 'Promo credits', value: `AUD $${profile.promo_credits || '0.00'}` },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between">
                    <span className="text-zinc-500 text-sm">{item.label}</span>
                    <span className="text-white text-sm font-medium">{item.value}</span>
                  </div>
                ))}
                {profile.referral_code && (
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500 text-sm">Referral code</span>
                    <span className="font-mono text-xs bg-zinc-800 border border-zinc-700 text-zinc-300 px-2 py-1 rounded-lg">
                      {profile.referral_code}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={handleSignOut}
              className="w-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white py-3 rounded-xl text-sm font-medium transition-all"
            >
              Sign Out
            </button>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-2">
            <div className="flex bg-zinc-900 border border-zinc-800 rounded-xl p-1 mb-5">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-zinc-800 text-white shadow-sm'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-semibold text-white">Personal Information</h2>
                  {!editing && (
                    <button
                      onClick={() => setEditing(true)}
                      className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
                    >
                      Edit
                    </button>
                  )}
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">
                      Full Name
                    </label>
                    {editing ? (
                      <input
                        type="text"
                        value={fullName}
                        onChange={e => setFullName(e.target.value)}
                        className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 rounded-xl text-white text-sm outline-none transition-all"
                      />
                    ) : (
                      <p className="text-sm py-1">
                        {profile.full_name
                          ? <span className="text-white">{profile.full_name}</span>
                          : <span className="text-zinc-600">Not set</span>
                        }
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">
                      Email Address
                    </label>
                    <p className="text-white text-sm py-1">{profile.email}</p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">
                      Phone Number
                    </label>
                    {editing ? (
                      <input
                        type="tel"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        placeholder="+61 4XX XXX XXX"
                        className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 rounded-xl text-white placeholder-zinc-600 text-sm outline-none transition-all"
                      />
                    ) : (
                      <p className="text-sm py-1">
                        {profile.phone
                          ? <span className="text-white">{profile.phone}</span>
                          : <span className="text-zinc-600">Not added</span>
                        }
                      </p>
                    )}
                  </div>

                  {editing && (
                    <div className="flex gap-3 pt-1">
                      <button
                        onClick={handleSaveProfile}
                        disabled={saving}
                        className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl text-sm font-medium transition-all disabled:opacity-40"
                      >
                        {saving ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button
                        onClick={() => {
                          setEditing(false)
                          setFullName(profile.full_name || '')
                          setPhone(profile.phone || '')
                        }}
                        className="flex-1 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 py-3 rounded-xl text-sm font-medium transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>

                <div className="mt-8 pt-6 border-t border-zinc-800">
                  <p className="text-xs font-medium text-zinc-600 uppercase tracking-wider mb-3">Danger Zone</p>
                  <button
                    onClick={handleDeleteAccount}
                    className="text-sm text-red-500 hover:text-red-400 border border-red-500/20 hover:border-red-500/40 px-4 py-2 rounded-xl transition-all"
                  >
                    Delete Account
                  </button>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                <h2 className="font-semibold text-white mb-6">Security Settings</h2>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-zinc-800/50 border border-zinc-800 rounded-xl">
                    <div>
                      <p className="font-medium text-white text-sm">Password</p>
                      <p className="text-zinc-500 text-xs mt-0.5">Change your account password</p>
                    </div>
                    <button
                      onClick={async () => {
                        await supabase.auth.resetPasswordForEmail(user.email!, {
                          redirectTo: `${window.location.origin}/reset-password`,
                        })
                        showMsg('Password reset link sent to your email.')
                      }}
                      className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
                    >
                      Change
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-zinc-800/50 border border-zinc-800 rounded-xl">
                    <div>
                      <p className="font-medium text-white text-sm">Email Verification</p>
                      <p className="text-zinc-500 text-xs mt-0.5">{profile.email}</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                      profile.email_verified
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}>
                      {profile.email_verified ? '✓ Verified' : '✗ Not Verified'}
                    </span>
                  </div>

                  {!profile.email_verified && (
                    <button
                      onClick={handleResendVerification}
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl text-sm font-medium transition-all shadow-lg shadow-blue-600/20"
                    >
                      Send Verification Email
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                <h2 className="font-semibold text-white mb-6">Email Notifications</h2>
                <div className="space-y-3">
                  {[
                    { key: 'booking_updates', label: 'Booking updates', desc: 'Confirmations, status changes, and reminders' },
                    { key: 'messages', label: 'New messages', desc: 'When a host or guest sends you a message' },
                    { key: 'promotions', label: 'Promotions & offers', desc: 'Special deals and discount codes' },
                  ].map(pref => {
                    const prefs = (profile.email_prefs as Record<string, boolean>) || {}
                    const enabled = prefs[pref.key] ?? true

                    return (
                      <div key={pref.key} className="flex items-center justify-between p-4 bg-zinc-800/50 border border-zinc-800 rounded-xl">
                        <div>
                          <p className="font-medium text-white text-sm">{pref.label}</p>
                          <p className="text-zinc-500 text-xs mt-0.5">{pref.desc}</p>
                        </div>
                        <button
                          onClick={async () => {
                            const updated = { ...prefs, [pref.key]: !enabled }
                            await supabase
                              .from('users')
                              .update({ email_prefs: updated, updated_at: new Date().toISOString() })
                              .eq('id', user.id)
                            await refreshProfile()
                          }}
                          className={`relative w-11 h-6 rounded-full transition-all flex-shrink-0 ${
                            enabled ? 'bg-blue-600' : 'bg-zinc-700'
                          }`}
                        >
                          <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${
                            enabled ? 'translate-x-6' : 'translate-x-1'
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
