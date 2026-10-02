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
    try {
      // First check session / user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Fallback to getSession in case tokens are in URL hash during email confirmation
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          set({ profile: null, loading: false, initialized: true });
          return;
        }
      }

      const activeUser = user || (await supabase.auth.getSession()).data.session?.user;
      if (!activeUser) {
        set({ profile: null, loading: false, initialized: true });
        return;
      }

      let { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', activeUser.id)
        .single();

      // If trigger hasn't finished writing profile yet, create/fetch it
      if (!profile) {
        const username = activeUser.user_metadata?.username || activeUser.email?.split('@')[0] || `user_${activeUser.id.slice(0, 6)}`;
        const fullName = activeUser.user_metadata?.full_name || username;
        const { data: newProfile } = await supabase
          .from('profiles')
          .upsert({
            id: activeUser.id,
            email: activeUser.email || '',
            username,
            full_name: fullName,
          })
          .select('*')
          .single();
        profile = newProfile;
      }

      set({ profile: profile ?? null, loading: false, initialized: true });
    } catch {
      set({ profile: null, loading: false, initialized: true });
    }
  },
}));
