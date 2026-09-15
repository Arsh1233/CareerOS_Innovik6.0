-- CareerOS skill gap + roadmap schema
--
-- Phase 06 (Skill Gap Intelligence + Personalized Roadmap). Adds the skill
-- evidence store, the role→skill requirement mapping, persisted roadmaps and
-- weekly milestones, and a `career_twin_stale` flag on `profiles`.
--
-- Apply with:  supabase db push   (or paste into the Supabase SQL editor)
--
-- Design rules this schema enforces:
--   * A skill row records what has been *observed*, never a guessed
--     proficiency. `proficiency` is nullable on purpose.
--   * Every skill/evidence/roadmap row belongs to exactly one user and is
--     readable/writable only by that user (RLS below).
--   * `role_required_skills` is reference data: readable by any authenticated
--     user, writable only by operators.

-- ── skills ────────────────────────────────────────────────────────────────
-- The user's current skill state. `proficiency` stays NULL until evidence
-- justifies a level — a resume mention is not mastery.

create table if not exists public.skills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  skill_key text not null,
  skill_name text not null,
  proficiency text
    check (proficiency is null or proficiency in ('aware', 'working', 'proficient', 'advanced')),
  evidence_summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, skill_key)
);

create index if not exists skills_user_idx on public.skills (user_id);
create index if not exists skills_skill_key_idx on public.skills (skill_key);

-- ── skill evidence ────────────────────────────────────────────────────────
-- Provenance for a skill: which resume/project/interview/certificate showed
-- it. Kept separate from `skills` so evidence can be listed without implying a
-- proficiency level.

create table if not exists public.skill_evidence (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  skill_id uuid references public.skills (id) on delete cascade,
  skill_key text not null,
  skill_name text,
  source_type text not null
    check (source_type in ('resume', 'project', 'interview', 'certification', 'manual', 'roadmap')),
  source_ref text,
  detail text,
  observed_level text
    check (observed_level is null or observed_level in ('aware', 'working', 'proficient', 'advanced')),
  created_at timestamptz not null default now()
);

create index if not exists skill_evidence_user_idx on public.skill_evidence (user_id);
create index if not exists skill_evidence_skill_id_idx on public.skill_evidence (skill_id);
create index if not exists skill_evidence_skill_key_idx on public.skill_evidence (skill_key);

-- ── role required skills ──────────────────────────────────────────────────
-- Maps a `role_requirements` version to the skills it demands. This is the
-- only source of "what the role needs" — the API never hardcodes requirements.

create table if not exists public.role_required_skills (
  id uuid primary key default gen_random_uuid(),
  role_requirement_id uuid not null
    references public.role_requirements (id) on delete cascade,
  skill_key text not null,
  skill_name text not null,
  importance text not null default 'recommended'
    check (importance in ('critical', 'recommended', 'optional')),
  minimum_level text
    check (minimum_level is null or minimum_level in ('aware', 'working', 'proficient', 'advanced')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (role_requirement_id, skill_key)
);

create index if not exists role_required_skills_req_idx
  on public.role_required_skills (role_requirement_id);

-- ── roadmaps ──────────────────────────────────────────────────────────────
-- `plan` holds the validated weekly structure (Pydantic-checked before it is
-- ever written). Milestone *state* lives in the table below so it can change
-- without rewriting the plan.

create table if not exists public.roadmaps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  target_role_name text not null,
  requirements_version integer,
  version integer not null default 1 check (version > 0),
  pace_hours_per_week integer
    check (pace_hours_per_week is null or pace_hours_per_week between 1 and 80),
  plan jsonb not null,
  status text not null default 'active' check (status in ('active', 'archived')),
  generated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists roadmaps_user_idx on public.roadmaps (user_id);
create index if not exists roadmaps_user_status_idx on public.roadmaps (user_id, status);

create table if not exists public.roadmap_milestones (
  id uuid primary key default gen_random_uuid(),
  roadmap_id uuid not null references public.roadmaps (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  week_number integer not null check (week_number > 0),
  title text not null,
  status text not null default 'pending' check (status in ('pending', 'complete')),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (roadmap_id, week_number)
);

create index if not exists roadmap_milestones_roadmap_idx
  on public.roadmap_milestones (roadmap_id);
create index if not exists roadmap_milestones_user_idx
  on public.roadmap_milestones (user_id);

-- ── career twin staleness ─────────────────────────────────────────────────
-- Set when target-role or learning evidence changes so the UI can offer a
-- refresh. The Twin is never regenerated automatically.

alter table public.profiles
  add column if not exists career_twin_stale boolean not null default false;

-- ── updated_at triggers ───────────────────────────────────────────────────

drop trigger if exists skills_set_updated_at on public.skills;
create trigger skills_set_updated_at before update on public.skills
  for each row execute function public.set_updated_at();

drop trigger if exists role_required_skills_set_updated_at on public.role_required_skills;
create trigger role_required_skills_set_updated_at before update on public.role_required_skills
  for each row execute function public.set_updated_at();

drop trigger if exists roadmaps_set_updated_at on public.roadmaps;
create trigger roadmaps_set_updated_at before update on public.roadmaps
  for each row execute function public.set_updated_at();

drop trigger if exists roadmap_milestones_set_updated_at on public.roadmap_milestones;
create trigger roadmap_milestones_set_updated_at before update on public.roadmap_milestones
  for each row execute function public.set_updated_at();

-- ── row level security ────────────────────────────────────────────────────

alter table public.skills enable row level security;
alter table public.skill_evidence enable row level security;
alter table public.role_required_skills enable row level security;
alter table public.roadmaps enable row level security;
alter table public.roadmap_milestones enable row level security;

-- A user may read and change only their own skill state. Even if the API were
-- bypassed, the database refuses another student's rows.
drop policy if exists skills_select_own on public.skills;
create policy skills_select_own on public.skills
  for select to authenticated using (user_id = auth.uid());

drop policy if exists skills_insert_own on public.skills;
create policy skills_insert_own on public.skills
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists skills_update_own on public.skills;
create policy skills_update_own on public.skills
  for update to authenticated using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists skills_delete_own on public.skills;
create policy skills_delete_own on public.skills
  for delete to authenticated using (user_id = auth.uid());

drop policy if exists skill_evidence_select_own on public.skill_evidence;
create policy skill_evidence_select_own on public.skill_evidence
  for select to authenticated using (user_id = auth.uid());

drop policy if exists skill_evidence_insert_own on public.skill_evidence;
create policy skill_evidence_insert_own on public.skill_evidence
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists skill_evidence_delete_own on public.skill_evidence;
create policy skill_evidence_delete_own on public.skill_evidence
  for delete to authenticated using (user_id = auth.uid());

-- Role requirements are shared reference data: readable by all authenticated
-- users, never written by them (no insert/update/delete policy is granted).
drop policy if exists role_required_skills_select_authenticated on public.role_required_skills;
create policy role_required_skills_select_authenticated on public.role_required_skills
  for select to authenticated using (true);

drop policy if exists roadmaps_select_own on public.roadmaps;
create policy roadmaps_select_own on public.roadmaps
  for select to authenticated using (user_id = auth.uid());

drop policy if exists roadmaps_insert_own on public.roadmaps;
create policy roadmaps_insert_own on public.roadmaps
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists roadmaps_update_own on public.roadmaps;
create policy roadmaps_update_own on public.roadmaps
  for update to authenticated using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists roadmap_milestones_select_own on public.roadmap_milestones;
create policy roadmap_milestones_select_own on public.roadmap_milestones
  for select to authenticated using (user_id = auth.uid());

drop policy if exists roadmap_milestones_insert_own on public.roadmap_milestones;
create policy roadmap_milestones_insert_own on public.roadmap_milestones
  for insert to authenticated with check (user_id = auth.uid());

-- The UPDATE policy re-checks ownership on both sides, so a student can flip
-- only their own milestone's status.
drop policy if exists roadmap_milestones_update_own on public.roadmap_milestones;
create policy roadmap_milestones_update_own on public.roadmap_milestones
  for update to authenticated using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ── grants ────────────────────────────────────────────────────────────────

grant select, insert, update, delete on public.skills to authenticated;
grant select, insert, delete on public.skill_evidence to authenticated;
grant select on public.role_required_skills to authenticated;
grant select, insert, update on public.roadmaps to authenticated;
grant select, insert, update on public.roadmap_milestones to authenticated;

-- ─────────────────────────────────────────────────────────────────────────
-- DEVELOPMENT / DEMO SEED — NOT VALIDATED INDUSTRY DATA
--
-- A small set of role requirements so the gap engine has something to read
-- before real sourced requirements exist. This is deliberately tiny and
-- explicitly labelled: it is NOT a market dataset and must be replaced with
-- sourced requirements before any readiness claim is made to a user.
-- Idempotent: re-running is a no-op.
-- ─────────────────────────────────────────────────────────────────────────

insert into public.role_requirements (role_name, seniority, requirements_version, source_metadata)
values
  ('AI Engineer', 'entry', 1,
   '{"seed": true, "source": "development seed", "validated": false}'::jsonb),
  ('Data Analyst', 'entry', 1,
   '{"seed": true, "source": "development seed", "validated": false}'::jsonb),
  ('Frontend Developer', 'entry', 1,
   '{"seed": true, "source": "development seed", "validated": false}'::jsonb)
on conflict (role_name, seniority, requirements_version) do nothing;

insert into public.role_required_skills
  (role_requirement_id, skill_key, skill_name, importance, minimum_level)
select r.id, v.skill_key, v.skill_name, v.importance, v.minimum_level
from public.role_requirements r
join (
  values
    -- AI Engineer
    ('AI Engineer', 'python', 'Python', 'critical', 'proficient'),
    ('AI Engineer', 'machine-learning', 'Machine Learning', 'critical', 'proficient'),
    ('AI Engineer', 'deep-learning', 'Deep Learning', 'recommended', 'working'),
    ('AI Engineer', 'mlops', 'MLOps', 'critical', 'working'),
    ('AI Engineer', 'sql', 'SQL', 'recommended', 'working'),
    ('AI Engineer', 'docker', 'Docker', 'recommended', 'working'),
    ('AI Engineer', 'system-design', 'System Design', 'recommended', 'working'),
    ('AI Engineer', 'statistics', 'Statistics', 'optional', 'aware'),
    -- Data Analyst
    ('Data Analyst', 'sql', 'SQL', 'critical', 'proficient'),
    ('Data Analyst', 'excel', 'Excel', 'critical', 'proficient'),
    ('Data Analyst', 'statistics', 'Statistics', 'critical', 'working'),
    ('Data Analyst', 'python', 'Python', 'recommended', 'working'),
    ('Data Analyst', 'data-visualization', 'Data Visualization', 'recommended', 'working'),
    ('Data Analyst', 'a-b-testing', 'A/B Testing', 'optional', 'aware'),
    -- Frontend Developer
    ('Frontend Developer', 'javascript', 'JavaScript', 'critical', 'proficient'),
    ('Frontend Developer', 'typescript', 'TypeScript', 'recommended', 'working'),
    ('Frontend Developer', 'react', 'React', 'critical', 'proficient'),
    ('Frontend Developer', 'html', 'HTML', 'critical', 'working'),
    ('Frontend Developer', 'css', 'CSS', 'critical', 'working'),
    ('Frontend Developer', 'accessibility', 'Accessibility', 'optional', 'aware'),
    ('Frontend Developer', 'rest-apis', 'REST APIs', 'recommended', 'working'),
    ('Frontend Developer', 'git', 'Git', 'recommended', 'working')
) as v(role_name, seniority, skill_key, skill_name, importance, minimum_level)
  on v.role_name = r.role_name and v.seniority = r.seniority
where r.requirements_version = 1
on conflict (role_requirement_id, skill_key) do nothing;
