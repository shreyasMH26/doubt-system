import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getProfile } from '../services/userService';
import { getUserDoubts, getUserAnswers } from '../services/userService';
import { Avatar } from '../components/ui/Avatar';
import { DoubtCard } from '../components/ui/DoubtCard';
import { PageLoader } from '../components/ui/Skeleton';
import { useAuthStore } from '../stores/authStore';
import { formatDate } from '../lib/utils';
import { MessageSquare, CheckCircle, Star, Calendar, GitBranch } from 'lucide-react';

export function ProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { profile: currentUser } = useAuthStore();
  const [tab, setTab] = useState<'doubts' | 'answers'>('doubts');

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', id],
    queryFn: () => getProfile(id!),
    enabled: !!id,
  });

  const { data: doubts = [] } = useQuery({
    queryKey: ['user-doubts', id],
    queryFn: () => getUserDoubts(id!),
    enabled: !!id && tab === 'doubts',
  });

  const { data: answers = [] } = useQuery({
    queryKey: ['user-answers', id],
    queryFn: () => getUserAnswers(id!),
    enabled: !!id && tab === 'answers',
  });

  if (isLoading) return <PageLoader />;
  if (!profile) return (
    <div className="card p-12 text-center">
      <p className="text-zinc-400">User not found.</p>
    </div>
  );

  const isOwn = currentUser?.id === id;

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Profile header */}
      <div className="card p-6">
        <div className="flex items-start gap-4">
          <Avatar src={profile.avatar_url} name={profile.full_name || profile.username} size="xl" />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{profile.full_name || profile.username}</h1>
                <p className="text-sm text-zinc-400">@{profile.username}</p>
              </div>
              {isOwn && (
                <Link to="/settings" className="btn-secondary text-xs">Edit Profile</Link>
              )}
            </div>

            {profile.bio && <p className="text-sm text-zinc-600 dark:text-zinc-300 mt-2">{profile.bio}</p>}

            <div className="flex flex-wrap gap-3 mt-3 text-xs text-zinc-400">
              {profile.branch && (
                <span className="flex items-center gap-1"><GitBranch size={11} /> {profile.branch}</span>
              )}
              {profile.semester && (
                <span>Sem {profile.semester}</span>
              )}
              <span className="flex items-center gap-1"><Calendar size={11} /> Joined {formatDate(profile.created_at)}</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t border-zinc-100 dark:border-zinc-800">
          {[
            { icon: Star, label: 'Reputation', value: profile.reputation },
            { icon: MessageSquare, label: 'Doubts', value: doubts.length },
            { icon: CheckCircle, label: 'Answers', value: answers.length },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="text-center">
              <Icon size={16} className="mx-auto text-indigo-500 mb-1" />
              <div className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{value}</div>
              <div className="text-[10px] text-zinc-400">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl">
        {(['doubts', 'answers'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all capitalize ${tab === t ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm' : 'text-zinc-400 hover:text-zinc-600'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === 'doubts' && (
        <div className="space-y-3">
          {doubts.length === 0 ? (
            <div className="card p-8 text-center text-sm text-zinc-400">No doubts posted yet.</div>
          ) : (
            (doubts as Parameters<typeof DoubtCard>[0]['doubt'][]).map((d) => <DoubtCard key={d.id} doubt={d} />)
          )}
        </div>
      )}

      {tab === 'answers' && (
        <div className="space-y-3">
          {answers.length === 0 ? (
            <div className="card p-8 text-center text-sm text-zinc-400">No answers posted yet.</div>
          ) : (
            answers.map((a) => (
              <div key={a.id} className="card p-4">
                <Link to={`/doubt/${a.doubt?.id}`} className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline block mb-2">
                  {a.doubt?.title || 'View Doubt'}
                </Link>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-3">{a.content}</p>
                {a.is_accepted && <span className="badge badge-green text-[10px] mt-2">✓ Accepted</span>}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
