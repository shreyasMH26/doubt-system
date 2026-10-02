import { supabase } from '../lib/supabase';
import type { Report, ReportReason } from '../types';

export async function submitReport(report: {
  reporter_id: string;
  target_id: string;
  target_type: 'doubt' | 'answer' | 'comment';
  reason: ReportReason;
  details?: string;
}): Promise<void> {
  const { error } = await supabase.from('reports').insert(report);
  if (error) throw error;
}

export async function getNotifications(userId: string) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(30);

  if (error) throw error;
  return data ?? [];
}

export async function markNotificationRead(id: string): Promise<void> {
  await supabase.from('notifications').update({ is_read: true }).eq('id', id);
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId);
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const { count } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  return count ?? 0;
}

export { getSubjects, DEFAULT_SUBJECTS } from './subjectService';

export async function getPlatformStats() {
  const [
    { count: users },
    { count: doubts },
    { count: answers },
    { count: solved },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('doubts').select('*', { count: 'exact', head: true }),
    supabase.from('answers').select('*', { count: 'exact', head: true }),
    supabase.from('doubts').select('*', { count: 'exact', head: true }).eq('status', 'resolved'),
  ]);

  return {
    users: users ?? 0,
    doubts: doubts ?? 0,
    answers: answers ?? 0,
    solved: solved ?? 0,
  };
}
