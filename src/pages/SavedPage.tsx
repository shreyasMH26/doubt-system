import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../stores/authStore';
import { getBookmarkedDoubts } from '../services/doubtService';
import { DoubtCard } from '../components/ui/DoubtCard';
import { DoubtCardSkeleton } from '../components/ui/Skeleton';
import { BookmarkIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export function SavedPage() {
  const { profile } = useAuthStore();

  const { data: saved = [], isLoading } = useQuery({
    queryKey: ['saved-doubts', profile?.id],
    queryFn: () => profile ? getBookmarkedDoubts(profile.id) : Promise.resolve([]),
    enabled: !!profile,
  });

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center gap-2">
        <BookmarkIcon size={18} className="text-zinc-700 dark:text-zinc-300" />
        <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Saved</h1>
        <span className="badge badge-zinc">{saved.length}</span>
      </div>

      {isLoading ? (
        Array.from({ length: 4 }).map((_, i) => <DoubtCardSkeleton key={i} />)
      ) : saved.length === 0 ? (
        <div className="card p-12 text-center">
          <BookmarkIcon size={32} className="mx-auto mb-3 text-zinc-300 dark:text-zinc-600" />
          <p className="text-sm font-medium text-zinc-400">No saved doubts yet</p>
          <p className="text-xs text-zinc-300 dark:text-zinc-600 mt-1">Save useful doubts here for later.</p>
          <Link to="/explore" className="btn-primary mt-4 text-sm">Browse Doubts</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {saved.map((doubt, i) => (
            <motion.div key={doubt.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <DoubtCard doubt={doubt} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
