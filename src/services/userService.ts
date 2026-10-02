import { supabase } from '../lib/supabase';
import type { Profile } from '../types';
import { ALLOWED_ATTACHMENT_TYPES, MAX_FILE_SIZE_BYTES, getAppUrl } from '../lib/utils';

// ---- PROFILE ----

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (data) return data as Profile;
  if (error && error.code !== 'PGRST116') {
    console.warn('[DoubtHub] Error fetching profile:', error);
  }

  // Self-heal: If profile row is missing in public.profiles and this is the authenticated user,
  // automatically create the profile row from Auth user metadata so the profile immediately exists.
  try {
    const { data: authData } = await supabase.auth.getUser();
    const user = authData?.user;
    if (user && user.id === userId) {
      const username =
        user.user_metadata?.username ||
        user.email?.split('@')[0] ||
        `student_${user.id.slice(0, 6)}`;
      const fullName = user.user_metadata?.full_name || username;

      const { data: created, error: insertErr } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email || '',
          username,
          full_name: fullName,
          branch: user.user_metadata?.branch || null,
          semester: user.user_metadata?.semester ? Number(user.user_metadata.semester) : null,
          role: 'student',
        })
        .select('*')
        .maybeSingle();

      if (!insertErr && created) {
        return created as Profile;
      }
    }
  } catch (healErr) {
    console.warn('[DoubtHub] Self-heal profile failed:', healErr);
  }

  return null;
}

export async function updateProfile(userId: string, updates: Partial<Profile>): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId);

  if (error) throw error;
}

export async function getUserDoubts(userId: string) {
  const { data, error } = await supabase
    .from('doubts')
    .select(`*, author:profiles!doubts_author_id_fkey(username, full_name, avatar_url)`)
    .eq('author_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getUserAnswers(userId: string) {
  const { data, error } = await supabase
    .from('answers')
    .select(`
      *,
      doubt:doubts(id, title, status, subject)
    `)
    .eq('author_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

// ---- AUTH ----

export async function signUp(params: {
  email: string;
  password: string;
  full_name: string;
  username: string;
  branch?: string;
  semester?: number;
}) {
  const { email, password, full_name, username, branch, semester } = params;

  // Check username not taken
  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username)
    .single();

  if (existing) throw new Error('Username is already taken.');

  const appUrl = getAppUrl();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name, username, branch, semester },
      emailRedirectTo: `${appUrl}/dashboard`,
    },
  });

  if (error) throw error;

  // If a session exists immediately, update profile with extra fields.
  // When email confirmation is enabled, the database trigger on auth.users handles this.
  if (data.user && data.session) {
    try {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        email,
        full_name,
        username,
        branch: branch ?? null,
        semester: semester ?? null,
      });
    } catch {
      // Ignored: database trigger creates profile on auth.users insert
    }
  }

  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function resetPassword(email: string) {
  const appUrl = getAppUrl();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${appUrl}/settings`,
  });
  if (error) throw error;
}

export async function updatePassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}

// ---- FILE UPLOADS ----

export async function uploadAttachment(
  file: File,
  userId: string
): Promise<{ url: string; file_name: string; file_type: string; file_size: number }> {
  if (!ALLOWED_ATTACHMENT_TYPES.includes(file.type)) {
    throw new Error('File type not allowed. Please upload images or PDFs only.');
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error(`File size exceeds ${Math.floor(MAX_FILE_SIZE_BYTES / 1024 / 1024)} MB limit.`);
  }

  const ext = file.name.split('.').pop();
  const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await supabase.storage
    .from('attachments')
    .upload(fileName, file, { contentType: file.type, upsert: false });

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage
    .from('attachments')
    .getPublicUrl(fileName);

  return {
    url: publicUrl,
    file_name: file.name,
    file_type: file.type,
    file_size: file.size,
  };
}

export async function saveAttachment(attachment: {
  url: string;
  file_name: string;
  file_type: string;
  file_size: number;
  doubt_id?: string;
  answer_id?: string;
  uploaded_by: string;
}) {
  const { error } = await supabase.from('attachments').insert(attachment);
  if (error) throw error;
}
