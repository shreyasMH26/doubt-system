import { supabase } from '../lib/supabase';
import type { Doubt, DoubtFilters, PaginatedResult, Answer, Comment, Attachment } from '../types';

const PAGE_SIZE = 15;

export async function getDoubts(filters: DoubtFilters = {}): Promise<PaginatedResult<Doubt>> {
  const { search, subject, branch, semester, status = 'all', sort = 'newest', page = 1, limit = PAGE_SIZE } = filters;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('doubts')
    .select(`
      *,
      author:profiles!doubts_author_id_fkey(id, username, full_name, avatar_url, branch, semester, reputation, role),
      attachments(*)
    `, { count: 'exact' });

  if (search) {
    query = query.textSearch('title', search, { type: 'websearch' });
  }
  if (subject && subject !== 'all') query = query.eq('subject', subject);
  if (branch) query = query.eq('branch', branch);
  if (semester) query = query.eq('semester', semester);
  if (status && status !== 'all') query = query.eq('status', status);

  // Sort
  if (sort === 'newest') query = query.order('is_pinned', { ascending: false }).order('created_at', { ascending: false });
  else if (sort === 'oldest') query = query.order('created_at', { ascending: true });
  else if (sort === 'unanswered') {
    query = query.eq('status', 'open').order('created_at', { ascending: false });
  } else {
    query = query.order('created_at', { ascending: false });
  }

  query = query.range(from, to);

  const { data, error, count } = await query;
  if (error) throw error;

  // Enrich with vote and answer counts
  const doubtIds = (data ?? []).map((d) => d.id);

  let answerCounts: Record<string, number> = {};
  let voteCounts: Record<string, number> = {};

  if (doubtIds.length > 0) {
    const { data: aCounts } = await supabase
      .from('doubt_answer_counts')
      .select('doubt_id, answer_count')
      .in('doubt_id', doubtIds);

    const { data: vCounts } = await supabase
      .from('doubt_vote_counts')
      .select('doubt_id, vote_count')
      .in('doubt_id', doubtIds);

    (aCounts ?? []).forEach((r) => { answerCounts[r.doubt_id] = Number(r.answer_count); });
    (vCounts ?? []).forEach((r) => { voteCounts[r.doubt_id] = Number(r.vote_count); });
  }

  const enriched = (data ?? []).map((d) => ({
    ...d,
    answer_count: answerCounts[d.id] ?? 0,
    vote_count: voteCounts[d.id] ?? 0,
  }));

  return {
    data: enriched as Doubt[],
    count: count ?? 0,
    page,
    totalPages: Math.ceil((count ?? 0) / limit),
  };
}

export async function getDoubtById(id: string): Promise<Doubt | null> {
  const { data, error } = await supabase
    .from('doubts')
    .select(`
      *,
      author:profiles!doubts_author_id_fkey(id, username, full_name, avatar_url, branch, semester, reputation, role),
      attachments(*)
    `)
    .eq('id', id)
    .single();

  if (error) return null;

  // Increment view count (fire and forget)
  supabase.rpc('increment_doubt_views', { doubt_id: id }).then(() => {});

  return data as Doubt;
}

function isUuid(val?: string | null): boolean {
  if (!val || typeof val !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val);
}

export async function createDoubt(doubt: {
  title: string;
  description: string;
  subject: string;
  subject_id?: string;
  branch?: string;
  semester?: number;
  tags?: string[];
  author_id: string;
}): Promise<Doubt> {
  // Ensure we have the current authenticated user to satisfy RLS (auth.uid() = author_id)
  let authorId = doubt.author_id;
  try {
    const { data: authData } = await supabase.auth.getUser();
    if (authData?.user) {
      authorId = authData.user.id;

      // Ensure profile row exists to prevent foreign key violation on doubts_author_id_fkey
      const { data: profileRow } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', authorId)
        .maybeSingle();

      if (!profileRow) {
        const u = authData.user;
        const username =
          u.user_metadata?.username ||
          u.email?.split('@')[0] ||
          `student_${u.id.slice(0, 6)}`;
        const fullName = u.user_metadata?.full_name || username;

        await supabase.from('profiles').upsert({
          id: u.id,
          email: u.email || '',
          username,
          full_name: fullName,
          branch: u.user_metadata?.branch || null,
          semester: u.user_metadata?.semester ? Number(u.user_metadata.semester) : null,
          role: 'student',
        });
      }
    }
  } catch (authErr) {
    console.warn('[DoubtHub] Pre-insert auth verification check:', authErr);
  }

  // Build clean payload.
  // Note: only pass subject_id if it is a syntactically valid UUID; non-UUID fallback IDs are ignored.
  const payload: Record<string, unknown> = {
    title: doubt.title.trim(),
    description: doubt.description.trim(),
    subject: doubt.subject.trim(),
    author_id: authorId,
    branch: doubt.branch || null,
    semester: typeof doubt.semester === 'number' ? doubt.semester : null,
    tags: Array.isArray(doubt.tags) ? doubt.tags : [],
    status: 'open',
  };

  if (doubt.subject_id && isUuid(doubt.subject_id)) {
    payload.subject_id = doubt.subject_id;
  }

  let { data, error } = await supabase
    .from('doubts')
    .insert(payload)
    .select()
    .single();

  // If insert failed and subject_id was included, retry without subject_id
  if (error && payload.subject_id) {
    console.warn('[DoubtHub] Insert with subject_id failed, retrying without subject_id:', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });

    const { subject_id, ...fallbackPayload } = payload;
    const retry = await supabase
      .from('doubts')
      .insert(fallbackPayload)
      .select()
      .single();

    data = retry.data;
    error = retry.error;
  }

  if (error) {
    console.error('[DoubtHub] createDoubt final error:', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
      payload,
    });
    const errorMsg = error.message || error.details || error.hint || `Failed to post doubt (Error ${error.code || 'unknown'})`;
    const fullErr = new Error(errorMsg);
    (fullErr as any).code = error.code;
    (fullErr as any).details = error.details;
    (fullErr as any).hint = error.hint;
    throw fullErr;
  }

  return data as Doubt;
}

export async function updateDoubt(id: string, updates: Partial<Doubt>): Promise<void> {
  const { error } = await supabase.from('doubts').update(updates).eq('id', id);
  if (error) throw error;
}

export async function deleteDoubt(id: string): Promise<void> {
  const { error } = await supabase.from('doubts').delete().eq('id', id);
  if (error) throw error;
}

export async function getSimilarDoubts(title: string, limit = 5): Promise<Doubt[]> {
  const { data, error } = await supabase
    .from('doubts')
    .select('id, title, subject, status, created_at, author:profiles!doubts_author_id_fkey(username)')
    .textSearch('title', title.split(' ').slice(0, 5).join(' | '), { type: 'websearch' })
    .limit(limit);

  if (error) return [];
  return data as unknown as Doubt[];
}

// ---- ANSWERS ----

export async function getAnswers(doubtId: string): Promise<Answer[]> {
  const { data, error } = await supabase
    .from('answers')
    .select(`
      *,
      author:profiles!answers_author_id_fkey(id, username, full_name, avatar_url, reputation, role),
      attachments(*)
    `)
    .eq('doubt_id', doubtId)
    .order('is_accepted', { ascending: false })
    .order('created_at', { ascending: true });

  if (error) throw error;

  const answerIds = (data ?? []).map((a) => a.id);
  let voteCounts: Record<string, number> = {};
  let commentCounts: Record<string, number> = {};

  if (answerIds.length > 0) {
    const { data: vCounts } = await supabase
      .from('answer_vote_counts')
      .select('answer_id, vote_count')
      .in('answer_id', answerIds);

    const { data: cCounts } = await supabase
      .from('comments')
      .select('answer_id')
      .in('answer_id', answerIds);

    (vCounts ?? []).forEach((r) => { voteCounts[r.answer_id] = Number(r.vote_count); });
    // Count comments per answer
    (cCounts ?? []).forEach((r) => {
      commentCounts[r.answer_id] = (commentCounts[r.answer_id] ?? 0) + 1;
    });
  }

  return (data ?? []).map((a) => ({
    ...a,
    vote_count: voteCounts[a.id] ?? 0,
    comment_count: commentCounts[a.id] ?? 0,
  })) as Answer[];
}

export async function createAnswer(answer: {
  doubt_id: string;
  author_id: string;
  content: string;
}): Promise<Answer> {
  const { data, error } = await supabase
    .from('answers')
    .insert(answer)
    .select()
    .single();

  if (error) throw error;
  return data as Answer;
}

export async function acceptAnswer(answerId: string, doubtId: string): Promise<void> {
  // Un-accept all answers for this doubt
  await supabase.from('answers').update({ is_accepted: false }).eq('doubt_id', doubtId);
  // Accept this one
  await supabase.from('answers').update({ is_accepted: true }).eq('id', answerId);
  // Update doubt status
  await supabase.from('doubts').update({ status: 'resolved', accepted_answer_id: answerId }).eq('id', doubtId);
}

export async function deleteAnswer(id: string): Promise<void> {
  const { error } = await supabase.from('answers').delete().eq('id', id);
  if (error) throw error;
}

// ---- COMMENTS ----

export async function getComments(answerId: string): Promise<Comment[]> {
  const { data, error } = await supabase
    .from('comments')
    .select(`
      *,
      author:profiles!comments_author_id_fkey(id, username, full_name, avatar_url, reputation)
    `)
    .eq('answer_id', answerId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data as Comment[];
}

export async function createComment(comment: {
  answer_id: string;
  author_id: string;
  content: string;
}): Promise<Comment> {
  const { data, error } = await supabase
    .from('comments')
    .insert(comment)
    .select()
    .single();

  if (error) throw error;
  return data as Comment;
}

export async function deleteComment(id: string): Promise<void> {
  const { error } = await supabase.from('comments').delete().eq('id', id);
  if (error) throw error;
}

// ---- VOTES ----

export async function getUserVote(userId: string, targetId: string, targetType: 'doubt' | 'answer'): Promise<number> {
  const { data } = await supabase
    .from('votes')
    .select('value')
    .eq('user_id', userId)
    .eq('target_id', targetId)
    .eq('target_type', targetType)
    .single();

  return data?.value ?? 0;
}

export async function vote(userId: string, targetId: string, targetType: 'doubt' | 'answer', value: 1 | -1): Promise<void> {
  const existing = await getUserVote(userId, targetId, targetType);

  if (existing === value) {
    // Remove vote (toggle off)
    await supabase.from('votes').delete()
      .eq('user_id', userId).eq('target_id', targetId).eq('target_type', targetType);
  } else {
    await supabase.from('votes').upsert({
      user_id: userId,
      target_id: targetId,
      target_type: targetType,
      value,
    }, { onConflict: 'user_id,target_id,target_type' });
  }
}

// ---- BOOKMARKS ----

export async function getUserBookmarks(userId: string): Promise<string[]> {
  const { data } = await supabase
    .from('bookmarks')
    .select('doubt_id')
    .eq('user_id', userId);

  return (data ?? []).map((b) => b.doubt_id);
}

export async function getBookmarkedDoubts(userId: string): Promise<Doubt[]> {
  const { data, error } = await supabase
    .from('bookmarks')
    .select(`
      doubt_id,
      doubt:doubts(
        *,
        author:profiles!doubts_author_id_fkey(id, username, full_name, avatar_url, reputation)
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map((b) => (b as any).doubt).filter(Boolean) as Doubt[];
}

export async function toggleBookmark(userId: string, doubtId: string): Promise<boolean> {
  const { data } = await supabase
    .from('bookmarks')
    .select('id')
    .eq('user_id', userId)
    .eq('doubt_id', doubtId)
    .single();

  if (data) {
    await supabase.from('bookmarks').delete().eq('user_id', userId).eq('doubt_id', doubtId);
    return false;
  } else {
    await supabase.from('bookmarks').insert({ user_id: userId, doubt_id: doubtId });
    return true;
  }
}

// ---- SEARCH ----

export async function searchDoubts(query: string, limit = 10): Promise<Doubt[]> {
  const { data, error } = await supabase
    .from('doubts')
    .select(`
      id, title, subject, status, created_at,
      author:profiles!doubts_author_id_fkey(username)
    `)
    .textSearch('title', query, { type: 'websearch' })
    .limit(limit);

  if (error) return [];
  return data as unknown as Doubt[];
}
