import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Profile } from '../types';

interface AuthStore {
  profile: Profile | null;
  loading: boolean;
  initialized: boolean;
  setProfile: (profile: Profile | null) => void;
  setLoading: (loading: boolean) => void;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  profile: null,
  loading: true,
  initialized: false,

  setProfile: (profile) => set({ profile, initialized: true }),
  setLoading: (loading) => set({ loading }),

  signOut: async () => {
    await supabase.auth.signOut();
    set({ profile: null });
  },

  refreshProfile: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      set({ profile: null, loading: false, initialized: true });
      return;
    }
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    set({ profile: data ?? null, loading: false, initialized: true });
  },
}));
