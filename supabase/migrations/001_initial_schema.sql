-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table (extends auth.users)
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text unique not null,
  full_name text,
  avatar_url text,
  plan text not null default 'free' check (plan in ('free', 'pro')),
  polar_customer_id text,
  polar_subscription_id text,
  daily_transcription_count int not null default 0,
  daily_reset_at date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Folders table
create table if not exists public.folders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  created_at timestamptz not null default now()
);

-- Transcriptions table
create table if not exists public.transcriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  folder_id uuid references public.folders(id) on delete set null,
  title text not null,
  original_filename text not null,
  audio_storage_path text,
  full_text text,
  segments jsonb,
  language text not null default 'en',
  duration_seconds int,
  word_count int not null default 0,
  status text not null default 'pending' check (status in ('pending', 'processing', 'completed', 'failed')),
  error_message text,
  summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.folders enable row level security;
alter table public.transcriptions enable row level security;

-- Profiles policies
create policy "Users can view their own profile"
  on public.profiles for select using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update using (auth.uid() = id);

-- Folders policies
create policy "Users can manage their own folders"
  on public.folders for all using (auth.uid() = user_id);

-- Transcriptions policies
create policy "Users can manage their own transcriptions"
  on public.transcriptions for all using (auth.uid() = user_id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Reset daily count function
create or replace function public.reset_daily_count_if_needed(user_id uuid)
returns void as $$
begin
  update public.profiles
  set
    daily_transcription_count = 0,
    daily_reset_at = current_date
  where id = user_id and daily_reset_at < current_date;
end;
$$ language plpgsql security definer;

-- Storage bucket setup (run this separately in Supabase dashboard):
-- insert into storage.buckets (id, name, public) values ('audio-files', 'audio-files', false);

-- Indexes
create index if not exists transcriptions_user_id_idx on public.transcriptions(user_id);
create index if not exists transcriptions_status_idx on public.transcriptions(status);
create index if not exists transcriptions_created_at_idx on public.transcriptions(created_at desc);
create index if not exists folders_user_id_idx on public.folders(user_id);

-- Full-text search
alter table public.transcriptions
  add column if not exists fts tsvector
  generated always as (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(full_text, ''))) stored;

create index if not exists transcriptions_fts_idx on public.transcriptions using gin(fts);
