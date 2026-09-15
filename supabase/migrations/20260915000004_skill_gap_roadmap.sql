-- CareerOS Phase 06: Skill Gap Intelligence + Roadmap
-- Tables: role_required_skills, roadmaps, roadmap_milestones
-- Seed: a small clearly-labelled demo seed for common roles.
-- Follows the same guard pattern as prior migrations.

-- ── role_required_skills ───────────────────────────────────────────────────
-- Links a target role (by name) to required skills with importance and level.
-- Source of truth for gap analysis. Do NOT generate fake rows at runtime.

create table if not exists public.role_required_skills (
    id              uuid primary key default gen_random_uuid(),
    role_name       text not null,          -- normalised lowercase: "ai engineer"
    skill_name      text not null,          -- normalised lowercase: "python"
    display_name    text not null,          -- human-readable: "Python"
    importance      text not null default 'recommended'
                        check (importance in ('critical','recommended','optional')),
    minimum_level   text check (minimum_level in ('beginner','intermediate','advanced',null)),
    version         integer not null default 1,
    created_at      timestamptz not null default now(),
    unique (role_name, skill_name, version)
);

comment on table public.role_required_skills is
    'Required skills per target role. Populated by seed migrations, not runtime code.';

create index if not exists idx_role_required_skills_role
    on public.role_required_skills (role_name, version);

-- RLS: all authenticated users may read role requirements
alter table public.role_required_skills enable row level security;

drop policy if exists "role_required_skills_select_authenticated" on public.role_required_skills;
create policy "role_required_skills_select_authenticated"
    on public.role_required_skills for select to authenticated
    using (true);

drop policy if exists "role_required_skills_service_role_all" on public.role_required_skills;
create policy "role_required_skills_service_role_all"
    on public.role_required_skills for all to service_role
    using (true) with check (true);

grant select on public.role_required_skills to authenticated;

-- ── DEMO SEED (Phase 06 — clearly labelled, not runtime-generated) ─────────
-- A minimal set of skills for 3 common roles to make gap analysis useful
-- during demo without inventing data at request time.
-- Production: replace/extend via a separate migration.

insert into public.role_required_skills
  (role_name, skill_name, display_name, importance, minimum_level, version)
values
  -- AI Engineer
  ('ai engineer', 'python',              'Python',               'critical',     'intermediate', 1),
  ('ai engineer', 'machine learning',    'Machine Learning',     'critical',     'intermediate', 1),
  ('ai engineer', 'deep learning',       'Deep Learning',        'critical',     'beginner',     1),
  ('ai engineer', 'pytorch',             'PyTorch',              'critical',     'beginner',     1),
  ('ai engineer', 'tensorflow',          'TensorFlow',           'recommended',  'beginner',     1),
  ('ai engineer', 'mlops',               'MLOps',                'critical',     'beginner',     1),
  ('ai engineer', 'docker',              'Docker',               'recommended',  'beginner',     1),
  ('ai engineer', 'kubernetes',          'Kubernetes',           'optional',     null,           1),
  ('ai engineer', 'sql',                 'SQL',                  'recommended',  'intermediate', 1),
  ('ai engineer', 'data engineering',    'Data Engineering',     'recommended',  'beginner',     1),
  ('ai engineer', 'llm',                 'LLMs',                 'critical',     'beginner',     1),
  ('ai engineer', 'system design',       'System Design',        'recommended',  'beginner',     1),
  ('ai engineer', 'git',                 'Git',                  'recommended',  'intermediate', 1),
  ('ai engineer', 'fastapi',             'FastAPI',              'optional',     null,           1),
  ('ai engineer', 'aws',                 'AWS',                  'optional',     null,           1),
  -- Software Engineer
  ('software engineer', 'python',        'Python',               'recommended',  'intermediate', 1),
  ('software engineer', 'javascript',    'JavaScript',           'critical',     'intermediate', 1),
  ('software engineer', 'typescript',    'TypeScript',           'recommended',  'intermediate', 1),
  ('software engineer', 'react',         'React',                'recommended',  'intermediate', 1),
  ('software engineer', 'sql',           'SQL',                  'critical',     'intermediate', 1),
  ('software engineer', 'git',           'Git',                  'critical',     'intermediate', 1),
  ('software engineer', 'docker',        'Docker',               'recommended',  'beginner',     1),
  ('software engineer', 'system design', 'System Design',        'critical',     'intermediate', 1),
  ('software engineer', 'rest api',      'REST APIs',            'critical',     'intermediate', 1),
  ('software engineer', 'aws',           'AWS',                  'recommended',  'beginner',     1),
  -- Data Scientist
  ('data scientist', 'python',           'Python',               'critical',     'advanced',     1),
  ('data scientist', 'machine learning', 'Machine Learning',     'critical',     'intermediate', 1),
  ('data scientist', 'sql',              'SQL',                  'critical',     'intermediate', 1),
  ('data scientist', 'statistics',       'Statistics',           'critical',     'intermediate', 1),
  ('data scientist', 'data visualization','Data Visualization',  'critical',     'intermediate', 1),
  ('data scientist', 'pandas',           'Pandas',               'critical',     'intermediate', 1),
  ('data scientist', 'numpy',            'NumPy',                'critical',     'intermediate', 1),
  ('data scientist', 'deep learning',    'Deep Learning',        'recommended',  'beginner',     1),
  ('data scientist', 'git',              'Git',                  'recommended',  'intermediate', 1),
  ('data scientist', 'spark',            'Apache Spark',         'optional',     null,           1),
  ('data scientist', 'tableau',          'Tableau',              'optional',     null,           1)
on conflict (role_name, skill_name, version) do nothing;

-- ── roadmaps ───────────────────────────────────────────────────────────────

create table if not exists public.roadmaps (
    id                  uuid primary key default gen_random_uuid(),
    user_id             uuid not null references auth.users(id) on delete cascade,
    target_role         text not null,
    version             integer not null default 1,
    pace_hours_per_week integer not null default 10,
    plan                jsonb not null default '{}',   -- full Groq-generated structured plan
    status              text not null default 'active'
                            check (status in ('active','completed','archived','stale')),
    model_provider      text,
    model_name          text,
    prompt_version      text,
    created_at          timestamptz not null default now(),
    updated_at          timestamptz not null default now()
);

comment on table public.roadmaps is
    'AI-generated weekly learning roadmaps. Validated by Pydantic before persistence.';
comment on column public.roadmaps.plan is
    'Groq-generated weekly plan validated with Pydantic. Not a guarantee of employment outcomes.';

create index if not exists idx_roadmaps_user_id
    on public.roadmaps (user_id);
create index if not exists idx_roadmaps_user_latest
    on public.roadmaps (user_id, created_at desc);

alter table public.roadmaps enable row level security;

drop policy if exists "roadmaps_select_own" on public.roadmaps;
create policy "roadmaps_select_own"
    on public.roadmaps for select to authenticated
    using (auth.uid() = user_id);

drop policy if exists "roadmaps_insert_own" on public.roadmaps;
create policy "roadmaps_insert_own"
    on public.roadmaps for insert to authenticated
    with check (auth.uid() = user_id);

drop policy if exists "roadmaps_update_own" on public.roadmaps;
create policy "roadmaps_update_own"
    on public.roadmaps for update to authenticated
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

drop policy if exists "roadmaps_service_role_all" on public.roadmaps;
create policy "roadmaps_service_role_all"
    on public.roadmaps for all to service_role
    using (true) with check (true);

grant select, insert, update on public.roadmaps to authenticated;

create or replace function public.handle_roadmap_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

drop trigger if exists roadmaps_updated_at on public.roadmaps;
create trigger roadmaps_updated_at
    before update on public.roadmaps
    for each row execute function public.handle_roadmap_updated_at();

-- ── roadmap_milestones ─────────────────────────────────────────────────────

create table if not exists public.roadmap_milestones (
    id              uuid primary key default gen_random_uuid(),
    roadmap_id      uuid not null references public.roadmaps(id) on delete cascade,
    user_id         uuid not null references auth.users(id) on delete cascade,
    week_number     integer not null,
    title           text not null,
    description     text,
    status          text not null default 'pending'
                        check (status in ('pending','in_progress','completed')),
    completed_at    timestamptz,
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now()
);

comment on table public.roadmap_milestones is
    'Individual milestones within a roadmap. Completion = learning progress only, not mastery.';
comment on column public.roadmap_milestones.status is
    'Completed milestone = learning progress only. Does NOT automatically make a skill "mastered".';

create index if not exists idx_roadmap_milestones_roadmap_id
    on public.roadmap_milestones (roadmap_id);
create index if not exists idx_roadmap_milestones_user_id
    on public.roadmap_milestones (user_id);

alter table public.roadmap_milestones enable row level security;

drop policy if exists "roadmap_milestones_select_own" on public.roadmap_milestones;
create policy "roadmap_milestones_select_own"
    on public.roadmap_milestones for select to authenticated
    using (auth.uid() = user_id);

drop policy if exists "roadmap_milestones_insert_own" on public.roadmap_milestones;
create policy "roadmap_milestones_insert_own"
    on public.roadmap_milestones for insert to authenticated
    with check (auth.uid() = user_id);

drop policy if exists "roadmap_milestones_update_own" on public.roadmap_milestones;
create policy "roadmap_milestones_update_own"
    on public.roadmap_milestones for update to authenticated
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

drop policy if exists "roadmap_milestones_service_role_all" on public.roadmap_milestones;
create policy "roadmap_milestones_service_role_all"
    on public.roadmap_milestones for all to service_role
    using (true) with check (true);

grant select, insert, update on public.roadmap_milestones to authenticated;

create or replace function public.handle_milestone_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

drop trigger if exists roadmap_milestones_updated_at on public.roadmap_milestones;
create trigger roadmap_milestones_updated_at
    before update on public.roadmap_milestones
    for each row execute function public.handle_milestone_updated_at();
