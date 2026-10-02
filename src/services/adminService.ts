import { supabase } from '../lib/supabase';
import type { Profile, Report, AdminAction } from '../types';

export async function getAdminStats() {
  const [
    { count: total_users },
    { count: total_doubts },
    { count: total_answers },
    { count: solved_doubts },
    { count: open_reports },
    { count: unanswered },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('doubts').select('*', { count: 'exact', head: true }),
    supabase.from('answers').select('*', { count: 'exact', head: true }),
    supabase.from('doubts').select('*', { count: 'exact', head: true }).eq('status', 'resolved'),
    supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('doubts').select('*', { count: 'exact', head: true }).eq('status', 'open'),
  ]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [{ count: doubts_today }, { count: answers_today }] = await Promise.all([
    supabase.from('doubts').select('*', { count: 'exact', head: true }).gte('created_at', today.toISOString()),
    supabase.from('answers').select('*', { count: 'exact', head: true }).gte('created_at', today.toISOString()),
  ]);

  return {
    total_users: total_users ?? 0,
    total_doubts: total_doubts ?? 0,
    total_answers: total_answers ?? 0,
    solved_doubts: solved_doubts ?? 0,
    open_reports: open_reports ?? 0,
    unanswered_doubts: unanswered ?? 0,
    doubts_today: doubts_today ?? 0,
    answers_today: answers_today ?? 0,
  };
}

export async function getAllUsers(search?: string): Promise<Profile[]> {
  let query = supabase.from('profiles').select('*').order('created_at', { ascending: false });
  if (search) query = query.ilike('full_name', `%${search}%`);
  const { data, error } = await query;
  if (error) throw error;
  return data as Profile[];
}

export async function suspendUser(userId: string, suspended: boolean, adminId: string): Promise<void> {
  const { error } = await supabase.from('profiles').update({ is_suspended: suspended }).eq('id', userId);
  if (error) throw error;

  await logAdminAction(adminId, suspended ? 'SUSPEND_USER' : 'UNSUSPEND_USER', 'user', userId);
}

export async function updateUserRole(userId: string, role: 'student' | 'admin', adminId: string): Promise<void> {
  const { error } = await supabase.from('profiles').update({ role }).eq('id', userId);
  if (error) throw error;
  await logAdminAction(adminId, `SET_ROLE_${role.toUpperCase()}`, 'user', userId);
}

export async function deleteUser(userId: string, adminId: string): Promise<void> {
  const { error } = await supabase.from('profiles').delete().eq('id', userId);
  if (error) throw error;
  await logAdminAction(adminId, 'DELETE_USER', 'user', userId);
}

export async function getReports(): Promise<Report[]> {
  const { data, error } = await supabase
    .from('reports')
    .select(`
      *,
      reporter:profiles!reports_reporter_id_fkey(id, username, full_name)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Report[];
}

export async function resolveReport(
  reportId: string,
  status: 'resolved' | 'dismissed',
  adminId: string
): Promise<void> {
  const { error } = await supabase.from('reports').update({
    status,
    reviewed_by: adminId,
    reviewed_at: new Date().toISOString(),
  }).eq('id', reportId);

  if (error) throw error;
  await logAdminAction(adminId, `REPORT_${status.toUpperCase()}`, 'report', reportId);
}

export async function pinDoubt(doubtId: string, pinned: boolean, adminId: string): Promise<void> {
  const { error } = await supabase.from('doubts').update({ is_pinned: pinned }).eq('id', doubtId);
  if (error) throw error;
  await logAdminAction(adminId, pinned ? 'PIN_DOUBT' : 'UNPIN_DOUBT', 'doubt', doubtId);
}

export async function adminDeleteDoubt(doubtId: string, adminId: string, reason?: string): Promise<void> {
  const { error } = await supabase.from('doubts').delete().eq('id', doubtId);
  if (error) throw error;
  await logAdminAction(adminId, 'DELETE_DOUBT', 'doubt', doubtId, reason);
}

export async function adminDeleteAnswer(answerId: string, adminId: string, reason?: string): Promise<void> {
  const { error } = await supabase.from('answers').delete().eq('id', answerId);
  if (error) throw error;
  await logAdminAction(adminId, 'DELETE_ANSWER', 'answer', answerId, reason);
}

export async function getAdminActions(limit = 50): Promise<AdminAction[]> {
  const { data, error } = await supabase
    .from('admin_actions')
    .select(`
      *,
      admin:profiles!admin_actions_admin_id_fkey(username, full_name, avatar_url)
    `)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data as AdminAction[];
}

async function logAdminAction(
  adminId: string,
  action: string,
  targetType: string,
  targetId: string,
  reason?: string
): Promise<void> {
  await supabase.from('admin_actions').insert({
    admin_id: adminId,
    action,
    target_type: targetType,
    target_id: targetId,
    reason: reason ?? null,
  });
}

export async function getTopSubjects(limit = 6) {
  const { data } = await supabase
    .from('doubts')
    .select('subject')
    .limit(500);

  if (!data) return [];

  const counts: Record<string, number> = {};
  data.forEach((d) => { counts[d.subject] = (counts[d.subject] ?? 0) + 1; });

  return Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([subject, count]) => ({ subject, count }));
}

export async function getTopContributors(limit = 5): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, full_name, avatar_url, reputation, branch')
    .order('reputation', { ascending: false })
    .limit(limit);

  if (error) return [];
  return data as Profile[];
}
