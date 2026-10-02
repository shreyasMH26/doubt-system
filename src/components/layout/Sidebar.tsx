import { NavLink, Link } from 'react-router-dom';
import { Home, Compass, Plus, BookmarkIcon, Bell, User, BarChart2 } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { cn } from '../../lib/utils';

interface SidebarProps {
  unreadCount?: number;
}

const navItems = [
  { to: '/dashboard', icon: Home, label: 'Home' },
  { to: '/explore', icon: Compass, label: 'Explore' },
  { to: '/saved', icon: BookmarkIcon, label: 'Saved' },
  { to: '/notifications', icon: Bell, label: 'Notifications' },
];

export function Sidebar({ unreadCount = 0 }: SidebarProps) {
  const { profile } = useAuthStore();

  return (
    <aside className="w-56 shrink-0 hidden lg:flex flex-col gap-1 pt-2">
      {navItems.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all',
              isActive
                ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100'
            )
          }
        >
          {({ isActive }) => (
            <>
              <Icon size={16} className={isActive ? 'text-indigo-600 dark:text-indigo-400' : ''} />
              <span>{label}</span>
              {label === 'Notifications' && unreadCount > 0 && (
                <span className="ml-auto h-5 min-w-5 bg-indigo-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </>
          )}
        </NavLink>
      ))}

      {profile && (
        <>
          <NavLink
            to={`/profile/${profile.id}`}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all',
                isActive
                  ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              )
            }
          >
            {({ isActive }) => (
              <>
                <User size={16} className={isActive ? 'text-indigo-600 dark:text-indigo-400' : ''} />
                <span>Profile</span>
              </>
            )}
          </NavLink>

          {profile.role === 'admin' && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all',
                  isActive
                    ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <BarChart2 size={16} className={isActive ? 'text-indigo-600 dark:text-indigo-400' : ''} />
                  <span>Admin</span>
                </>
              )}
            </NavLink>
          )}
        </>
      )}

      <div className="mt-3 px-3">
        <Link to="/ask" className="btn-primary w-full justify-center text-xs">
          <Plus size={14} />
          Ask a Doubt
        </Link>
      </div>
    </aside>
  );
}

// Mobile bottom navigation
export function MobileNav({ unreadCount = 0 }: SidebarProps) {
  const { profile } = useAuthStore();

  const mobileItems = [
    { to: '/dashboard', icon: Home, label: 'Home' },
    { to: '/explore', icon: Compass, label: 'Explore' },
    { to: '/ask', icon: Plus, label: 'Ask', special: true },
    { to: '/saved', icon: BookmarkIcon, label: 'Saved' },
    { to: profile ? `/profile/${profile.id}` : '/login', icon: User, label: 'Profile' },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 flex items-center px-2 pb-safe-bottom">
      {mobileItems.map(({ to, icon: Icon, label, special }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            cn(
              'flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors',
              special
                ? 'text-white'
                : isActive
                ? 'text-indigo-600 dark:text-indigo-400'
                : 'text-zinc-400 dark:text-zinc-500'
            )
          }
        >
          {({ isActive }) => (
            <>
              {special ? (
                <div className="h-9 w-9 bg-indigo-600 rounded-full flex items-center justify-center shadow-lg shadow-indigo-500/30 -mt-3">
                  <Icon size={18} className="text-white" />
                </div>
              ) : (
                <div className="relative">
                  <Icon size={20} className={isActive ? 'text-indigo-600 dark:text-indigo-400' : ''} />
                  {label === 'Notifications' && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-3.5 w-3.5 bg-indigo-600 text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </div>
              )}
              {!special && <span>{label}</span>}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
