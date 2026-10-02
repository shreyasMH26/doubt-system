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
  refreshProfile: () => Promise<Profile | null>;
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
      set({ loading: true });

      // First check getUser(), fallback to getSession()
      let user: any = null;
      try {
        const { data } = await supabase.auth.getUser();
        user = data?.user ?? null;
      } catch (e) {
        console.warn('[DoubtHub Auth] getUser error:', e);
      }

      if (!user) {
        const { data: sessionData } = await supabase.auth.getSession();
        user = sessionData?.session?.user ?? null;
      }

      if (!user) {
        set({ profile: null, loading: false, initialized: true });
        return null;
      }

      // Query profile
      let profile: Profile | null = null;
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (error) {
          console.warn('[DoubtHub Auth] profile query error:', error);
        } else {
          profile = data;
        }
      } catch (err) {
        console.warn('[DoubtHub Auth] fetch profile error:', err);
      }

      // If profile record does not yet exist, create it or build synthetic profile
      if (!profile) {
        const username =
          user.user_metadata?.username ||
          user.email?.split('@')[0] ||
          `student_${user.id.slice(0, 6)}`;
        const fullName = user.user_metadata?.full_name || username;

        try {
          const { data: inserted, error: upsertErr } = await supabase
            .from('profiles')
            .upsert({
              id: user.id,
              email: user.email || '',
              username,
              full_name: fullName,
              role: 'student',
            })
            .select('*')
            .single();

          if (!upsertErr && inserted) {
            profile = inserted;
          }
        } catch (upsertCatch) {
          console.warn('[DoubtHub Auth] profile upsert fallback:', upsertCatch);
        }

        // Guaranteed synthetic fallback so user is NEVER blocked if profile row is creating
        if (!profile) {
          profile = {
            id: user.id,
            email: user.email || '',
            username,
            full_name: fullName,
            avatar_url: null,
            branch: user.user_metadata?.branch || null,
            semester: user.user_metadata?.semester || null,
            year: null,
            bio: null,
            role: 'student',
            reputation: 0,
            is_suspended: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
        }
      }

      set({ profile, loading: false, initialized: true });
      return profile;
    } catch (globalErr) {
      console.error('[DoubtHub Auth] refreshProfile failed:', globalErr);
      set({ profile: null, loading: false, initialized: true });
      return null;
    }
  },
}));
