-- ============================================================
-- DoubtHub — Supabase PostgreSQL Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm"; -- for fuzzy text search

-- ============================================================
-- PROFILES (extends auth.users)
-- ============================================================
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  full_name text not null default '',
  username text unique not null,
  avatar_url text,
  branch text,
  semester integer check (semester >= 1 and semester <= 8),
  year integer check (year >= 1 and year <= 4),
  bio text,
  role text not null default 'student' check (role in ('student', 'admin')),
  reputation integer not null default 0,
  is_suspended boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- SUBJECTS
-- ============================================================
create table if not exists public.subjects (
  id uuid default uuid_generate_v4() primary key,
  name text not null unique,
  slug text not null unique,
  description text,
  icon text,
  created_at timestamptz not null default now()
);

-- Seed default subjects
insert into public.subjects (name, slug, description, icon) values
  ('Mathematics', 'mathematics', 'Calculus, Algebra, Discrete Math', '📐'),
  ('Physics', 'physics', 'Mechanics, Electromagnetism, Optics', '⚛️'),
  ('Chemistry', 'chemistry', 'Organic, Inorganic, Physical Chemistry', '🧪'),
  ('Computer Science', 'computer-science', 'DSA, OS, DBMS, Networks', '💻'),
  ('Electronics', 'electronics', 'Circuits, Signals, Digital Systems', '🔌'),
  ('Electrical', 'electrical', 'Machines, Power Systems, Control', '⚡'),
  ('Mechanical', 'mechanical', 'Thermodynamics, Fluid Mechanics, Manufacturing', '⚙️'),
  ('Civil', 'civil', 'Structures, Geotechnics, Transportation', '🏗️'),
  ('English', 'english', 'Communication, Technical Writing', '📝'),
  ('General', 'general', 'Miscellaneous academic doubts', '📚')
on conflict do nothing;

-- ============================================================
-- DOUBTS
-- ============================================================
create table if not exists public.doubts (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text not null,
  subject text not null,
  branch text,
  semester integer,
  tags text[] default '{}',
  status text not null default 'open' check (status in ('open', 'resolved', 'closed')),
  author_id uuid not null references public.profiles(id) on delete cascade,
  views integer not null default 0,
  is_pinned boolean not null default false,
  accepted_answer_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Full-text search index
create index if not exists doubts_search_idx on public.doubts
  using gin(to_tsvector('english', title || ' ' || description));
create index if not exists doubts_subject_idx on public.doubts(subject);
create index if not exists doubts_branch_idx on public.doubts(branch);
create index if not exists doubts_semester_idx on public.doubts(semester);
create index if not exists doubts_status_idx on public.doubts(status);
create index if not exists doubts_author_idx on public.doubts(author_id);
create index if not exists doubts_created_at_idx on public.doubts(created_at desc);
create index if not exists doubts_pinned_idx on public.doubts(is_pinned);

-- ============================================================
-- ANSWERS
-- ============================================================
create table if not exists public.answers (
  id uuid default uuid_generate_v4() primary key,
  doubt_id uuid not null references public.doubts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  is_accepted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists answers_doubt_idx on public.answers(doubt_id);
create index if not exists answers_author_idx on public.answers(author_id);

-- ============================================================
-- COMMENTS
-- ============================================================
create table if not exists public.comments (
  id uuid default uuid_generate_v4() primary key,
  answer_id uuid not null references public.answers(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists comments_answer_idx on public.comments(answer_id);

-- ============================================================
-- ATTACHMENTS
-- ============================================================
create table if not exists public.attachments (
  id uuid default uuid_generate_v4() primary key,
  url text not null,
  file_name text not null,
  file_type text not null,
  file_size integer not null,
  doubt_id uuid references public.doubts(id) on delete cascade,
  answer_id uuid references public.answers(id) on delete cascade,
  uploaded_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  check (doubt_id is not null or answer_id is not null)
);

-- ============================================================
-- BOOKMARKS
-- ============================================================
create table if not exists public.bookmarks (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  doubt_id uuid not null references public.doubts(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id, doubt_id)
);

create index if not exists bookmarks_user_idx on public.bookmarks(user_id);

-- ============================================================
-- VOTES
-- ============================================================
create table if not exists public.votes (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  target_id uuid not null,
  target_type text not null check (target_type in ('doubt', 'answer')),
  value integer not null check (value in (1, -1)),
  created_at timestamptz not null default now(),
  unique(user_id, target_id, target_type)
);

create index if not exists votes_target_idx on public.votes(target_id, target_type);

-- ============================================================
-- REPORTS
-- ============================================================
create table if not exists public.reports (
  id uuid default uuid_generate_v4() primary key,
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  target_id uuid not null,
  target_type text not null check (target_type in ('doubt', 'answer', 'comment')),
  reason text not null check (reason in ('spam', 'harassment', 'inappropriate', 'misleading', 'duplicate', 'other')),
  details text,
  status text not null default 'pending' check (status in ('pending', 'resolved', 'dismissed')),
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists reports_status_idx on public.reports(status);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
create table if not exists public.notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  title text not null,
  message text not null,
  link text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_idx on public.notifications(user_id, is_read);

-- ============================================================
-- ADMIN ACTIONS LOG
-- ============================================================
create table if not exists public.admin_actions (
  id uuid default uuid_generate_v4() primary key,
  admin_id uuid not null references public.profiles(id) on delete cascade,
  action text not null,
  target_type text not null,
  target_id text not null,
  reason text,
  created_at timestamptz not null default now()
);

create index if not exists admin_actions_admin_idx on public.admin_actions(admin_id);
create index if not exists admin_actions_created_idx on public.admin_actions(created_at desc);

-- ============================================================
-- ACTIVITY LOGS (platform-wide student audit / event trail)
-- ============================================================
create table if not exists public.activity_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  action text not null,
  target_type text not null,
  target_id text not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists activity_logs_user_idx on public.activity_logs(user_id);
create index if not exists activity_logs_created_idx on public.activity_logs(created_at desc);

-- ============================================================
-- VIEWS (for easy querying)
-- ============================================================

-- Doubt vote counts
create or replace view public.doubt_vote_counts as
  select target_id as doubt_id, coalesce(sum(value), 0) as vote_count
  from public.votes where target_type = 'doubt' group by target_id;

-- Answer vote counts
create or replace view public.answer_vote_counts as
  select target_id as answer_id, coalesce(sum(value), 0) as vote_count
  from public.votes where target_type = 'answer' group by target_id;

-- Answer counts per doubt
create or replace view public.doubt_answer_counts as
  select doubt_id, count(*) as answer_count
  from public.answers group by doubt_id;

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-update updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create or replace trigger doubts_updated_at
  before update on public.doubts
  for each row execute function public.handle_updated_at();

create or replace trigger answers_updated_at
  before update on public.answers
  for each row execute function public.handle_updated_at();

create or replace trigger comments_updated_at
  before update on public.comments
  for each row execute function public.handle_updated_at();

create or replace trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, username, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Increment doubt views
create or replace function public.increment_doubt_views(doubt_id uuid)
returns void as $$
  update public.doubts set views = views + 1 where id = doubt_id;
$$ language sql security definer;

-- Update reputation when answer is accepted
create or replace function public.handle_answer_accepted()
returns trigger as $$
begin
  if new.is_accepted = true and old.is_accepted = false then
    update public.profiles set reputation = reputation + 15
    where id = new.author_id;
    -- Notify answerer
    insert into public.notifications (user_id, type, title, message, link)
    values (
      new.author_id,
      'answer_accepted',
      'Your answer was accepted!',
      'Congratulations! Your answer has been marked as accepted.',
      '/doubt/' || new.doubt_id
    );
  end if;
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_answer_accepted
  after update on public.answers
  for each row execute function public.handle_answer_accepted();

-- Notify doubt author when new answer posted
create or replace function public.handle_new_answer()
returns trigger as $$
declare
  doubt_author uuid;
  doubt_title text;
begin
  select author_id, title into doubt_author, doubt_title
  from public.doubts where id = new.doubt_id;

  if doubt_author != new.author_id then
    insert into public.notifications (user_id, type, title, message, link)
    values (
      doubt_author,
      'new_answer',
      'New answer on your doubt',
      'Someone answered your doubt: ' || doubt_title,
      '/doubt/' || new.doubt_id
    );
  end if;

  -- Give answerer reputation
  update public.profiles set reputation = reputation + 5
  where id = new.author_id;

  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_new_answer
  after insert on public.answers
  for each row execute function public.handle_new_answer();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.profiles enable row level security;
alter table public.doubts enable row level security;
alter table public.answers enable row level security;
alter table public.comments enable row level security;
alter table public.attachments enable row level security;
alter table public.bookmarks enable row level security;
alter table public.votes enable row level security;
alter table public.reports enable row level security;
alter table public.notifications enable row level security;
alter table public.admin_actions enable row level security;
alter table public.activity_logs enable row level security;
alter table public.subjects enable row level security;

-- Helper function: check if current user is admin
create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$ language sql security definer stable;

-- Helper function: check if user is suspended
create or replace function public.is_suspended()
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and is_suspended = true
  );
$$ language sql security definer stable;

-- ---- PROFILES ----
create policy "profiles_select_all" on public.profiles
  for select using (true);

create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id)
  with check (
    auth.uid() = id
    and role = (select role from public.profiles where id = auth.uid()) -- cannot self-promote
  );

create policy "profiles_update_admin" on public.profiles
  for update using (public.is_admin());

create policy "profiles_delete_admin" on public.profiles
  for delete using (public.is_admin());

-- ---- SUBJECTS ----
create policy "subjects_select_all" on public.subjects for select using (true);
create policy "subjects_manage_admin" on public.subjects
  for all using (public.is_admin());

-- ---- DOUBTS ----
create policy "doubts_select_all" on public.doubts for select using (true);

create policy "doubts_insert_auth" on public.doubts
  for insert with check (
    auth.uid() is not null
    and auth.uid() = author_id
    and not public.is_suspended()
  );

create policy "doubts_update_own" on public.doubts
  for update using (auth.uid() = author_id and not public.is_suspended());

create policy "doubts_update_admin" on public.doubts
  for update using (public.is_admin());

create policy "doubts_delete_own" on public.doubts
  for delete using (auth.uid() = author_id);

create policy "doubts_delete_admin" on public.doubts
  for delete using (public.is_admin());

-- ---- ANSWERS ----
create policy "answers_select_all" on public.answers for select using (true);

create policy "answers_insert_auth" on public.answers
  for insert with check (
    auth.uid() is not null
    and auth.uid() = author_id
    and not public.is_suspended()
  );

create policy "answers_update_own" on public.answers
  for update using (auth.uid() = author_id and not public.is_suspended());

create policy "answers_update_doubt_author" on public.answers
  for update using (
    exists (select 1 from public.doubts where id = answers.doubt_id and author_id = auth.uid())
  );

create policy "answers_delete_own" on public.answers
  for delete using (auth.uid() = author_id);

create policy "answers_delete_admin" on public.answers
  for delete using (public.is_admin());

-- ---- COMMENTS ----
create policy "comments_select_all" on public.comments for select using (true);

create policy "comments_insert_auth" on public.comments
  for insert with check (
    auth.uid() is not null
    and auth.uid() = author_id
    and not public.is_suspended()
  );

create policy "comments_delete_own" on public.comments
  for delete using (auth.uid() = author_id);

create policy "comments_delete_admin" on public.comments
  for delete using (public.is_admin());

-- ---- ATTACHMENTS ----
create policy "attachments_select_all" on public.attachments for select using (true);

create policy "attachments_insert_auth" on public.attachments
  for insert with check (auth.uid() = uploaded_by and not public.is_suspended());

create policy "attachments_delete_own" on public.attachments
  for delete using (auth.uid() = uploaded_by);

create policy "attachments_delete_admin" on public.attachments
  for delete using (public.is_admin());

-- ---- BOOKMARKS ----
create policy "bookmarks_own" on public.bookmarks
  for all using (auth.uid() = user_id);

-- ---- VOTES ----
create policy "votes_select_all" on public.votes for select using (true);

create policy "votes_own" on public.votes
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id and not public.is_suspended());

-- ---- REPORTS ----
create policy "reports_insert_auth" on public.reports
  for insert with check (auth.uid() = reporter_id and not public.is_suspended());

create policy "reports_select_own" on public.reports
  for select using (auth.uid() = reporter_id or public.is_admin());

create policy "reports_update_admin" on public.reports
  for update using (public.is_admin());

-- ---- NOTIFICATIONS ----
create policy "notifications_own" on public.notifications
  for all using (auth.uid() = user_id);

-- ---- ADMIN ACTIONS ----
create policy "admin_actions_admin_only" on public.admin_actions
  for all using (public.is_admin());

-- ---- ACTIVITY LOGS ----
create policy "activity_logs_insert_auth" on public.activity_logs
  for insert with check (auth.uid() = user_id and not public.is_suspended());

create policy "activity_logs_select_own_or_admin" on public.activity_logs
  for select using (auth.uid() = user_id or public.is_admin());

-- ============================================================
-- STORAGE BUCKETS
-- Setup via Supabase Dashboard or CLI:
-- 1. Create bucket: "attachments" (private, 10MB limit)
-- 2. Allow authenticated uploads
-- 3. Allow public read for attachment URLs (use signed URLs)
-- ============================================================

-- ============================================================
-- TO MAKE YOUR ACCOUNT ADMIN:
-- Run this after signing up with your email:
--
-- update public.profiles
-- set role = 'admin'
-- where email = 'YOUR_EMAIL_HERE';
--
-- ============================================================
