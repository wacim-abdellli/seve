-- Required table: resumes
-- The application upserts rows with { id, user_id, title, resume_data, updated_at }
-- Run this in the Supabase SQL editor to set up RLS.

create table if not exists public.resumes (
  id            text primary key,
  user_id       uuid not null references auth.users(id) on delete cascade,
  title         text not null default 'Untitled Resume',
  resume_data   jsonb not null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Enable RLS
alter table public.resumes enable row level security;

-- Users can only read their own resumes
create policy "Users can read own resumes"
  on public.resumes for select
  using (auth.uid() = user_id);

-- Users can only insert their own resumes
create policy "Users can insert own resumes"
  on public.resumes for insert
  with check (auth.uid() = user_id);

-- Users can only update their own resumes
create policy "Users can update own resumes"
  on public.resumes for update
  using (auth.uid() = user_id);

-- Users can only delete their own resumes
create policy "Users can delete own resumes"
  on public.resumes for delete
  using (auth.uid() = user_id);

-- Index for faster user-scoped queries
create index if not exists idx_resumes_user_id on public.resumes(user_id);
