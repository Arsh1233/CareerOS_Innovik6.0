-- CareerOS resume intelligence schema
--
-- Phase 05 (Resume ingestion, extraction and analysis). Stores the uploaded
-- resume's metadata, the text extracted from the file, and the deterministic
-- analysis computed from that text.
--
-- Apply with:  supabase db push   (or paste into the Supabase SQL editor)
--
-- Notes:
--   * `extracted_text` and `analysis` are derived, not authoritative: they can
--     always be recomputed from the stored file. They are kept so downstream
--     features (skill gap, roadmap) do not need to re-parse the PDF.
--   * A resume belongs to exactly one user and is readable/writable only by
--     that user (RLS below).

create table if not exists public.resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  filename text not null,
  mime_type text,
  size_bytes integer check (size_bytes is null or size_bytes >= 0),
  content_hash text not null,
  storage_path text,
  version integer not null default 1 check (version > 0),
  parse_status text not null default 'pending'
    check (parse_status in ('pending', 'parsed', 'failed')),
  analysis_status text not null default 'pending'
    check (analysis_status in ('pending', 'complete', 'failed')),
  extracted_text text,
  extracted_data jsonb not null default '{}'::jsonb,
  analysis jsonb,
  ats_score integer check (ats_score is null or ats_score between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists resumes_user_idx on public.resumes (user_id);
create index if not exists resumes_user_created_idx
  on public.resumes (user_id, created_at desc);

drop trigger if exists resumes_set_updated_at on public.resumes;
create trigger resumes_set_updated_at before update on public.resumes
  for each row execute function public.set_updated_at();

alter table public.resumes enable row level security;

drop policy if exists resumes_select_own on public.resumes;
create policy resumes_select_own on public.resumes
  for select to authenticated using (user_id = auth.uid());

drop policy if exists resumes_insert_own on public.resumes;
create policy resumes_insert_own on public.resumes
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists resumes_update_own on public.resumes;
create policy resumes_update_own on public.resumes
  for update to authenticated using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists resumes_delete_own on public.resumes;
create policy resumes_delete_own on public.resumes
  for delete to authenticated using (user_id = auth.uid());

grant select, insert, update, delete on public.resumes to authenticated;
