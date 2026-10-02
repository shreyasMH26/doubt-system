-- ==============================================================================
-- DoubtHub — Complete Supabase PostgreSQL Schema
-- Idempotent, safe execution order for the Supabase SQL Editor
-- ==============================================================================

-- ==============================================================================
-- 1. EXTENSIONS
-- ==============================================================================
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";

-- ==============================================================================
-- 2. BASE TABLES (in strict dependency order)
-- ==============================================================================

-- PROFILES (extends auth.users)
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

-- SUBJECTS
create table if not exists public.subjects (
  id uuid default uuid_generate_v4() primary key,
  name text not null unique,
  slug text not null unique,
  description text,
  icon text,
  created_at timestamptz not null default now()
);

-- DOUBTS
create table if not exists public.doubts (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text not null,
  subject text not null,
  subject_id uuid references public.subjects(id) on delete set null,
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

-- ANSWERS
create table if not exists public.answers (
  id uuid default uuid_generate_v4() primary key,
  doubt_id uuid not null references public.doubts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  is_accepted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- COMMENTS
create table if not exists public.comments (
  id uuid default uuid_generate_v4() primary key,
  answer_id uuid not null references public.answers(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ATTACHMENTS
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

-- VOTES
create table if not exists public.votes (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  target_id uuid not null,
  target_type text not null check (target_type in ('doubt', 'answer')),
  value integer not null check (value in (1, -1)),
  created_at timestamptz not null default now(),
  unique(user_id, target_id, target_type)
);

-- BOOKMARKS
create table if not exists public.bookmarks (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  doubt_id uuid not null references public.doubts(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id, doubt_id)
);

-- REPORTS
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

-- NOTIFICATIONS
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

-- ADMIN ACTIONS LOG
create table if not exists public.admin_actions (
  id uuid default uuid_generate_v4() primary key,
  admin_id uuid not null references public.profiles(id) on delete cascade,
  action text not null,
  target_type text not null,
  target_id text not null,
  reason text,
  created_at timestamptz not null default now()
);

-- ACTIVITY LOGS (platform audit & event history)
create table if not exists public.activity_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  action text not null,
  target_type text not null,
  target_id text not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ==============================================================================
-- 3. SEED DEFAULT SUBJECTS (JIT, CSE, & Engineering Catalog)
-- ==============================================================================

-- Ensure unique constraints exist on subjects
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'subjects_name_key') then
    begin
      alter table public.subjects add constraint subjects_name_key unique (name);
    exception when others then null;
    end;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'subjects_slug_key') then
    begin
      alter table public.subjects add constraint subjects_slug_key unique (slug);
    exception when others then null;
    end;
  end if;
end $$;

insert into public.subjects (name, slug, description, icon) values
  -- CSE & ISE Core
  ('Data Structures & Algorithms', 'data-structures-algorithms', 'Arrays, Trees, Graphs, Sorting, Dynamic Programming', '💻'),
  ('Database Management Systems', 'database-management-systems', 'SQL, Normalization, Transactions, Indexing', '🗄️'),
  ('Operating Systems', 'operating-systems', 'Processes, Threads, Memory Management, CPU Scheduling', '🖥️'),
  ('Computer Networks', 'computer-networks', 'OSI Model, TCP/IP, Routing Protocols, Sockets', '🌐'),
  ('Object-Oriented Programming (Java/C++)', 'object-oriented-programming', 'Classes, Inheritance, Polymorphism, Design Patterns', '☕'),
  ('Design & Analysis of Algorithms', 'design-analysis-algorithms', 'Divide & Conquer, Greedy, DP, NP-Completeness', '⚡'),
  ('Theory of Computation & Automata', 'theory-of-computation', 'DFA, NFA, Regular Expressions, Turing Machines', '🔄'),
  ('Computer Organization & Architecture', 'computer-organization-architecture', 'Instruction Sets, Pipeline Hazards, Cache Memory', '🏗️'),
  ('Software Engineering & Agile', 'software-engineering', 'SDLC, Agile Scrum, System Design, Testing Methodologies', '📊'),
  ('Web Technologies & Full Stack', 'web-technologies', 'HTML, CSS, JavaScript, React, Node.js, REST APIs', '🌐'),
  ('Artificial Intelligence & Machine Learning', 'ai-machine-learning', 'Supervised Learning, Neural Networks, Deep Learning', '🤖'),
  ('Cloud Computing & DevOps', 'cloud-computing', 'AWS, GCP, Docker, Kubernetes, CI/CD Pipelines', '☁️'),
  ('Cyber Security & Cryptography', 'cyber-security', 'Network Security, RSA, AES, Authentication Protocols', '🔒'),
  ('System Software & Compilers', 'compilers-system-software', 'Lexical Analysis, Parsing, Syntax Directed Translation', '⚙️'),

  -- First Year / Common Engineering (VTU / JIT)
  ('Engineering Mathematics - I', 'engineering-math-1', 'Calculus, Linear Algebra, Matrix Diagonalization', '📐'),
  ('Engineering Mathematics - II', 'engineering-math-2', 'Differential Equations, Vector Calculus, Laplace Transforms', '📐'),
  ('Engineering Physics', 'engineering-physics', 'Quantum Mechanics, Lasers, Optical Fibers, Semiconductors', '⚛️'),
  ('Engineering Chemistry', 'engineering-chemistry', 'Electrochemistry, Battery Tech, Polymers, Water Tech', '🧪'),
  ('Problem Solving through C (CPS)', 'problem-solving-c', 'C Programming, Pointers, Structures, File Handling', '💻'),
  ('Basic Electrical Engineering', 'basic-electrical', 'DC/AC Circuits, Transformers, Single & 3-Phase Motors', '⚡'),
  ('Basic Electronics Engineering', 'basic-electronics', 'Diodes, BJTs, Op-Amps, Digital Logic, Number Systems', '🔌'),
  ('Elements of Mechanical Engineering', 'mechanical-basics', 'Thermodynamics, Turbines, Refrigeration, Lathe, Milling', '⚙️'),
  ('Elements of Civil Engineering', 'civil-basics', 'Statics, Coplanar Forces, Surveying, Friction', '🏗️'),
  ('Technical English & Communication', 'technical-english', 'Technical Writing, Business Correspondence, Presentation', '📝'),
  ('Environmental Studies & Ethics', 'environmental-studies', 'Ecology, Pollution Control, Sustainable Engineering', '🌱'),

  -- Core Disciplines (ECE / EEE / MECH / CIVIL)
  ('Signals & Systems', 'signals-systems', 'Continuous & Discrete Signals, Fourier Analysis, Z-Transform', '📡'),
  ('Digital Electronics & Microcontrollers', 'digital-electronics', 'Combinational Logic, Flip-Flops, 8051 & ARM Architecture', '🔌'),
  ('Control Systems', 'control-systems', 'Transfer Functions, Root Locus, Nyquist & Bode Stability', '🎛️'),
  ('VLSI Design & Embedded Systems', 'vlsi-embedded-systems', 'CMOS Inverters, FPGA, Verilog HDL, Embedded C', '🔬'),
  ('Thermodynamics & Heat Transfer', 'thermodynamics-heat-transfer', '1st & 2nd Laws, Rankine Cycle, Heat Exchangers', '🔥'),
  ('Strength of Materials & Structures', 'strength-of-materials', 'Stress, Strain, SFD/BMD, Torsion, Column Deflection', '🏛️'),

  -- General Academic
  ('Aptitude & Placement Prep', 'aptitude-placement-prep', 'Quantitative Aptitude, Logical Reasoning, Coding Rounds', '🎯'),
  ('Projects & Academic Doubts', 'projects-academic-doubts', 'Capstone Projects, Mini Projects, General Academic Doubts', '📚'),
  ('Mathematics', 'mathematics', 'Calculus, Algebra, Discrete Math', '📐'),
  ('Computer Science', 'computer-science', 'DSA, OS, DBMS, Networks', '💻'),
  ('Electronics', 'electronics', 'Circuits, Signals, Digital Systems', '🔌'),
  ('Electrical', 'electrical', 'Machines, Power Systems, Control', '⚡'),
  ('Mechanical', 'mechanical', 'Thermodynamics, Fluid Mechanics, Manufacturing', '⚙️'),
  ('Civil', 'civil', 'Structures, Geotechnics, Transportation', '🏗️'),
  ('General', 'general', 'General academic doubts', '📚')
on conflict (name) do update set
  slug = excluded.slug,
  description = excluded.description,
  icon = excluded.icon;

-- ==============================================================================
-- 4. INDEXES
-- ==============================================================================
create index if not exists doubts_search_idx on public.doubts
  using gin(to_tsvector('english', title || ' ' || description));
create index if not exists doubts_subject_idx on public.doubts(subject);
create index if not exists doubts_subject_id_idx on public.doubts(subject_id);
create index if not exists doubts_branch_idx on public.doubts(branch);
create index if not exists doubts_semester_idx on public.doubts(semester);
create index if not exists doubts_status_idx on public.doubts(status);
create index if not exists doubts_author_idx on public.doubts(author_id);
create index if not exists doubts_created_at_idx on public.doubts(created_at desc);
create index if not exists doubts_pinned_idx on public.doubts(is_pinned);

create index if not exists answers_doubt_idx on public.answers(doubt_id);
create index if not exists answers_author_idx on public.answers(author_id);

create index if not exists comments_answer_idx on public.comments(answer_id);

create index if not exists votes_target_idx on public.votes(target_id, target_type);
create index if not exists bookmarks_user_idx on public.bookmarks(user_id);
create index if not exists reports_status_idx on public.reports(status);
create index if not exists notifications_user_idx on public.notifications(user_id, is_read);
create index if not exists admin_actions_admin_idx on public.admin_actions(admin_id);
create index if not exists admin_actions_created_idx on public.admin_actions(created_at desc);
create index if not exists activity_logs_user_idx on public.activity_logs(user_id);
create index if not exists activity_logs_created_idx on public.activity_logs(created_at desc);

-- ==============================================================================
-- 5. VIEWS (created after doubts, answers, and votes exist)
-- ==============================================================================

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

-- ==============================================================================
-- 6. FUNCTIONS & TRIGGERS
-- ==============================================================================

-- Auto-update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists doubts_updated_at on public.doubts;
create trigger doubts_updated_at
  before update on public.doubts
  for each row execute function public.handle_updated_at();

drop trigger if exists answers_updated_at on public.answers;
create trigger answers_updated_at
  before update on public.answers
  for each row execute function public.handle_updated_at();

drop trigger if exists comments_updated_at on public.comments;
create trigger comments_updated_at
  before update on public.comments
  for each row execute function public.handle_updated_at();

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

-- Protect sensitive profile fields on update
create or replace function public.protect_profile_fields()
returns trigger as $$
begin
  if not public.is_admin() then
    -- Regular users cannot alter role, reputation, or suspension status
    new.role := old.role;
    new.reputation := old.reputation;
    new.is_suspended := old.is_suspended;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists protect_profile_fields_trigger on public.profiles;
create trigger protect_profile_fields_trigger
  before update on public.profiles
  for each row execute function public.protect_profile_fields();

-- Protect sensitive profile fields on insert
create or replace function public.protect_profile_insert()
returns trigger as $$
begin
  if not public.is_admin() then
    new.role := coalesce(new.role, 'student');
    if new.role != 'student' then
      new.role := 'student';
    end if;
    new.reputation := coalesce(new.reputation, 0);
    new.is_suspended := false;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists protect_profile_insert_trigger on public.profiles;
create trigger protect_profile_insert_trigger
  before insert on public.profiles
  for each row execute function public.protect_profile_insert();

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
declare
  v_username text;
  v_full_name text;
  v_branch text;
  v_semester integer;
begin
  v_username := coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1));
  v_full_name := coalesce(new.raw_user_meta_data->>'full_name', v_username);
  v_branch := new.raw_user_meta_data->>'branch';
  
  begin
    v_semester := (new.raw_user_meta_data->>'semester')::integer;
  exception when others then
    v_semester := null;
  end;

  -- Ensure username uniqueness by suffixing ID characters if collided
  if exists (select 1 from public.profiles where username = v_username and id != new.id) then
    v_username := v_username || '_' || substr(replace(new.id::text, '-', ''), 1, 4);
  end if;

  insert into public.profiles (id, email, username, full_name, branch, semester)
  values (
    new.id,
    coalesce(new.email, ''),
    v_username,
    v_full_name,
    v_branch,
    v_semester
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(nullif(public.profiles.full_name, ''), excluded.full_name),
    username = coalesce(nullif(public.profiles.username, ''), excluded.username),
    branch = coalesce(public.profiles.branch, excluded.branch),
    semester = coalesce(public.profiles.semester, excluded.semester);
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
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

drop trigger if exists on_answer_accepted on public.answers;
create trigger on_answer_accepted
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

  update public.profiles set reputation = reputation + 5
  where id = new.author_id;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_new_answer on public.answers;
create trigger on_new_answer
  after insert on public.answers
  for each row execute function public.handle_new_answer();

-- ==============================================================================
-- 7. ROW LEVEL SECURITY (RLS)
-- ==============================================================================

alter table public.profiles enable row level security;
alter table public.subjects enable row level security;
alter table public.doubts enable row level security;
alter table public.answers enable row level security;
alter table public.comments enable row level security;
alter table public.attachments enable row level security;
alter table public.votes enable row level security;
alter table public.bookmarks enable row level security;
alter table public.reports enable row level security;
alter table public.notifications enable row level security;
alter table public.admin_actions enable row level security;
alter table public.activity_logs enable row level security;

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

-- ------------------------------------------------------------------------------
-- POLICIES (with idempotent DROP POLICY IF EXISTS)
-- ------------------------------------------------------------------------------

-- ---- PROFILES ----
drop policy if exists "profiles_select_all" on public.profiles;
create policy "profiles_select_all" on public.profiles
  for select using (true);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "profiles_update_admin" on public.profiles;
create policy "profiles_update_admin" on public.profiles
  for update using (public.is_admin());

drop policy if exists "profiles_delete_admin" on public.profiles;
create policy "profiles_delete_admin" on public.profiles
  for delete using (public.is_admin());

-- ---- SUBJECTS ----
drop policy if exists "subjects_select_all" on public.subjects;
create policy "subjects_select_all" on public.subjects
  for select using (true);

drop policy if exists "subjects_manage_admin" on public.subjects;
create policy "subjects_manage_admin" on public.subjects
  for all using (public.is_admin());

-- ---- DOUBTS ----
drop policy if exists "doubts_select_all" on public.doubts;
create policy "doubts_select_all" on public.doubts
  for select using (true);

drop policy if exists "doubts_insert_auth" on public.doubts;
create policy "doubts_insert_auth" on public.doubts
  for insert with check (
    auth.uid() is not null
    and auth.uid() = author_id
    and not public.is_suspended()
  );

drop policy if exists "doubts_update_own" on public.doubts;
create policy "doubts_update_own" on public.doubts
  for update using (auth.uid() = author_id and not public.is_suspended());

drop policy if exists "doubts_update_admin" on public.doubts;
create policy "doubts_update_admin" on public.doubts
  for update using (public.is_admin());

drop policy if exists "doubts_delete_own" on public.doubts;
create policy "doubts_delete_own" on public.doubts
  for delete using (auth.uid() = author_id);

drop policy if exists "doubts_delete_admin" on public.doubts;
create policy "doubts_delete_admin" on public.doubts
  for delete using (public.is_admin());

-- ---- ANSWERS ----
drop policy if exists "answers_select_all" on public.answers;
create policy "answers_select_all" on public.answers
  for select using (true);

drop policy if exists "answers_insert_auth" on public.answers;
create policy "answers_insert_auth" on public.answers
  for insert with check (
    auth.uid() is not null
    and auth.uid() = author_id
    and not public.is_suspended()
  );

drop policy if exists "answers_update_own" on public.answers;
create policy "answers_update_own" on public.answers
  for update using (auth.uid() = author_id and not public.is_suspended());

drop policy if exists "answers_update_doubt_author" on public.answers;
create policy "answers_update_doubt_author" on public.answers
  for update using (
    exists (select 1 from public.doubts where id = answers.doubt_id and author_id = auth.uid())
  );

drop policy if exists "answers_delete_own" on public.answers;
create policy "answers_delete_own" on public.answers
  for delete using (auth.uid() = author_id);

drop policy if exists "answers_delete_admin" on public.answers;
create policy "answers_delete_admin" on public.answers
  for delete using (public.is_admin());

-- ---- COMMENTS ----
drop policy if exists "comments_select_all" on public.comments;
create policy "comments_select_all" on public.comments
  for select using (true);

drop policy if exists "comments_insert_auth" on public.comments;
create policy "comments_insert_auth" on public.comments
  for insert with check (
    auth.uid() is not null
    and auth.uid() = author_id
    and not public.is_suspended()
  );

drop policy if exists "comments_delete_own" on public.comments;
create policy "comments_delete_own" on public.comments
  for delete using (auth.uid() = author_id);

drop policy if exists "comments_delete_admin" on public.comments;
create policy "comments_delete_admin" on public.comments
  for delete using (public.is_admin());

-- ---- ATTACHMENTS ----
drop policy if exists "attachments_select_all" on public.attachments;
create policy "attachments_select_all" on public.attachments
  for select using (true);

drop policy if exists "attachments_insert_auth" on public.attachments;
create policy "attachments_insert_auth" on public.attachments
  for insert with check (auth.uid() = uploaded_by and not public.is_suspended());

drop policy if exists "attachments_delete_own" on public.attachments;
create policy "attachments_delete_own" on public.attachments
  for delete using (auth.uid() = uploaded_by);

drop policy if exists "attachments_delete_admin" on public.attachments;
create policy "attachments_delete_admin" on public.attachments
  for delete using (public.is_admin());

-- ---- VOTES ----
drop policy if exists "votes_select_all" on public.votes;
create policy "votes_select_all" on public.votes
  for select using (true);

drop policy if exists "votes_own" on public.votes;
create policy "votes_own" on public.votes
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id and not public.is_suspended());

-- ---- BOOKMARKS ----
drop policy if exists "bookmarks_own" on public.bookmarks;
create policy "bookmarks_own" on public.bookmarks
  for all using (auth.uid() = user_id);

-- ---- REPORTS ----
drop policy if exists "reports_insert_auth" on public.reports;
create policy "reports_insert_auth" on public.reports
  for insert with check (auth.uid() = reporter_id and not public.is_suspended());

drop policy if exists "reports_select_own" on public.reports;
create policy "reports_select_own" on public.reports
  for select using (auth.uid() = reporter_id or public.is_admin());

drop policy if exists "reports_update_admin" on public.reports;
create policy "reports_update_admin" on public.reports
  for update using (public.is_admin());

-- ---- NOTIFICATIONS ----
drop policy if exists "notifications_own" on public.notifications;
create policy "notifications_own" on public.notifications
  for all using (auth.uid() = user_id);

-- ---- ADMIN ACTIONS ----
drop policy if exists "admin_actions_admin_only" on public.admin_actions;
create policy "admin_actions_admin_only" on public.admin_actions
  for all using (public.is_admin());

-- ---- ACTIVITY LOGS ----
drop policy if exists "activity_logs_insert_auth" on public.activity_logs;
create policy "activity_logs_insert_auth" on public.activity_logs
  for insert with check (auth.uid() = user_id and not public.is_suspended());

drop policy if exists "activity_logs_select_own_or_admin" on public.activity_logs;
create policy "activity_logs_select_own_or_admin" on public.activity_logs
  for select using (auth.uid() = user_id or public.is_admin());

-- ==============================================================================
-- 8. STORAGE BUCKET CONFIGURATION (Execute in Supabase Storage or SQL)
-- ==============================================================================
-- 1. Create bucket: "attachments" (public or authenticated)
-- 2. Allow authenticated users to upload and manage their own attachments
insert into storage.buckets (id, name, public)
values ('attachments', 'attachments', true)
on conflict (id) do nothing;

drop policy if exists "attachments_public_read" on storage.objects;
create policy "attachments_public_read" on storage.objects
  for select using (bucket_id = 'attachments');

drop policy if exists "attachments_auth_upload" on storage.objects;
create policy "attachments_auth_upload" on storage.objects
  for insert with check (
    bucket_id = 'attachments'
    and auth.uid() is not null
  );

drop policy if exists "attachments_auth_delete_own" on storage.objects;
create policy "attachments_auth_delete_own" on storage.objects
  for delete using (
    bucket_id = 'attachments'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- ==============================================================================
-- 9. BACKFILL EXISTING USERS
-- ==============================================================================
-- Creates profile rows for any auth.users that were registered before the trigger was created
insert into public.profiles (id, email, username, full_name, branch, semester)
select
  u.id,
  coalesce(u.email, ''),
  case
    when exists (select 1 from public.profiles p where p.username = coalesce(u.raw_user_meta_data->>'username', split_part(u.email, '@', 1)))
    then coalesce(u.raw_user_meta_data->>'username', split_part(u.email, '@', 1)) || '_' || substr(replace(u.id::text, '-', ''), 1, 4)
    else coalesce(u.raw_user_meta_data->>'username', split_part(u.email, '@', 1))
  end as username,
  coalesce(u.raw_user_meta_data->>'full_name', coalesce(u.raw_user_meta_data->>'username', split_part(u.email, '@', 1))) as full_name,
  u.raw_user_meta_data->>'branch' as branch,
  case
    when (u.raw_user_meta_data->>'semester') ~ '^[0-9]+$' then (u.raw_user_meta_data->>'semester')::integer
    else null
  end as semester
from auth.users u
where u.id not in (select id from public.profiles)
on conflict (id) do nothing;

-- ==============================================================================
-- 10. ADMIN ACCOUNT PROMOTION INSTRUCTIONS
-- ==============================================================================
-- After creating your student account, promote it to administrator by executing:
--
-- UPDATE public.profiles
-- SET role = 'admin'
-- WHERE email = 'YOUR_EMAIL@EXAMPLE.COM';
-- ==============================================================================
