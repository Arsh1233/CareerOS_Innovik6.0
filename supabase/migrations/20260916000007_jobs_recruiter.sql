-- Phase 09: Jobs & Job Applications
-- Allows recruiters to post jobs and students to apply for them.

begin;

-- ── jobs ─────────────────────────────────────────────────────────────────

create table if not exists public.jobs (
  id                          uuid primary key default gen_random_uuid(),
  recruiter_id                uuid not null references auth.users(id) on delete cascade,
  
  -- Job details
  company_name                text not null,
  title                       text not null,
  department                  text,
  location                    text not null,
  salary_range                text,
  employment_type             text not null default 'Full-time',
  description                 text,
  required_skills             jsonb not null default '[]'::jsonb,
  
  -- Lifecycle
  status                      text not null default 'active'
                                check (status in ('active', 'paused', 'closed')),
  deadline                    timestamptz,

  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

-- Fast lookups by recruiter
create index if not exists idx_jobs_recruiter_id on public.jobs (recruiter_id);

-- Auto-update updated_at for jobs
create or replace function public.set_jobs_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_jobs_updated_at on public.jobs;
create trigger trg_jobs_updated_at
  before update on public.jobs
  for each row execute function public.set_jobs_updated_at();

-- ── job_applications ─────────────────────────────────────────────────────

create table if not exists public.job_applications (
  id                          uuid primary key default gen_random_uuid(),
  job_id                      uuid not null references public.jobs(id) on delete cascade,
  student_id                  uuid not null references auth.users(id) on delete cascade,
  
  -- Application state
  status                      text not null default 'new'
                                check (status in ('new', 'reviewing', 'shortlisted', 'interviewed', 'offered', 'rejected')),
  
  -- Match details computed at application time
  match_score                 integer check (match_score >= 0 and match_score <= 100),
  matching_skills             jsonb,
  missing_skills              jsonb,

  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now(),
  
  -- A student can only apply once to a specific job
  unique(job_id, student_id)
);

-- Fast lookups
create index if not exists idx_job_applications_job_id on public.job_applications (job_id);
create index if not exists idx_job_applications_student_id on public.job_applications (student_id);

-- Auto-update updated_at for applications
create or replace function public.set_job_applications_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_job_applications_updated_at on public.job_applications;
create trigger trg_job_applications_updated_at
  before update on public.job_applications
  for each row execute function public.set_job_applications_updated_at();

-- ── Row Level Security ───────────────────────────────────────────────────

alter table public.jobs enable row level security;
alter table public.job_applications enable row level security;

-- Jobs RLS
-- Students (and everyone) can read active jobs
DROP POLICY IF EXISTS "jobs: anyone can read active jobs" ON public.jobs;
create policy "jobs: anyone can read active jobs"
  on public.jobs for select
  using (status = 'active');

-- Recruiters can read their own jobs regardless of status
DROP POLICY IF EXISTS "jobs: recruiter can read own jobs" ON public.jobs;
create policy "jobs: recruiter can read own jobs"
  on public.jobs for select
  using (auth.uid() = recruiter_id);

-- Recruiters can insert/update their own jobs
DROP POLICY IF EXISTS "jobs: recruiter can insert" ON public.jobs;
create policy "jobs: recruiter can insert"
  on public.jobs for insert
  with check (auth.uid() = recruiter_id);

DROP POLICY IF EXISTS "jobs: recruiter can update" ON public.jobs;
create policy "jobs: recruiter can update"
  on public.jobs for update
  using (auth.uid() = recruiter_id);

-- Job Applications RLS
-- Students can read their own applications
DROP POLICY IF EXISTS "job_applications: student can read own applications" ON public.job_applications;
create policy "job_applications: student can read own applications"
  on public.job_applications for select
  using (auth.uid() = student_id);

-- Students can insert their own applications
DROP POLICY IF EXISTS "job_applications: student can insert" ON public.job_applications;
create policy "job_applications: student can insert"
  on public.job_applications for insert
  with check (auth.uid() = student_id);

-- Recruiters can read applications for their own jobs
DROP POLICY IF EXISTS "job_applications: recruiter can read applications for own jobs" ON public.job_applications;
create policy "job_applications: recruiter can read applications for own jobs"
  on public.job_applications for select
  using (
    exists (
      select 1 from public.jobs
      where jobs.id = job_applications.job_id
      and jobs.recruiter_id = auth.uid()
    )
  );

-- Recruiters can update applications for their own jobs (e.g. changing status)
DROP POLICY IF EXISTS "job_applications: recruiter can update applications for own jobs" ON public.job_applications;
create policy "job_applications: recruiter can update applications for own jobs"
  on public.job_applications for update
  using (
    exists (
      select 1 from public.jobs
      where jobs.id = job_applications.job_id
      and jobs.recruiter_id = auth.uid()
    )
  );

commit;
