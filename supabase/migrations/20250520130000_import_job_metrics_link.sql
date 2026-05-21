-- Tie metric rows to the import job that wrote them (cascade on job delete)
alter table public.post_metrics_daily
  add column if not exists import_job_id uuid references public.import_jobs (id) on delete cascade;

create index if not exists post_metrics_daily_import_job_idx
  on public.post_metrics_daily (import_job_id)
  where import_job_id is not null;

create policy "import_jobs_delete_own" on public.import_jobs
  for delete using (auth.uid() = user_id);
