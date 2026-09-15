-- CareerOS core identity schema
-- Phase 03 (Auth + Identity + Profile)
-- Applied: 2026-09-15

create schema if not exists app;

-- updated_at bookkeeping
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- organisations
create table if not exists public.colleges (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  short_name text,
  city text,
  verified_status text not null default 'pending'
    check (verified_status in ('pending', 'verified', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.recruiter_organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  website text,
  industry text,
  verified_status text not null default 'pending'
    check (verified_status in ('pending', 'verified', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- target role requirements
create table if not exists public.role_requirements (
  id uuid primary key default gen_random_uuid(),
  role_name text not null,
  seniority text,
  requirements_version integer not null default 1 check (requirements_version > 0),
  source_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (role_name, seniority, requirements_version)
);

-- profiles
create table if not exists public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  email text,
  phone text,
  location text,
  linkedin_url text,
  github_url text,
  education jsonb not null default '[]'::jsonb
    check (jsonb_typeof(education) = 'array'),
  experience jsonb not null default '[]'::jsonb
    check (jsonb_typeof(experience) = 'array'),
  interests jsonb not null default '[]'::jsonb
    check (jsonb_typeof(interests) = 'array'),
  target_role_id uuid references public.role_requirements (id) on delete set null,
  target_role_name text,
  target_salary_inr integer check (target_salary_inr is null or target_salary_inr >= 0),
  timeframe_years integer check (timeframe_years is null or timeframe_years between 0 and 40),
  onboarding_state text not null default 'not_started'
    check (onboarding_state in ('not_started', 'in_progress', 'complete')),
  discoverability boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- tenancy
create table if not exists public.organization_memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  college_id uuid references public.colleges (id) on delete cascade,
  recruiter_organization_id uuid references public.recruiter_organizations (id) on delete cascade,
  membership_role text not null default 'member'
    check (membership_role in ('owner', 'admin', 'member', 'viewer')),
  status text not null default 'active'
    check (status in ('invited', 'active', 'suspended', 'removed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organization_memberships_one_org
    check (((college_id is not null)::integer + (recruiter_organization_id is not null)::integer) = 1)
);

create table if not exists public.student_college_memberships (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references auth.users (id) on delete cascade,
  college_id uuid not null references public.colleges (id) on delete cascade,
  department text,
  batch text,
  enrollment_status text not null default 'active'
    check (enrollment_status in ('active', 'graduated', 'suspended', 'left')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id, college_id)
);

-- indexes
create index if not exists profiles_email_idx on public.profiles (email);
create index if not exists organization_memberships_user_idx
  on public.organization_memberships (user_id);
create index if not exists organization_memberships_college_idx
  on public.organization_memberships (college_id);
create index if not exists student_college_memberships_student_idx
  on public.student_college_memberships (student_id);
create index if not exists student_college_memberships_college_idx
  on public.student_college_memberships (college_id);
create index if not exists colleges_verified_status_idx on public.colleges (verified_status);

-- updated_at triggers
drop trigger if exists colleges_set_updated_at on public.colleges;
create trigger colleges_set_updated_at before update on public.colleges
  for each row execute function public.set_updated_at();

drop trigger if exists recruiter_organizations_set_updated_at on public.recruiter_organizations;
create trigger recruiter_organizations_set_updated_at before update on public.recruiter_organizations
  for each row execute function public.set_updated_at();

drop trigger if exists role_requirements_set_updated_at on public.role_requirements;
create trigger role_requirements_set_updated_at before update on public.role_requirements
  for each row execute function public.set_updated_at();

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists organization_memberships_set_updated_at on public.organization_memberships;
create trigger organization_memberships_set_updated_at before update on public.organization_memberships
  for each row execute function public.set_updated_at();

drop trigger if exists student_college_memberships_set_updated_at on public.student_college_memberships;
create trigger student_college_memberships_set_updated_at
  before update on public.student_college_memberships
  for each row execute function public.set_updated_at();

-- profile provisioning on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, email, display_name)
  values (
    new.id,
    new.email,
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), '')
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- tenant helpers
create or replace function app.current_college_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select m.college_id
  from public.organization_memberships m
  where m.user_id = auth.uid()
    and m.status = 'active'
    and m.college_id is not null;
$$;

create or replace function app.current_recruiter_organization_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select m.recruiter_organization_id
  from public.organization_memberships m
  where m.user_id = auth.uid()
    and m.status = 'active'
    and m.recruiter_organization_id is not null;
$$;

-- row level security
alter table public.profiles enable row level security;
alter table public.colleges enable row level security;
alter table public.recruiter_organizations enable row level security;
alter table public.role_requirements enable row level security;
alter table public.organization_memberships enable row level security;
alter table public.student_college_memberships enable row level security;

-- profiles policies
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select to authenticated using (user_id = auth.uid());

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update to authenticated using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- colleges policies
drop policy if exists colleges_select_verified_or_member on public.colleges;
create policy colleges_select_verified_or_member on public.colleges
  for select to authenticated
  using (verified_status = 'verified' or id in (select app.current_college_ids()));

-- recruiter org policies
drop policy if exists recruiter_organizations_select_verified_or_member
  on public.recruiter_organizations;
create policy recruiter_organizations_select_verified_or_member
  on public.recruiter_organizations
  for select to authenticated
  using (
    verified_status = 'verified'
    or id in (select app.current_recruiter_organization_ids())
  );

-- role requirements policies
drop policy if exists role_requirements_select_authenticated on public.role_requirements;
create policy role_requirements_select_authenticated on public.role_requirements
  for select to authenticated using (true);

-- organization memberships policies
drop policy if exists organization_memberships_select_member on public.organization_memberships;
create policy organization_memberships_select_member on public.organization_memberships
  for select to authenticated
  using (
    user_id = auth.uid()
    or college_id in (select app.current_college_ids())
    or recruiter_organization_id in (select app.current_recruiter_organization_ids())
  );

-- student college memberships policies
drop policy if exists student_college_memberships_select_scoped
  on public.student_college_memberships;
create policy student_college_memberships_select_scoped
  on public.student_college_memberships
  for select to authenticated
  using (
    student_id = auth.uid()
    or college_id in (select app.current_college_ids())
  );

-- grants
grant usage on schema app to authenticated;
grant execute on function app.current_college_ids() to authenticated;
grant execute on function app.current_recruiter_organization_ids() to authenticated;

grant select, insert, update on public.profiles to authenticated;
grant select on public.colleges to authenticated;
grant select on public.recruiter_organizations to authenticated;
grant select on public.role_requirements to authenticated;
grant select on public.organization_memberships to authenticated;
grant select on public.student_college_memberships to authenticated;
