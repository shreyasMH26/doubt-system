import { supabase } from '../lib/supabase';
import type { Profile } from '../types';
import { ALLOWED_ATTACHMENT_TYPES, MAX_FILE_SIZE_BYTES } from '../lib/utils';

// ---- PROFILE ----

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) return null;
  return data as Profile;
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

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name, username, branch, semester },
    },
  });

  if (error) throw error;

  // Update profile with extra fields if user created
  if (data.user) {
    await supabase.from('profiles').upsert({
      id: data.user.id,
      email,
      full_name,
      username,
      branch: branch ?? null,
      semester: semester ?? null,
    });
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
  const origin = window.location.origin;
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/reset-password`,
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
