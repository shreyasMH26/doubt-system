import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, X, SlidersHorizontal } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getDoubts, getUserBookmarks, toggleBookmark } from '../services/doubtService';
import { getSubjects } from '../services/notificationService';
import { DoubtCard } from '../components/ui/DoubtCard';
import { DoubtCardSkeleton } from '../components/ui/Skeleton';
import { useAuthStore } from '../stores/authStore';
import { BRANCHES, SEMESTERS } from '../lib/utils';
import type { DoubtFilters, DoubtStatus } from '../types';
import toast from 'react-hot-toast';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'most_voted', label: 'Most Voted' },
  { value: 'most_answers', label: 'Most Discussed' },
  { value: 'unanswered', label: 'Unanswered' },
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'resolved', label: 'Resolved' },
];

export function ExplorePage() {
  const { profile } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);

  const [filters, setFilters] = useState<DoubtFilters>({
    search: searchParams.get('search') || '',
    subject: searchParams.get('subject') || 'all',
    branch: searchParams.get('branch') || '',
    status: (searchParams.get('status') as DoubtStatus | 'all') || 'all',
    sort: (searchParams.get('sort') as DoubtFilters['sort']) || 'newest',
    semester: undefined,
  });

  const { data: doubts, isLoading } = useQuery({
    queryKey: ['explore-doubts', filters, page],
    queryFn: () => getDoubts({ ...filters, page }),
    placeholderData: (prev) => prev,
  });

  const { data: subjects = [] } = useQuery({
    queryKey: ['subjects'],
    queryFn: getSubjects,
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

  useEffect(() => {
    const params: Record<string, string> = {};
    if (filters.search) params.search = filters.search;
    if (filters.subject && filters.subject !== 'all') params.subject = filters.subject;
    if (filters.branch) params.branch = filters.branch;
    if (filters.status && filters.status !== 'all') params.status = filters.status;
    if (filters.sort && filters.sort !== 'newest') params.sort = filters.sort;
    setSearchParams(params, { replace: true });
    setPage(1);
  }, [filters]);

  const set = <K extends keyof DoubtFilters>(key: K, val: DoubtFilters[K]) =>
    setFilters((f) => ({ ...f, [key]: val }));

  const clearFilters = () => setFilters({ search: '', subject: 'all', branch: '', status: 'all', sort: 'newest' });

  const handleBookmark = async (doubtId: string) => {
    if (!profile) { toast.error('Sign in to bookmark'); return; }
    const added = await toggleBookmark(profile.id, doubtId);
    setBookmarks((prev) => added ? [...prev, doubtId] : prev.filter((id) => id !== doubtId));
    toast.success(added ? 'Bookmarked!' : 'Removed');
  };

  const hasFilters = (filters.search || (filters.subject && filters.subject !== 'all') || filters.branch || (filters.status && filters.status !== 'all'));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Explore</h1>
        <button onClick={() => setShowFilters(!showFilters)} className={`btn-ghost text-xs gap-1.5 ${showFilters ? 'text-indigo-600 dark:text-indigo-400' : ''}`}>
          <SlidersHorizontal size={13} />
          Filters
          {hasFilters && <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />}
        </button>
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
        <input
          className="input pl-9"
          placeholder="Search doubts by title, subject, or topic…"
          value={filters.search}
          onChange={(e) => set('search', e.target.value)}
        />
        {filters.search && (
          <button onClick={() => set('search', '')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600">
            <X size={13} />
          </button>
        )}
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="card p-4 grid sm:grid-cols-4 gap-3">
          <div>
            <label className="label text-[11px]">Subject</label>
            <select className="input text-xs" value={filters.subject} onChange={(e) => set('subject', e.target.value)}>
              <option value="all">All Subjects</option>
              {subjects.map((s) => (
                <option key={s.name} value={s.name}>
                  {s.icon ? `${s.icon} ${s.name}` : s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label text-[11px]">Branch</label>
            <select className="input text-xs" value={filters.branch} onChange={(e) => set('branch', e.target.value)}>
              <option value="">All Branches</option>
              {BRANCHES.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label className="label text-[11px]">Status</label>
            <select className="input text-xs" value={filters.status} onChange={(e) => set('status', e.target.value as DoubtStatus | 'all')}>
              {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label text-[11px]">Sort By</label>
            <select className="input text-xs" value={filters.sort} onChange={(e) => set('sort', e.target.value as DoubtFilters['sort'])}>
              {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          {hasFilters && (
            <div className="sm:col-span-4 flex justify-end">
              <button onClick={clearFilters} className="btn-ghost text-xs text-red-500 gap-1">
                <X size={12} /> Clear filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Results */}
      <div className="space-y-3">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => <DoubtCardSkeleton key={i} />)
          : doubts?.data.length === 0
          ? (
            <div className="card p-12 text-center">
              <div className="text-4xl mb-3">🔍</div>
              <p className="font-medium text-zinc-700 dark:text-zinc-300 text-sm">No doubts found</p>
              <p className="text-xs text-zinc-400 mt-1">Try adjusting your filters or search terms</p>
              {hasFilters && <button onClick={clearFilters} className="btn-ghost text-xs mt-3 text-indigo-600">Clear filters</button>}
            </div>
          )
          : doubts?.data.map((d) => (
            <DoubtCard key={d.id} doubt={d} isBookmarked={bookmarks.includes(d.id)} onBookmark={handleBookmark} />
          ))
        }
      </div>

      {/* Pagination */}
      {doubts && doubts.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="btn-secondary text-xs disabled:opacity-40">Previous</button>
          <span className="text-xs text-zinc-400">Page {page} of {doubts.totalPages}</span>
          <button disabled={page >= doubts.totalPages} onClick={() => setPage((p) => p + 1)} className="btn-secondary text-xs disabled:opacity-40">Next</button>
        </div>
      )}
    </div>
  );
}
