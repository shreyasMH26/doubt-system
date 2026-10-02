import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck } from 'lucide-react';
import { getNotifications, markAllNotificationsRead, markNotificationRead } from '../services/notificationService';
import { useAuthStore } from '../stores/authStore';
import { timeAgo } from '../lib/utils';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PageLoader } from '../components/ui/Skeleton';
import type { Notification } from '../types';

const typeIcon: Record<string, string> = {
  new_answer: '💬',
  answer_accepted: '✅',
  new_comment: '🗨️',
  mention: '@',
  report_reviewed: '🔍',
  admin_announcement: '📢',
};

export function NotificationsPage() {
  const { profile } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications', profile?.id],
    queryFn: () => profile ? getNotifications(profile.id) : Promise.resolve([]),
    enabled: !!profile,
  });

  const markAllRead = useMutation({
    mutationFn: () => markAllNotificationsRead(profile!.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications', profile?.id] }),
  });

  const handleMarkRead = async (id: string) => {
    await markNotificationRead(id);
    queryClient.invalidateQueries({ queryKey: ['notifications', profile?.id] });
    queryClient.invalidateQueries({ queryKey: ['unread-notifications', profile?.id] });
  };

  const unread = (notifications as Notification[]).filter((n) => !n.is_read).length;

  return (
    <div className="max-w-xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell size={18} className="text-zinc-700 dark:text-zinc-300" />
          <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Notifications</h1>
          {unread > 0 && <span className="badge badge-indigo">{unread} new</span>}
        </div>
        {unread > 0 && (
          <button onClick={() => markAllRead.mutate()} className="btn-ghost text-xs gap-1.5 text-zinc-400">
            <CheckCheck size={13} /> Mark all read
          </button>
        )}
      </div>

      {isLoading ? <PageLoader /> : (notifications as Notification[]).length === 0 ? (
        <div className="card p-12 text-center">
          <Bell size={32} className="mx-auto mb-3 text-zinc-300 dark:text-zinc-600" />
          <p className="text-sm font-medium text-zinc-400">No notifications yet</p>
          <p className="text-xs text-zinc-300 dark:text-zinc-600 mt-1">You'll be notified when someone answers your doubts.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {(notifications as Notification[]).map((n) => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className={`card p-4 flex items-start gap-3 cursor-pointer transition-colors ${!n.is_read ? 'border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-900/10' : 'hover:border-zinc-300 dark:hover:border-zinc-700'}`}
              onClick={() => !n.is_read && handleMarkRead(n.id)}
            >
              <span className="text-xl shrink-0">{typeIcon[n.type] || '🔔'}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{n.title}</p>
                <p className="text-xs text-zinc-400 mt-0.5">{n.message}</p>
                <p className="text-[10px] text-zinc-300 dark:text-zinc-600 mt-1">{timeAgo(n.created_at)}</p>
              </div>
              {!n.is_read && <span className="h-2 w-2 bg-indigo-500 rounded-full shrink-0 mt-1" />}
              {n.link && (
                <Link to={n.link} className="btn-ghost text-xs p-1" onClick={(e) => e.stopPropagation()}>→</Link>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
