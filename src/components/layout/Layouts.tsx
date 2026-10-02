import { useEffect } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useQuery } from '@tanstack/react-query';
import { getUnreadNotificationCount } from '../../services/notificationService';
import { TopNav } from './TopNav';
import { Sidebar, MobileNav } from './Sidebar';
import { PageLoader } from '../ui/Skeleton';
import { supabase } from '../../lib/supabase';

// ---- Public layout (landing, login, signup) ----
export function PublicLayout() {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <Outlet />
    </div>
  );
}

// ---- App layout (requires auth) ----
export function AppLayout() {
  const { profile, loading, initialized, refreshProfile } = useAuthStore();

  useEffect(() => {
    refreshProfile();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      refreshProfile();
    });
    return () => subscription.unsubscribe();
  }, []);

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['unread-notifications', profile?.id],
    queryFn: () => profile ? getUnreadNotificationCount(profile.id) : Promise.resolve(0),
    enabled: !!profile,
    refetchInterval: 30_000,
  });

  if (!initialized || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-zinc-950">
        <PageLoader />
      </div>
    );
  }

  if (!profile) {
    return <Navigate to="/login" replace />;
  }

  if (profile.is_suspended) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-zinc-950 p-6 text-center">
        <div className="text-4xl mb-4">🚫</div>
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">Account Suspended</h1>
        <p className="text-zinc-500 text-sm max-w-sm">Your account has been suspended. Please contact an administrator if you believe this is an error.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <TopNav unreadCount={unreadCount} />
      <div className="max-w-7xl mx-auto px-4 py-6 flex gap-6">
        <Sidebar unreadCount={unreadCount} />
        <main className="flex-1 min-w-0 pb-24 lg:pb-6">
          <Outlet />
        </main>
      </div>
      <MobileNav unreadCount={unreadCount} />
    </div>
  );
}

// ---- Admin layout (requires admin role) ----
export function AdminLayout() {
  const { profile, loading, initialized, refreshProfile } = useAuthStore();

  useEffect(() => {
    refreshProfile();
  }, []);

  if (!initialized || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-zinc-950">
        <PageLoader />
      </div>
    );
  }

  if (!profile) return <Navigate to="/login" replace />;

  if (profile.role !== 'admin') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-zinc-950 p-6 text-center">
        <div className="text-4xl mb-4">🔒</div>
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">Unauthorized</h1>
        <p className="text-zinc-500 text-sm max-w-sm">You don't have permission to access the admin dashboard.</p>
        <a href="/dashboard" className="btn-primary mt-4 text-sm">Back to DoubtHub</a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <TopNav />
      <div className="max-w-7xl mx-auto px-4 py-6">
        <Outlet />
      </div>
    </div>
  );
}
