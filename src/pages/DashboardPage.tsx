import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, TrendingUp, Clock, HelpCircle, Flame } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { getDoubts } from '../services/doubtService';
import { getTopContributors, getTopSubjects } from '../services/adminService';
import { getUserBookmarks, toggleBookmark } from '../services/doubtService';
import { DoubtCard } from '../components/ui/DoubtCard';
import { DoubtCardSkeleton } from '../components/ui/Skeleton';
import { Avatar } from '../components/ui/Avatar';
import toast from 'react-hot-toast';
import { useState } from 'react';

export function DashboardPage() {
  const { profile } = useAuthStore();
  const [bookmarks, setBookmarks] = useState<string[]>([]);

  const { data: recentDoubts, isLoading: loadingRecent } = useQuery({
    queryKey: ['doubts', 'recent'],
    queryFn: () => getDoubts({ sort: 'newest', limit: 8 }),
  });

  const { data: unanswered, isLoading: loadingUnanswered } = useQuery({
    queryKey: ['doubts', 'unanswered'],
    queryFn: () => getDoubts({ sort: 'unanswered', status: 'open', limit: 4 }),
  });

  const { data: subjects } = useQuery({
    queryKey: ['top-subjects'],
    queryFn: () => getTopSubjects(6),
  });

  const { data: contributors } = useQuery({
    queryKey: ['top-contributors'],
    queryFn: () => getTopContributors(5),
  });

  useQuery({
    queryKey: ['user-bookmarks', profile?.id],
    queryFn: async () => {
      if (!profile) return [];
      const bms = await getUserBookmarks(profile.id);
      setBookmarks(bms);
      return bms;
    },
    enabled: !!profile,
  });

  const handleBookmark = async (doubtId: string) => {
    if (!profile) { toast.error('Sign in to bookmark'); return; }
    const added = await toggleBookmark(profile.id, doubtId);
    setBookmarks((prev) => added ? [...prev, doubtId] : prev.filter((id) => id !== doubtId));
    toast.success(added ? 'Bookmarked!' : 'Removed bookmark');
  };

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
            Hey, {profile?.full_name?.split(' ')[0] || profile?.username} 👋
          </h1>
          <p className="text-sm text-zinc-400 mt-0.5">What do you want to learn today?</p>
        </div>
        <Link to="/ask" className="btn-primary text-sm shrink-0">
          <Plus size={15} />
          Ask a Doubt
        </Link>
      </div>

      <div className="flex gap-6">
        {/* Main column */}
        <div className="flex-1 min-w-0 space-y-6">
          {/* Recent */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Clock size={15} className="text-zinc-400" />
              <h2 className="font-semibold text-sm text-zinc-700 dark:text-zinc-300">Recent Doubts</h2>
            </div>
            <div className="space-y-3">
              {loadingRecent
                ? Array.from({ length: 4 }).map((_, i) => <DoubtCardSkeleton key={i} />)
                : recentDoubts?.data.length === 0
                ? <EmptyState icon="💭" title="No doubts yet" sub="Be the first to ask something!" action={{ to: '/ask', label: 'Ask a Doubt' }} />
                : recentDoubts?.data.map((d) => (
                  <DoubtCard key={d.id} doubt={d} isBookmarked={bookmarks.includes(d.id)} onBookmark={handleBookmark} />
                ))
              }
            </div>
          </section>

          {/* Unanswered */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <HelpCircle size={15} className="text-amber-500" />
              <h2 className="font-semibold text-sm text-zinc-700 dark:text-zinc-300">Needs an Answer</h2>
            </div>
            <div className="space-y-3">
              {loadingUnanswered
                ? Array.from({ length: 3 }).map((_, i) => <DoubtCardSkeleton key={i} />)
                : unanswered?.data.length === 0
                ? <div className="card p-4 text-center text-sm text-zinc-400">🎉 All doubts are answered!</div>
                : unanswered?.data.map((d) => (
                  <DoubtCard key={d.id} doubt={d} isBookmarked={bookmarks.includes(d.id)} onBookmark={handleBookmark} />
                ))
              }
            </div>
          </section>
        </div>

        {/* Right sidebar */}
        <div className="hidden xl:flex flex-col gap-5 w-64 shrink-0">
          {/* Popular subjects */}
          {subjects && subjects.length > 0 && (
            <div className="card p-4">
              <div className="flex items-center gap-1.5 mb-3">
                <TrendingUp size={14} className="text-indigo-500" />
                <h3 className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Popular Subjects</h3>
              </div>
              <div className="space-y-2">
                {subjects.map(({ subject, count }) => (
                  <Link key={subject} to={`/explore?subject=${encodeURIComponent(subject)}`} className="flex items-center justify-between text-xs py-0.5 text-zinc-600 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                    <span className="truncate">{subject}</span>
                    <span className="badge badge-zinc shrink-0">{count}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Top contributors */}
          {contributors && contributors.length > 0 && (
            <div className="card p-4">
              <div className="flex items-center gap-1.5 mb-3">
                <Flame size={14} className="text-orange-500" />
                <h3 className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Top Contributors</h3>
              </div>
              <div className="space-y-3">
                {contributors.map((c, i) => (
                  <Link key={c.id} to={`/profile/${c.id}`} className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
                    <span className="text-xs text-zinc-300 dark:text-zinc-600 w-4">{i + 1}</span>
                    <Avatar src={c.avatar_url} name={c.full_name || c.username} size="xs" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200 truncate">{c.full_name || c.username}</p>
                      <p className="text-[10px] text-zinc-400">{c.reputation} rep</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ icon, title, sub, action }: { icon: string; title: string; sub: string; action?: { to: string; label: string } }) {
  return (
    <div className="card p-8 text-center">
      <div className="text-3xl mb-3">{icon}</div>
      <p className="font-medium text-zinc-700 dark:text-zinc-300 text-sm mb-1">{title}</p>
      <p className="text-xs text-zinc-400 mb-4">{sub}</p>
      {action && <Link to={action.to} className="btn-primary text-xs">{action.label}</Link>}
    </div>
  );
}
