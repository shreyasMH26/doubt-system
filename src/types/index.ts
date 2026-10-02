export type UserRole = 'student' | 'admin';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  username: string;
  avatar_url: string | null;
  branch: string | null;
  semester: number | null;
  year: number | null;
  bio: string | null;
  role: UserRole;
  reputation: number;
  is_suspended: boolean;
  created_at: string;
  updated_at: string;
}

export type DoubtStatus = 'open' | 'resolved' | 'closed';

export interface Doubt {
  id: string;
  title: string;
  description: string;
  subject: string;
  subject_id?: string | null;
  subject_ref?: Subject;
  branch: string | null;
  semester: number | null;
  tags: string[];
  status: DoubtStatus;
  author_id: string;
  author?: Profile;
  views: number;
  is_pinned: boolean;
  accepted_answer_id: string | null;
  created_at: string;
  updated_at: string;
  answer_count?: number;
  vote_count?: number;
  attachments?: Attachment[];
}

export interface Answer {
  id: string;
  doubt_id: string;
  author_id: string;
  author?: Profile;
  content: string;
  is_accepted: boolean;
  created_at: string;
  updated_at: string;
  vote_count?: number;
  comment_count?: number;
  attachments?: Attachment[];
}

export interface Comment {
  id: string;
  answer_id: string;
  author_id: string;
  author?: Profile;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface Attachment {
  id: string;
  url: string;
  file_name: string;
  file_type: string;
  file_size: number;
  doubt_id?: string | null;
  answer_id?: string | null;
  created_at: string;
}

export interface Subject {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  created_at?: string;
}

export interface Bookmark {
  id: string;
  user_id: string;
  doubt_id: string;
  doubt?: Doubt;
  created_at: string;
}

export interface Vote {
  id: string;
  user_id: string;
  target_id: string;
  target_type: 'doubt' | 'answer';
  value: 1 | -1;
  created_at: string;
}

export interface Report {
  id: string;
  reporter_id: string;
  reporter?: Profile;
  target_id: string;
  target_type: 'doubt' | 'answer' | 'comment';
  reason: ReportReason;
  details: string | null;
  status: 'pending' | 'resolved' | 'dismissed';
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export type ReportReason =
  | 'spam'
  | 'harassment'
  | 'inappropriate'
  | 'misleading'
  | 'duplicate'
  | 'other';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

export type NotificationType =
  | 'new_answer'
  | 'answer_accepted'
  | 'new_comment'
  | 'mention'
  | 'report_reviewed'
  | 'admin_announcement';

export interface AdminAction {
  id: string;
  admin_id: string;
  admin?: Profile;
  action: string;
  target_type: string;
  target_id: string;
  reason: string | null;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  user_id: string;
  user?: Profile;
  action: string;
  target_type: string;
  target_id: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface DoubtFilters {
  search?: string;
  subject?: string;
  branch?: string;
  semester?: number;
  status?: DoubtStatus | 'all';
  sort?: 'newest' | 'oldest' | 'most_voted' | 'most_answers' | 'unanswered';
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  count: number;
  page: number;
  totalPages: number;
}

export interface AnalyticsData {
  total_users: number;
  total_doubts: number;
  total_answers: number;
  solved_doubts: number;
  open_reports: number;
  doubts_today: number;
  answers_today: number;
}
