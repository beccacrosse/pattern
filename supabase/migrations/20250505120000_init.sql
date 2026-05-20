-- Instagram analytics MVP schema
-- Run via Supabase SQL editor or `supabase db push`

create extension if not exists "pgcrypto";

-- Posts (Instagram media identifier lives in post_id text column per plan)
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  post_id text not null,
  media_type text,
  caption text,
  posted_at timestamptz,
  permalink text,
  created_at timestamptz not null default now(),
  unique (user_id, post_id)
);

create index if not exists posts_user_posted_at_idx on public.posts (user_id, posted_at desc);

create table if not exists public.post_metrics_daily (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  post_uuid uuid not null references public.posts (id) on delete cascade,
  metric_date date not null,
  impressions integer not null default 0,
  reach integer not null default 0,
  likes integer not null default 0,
  comments integer not null default 0,
  saves integer not null default 0,
  shares integer not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, post_uuid, metric_date)
);

create index if not exists post_metrics_daily_user_date_idx
  on public.post_metrics_daily (user_id, metric_date);

create table if not exists public.import_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  filename text,
  status text not null check (status in ('pending', 'processing', 'completed', 'failed')),
  row_count integer not null default 0,
  errors jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,
  engagement_denominator text not null default 'impressions_then_reach'
    check (engagement_denominator in ('impressions', 'reach', 'impressions_then_reach')),
  updated_at timestamptz not null default now()
);

create table if not exists public.instagram_integration (
  user_id uuid primary key references auth.users (id) on delete cascade,
  facebook_app_id text,
  instagram_business_account_id text,
  access_token_hint text,
  token_status text not null default 'not_configured',
  updated_at timestamptz not null default now()
);

create table if not exists public.sync_job_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  source text not null,
  status text not null,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.posts enable row level security;
alter table public.post_metrics_daily enable row level security;
alter table public.import_jobs enable row level security;
alter table public.user_preferences enable row level security;
alter table public.instagram_integration enable row level security;
alter table public.sync_job_logs enable row level security;

create policy "posts_select_own" on public.posts for select using (auth.uid() = user_id);
create policy "posts_insert_own" on public.posts for insert with check (auth.uid() = user_id);
create policy "posts_update_own" on public.posts for update using (auth.uid() = user_id);
create policy "posts_delete_own" on public.posts for delete using (auth.uid() = user_id);

create policy "metrics_select_own" on public.post_metrics_daily for select using (auth.uid() = user_id);
create policy "metrics_insert_own" on public.post_metrics_daily for insert with check (auth.uid() = user_id);
create policy "metrics_update_own" on public.post_metrics_daily for update using (auth.uid() = user_id);
create policy "metrics_delete_own" on public.post_metrics_daily for delete using (auth.uid() = user_id);

create policy "import_jobs_select_own" on public.import_jobs for select using (auth.uid() = user_id);
create policy "import_jobs_insert_own" on public.import_jobs for insert with check (auth.uid() = user_id);
create policy "import_jobs_update_own" on public.import_jobs for update using (auth.uid() = user_id);

create policy "prefs_select_own" on public.user_preferences for select using (auth.uid() = user_id);
create policy "prefs_insert_own" on public.user_preferences for insert with check (auth.uid() = user_id);
create policy "prefs_update_own" on public.user_preferences for update using (auth.uid() = user_id);

create policy "integration_select_own" on public.instagram_integration for select using (auth.uid() = user_id);
create policy "integration_insert_own" on public.instagram_integration for insert with check (auth.uid() = user_id);
create policy "integration_update_own" on public.instagram_integration for update using (auth.uid() = user_id);

create policy "sync_logs_select_own" on public.sync_job_logs for select using (auth.uid() = user_id);
create policy "sync_logs_insert_own" on public.sync_job_logs for insert with check (auth.uid() = user_id);

-- Default user_preferences are created from the app on first use (avoids auth trigger privileges).
