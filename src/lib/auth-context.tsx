'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createBrowserClient } from '@supabase/ssr';

// ─────────────────────────────────────────────
// Supabase client — SSR compatible
// ─────────────────────────────────────────────
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
  loginWithGoogle: (nextPath?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  toggleFavourite: (carId: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

function normalizeRole(role: unknown): User['role'] {
  return role === 'admin' || role === 'host' ? role : 'guest';
}

function formatJoinedDate(createdAt?: string | null) {
  return createdAt
    ? new Date(createdAt).toLocaleDateString('en-AU', { month: 'short', year: 'numeric' })
    : undefined;
}

function getAuthCallbackUrl(nextPath = '/') {
  if (typeof window === 'undefined') {
    return '/auth/callback';
  }

  const safeNext = nextPath.startsWith('/') ? nextPath : '/';
  return `${window.location.origin}/auth/callback?next=${encodeURIComponent(safeNext)}`;
}

async function hasAuthenticatedSession() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return Boolean(session?.access_token);
}

async function ensureUserProfile(authUser: {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown>;
}) {
  if (!(await hasAuthenticatedSession())) {
    return false;
  }

  const metadata = authUser.user_metadata || {};
  const fullName =
    typeof metadata.full_name === 'string' && metadata.full_name.trim().length > 0
      ? metadata.full_name.trim()
      : typeof metadata.name === 'string' && metadata.name.trim().length > 0
        ? metadata.name.trim()
        : authUser.email?.split('@')[0] || 'User';
  const role = normalizeRole(metadata.role);

  const { error } = await supabase.from('users').upsert(
    {
      id: authUser.id,
      email: authUser.email || '',
      full_name: fullName,
      role,
      promo_credits: 20,
    },
    { onConflict: 'id' }
  );

  if (error) {
    console.error('ensureUserProfile error:', error.message);
    return false;
  }

  return true;
}

async function fetchProfile(userId: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
  if (error || !data) return null;
  return {
    id: data.id,
    name: data.full_name || '',
    email: data.email,
    avatar: data.avatar_url,
    role: normalizeRole(data.role),
    phone: data.phone,
    verified: data.email_verified || false,
    licenceUploaded: !!data.licence_url,
    licenceVerified: data.licence_verified || false,
    trips: data.total_trips || 0,
    hostTrips: data.host_trips || 0,
    joinedDate: formatJoinedDate(data.created_at),
    promoCredits: parseFloat(data.promo_credits || '20'),
    isSuperhost: data.is_superhost || false,
    trustScore: data.trust_score || 50,
  };
}

async function loadProfile(authUser: {
  id: string;
  email?: string | null;
  email_confirmed_at?: string | null;
  user_metadata?: Record<string, unknown>;
}): Promise<User> {
  await ensureUserProfile(authUser);
  const profile = await fetchProfile(authUser.id);

  if (profile) {
    return {
      ...profile,
      email: profile.email || authUser.email || '',
      verified: profile.verified || Boolean(authUser.email_confirmed_at),
      name: profile.name || (typeof authUser.user_metadata?.full_name === 'string' ? authUser.user_metadata.full_name : authUser.email || 'GlideGo User'),
      role: normalizeRole(profile.role || authUser.user_metadata?.role),
    };
  }

  return {
    id: authUser.id,
    name: typeof authUser.user_metadata?.full_name === 'string' ? authUser.user_metadata.full_name : authUser.email || 'GlideGo User',
    email: authUser.email || '',
    role: normalizeRole(authUser.user_metadata?.role),
    verified: Boolean(authUser.email_confirmed_at),
    licenceUploaded: false,
    licenceVerified: false,
    promoCredits: 20,
    joinedDate: undefined,
    favourites: [],
    trips: 0,
    hostTrips: 0,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      if (session?.user) {
        const profile = await loadProfile(session.user);
        if (mounted) setUser(profile);
      }
      if (mounted) setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        if (session?.user) {
          const profile = await loadProfile(session.user);
          if (mounted) setUser(profile);
        } else if (event === 'SIGNED_OUT') {
          if (mounted) setUser(null);
        }
        if (mounted) setIsLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      if (error.message.includes('Invalid login')) return { ok: false, error: 'Wrong email or password. Please try again.' };
      if (error.message.includes('Email not confirmed')) return { ok: false, error: 'Please check your email and click the verification link first.' };
      if (error.message.toLowerCase().includes('rate limit')) {
        return { ok: false, error: 'Too many login attempts. Please wait a few minutes and try again.' };
      }
      return { ok: false, error: error.message };
    }
    if (data.user) {
      const profile = await loadProfile(data.user);
      setUser(profile);
      return { ok: true };
    }
    return { ok: false, error: 'Something went wrong. Please try again.' };
  };

  const signup = async (name: string, email: string, password: string, role: 'guest' | 'host' = 'guest') => {
    if (!name.trim()) return { ok: false, error: 'Please enter your full name.' };
    if (password.length < 6) return { ok: false, error: 'Password must be at least 6 characters.' };
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        emailRedirectTo: getAuthCallbackUrl('/'),
        data: { full_name: name.trim(), role },
      },
    });
    if (error) {
      if (error.message.includes('already registered')) return { ok: false, error: 'This email is already registered. Please sign in.' };
      if (error.message.toLowerCase().includes('rate limit')) {
        return { ok: false, error: 'Email sending is temporarily rate-limited. Please wait a few minutes before creating another account.' };
      }
      return { ok: false, error: error.message };
    }
    if (data.user) {
      const authUser = {
        ...data.user,
        user_metadata: { ...data.user.user_metadata, full_name: name.trim(), role },
      };

      if (data.session) {
        const profile = await loadProfile(authUser);
        setUser(profile);
      }

      return { ok: true };
    }
    return { ok: false, error: 'Something went wrong. Please try again.' };
  };

  const loginWithGoogle = async (nextPath = '/') => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: getAuthCallbackUrl(nextPath),
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const updateUser = async (updates: Partial<User>) => {
    if (!user) return;
    const dbUpdates: Record<string, unknown> = {};
    if (updates.name !== undefined) dbUpdates.full_name = updates.name;
    if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
    if (updates.avatar !== undefined) dbUpdates.avatar_url = updates.avatar;
    if (updates.role !== undefined) dbUpdates.role = updates.role;
    if (updates.promoCredits !== undefined) dbUpdates.promo_credits = updates.promoCredits;
    if (Object.keys(dbUpdates).length > 0) {
      await supabase.from('users').update(dbUpdates).eq('id', user.id);
    }
    setUser(prev => prev ? { ...prev, ...updates } : null);
  };

  const toggleFavourite = async (carId: string) => {
    if (!user) return;
    const favs = user.favourites || [];
    const isFaved = favs.includes(carId);
    if (isFaved) {
      await supabase.from('favourites').delete().eq('user_id', user.id).eq('car_id', carId);
      setUser(prev => prev ? { ...prev, favourites: favs.filter(f => f !== carId) } : null);
    } else {
      await supabase.from('favourites').insert({ user_id: user.id, car_id: carId });
      setUser(prev => prev ? { ...prev, favourites: [...favs, carId] } : null);
    }
  };

  const refreshUser = async () => {
    if (!user) return;
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
      setUser(null);
      return;
    }
    const profile = await loadProfile(authUser);
    setUser(profile);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, loginWithGoogle, logout, updateUser, toggleFavourite, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
