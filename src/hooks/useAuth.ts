'use client'

// src/hooks/useAuth.ts
// Central auth hook — use this EVERYWHERE instead of calling supabase directly

import { useState, useEffect, useCallback } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'

export interface UserProfile {
  id: string
  email: string
  full_name: string
  role: 'guest' | 'host' | 'admin'
  avatar_url: string | null
  email_verified: boolean
  trust_score: number
  is_superhost: boolean
  superhost_since: string | null
  phone: string | null
  promo_credits: number
  referral_code: string | null
  total_trips: number
  host_trips: number
  rating: number
  licence_url: string | null
  licence_verified: boolean
  stripe_customer_id: string | null
  stripe_account_id: string | null
  notifications_enabled: boolean
  email_prefs: Record<string, boolean> | null
  created_at: string
  updated_at: string
}

interface AuthState {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  isHost: boolean
  isAdmin: boolean
  isEmailVerified: boolean
}

export function useAuth() {
  const supabase = createClient()
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    loading: true,
    isHost: false,
    isAdmin: false,
    isEmailVerified: false,
  })

  const fetchProfile = useCallback(async (userId: string) => { // eslint-disable-line react-hooks/exhaustive-deps
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Profile fetch error:', error)
      return null
    }
    return data as UserProfile
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    let mounted = true

    supabase.auth.getUser().then(async ({ data: { user } }) => { // eslint-disable-line react-hooks/exhaustive-deps
      if (!mounted) return

      if (user) {
        const profile = await fetchProfile(user.id)
        if (mounted) {
          setState({
            user,
            profile,
            loading: false,
            isHost: profile?.role === 'host' || profile?.role === 'admin',
            isAdmin: profile?.role === 'admin',
            isEmailVerified: profile?.email_verified ?? false,
          })
        }
      } else {
        if (mounted) {
          setState({
            user: null,
            profile: null,
            loading: false,
            isHost: false,
            isAdmin: false,
            isEmailVerified: false,
          })
        }
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange( // eslint-disable-line react-hooks/exhaustive-deps
      async (event, session) => {
        if (!mounted) return

        if (session?.user) {
          const profile = await fetchProfile(session.user.id)
          if (mounted) {
            setState({
              user: session.user,
              profile,
              loading: false,
              isHost: profile?.role === 'host' || profile?.role === 'admin',
              isAdmin: profile?.role === 'admin',
              isEmailVerified: profile?.email_verified ?? false,
            })
          }
        } else {
          if (mounted) {
            setState({
              user: null,
              profile: null,
              loading: false,
              isHost: false,
              isAdmin: false,
              isEmailVerified: false,
            })
          }
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [fetchProfile])

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const refreshProfile = async () => {
    if (state.user) {
      const profile = await fetchProfile(state.user.id)
      setState(prev => ({
        ...prev,
        profile,
        isHost: profile?.role === 'host' || profile?.role === 'admin',
        isAdmin: profile?.role === 'admin',
        isEmailVerified: profile?.email_verified ?? false,
      }))
    }
  }

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!state.user) return { error: 'Not authenticated' }

    const { error } = await supabase
      .from('users')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', state.user.id)

    if (!error) {
      await refreshProfile()
    }

    return { error }
  }

  return {
    ...state,
    signOut,
    refreshProfile,
    updateProfile,
  }
}
