import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  checkSession: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  setUser: (user) => set({ user }),
  checkSession: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    set({ user: session?.user ?? null, isLoading: false });
  },
  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null });
  },
}));