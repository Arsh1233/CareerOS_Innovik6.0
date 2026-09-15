-- Phase 08: ECHO Interview Agent
-- Tracks speech-to-speech interview sessions powered by ElevenLabs.
-- Each row holds the ElevenLabs conversation reference, the full transcript,
-- Groq-generated rubric scores, and structured feedback.
--
-- RLS: a student can only read/write their own sessions.

begin;

-- ── interview_sessions ───────────────────────────────────────────────────

create table if not exists public.interview_sessions (
  id                          uuid primary key default gen_random_uuid(),
  user_id                     uuid not null references auth.users(id) on delete cascade,

  -- Configuration chosen at start
  interview_type              text not null default 'Technical',   -- Technical|Behavioral|System Design|Mixed
  difficulty                  text not null default 'Medium',      -- Easy|Medium|Hard
  target_role                 text,

  -- ElevenLabs reference — null until the browser reports the conversation ID
  elevenlabs_conversation_id  text,

  -- Lifecycle
  status                      text not null default 'pending'
                                check (status in ('pending', 'active', 'complete', 'scored', 'failed')),

  -- Populated after end-session
  transcript                  jsonb,          -- raw turn-by-turn from ElevenLabs
  rubric_version              text,           -- Groq prompt version used for scoring
  scores                      jsonb,          -- {technical, communication, confidence, overall}
  feedback                    jsonb,          -- {strongest_area, improvement_area, summary, recommended_action}
  duration_seconds            integer,

  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

-- Fast lookups by user (for session history list)
create index if not exists idx_interview_sessions_user_id
  on public.interview_sessions (user_id, created_at desc);

-- Index for ElevenLabs conversation reference (end-session lookup)
create index if not exists idx_interview_sessions_el_conversation
  on public.interview_sessions (elevenlabs_conversation_id)
  where elevenlabs_conversation_id is not null;

-- Auto-update updated_at
create or replace function public.set_interview_session_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_interview_sessions_updated_at on public.interview_sessions;
create trigger trg_interview_sessions_updated_at
  before update on public.interview_sessions
  for each row execute function public.set_interview_session_updated_at();

-- ── Row Level Security ───────────────────────────────────────────────────

alter table public.interview_sessions enable row level security;

-- Students can read their own sessions only
DROP POLICY IF EXISTS "interview_sessions: owner can read" ON public.interview_sessions;
create policy "interview_sessions: owner can read"
  on public.interview_sessions for select
  using (auth.uid() = user_id);

-- Students can insert their own sessions only
DROP POLICY IF EXISTS "interview_sessions: owner can insert" ON public.interview_sessions;
create policy "interview_sessions: owner can insert"
  on public.interview_sessions for insert
  with check (auth.uid() = user_id);

-- Students can update their own sessions only
DROP POLICY IF EXISTS "interview_sessions: owner can update" ON public.interview_sessions;
create policy "interview_sessions: owner can update"
  on public.interview_sessions for update
  using (auth.uid() = user_id);

-- No delete: session history is append-only for audit purposes
-- (admins can delete via service-role if needed)

commit;
