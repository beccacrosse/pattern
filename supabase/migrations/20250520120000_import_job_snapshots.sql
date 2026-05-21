-- Snapshot data so import jobs can be reviewed after upload
alter table public.import_jobs
  add column if not exists column_mapping jsonb,
  add column if not exists headers jsonb,
  add column if not exists preview_rows jsonb,
  add column if not exists posts_touched integer not null default 0;
