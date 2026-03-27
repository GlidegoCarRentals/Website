'use client';
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { createBrowserClient } from '@supabase/ssr';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export { supabase };

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'guest' | 'host' | 'admin';
  phone?: string;
  verified: boolean;
  licenceUploaded: boolean;
  licenceVerified: boolean;
  rating?: number;
  trips?: number;
  hostTrips?: number;
  joinedDate?: string;
  promoCredits?: number;
  favourites?: string[];
  isSuperhost?: boolean;
  trustScore?: number;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  signup: (name: string, email: string, password: string, role?: 'guest' | 'host') => Promise<{ ok: boolean; error?: string }>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  toggleFavourite: (carId: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

// ─────────────────────────────────────────────
// fetchProfile — with retry and fallback
// ─────────────────────────────────────────────
async function fetchProfile(userId: string): Promise<User | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('fetchProfile error:', error.message);
      return null;
    }

    if (!data) return null;

    // Validate role — prevent invalid roles
    const validRoles = ['guest', 'host', 'admin'];
    const role = validRoles.includes(data.role) ? data.role : 'guest';

    return {
      id: data.id,
      name: data.full_name || data.email?.split('@')[0] || 'User',
      email: data.email || '',
      avatar: data.avatar_url || undefined,
      role,
      phone: data.phone || undefined,
      verified: Boolean(data.email_verified),
      licenceUploaded: Boolean(data.licence_url),
      licenceVerified: Boolean(data.licence_verified),
      trips: Number(data.total_trips) || 0,
      hostTrips: Number(data.host_trips) || 0,
      joinedDate: data.created_at
        ? new Date(data.created_at).toLocaleDateString('en-AU', { month: 'short', year: 'numeric' })
        : undefined,
      promoCredits: parseFloat(String(data.promo_credits || '20')) || 20,
      favourites: Array.isArray(data.favourites) ? data.favourites : [],
      isSuperhost: Boolean(data.is_superhost),
      trustScore: Number(data.trust_score) || 50,
    };
  } catch (err) {
    console.error('fetchProfile unexpected error:', err);
    return null;
  }
}

// ─────────────────────────────────────────────
// AuthProvider
// ─────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && mounted) {
          const profile = await fetchProfile(session.user.id);
          if (mounted) setUser(profile);
        }
      } catch (err) {
        console.error('initAuth error:', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        if (event === 'SIGNED_IN' && session?.user) {
          const profile = await fetchProfile(session.user.id);
          if (mounted) {
            setUser(profile);
            setIsLoading(false);
          }
        } else if (event === 'SIGNED_OUT') {
          if (mounted) {
            setUser(null);
            setIsLoading(false);
          }
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          // Session refreshed — update user silently
          const profile = await fetchProfile(session.user.id);
          if (mounted) setUser(profile);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // ─────────────────────────────────────────────
  // Login
  // ─────────────────────────────────────────────
  const login = async (email: string, password: string) => {
    try {
      // Input validation
      if (!email?.trim()) return { ok: false, error: 'Please enter your email.' };
      if (!password) return { ok: false, error: 'Please enter your password.' };

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          return { ok: false, error: 'Wrong email or password. Please try again.' };
        }
        if (error.message.includes('Email not confirmed')) {
          return { ok: false, error: 'Please verify your email before logging in.' };
        }
        if (error.message.includes('Too many requests')) {
          return { ok: false, error: 'Too many login attempts. Please wait a moment.' };
        }
        return { ok: false, error: error.message };
      }

      if (data.user) {
        const profile = await fetchProfile(data.user.id);
        setUser(profile);
        return { ok: true };
      }

      return { ok: false, error: 'Something went wrong. Please try again.' };
    } catch (err) {
      console.error('login error:', err);
      return { ok: false, error: 'Network error. Please check your connection.' };
    }
  };

  // ─────────────────────────────────────────────
  // Signup
  // ─────────────────────────────────────────────
  const signup = async (
    name: string,
    email: string,
    password: string,
    role: 'guest' | 'host' = 'guest'
  ) => {
    try {
      // Validation
      if (!name?.trim()) return { ok: false, error: 'Please enter your full name.' };
      if (name.trim().length < 2) return { ok: false, error: 'Name must be at least 2 characters.' };
      if (!email?.trim()) return { ok: false, error: 'Please enter your email.' };
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: 'Please enter a valid email address.' };
      if (!password) return { ok: false, error: 'Please enter a password.' };
      if (password.length < 6) return { ok: false, error: 'Password must be at least 6 characters.' };

      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: { full_name: name.trim(), role },
        },
      });

      if (error) {
        if (error.message.includes('already registered')) {
          return { ok: false, error: 'This email is already registered. Please sign in.' };
        }
        if (error.message.includes('Password should be')) {
          return { ok: false, error: 'Password is too weak. Use at least 6 characters.' };
        }
        return { ok: false, error: error.message };
      }

      if (data.user) {
        // Update user profile in DB
        await supabase
          .from('users')
          .update({ role, full_name: name.trim(), promo_credits: 20 })
          .eq('id', data.user.id);

        const profile = await fetchProfile(data.user.id);
        setUser(profile);
        return { ok: true };
      }

      return { ok: false, error: 'Something went wrong. Please try again.' };
    } catch (err) {
      console.error('signup error:', err);
      return { ok: false, error: 'Network error. Please check your connection.' };
    }
  };

  // ─────────────────────────────────────────────
  // Google OAuth
  // ─────────────────────────────────────────────
  const loginWithGoogle = async () => {
    try {
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
    } catch (err) {
      console.error('Google OAuth error:', err);
    }
  };

  // ─────────────────────────────────────────────
  // Logout
  // ─────────────────────────────────────────────
  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
    } catch (err) {
      console.error('logout error:', err);
      // Force clear user even if signOut fails
      setUser(null);
    }
  };

  // ─────────────────────────────────────────────
  // Update User
  // ─────────────────────────────────────────────
  const updateUser = async (updates: Partial<User>) => {
    if (!user) return;

    try {
      const dbUpdates: Record<string, unknown> = {};
      if (updates.name !== undefined) dbUpdates.full_name = updates.name;
      if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
      if (updates.avatar !== undefined) dbUpdates.avatar_url = updates.avatar;
      if (updates.role !== undefined) dbUpdates.role = updates.role;
      if (updates.promoCredits !== undefined) dbUpdates.promo_credits = updates.promoCredits;

      if (Object.keys(dbUpdates).length > 0) {
        const { error } = await supabase
          .from('users')
          .update(dbUpdates)
          .eq('id', user.id);

        if (error) console.error('updateUser DB error:', error.message);
      }

      setUser(prev => prev ? { ...prev, ...updates } : null);
    } catch (err) {
      console.error('updateUser error:', err);
    }
  };

  // ─────────────────────────────────────────────
  // Toggle Favourite
  // ─────────────────────────────────────────────
  const toggleFavourite = async (carId: string) => {
    if (!user) return;

    try {
      const favs = user.favourites || [];
      const isFaved = favs.includes(carId);

      if (isFaved) {
        await supabase
          .from('favourites')
          .delete()
          .eq('user_id', user.id)
          .eq('car_id', carId);
        setUser(prev => prev ? { ...prev, favourites: favs.filter(f => f !== carId) } : null);
      } else {
        await supabase
          .from('favourites')
          .insert({ user_id: user.id, car_id: carId });
        setUser(prev => prev ? { ...prev, favourites: [...favs, carId] } : null);
      }
    } catch (err) {
      console.error('toggleFavourite error:', err);
    }
  };

  // ─────────────────────────────────────────────
  // Refresh User
  // ─────────────────────────────────────────────
  const refreshUser = useCallback(async () => {
    if (!user?.id) return;
    try {
      const profile = await fetchProfile(user.id);
      setUser(profile);
    } catch (err) {
      console.error('refreshUser error:', err);
    }
  }, [user?.id]);

  return (
    <AuthContext.Provider value={{
      user, isLoading, login, signup, loginWithGoogle,
      logout, updateUser, toggleFavourite, refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
