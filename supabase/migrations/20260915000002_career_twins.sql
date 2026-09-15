-- CareerOS Phase 04: Career Twins
-- Stores AI-generated career twin results, versioned per user.
-- Follows the same guard pattern as 20260915000001_core_identity.sql.

-- ── Table ─────────────────────────────────────────────────────────────────

create table if not exists public.career_twins (
    id              uuid primary key default gen_random_uuid(),
    user_id         uuid not null references auth.users(id) on delete cascade,
    target_role     text,
    input_version   integer not null default 1,
    model_provider  text not null default 'groq',
    model_name      text not null default 'llama-3.3-70b-versatile',
    prompt_version  text not null default 'v1',
    evidence_snapshot jsonb not null default '{}',
    result          jsonb not null default '{}',
    status          text not null default 'generated'
                        check (status in ('generated', 'stale', 'error')),
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now()
);

comment on table public.career_twins is 'AI-generated career twin results, one row per generation.';

-- ── Indexes ───────────────────────────────────────────────────────────────

create index if not exists idx_career_twins_user_id
    on public.career_twins (user_id);

create index if not exists idx_career_twins_user_latest
    on public.career_twins (user_id, created_at desc);

-- ── RLS ───────────────────────────────────────────────────────────────────

alter table public.career_twins enable row level security;

-- Students can read their own career twins.
drop policy if exists "career_twins_select_own" on public.career_twins;
create policy "career_twins_select_own"
    on public.career_twins
    for select
    to authenticated
    using (auth.uid() = user_id);

-- Students can insert their own career twins (via the application server).
drop policy if exists "career_twins_insert_own" on public.career_twins;
create policy "career_twins_insert_own"
    on public.career_twins
    for insert
    to authenticated
    with check (auth.uid() = user_id);

-- Students can update their own career twins (for stale flagging).
drop policy if exists "career_twins_update_own" on public.career_twins;
create policy "career_twins_update_own"
    on public.career_twins
    for update
    to authenticated
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- Service role can do anything (for admin/migration purposes).
drop policy if exists "career_twins_service_role_all" on public.career_twins;
create policy "career_twins_service_role_all"
    on public.career_twins
    for all
    to service_role
    using (true)
    with check (true);

-- ── Grants ────────────────────────────────────────────────────────────────

grant select, insert, update on public.career_twins to authenticated;

-- ── Trigger for updated_at ────────────────────────────────────────────────

create or replace function public.handle_career_twin_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

drop trigger if exists career_twins_updated_at on public.career_twins;
create trigger career_twins_updated_at
    before update on public.career_twins
    for each row
    execute function public.handle_career_twin_updated_at();
