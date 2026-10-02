import { Link } from 'react-router-dom';
import { MessageSquare, ThumbsUp, CheckCircle2, Clock, Pin, Bookmark, BookmarkCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { Avatar } from './Avatar';
import { cn, timeAgo, truncate } from '../../lib/utils';
import type { Doubt } from '../../types';

interface DoubtCardProps {
  doubt: Doubt;
  isBookmarked?: boolean;
  onBookmark?: (id: string) => void;
  className?: string;
}

const statusConfig = {
  open: { label: 'Open', className: 'badge-indigo' },
  resolved: { label: 'Resolved', className: 'badge-green' },
  closed: { label: 'Closed', className: 'badge-zinc' },
};

export function DoubtCard({ doubt, isBookmarked, onBookmark, className }: DoubtCardProps) {
  const status = statusConfig[doubt.status];
  const author = doubt.author;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'card p-4 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all duration-200 group',
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Meta row */}
          <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 mb-2 flex-wrap">
            {doubt.is_pinned && (
              <span className="flex items-center gap-1 text-indigo-500">
                <Pin size={11} /> Pinned
              </span>
            )}
            <span className={cn('badge', status.className)}>{status.label}</span>
            <span className="badge badge-zinc">{doubt.subject}</span>
            {doubt.branch && <span className="text-zinc-400 dark:text-zinc-500">· {doubt.branch}</span>}
            {doubt.semester && <span className="text-zinc-400 dark:text-zinc-500">· Sem {doubt.semester}</span>}
          </div>

          {/* Title */}
          <Link to={`/doubt/${doubt.id}`}>
            <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 leading-snug mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
              {doubt.title}
            </h3>
          </Link>

          {/* Preview */}
          <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 mb-3 leading-relaxed">
            {truncate(doubt.description, 120)}
          </p>

          {/* Tags */}
          {doubt.tags && doubt.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {doubt.tags.slice(0, 4).map((tag) => (
                <span key={tag} className="badge badge-zinc text-[10px]">{tag}</span>
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between text-xs text-zinc-400 dark:text-zinc-500">
            <div className="flex items-center gap-3">
              {author && (
                <Link to={`/profile/${author.id}`} className="flex items-center gap-1.5 hover:text-zinc-600 dark:hover:text-zinc-300">
                  <Avatar src={author.avatar_url} name={author.full_name || author.username} size="xs" />
                  <span>{author.username}</span>
                </Link>
              )}
              <span className="flex items-center gap-1">
                <Clock size={11} />
                {timeAgo(doubt.created_at)}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <ThumbsUp size={11} />
                {doubt.vote_count ?? 0}
              </span>
              <span className={cn('flex items-center gap-1', (doubt.answer_count ?? 0) > 0 ? 'text-emerald-500' : '')}>
                {doubt.status === 'resolved' ? <CheckCircle2 size={11} /> : <MessageSquare size={11} />}
                {doubt.answer_count ?? 0}
              </span>
            </div>
          </div>
        </div>

        {/* Bookmark button */}
        {onBookmark && (
          <button
            onClick={(e) => { e.preventDefault(); onBookmark(doubt.id); }}
            className="mt-0.5 text-zinc-300 dark:text-zinc-600 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors shrink-0"
            aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark'}
          >
            {isBookmarked ? <BookmarkCheck size={16} className="text-indigo-500" /> : <Bookmark size={16} />}
          </button>
        )}
      </div>
    </motion.div>
  );
}
