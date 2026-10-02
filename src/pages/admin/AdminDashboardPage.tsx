import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  MessageSquare,
  AlertTriangle,
  Pin,
  Trash2,
  UserX,
  UserCheck,
  ShieldAlert,
  Search,
  Filter,
  Activity,
  Tag,
  BarChart3,
  TrendingUp,
  CheckCircle2
} from 'lucide-react';
import {
  getAdminStats,
  getAllUsers,
  suspendUser,
  updateUserRole,
  deleteUser,
  getReports,
  resolveReport,
  pinDoubt,
  adminDeleteDoubt,
  adminDeleteAnswer,
  getAdminActions,
  getTopSubjects
} from '../../services/adminService';
import { getDoubts } from '../../services/doubtService';
import { useAuthStore } from '../../stores/authStore';
import { Avatar } from '../../components/ui/Avatar';
import { PageLoader } from '../../components/ui/Skeleton';
import { formatDate, timeAgo } from '../../lib/utils';
import type { Profile, Report, AdminAction, Doubt } from '../../types';
import toast from 'react-hot-toast';

export function AdminDashboardPage() {
  const { profile: currentAdmin } = useAuthStore();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'doubts' | 'reports' | 'logs'>('overview');
  const [userSearch, setUserSearch] = useState('');
  const [doubtSearch, setDoubtSearch] = useState('');

  // Stats
  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: getAdminStats,
  });

  // Users
  const { data: users = [], isLoading: loadingUsers } = useQuery({
    queryKey: ['admin-users', userSearch],
    queryFn: () => getAllUsers(userSearch),
    enabled: activeTab === 'users',
  });

  // Doubts
  const { data: doubtsData, isLoading: loadingDoubts } = useQuery({
    queryKey: ['admin-doubts', doubtSearch],
    queryFn: () => getDoubts({ search: doubtSearch, limit: 30 }),
    enabled: activeTab === 'doubts',
  });

  // Reports
  const { data: reports = [], isLoading: loadingReports } = useQuery({
    queryKey: ['admin-reports'],
    queryFn: getReports,
    enabled: activeTab === 'reports',
  });

  // Logs
  const { data: logs = [], isLoading: loadingLogs } = useQuery({
    queryKey: ['admin-logs'],
    queryFn: () => getAdminActions(50),
    enabled: activeTab === 'logs',
  });

  // Top subjects
  const { data: topSubjects = [] } = useQuery({
    queryKey: ['admin-top-subjects'],
    queryFn: () => getTopSubjects(6),
    enabled: activeTab === 'overview',
  });

  // Mutations
  const suspendUserMutation = useMutation({
    mutationFn: ({ userId, suspended }: { userId: string; suspended: boolean }) =>
      suspendUser(userId, suspended, currentAdmin!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('User status updated');
    },
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : 'Action failed'),
  });

  const changeRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: 'student' | 'admin' }) =>
      updateUserRole(userId, role, currentAdmin!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('User role updated');
    },
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : 'Action failed'),
  });

  const deleteUserMutation = useMutation({
    mutationFn: (userId: string) => deleteUser(userId, currentAdmin!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('User deleted');
    },
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : 'Action failed'),
  });

  const resolveReportMutation = useMutation({
    mutationFn: ({ reportId, status }: { reportId: string; status: 'resolved' | 'dismissed' }) =>
      resolveReport(reportId, status, currentAdmin!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      toast.success('Report updated');
    },
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : 'Action failed'),
  });

  const togglePinMutation = useMutation({
    mutationFn: ({ doubtId, pinned }: { doubtId: string; pinned: boolean }) =>
      pinDoubt(doubtId, pinned, currentAdmin!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-doubts'] });
      toast.success('Doubt pin status updated');
    },
  });

  const deleteDoubtMutation = useMutation({
    mutationFn: (doubtId: string) =>
      adminDeleteDoubt(doubtId, currentAdmin!.id, 'Removed by admin moderation'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-doubts'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      toast.success('Doubt deleted by admin');
    },
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : 'Delete failed'),
  });

  return (
    <div className="space-y-6">
      {/* Admin header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="badge badge-indigo">Admin Portal</span>
            <span className="text-xs text-zinc-400">Strict RLS Protected</span>
          </div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">DoubtHub Management</h1>
        </div>

        {/* Tab switchers */}
        <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800/80 p-1 rounded-xl overflow-x-auto">
          {[
            { key: 'overview', label: 'Overview', icon: BarChart3 },
            { key: 'users', label: 'Users', icon: Users },
            { key: 'doubts', label: 'Doubts', icon: MessageSquare },
            { key: 'reports', label: 'Reports', icon: AlertTriangle, count: stats?.open_reports },
            { key: 'logs', label: 'Audit Logs', icon: Activity },
          ].map(({ key, label, icon: Icon, count }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all shrink-0 ${
                activeTab === key
                  ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              <Icon size={14} />
              <span>{label}</span>
              {typeof count === 'number' && count > 0 && (
                <span className="bg-red-500 text-white rounded-full px-1.5 py-0.2 text-[10px] font-bold">
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {loadingStats ? (
            <PageLoader />
          ) : (
            <>
              {/* Stat Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Total Students', value: stats?.total_users ?? 0, icon: Users, color: 'text-indigo-500' },
                  { label: 'Total Doubts', value: stats?.total_doubts ?? 0, icon: MessageSquare, color: 'text-blue-500' },
                  { label: 'Total Answers', value: stats?.total_answers ?? 0, icon: CheckCircle2, color: 'text-emerald-500' },
                  { label: 'Pending Reports', value: stats?.open_reports ?? 0, icon: AlertTriangle, color: 'text-amber-500' },
                  { label: 'Solved Doubts', value: stats?.solved_doubts ?? 0, icon: TrendingUp, color: 'text-green-500' },
                  { label: 'Unanswered', value: stats?.unanswered_doubts ?? 0, icon: MessageSquare, color: 'text-rose-500' },
                  { label: "Today's Doubts", value: stats?.doubts_today ?? 0, icon: Activity, color: 'text-violet-500' },
                  { label: "Today's Answers", value: stats?.answers_today ?? 0, icon: CheckCircle2, color: 'text-teal-500' },
                ].map(({ label, value, icon: Icon, color }) => (
                  <div key={label} className="card p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-zinc-400">{label}</span>
                      <Icon size={16} className={color} />
                    </div>
                    <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{value}</div>
                  </div>
                ))}
              </div>

              {/* Popular Subjects */}
              <div className="card p-5">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
                  <Tag size={15} className="text-indigo-500" />
                  Most Active Subjects
                </h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {topSubjects.length === 0 ? (
                    <p className="text-xs text-zinc-400">No subject statistics available yet.</p>
                  ) : (
                    topSubjects.map(({ subject, count }) => (
                      <div key={subject} className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
                        <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200">{subject}</span>
                        <span className="badge badge-zinc">{count} doubts</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* USERS TAB */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              className="input pl-9"
              placeholder="Search students by name or email…"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
            />
          </div>

          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400">
                  <tr>
                    <th className="p-3">User</th>
                    <th className="p-3">Role</th>
                    <th className="p-3">Branch & Sem</th>
                    <th className="p-3">Reputation</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Joined</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {loadingUsers ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-zinc-400">Loading students…</td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-zinc-400">No users found.</td>
                    </tr>
                  ) : (
                    users.map((u) => (
                      <tr key={u.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <Avatar src={u.avatar_url} name={u.full_name || u.username} size="sm" />
                            <div>
                              <p className="font-semibold text-zinc-900 dark:text-zinc-100">{u.full_name || u.username}</p>
                              <p className="text-[10px] text-zinc-400">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <span className={`badge ${u.role === 'admin' ? 'badge-indigo' : 'badge-zinc'}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="p-3 text-zinc-600 dark:text-zinc-300">
                          {u.branch || '—'} {u.semester ? `(Sem ${u.semester})` : ''}
                        </td>
                        <td className="p-3 font-semibold text-zinc-700 dark:text-zinc-300">
                          {u.reputation}
                        </td>
                        <td className="p-3">
                          {u.is_suspended ? (
                            <span className="badge badge-red">Suspended</span>
                          ) : (
                            <span className="badge badge-green">Active</span>
                          )}
                        </td>
                        <td className="p-3 text-zinc-400">{formatDate(u.created_at)}</td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {u.id !== currentAdmin?.id && (
                              <>
                                <button
                                  onClick={() => suspendUserMutation.mutate({ userId: u.id, suspended: !u.is_suspended })}
                                  className={`btn-ghost text-xs p-1.5 ${u.is_suspended ? 'text-green-600' : 'text-amber-500'}`}
                                  title={u.is_suspended ? 'Unsuspend student' : 'Suspend student'}
                                >
                                  {u.is_suspended ? <UserCheck size={14} /> : <UserX size={14} />}
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm(`Permanently delete ${u.username}?`)) {
                                      deleteUserMutation.mutate(u.id);
                                    }
                                  }}
                                  className="btn-ghost text-xs p-1.5 text-red-500"
                                  title="Delete user"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* DOUBTS TAB */}
      {activeTab === 'doubts' && (
        <div className="space-y-4">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              className="input pl-9"
              placeholder="Search doubts across all topics…"
              value={doubtSearch}
              onChange={(e) => setDoubtSearch(e.target.value)}
            />
          </div>

          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400">
                  <tr>
                    <th className="p-3">Title</th>
                    <th className="p-3">Subject</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Author</th>
                    <th className="p-3">Created</th>
                    <th className="p-3 text-right">Moderation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {loadingDoubts ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-zinc-400">Loading doubts…</td>
                    </tr>
                  ) : !doubtsData?.data || doubtsData.data.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-zinc-400">No doubts found.</td>
                    </tr>
                  ) : (
                    doubtsData.data.map((d: Doubt) => (
                      <tr key={d.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                        <td className="p-3 max-w-xs">
                          <p className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">{d.title}</p>
                          <p className="text-[10px] text-zinc-400 truncate">{d.description}</p>
                        </td>
                        <td className="p-3">
                          <span className="badge badge-zinc">{d.subject}</span>
                        </td>
                        <td className="p-3">
                          <span className={`badge ${d.status === 'resolved' ? 'badge-green' : 'badge-indigo'}`}>
                            {d.status}
                          </span>
                        </td>
                        <td className="p-3 text-zinc-600 dark:text-zinc-300">
                          {d.author?.username || 'Unknown'}
                        </td>
                        <td className="p-3 text-zinc-400">{timeAgo(d.created_at)}</td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => togglePinMutation.mutate({ doubtId: d.id, pinned: !d.is_pinned })}
                              className={`btn-ghost text-xs p-1.5 ${d.is_pinned ? 'text-indigo-600' : 'text-zinc-400'}`}
                              title={d.is_pinned ? 'Unpin doubt' : 'Pin doubt'}
                            >
                              <Pin size={14} />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Delete doubt "${d.title}"?`)) {
                                  deleteDoubtMutation.mutate(d.id);
                                }
                              }}
                              className="btn-ghost text-xs p-1.5 text-red-500"
                              title="Delete doubt"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* REPORTS TAB */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400">
                  <tr>
                    <th className="p-3">Reason</th>
                    <th className="p-3">Target Type</th>
                    <th className="p-3">Reporter</th>
                    <th className="p-3">Details</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Date</th>
                    <th className="p-3 text-right">Resolution</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {loadingReports ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-zinc-400">Loading reports…</td>
                    </tr>
                  ) : reports.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-zinc-400">No reports submitted. Community is healthy!</td>
                    </tr>
                  ) : (
                    reports.map((r) => (
                      <tr key={r.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                        <td className="p-3">
                          <span className="badge badge-red font-semibold uppercase text-[10px]">
                            {r.reason}
                          </span>
                        </td>
                        <td className="p-3 uppercase text-zinc-500 font-mono text-[11px]">{r.target_type}</td>
                        <td className="p-3 text-zinc-700 dark:text-zinc-300">
                          {r.reporter?.username || 'Anonymous'}
                        </td>
                        <td className="p-3 text-zinc-600 dark:text-zinc-400 max-w-xs truncate">
                          {r.details || 'No additional details provided'}
                        </td>
                        <td className="p-3">
                          <span className={`badge ${r.status === 'pending' ? 'badge-yellow' : r.status === 'resolved' ? 'badge-green' : 'badge-zinc'}`}>
                            {r.status}
                          </span>
                        </td>
                        <td className="p-3 text-zinc-400">{timeAgo(r.created_at)}</td>
                        <td className="p-3 text-right">
                          {r.status === 'pending' ? (
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => resolveReportMutation.mutate({ reportId: r.id, status: 'resolved' })}
                                className="btn-primary text-[11px] px-2.5 py-1"
                              >
                                Resolve
                              </button>
                              <button
                                onClick={() => resolveReportMutation.mutate({ reportId: r.id, status: 'dismissed' })}
                                className="btn-secondary text-[11px] px-2.5 py-1"
                              >
                                Dismiss
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] text-zinc-400 capitalize">{r.status}</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* AUDIT LOGS TAB */}
      {activeTab === 'logs' && (
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
            <Activity size={16} className="text-indigo-500" />
            Recorded Admin Action History
          </h3>
          <div className="space-y-3">
            {loadingLogs ? (
              <p className="text-xs text-zinc-400">Loading audit history…</p>
            ) : logs.length === 0 ? (
              <p className="text-xs text-zinc-400">No admin actions recorded yet.</p>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="flex items-start justify-between p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 text-xs">
                  <div>
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400 mr-2 font-mono">
                      {log.action}
                    </span>
                    <span className="text-zinc-600 dark:text-zinc-300">
                      Target: {log.target_type} ({log.target_id.slice(0, 8)}…)
                    </span>
                    {log.reason && (
                      <p className="text-[11px] text-zinc-400 mt-0.5">Reason: {log.reason}</p>
                    )}
                  </div>
                  <span className="text-zinc-400 text-[10px] shrink-0 ml-4">{timeAgo(log.created_at)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
