'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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
    role: data.role || 'guest',
    phone: data.phone,
    verified: data.email_verified || false,
    licenceUploaded: !!data.licence_url,
    licenceVerified: data.licence_verified || false,
    trips: data.total_trips || 0,
    hostTrips: data.host_trips || 0,
    joinedDate: data.created_at
      ? new Date(data.created_at).toLocaleDateString('en-AU', { month: 'short', year: 'numeric' })
      : undefined,
    promoCredits: parseFloat(data.promo_credits || '20'),
    isSuperhost: data.is_superhost || false,
    trustScore: data.trust_score || 50,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      if (session?.user) {
        const profile = await fetchProfile(session.user.id);
        if (mounted) setUser(profile);
      }
      if (mounted) setIsLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        if (session?.user) {
          const profile = await fetchProfile(session.user.id);
          if (mounted) setUser(profile);
        } else if (event === 'SIGNED_OUT') {
          if (mounted) setUser(null);
        }
        if (mounted) setIsLoading(false);
      }
    );
    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      if (error.message.includes('Invalid login')) return { ok: false, error: 'Wrong email or password. Please try again.' };
      if (error.message.includes('Email not confirmed')) return { ok: false, error: 'Please check your email and click the verification link first.' };
      return { ok: false, error: error.message };
    }
    if (data.user) {
      const profile = await fetchProfile(data.user.id);
      setUser(profile);
      return { ok: true };
    }
    return { ok: false, error: 'Something went wrong. Please try again.' };
  };

  const signup = async (name: string, email: string, password: string, role: 'guest' | 'host' = 'guest') => {
    if (!name.trim()) return { ok: false, error: 'Please enter your full name.' };
    if (password.length < 6) return { ok: false, error: 'Password must be at least 6 characters.' };
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: name, role } },
    });
    if (error) {
      if (error.message.includes('already registered')) return { ok: false, error: 'This email is already registered. Please sign in.' };
      return { ok: false, error: error.message };
    }
    if (data.user) {
      await supabase.from('users').update({ role, full_name: name, promo_credits: 20 }).eq('id', data.user.id);
      const profile = await fetchProfile(data.user.id);
      setUser(profile);
      return { ok: true };
    }
    return { ok: false, error: 'Something went wrong. Please try again.' };
  };

  const loginWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
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
    const profile = await fetchProfile(user.id);
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

export { supabase };
