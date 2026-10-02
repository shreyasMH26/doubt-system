import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, Bell, Sun, Moon, LogOut, User, Settings, Shield, Menu, X, MessageSquare } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useThemeStore } from '../../stores/themeStore';
import { Avatar } from '../ui/Avatar';
import { cn } from '../../lib/utils';

interface TopNavProps {
  unreadCount?: number;
}

export function TopNav({ unreadCount = 0 }: TopNavProps) {
  const { profile, signOut } = useAuthStore();
  const { resolvedTheme, setTheme } = useThemeStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleTheme = () => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="h-7 w-7 bg-indigo-600 rounded-lg flex items-center justify-center">
            <MessageSquare size={14} className="text-white" />
          </div>
          <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">DoubtHub</span>
        </Link>

        {/* Search */}
        <div className="hidden sm:flex flex-1 max-w-sm">
          <Link
            to="/explore"
            className="w-full flex items-center gap-2 text-sm text-zinc-400 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 px-3 py-1.5 rounded-lg transition-colors"
          >
            <Search size={14} />
            <span>Search doubts…</span>
          </Link>
        </div>

        <div className="ml-auto flex items-center gap-1.5">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="btn-ghost p-1.5"
            aria-label="Toggle theme"
          >
            {resolvedTheme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {profile ? (
            <>
              {/* Notifications */}
              <Link to="/notifications" className="btn-ghost p-1.5 relative">
                <Bell size={16} />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-indigo-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>

              {/* Ask button */}
              <Link to="/ask" className="hidden sm:block btn-primary text-xs px-3 py-1.5">
                Ask
              </Link>

              {/* Avatar menu */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="ml-1 flex items-center gap-1.5 hover:opacity-80 transition-opacity"
                >
                  <Avatar
                    src={profile.avatar_url}
                    name={profile.full_name || profile.username}
                    size="sm"
                  />
                </button>

                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute right-0 mt-2 w-52 z-20 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg overflow-hidden animate-scale-in">
                      <div className="p-3 border-b border-zinc-100 dark:border-zinc-800">
                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{profile.full_name || profile.username}</p>
                        <p className="text-xs text-zinc-400 truncate">{profile.email}</p>
                        <p className="text-xs text-indigo-500 font-medium mt-0.5 capitalize">{profile.role} · {profile.reputation} rep</p>
                      </div>
                      <div className="p-1.5 space-y-0.5">
                        <Link to={`/profile/${profile.id}`} onClick={() => setUserMenuOpen(false)} className="btn-ghost w-full justify-start text-xs gap-2">
                          <User size={14} /> Profile
                        </Link>
                        <Link to="/settings" onClick={() => setUserMenuOpen(false)} className="btn-ghost w-full justify-start text-xs gap-2">
                          <Settings size={14} /> Settings
                        </Link>
                        {profile.role === 'admin' && (
                          <Link to="/admin" onClick={() => setUserMenuOpen(false)} className="btn-ghost w-full justify-start text-xs gap-2 text-indigo-600 dark:text-indigo-400">
                            <Shield size={14} /> Admin Dashboard
                          </Link>
                        )}
                        <div className="divider !border-zinc-100 dark:!border-zinc-800 my-1" />
                        <button onClick={handleSignOut} className="btn-ghost w-full justify-start text-xs gap-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                          <LogOut size={14} /> Sign Out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="btn-ghost text-xs px-3 py-1.5">Log In</Link>
              <Link to="/signup" className="btn-primary text-xs px-3 py-1.5">Sign Up</Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
