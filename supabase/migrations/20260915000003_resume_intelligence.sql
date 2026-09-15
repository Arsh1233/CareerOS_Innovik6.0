-- CareerOS Phase 05: Resume Intelligence
-- Tables: resumes, skills, skill_evidence
-- Follows the same guard pattern as 20260915000001_core_identity.sql.

-- ── resumes ───────────────────────────────────────────────────────────────

create table if not exists public.resumes (
    id                  uuid primary key default gen_random_uuid(),
    user_id             uuid not null references auth.users(id) on delete cascade,
    storage_path        text not null,
    original_filename   text not null,
    mime_type           text not null default 'application/pdf',
    file_size_bytes     bigint not null default 0,
    content_hash        text not null,          -- SHA-256 hex of PDF bytes
    version             integer not null default 1,
    -- pipeline state flags (independent — one can fail without rolling back others)
    parse_status        text not null default 'pending'
                            check (parse_status in ('pending','ok','failed','insufficient_text')),
    analysis_status     text not null default 'pending'
                            check (analysis_status in ('pending','ok','failed')),
    embedding_status    text not null default 'pending'
                            check (embedding_status in ('pending','ok','failed')),
    -- content (nullable — privacy decision: stored for reanalysis but not indexed)
    extracted_text      text,
    extracted_data      jsonb not null default '{}',  -- structured parse metadata
    analysis            jsonb not null default '{}',  -- full Groq structured output
    -- quality score (deterministic v1 rubric — NOT an employer ATS prediction)
    resume_quality_score integer,
    score_version        text,
    score_breakdown      jsonb not null default '{}',
    -- provenance
    model_provider      text,
    model_name          text,
    prompt_version      text,
    -- soft-delete: archived resumes are hidden from UI but preserved for evidence
    is_archived         boolean not null default false,
    created_at          timestamptz not null default now(),
    updated_at          timestamptz not null default now()
);

comment on table public.resumes is
    'Student resume upload records with pipeline status and AI analysis.';
comment on column public.resumes.content_hash is
    'SHA-256 hex of the raw PDF bytes — used for duplicate detection and versioning.';
comment on column public.resumes.resume_quality_score is
    'CareerOS deterministic resume quality score (0-100). Not an employer ATS prediction.';

-- Indexes
create index if not exists idx_resumes_user_id
    on public.resumes (user_id);

create index if not exists idx_resumes_user_latest
    on public.resumes (user_id, created_at desc);

create index if not exists idx_resumes_user_hash
    on public.resumes (user_id, content_hash);

-- RLS
alter table public.resumes enable row level security;

drop policy if exists "resumes_select_own" on public.resumes;
create policy "resumes_select_own"
    on public.resumes for select to authenticated
    using (auth.uid() = user_id);

drop policy if exists "resumes_insert_own" on public.resumes;
create policy "resumes_insert_own"
    on public.resumes for insert to authenticated
    with check (auth.uid() = user_id);

drop policy if exists "resumes_update_own" on public.resumes;
create policy "resumes_update_own"
    on public.resumes for update to authenticated
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

drop policy if exists "resumes_service_role_all" on public.resumes;
create policy "resumes_service_role_all"
    on public.resumes for all to service_role
    using (true) with check (true);

grant select, insert, update on public.resumes to authenticated;

-- Trigger
create or replace function public.handle_resume_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

drop trigger if exists resumes_updated_at on public.resumes;
create trigger resumes_updated_at
    before update on public.resumes
    for each row execute function public.handle_resume_updated_at();

-- ── skills ────────────────────────────────────────────────────────────────

create table if not exists public.skills (
    id                  uuid primary key default gen_random_uuid(),
    user_id             uuid not null references auth.users(id) on delete cascade,
    normalized_skill_key text not null,  -- lowercase normalised: "fastapi", "react"
    display_name        text not null,   -- human-readable: "FastAPI", "React"
    -- proficiency is nullable: a keyword mention does NOT prove proficiency level
    proficiency         text check (proficiency in ('beginner','intermediate','advanced',null)),
    source_summary      text,
    -- if manually verified by the user, do NOT overwrite on re-extraction
    verified            boolean not null default false,
    created_at          timestamptz not null default now(),
    updated_at          timestamptz not null default now(),
    unique (user_id, normalized_skill_key)
);

comment on table public.skills is
    'Normalized skill records per student. Evidence is in skill_evidence.';
comment on column public.skills.proficiency is
    'Nullable. Resume keyword mention alone does not prove proficiency level.';

create index if not exists idx_skills_user_id
    on public.skills (user_id);

create index if not exists idx_skills_user_key
    on public.skills (user_id, normalized_skill_key);

alter table public.skills enable row level security;

drop policy if exists "skills_select_own" on public.skills;
create policy "skills_select_own"
    on public.skills for select to authenticated
    using (auth.uid() = user_id);

drop policy if exists "skills_insert_own" on public.skills;
create policy "skills_insert_own"
    on public.skills for insert to authenticated
    with check (auth.uid() = user_id);

drop policy if exists "skills_update_own" on public.skills;
create policy "skills_update_own"
    on public.skills for update to authenticated
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

drop policy if exists "skills_service_role_all" on public.skills;
create policy "skills_service_role_all"
    on public.skills for all to service_role
    using (true) with check (true);

grant select, insert, update on public.skills to authenticated;

create or replace function public.handle_skill_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

drop trigger if exists skills_updated_at on public.skills;
create trigger skills_updated_at
    before update on public.skills
    for each row execute function public.handle_skill_updated_at();

-- ── skill_evidence ────────────────────────────────────────────────────────

create table if not exists public.skill_evidence (
    id              uuid primary key default gen_random_uuid(),
    user_id         uuid not null references auth.users(id) on delete cascade,
    skill_id        uuid not null references public.skills(id) on delete cascade,
    -- source_type: "resume" | "project" | "interview" | "certification" | "manual"
    source_type     text not null check (source_type in ('resume','project','interview','certification','manual')),
    source_id       text,       -- resume_id, project_id, etc. — nullable for manual
    evidence_text   text not null,
    created_at      timestamptz not null default now()
);

comment on table public.skill_evidence is
    'Provenance records linking skill mentions to their source (resume, project, interview).';

create index if not exists idx_skill_evidence_skill_id
    on public.skill_evidence (skill_id);

create index if not exists idx_skill_evidence_user_id
    on public.skill_evidence (user_id);

alter table public.skill_evidence enable row level security;

drop policy if exists "skill_evidence_select_own" on public.skill_evidence;
create policy "skill_evidence_select_own"
    on public.skill_evidence for select to authenticated
    using (auth.uid() = user_id);

drop policy if exists "skill_evidence_insert_own" on public.skill_evidence;
create policy "skill_evidence_insert_own"
    on public.skill_evidence for insert to authenticated
    with check (auth.uid() = user_id);

drop policy if exists "skill_evidence_service_role_all" on public.skill_evidence;
create policy "skill_evidence_service_role_all"
    on public.skill_evidence for all to service_role
    using (true) with check (true);

grant select, insert on public.skill_evidence to authenticated;
