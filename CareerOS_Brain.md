# CareerOS — Agent Brain File

> **Created:** 2026-09-15  
> **Sources:** `CareerOS-RuBI/CareerOS_Development_Context.md` · `CareerOS-RuBI/CareerOS_Phased_Development_Playbook.md`  
> **Workspace root:** `D:\innovik_careerOs\`  
> **Purpose:** Fast re-entry reference for any coding agent picking up CareerOS work.

> **ACTIVE STATE (last updated 2026-09-15):** backend exists at
> `CareerOS-RuBI/backend/` (FastAPI — 7 endpoints, 40 passing tests, no live
> credentials). See **§18 Backend Implementation**. The frontend auth/profile
> path is now wired to it — **the fake login is gone**; see §17 *Frontend
> Integration*. The identity migration is written but **not yet applied** to a
> Supabase project, so **live end-to-end auth has NOT been demonstrated**.
> Next action: apply the migration + configure Supabase credentials, then verify
> the loop for real.

---

## 1. What Is CareerOS

**Agentic AI Career Operating System** — a closed-loop career intelligence ecosystem connecting **students, colleges, and recruiters** through shared career data and AI-driven guidance.

**Origin:** INNOVIK 6.0 hackathon. Built by founder/team using Figma → code export + Google Antigravity. Current problem: frontend uses sample/mock data; backend integration is incomplete or partially wired.

**Core USP:** Not just a twin or resume tool — a *three-sided feedback loop*:
- Students improve resumes, skills, interview performance
- Colleges get placement-readiness analytics and intervention signals
- Recruiters discover/hire candidates; their feedback improves student guidance

---

## 2. Roles & Access

| Role | Scope |
|---|---|
| Visitor | Public landing + auth |
| Student | Own profile, resumes, skills, chats, plans, interviews, applications, recommendations |
| Recruiter | Own org, jobs, hiring pipeline, discoverable candidate info |
| College Admin | Students associated with authorized college only |
| Super Admin | Privileged operational + management views |

**Auth stack:** Supabase Auth + Google OAuth + JWT. Role derived server-side — never from client-supplied user ID or URL param.

---

## 3. Tech Stack (Established)

| Layer | Choice | Notes |
|---|---|---|
| Frontend | **React 19 + Vite 8** ⚠️ | Figma Make export — NOT Next.js. App Router planning docs do NOT match. |
| Styling | **Tailwind CSS v4** (no shadcn/ui) | `@tailwindcss/vite` plugin; no PostCSS config needed |
| Backend | FastAPI, Python, Uvicorn | Python 3.13 target; verify installed version |
| AI Provider | **Google Gemini 2.5 only** | Later phases explicitly "only Gemini" |
| Orchestration | **n8n** (supersedes LangGraph) | Multi-step workflows + retries only. n8n must not replace normal CRUD APIs. |
| Validation | Pydantic AI / Pydantic models | All AI outputs validated before persistence |
| Auth | Supabase Auth + Google OAuth | Supersedes Clerk/BetterAuth |
| DB | Supabase PostgreSQL | Migrations + RLS; source of truth |
| Files | Supabase Storage | Private buckets; short-lived access URLs |
| Vector | Qdrant / Qdrant Cloud | Collections: `resume_embeddings`, `job_embeddings`, `user_embeddings`, `career_knowledge` |
| Embeddings | Gemini embeddings | Exact model/dimensions **unresolved** — must select before indexing |
| Voice | ElevenLabs | WebSocket/WebRTC; session details **unresolved** |
| Observability | LangSmith | Redact PII and secrets |
| Testing | Pytest (backend) + Playwright (E2E) | No passing suite supplied yet |
| CI/Deploy | Docker + GitHub Actions | Vercel (FE) + Railway (BE) primary candidate |

**Do NOT install:** DeepSeek, Llama, CrewAI, Redis, LlamaIndex, LangChain, **LangGraph**, Socket.io, LiveKit, Tavus, HeyGen, Prometheus, Grafana, OpenTelemetry — exploratory only. LangGraph was dropped in favour of n8n; do not reintroduce it.

---

## 4. Routes (All 14 — Preserve Exactly)

| Route | Page | Primary Integration |
|---|---|---|
| `/` | Home | Public nav |
| `/auth` | Auth | Supabase signup/login + role routing |
| `/dashboard` | Dashboard | Analytics: readiness, heatmap, goals |
| `/career-twin` | Career Twin | POST `/career-twin/get-career-twin` |
| `/mentor` | ARIA | POST `/chat/` |
| `/resume` | Resume | POST `/resumes/upload-resume` |
| `/skills` | Skill Gap | GET `/skills/gap-analysis` (proposed) |
| `/roadmap` | **Dedicated Roadmap** | POST `/roadmap/get-roadmap` + milestones |
| `/interview` | ECHO | POST `/voice/start-session` + WS |
| `/jobs` | Jobs | POST `/recommendations/jobs` |
| `/profile` | Profile | PUT `/users/profile` |
| `/recruiter` | Recruiter | POST `/recruiter/search-candidates` |
| `/college` | College Admin | Tenant-scoped analytics |
| `/admin` | Super Admin | Privileged operational telemetry |

> `/roadmap` is a **confirmed separate route** — not folded into `/skills`.

---

## 5. Established API Endpoints (Backend Paths)

All relative to `/api/v1` base — verify prefix in router to avoid double-prefix.

Legend: ✅ **built 2026-09-15** (see §18) · ⬜ not started.

| Method + Path | Purpose | Status |
|---|---|---|
| `POST /auth/signup` | Supabase-backed signup | ✅ built |
| `POST /auth/login` | Auth/session | ✅ built |
| `POST /auth/logout` | Revoke session | ✅ built (added) |
| `POST /auth/password-reset` | Reset link | ✅ built (added) |
| `GET /users/me` | Current authorized identity | ✅ built |
| `PUT /users/profile` | Profile persistence | ✅ built |
| `GET /analytics/dashboard` | Readiness, activity, goals | ⬜ not started |
| `POST /career-twin/get-career-twin` | Generate/display Twin |
| `POST /chat/` | ARIA response (note trailing slash) |
| `POST /resumes/upload-resume` | Multipart PDF → parse → persist → embed |
| `POST /roadmap/get-roadmap` | Structured weekly learning plan |
| `POST /voice/start-session` | Authorized ECHO session start | ⬜ not started |
| `WS /voice/ws/{session_id}` | Interview transport stream | ⬜ not started |
| `POST /recommendations/jobs` | Semantic job recommendations | ⬜ not started |
| `POST /applications/apply` | Persist application to recruiter pipeline | ⬜ not started |
| `POST /recruiter/search-candidates` | Semantic candidate discovery | ⬜ not started |
| `GET /health` | Status + configured capabilities (operational) | ✅ built (added) |

---

## 6. Modules — Historical Status (Must Verify Against Actual Repo)

| Module | Last Known Status | What Needs Verifying / Completing |
|---|---|---|
| ARIA Chat API | ✅ Implemented, wired to Gemini | Real UI request, persisted history, auth scope, context, failure handling |
| Career Twin API | ⚠️ Partially implemented | Replace frontend mock arrays with backend results |
| Resume Upload | ❌ Router exists; processing missing | PDF parsing + Qdrant embedding missing |
| Roadmap API | ❌ Stub only | Gemini integration + persistence missing |
| Voice/ECHO | ❌ Missing | ElevenLabs + WebSocket/WebRTC |
| Job Recommendations | ❌ Missing | Qdrant semantic search |
| Recruiter Pipeline | ❌ Missing/stubbed | Search, applications, stage management |
| Auth/Profile | 🟡 **API + frontend wired 2026-09-15** | Signup/login/logout/password-reset, `GET /users/me`, `PUT /users/profile`. JWT verified server-side; role from `app_metadata`. Frontend now calls the real endpoints (`src/lib/api/*`) — fake login removed. **Live Supabase auth not yet demonstrated (no credentials, migration unapplied).** |
| DB Migrations/RLS | 🟡 **Migration written 2026-09-15** | `supabase/migrations/20260915000001_core_identity.sql`. **Not yet applied or executed against a live Supabase project.** |
| College Analytics | ❌ Missing | Tenant-scoped aggregates |
| Super Admin | ❌ Missing | Operational telemetry |

> ⚠️ Later user statement: *"we have all the listed features"* — **do not accept at face value**. Audit actual repo before claiming any module complete.

---

## 7. Database Schema (Proposed — Verify Against Actual Migrations)

Key tables (all UUID PKs, created_at/updated_at unless noted):

- `profiles` — user_id FK auth.users, target_role_id, target_salary_inr, onboarding_state, discoverability
- `colleges`, `recruiter_organizations` — id, name, verified_status
- `organization_memberships`, `student_college_memberships` — tenant membership
- `role_requirements`, `role_required_skills` — versioned target role data
- `resumes` — storage_path, content_hash, version, parse_status, extracted_data JSONB, ats_score, embedding_status
- `skills` — normalized_skill_key, proficiency (nullable), evidence_summary
- `skill_evidence` — provenance per skill (resume/project/interview/cert)
- `career_twins` — input_version, model_version, result JSONB
- `roadmaps` — pace_hours_per_week, version, plan JSONB
- `roadmap_milestones` — week_number, status, completed_at
- `chat_sessions`, `chat_history` — session_id, role, message, source_refs
- `interview_sessions` — transcript JSONB, rubric_version, scores JSONB, feedback JSONB
- `jobs` — owned by recruiter_organization, requirements JSONB, status
- `applications` — student_id, job_id, resume_id, resume_version, status
- `application_events` — audit trail of stage transitions
- `candidate_shortlists`, `recommendations`, `goals`
- `activity_events`, `analytics_snapshots`, `ai_runs`, `audit_logs`

**RLS must be enabled and tested on all user/tenant data.**

---

## 8. AI Agents

| Agent | Engine | Key Inputs | Key Outputs |
|---|---|---|---|
| ARIA Mentor | Gemini, n8n-orchestrated | User request, profile/skills/goals/history, retrieved knowledge | Contextual advice + suggested actions |
| Career Twin / Career Agent | Gemini | Profile, goal, skills, resume/interview/learning evidence | Trajectory, alignment, gaps, actions |
| Resume Agent / Parser | Gemini + Qdrant | Validated PDF text | Structured analysis, extracted skills, ATS feedback |
| Learning Agent | Gemini, orchestrated | Target requirements, gaps, time budget | Weekly roadmap + resource/project recommendations |
| ECHO Interview Agent | Gemini + ElevenLabs | Interview type/difficulty, career context, transcript | Questions, responses, rubric-based feedback |
| Job Agent / Matcher | Qdrant + optional Gemini | Candidate/job representations | Ranked matches with explanations |
| Analytics Agent | DB aggregates + optional Gemini | Progress, outcomes, institutional scope | Insights + summaries |

**Workflow state must carry:** authenticated user/tenant context, request ID, task type, target role, evidence references/versions, retrieved sources, typed results, tool errors, final result. With n8n this state lives in the workflow execution and in `ai_runs`, not in a LangGraph state object.

> None of the agents above are implemented yet. `backend/app/agents/` is a placeholder.

---

## 9. Closed-Loop Event Model

| Trigger | Persist First | Then Refresh |
|---|---|---|
| Resume analysis completes | Resume version, extracted skills | Twin, gaps, roadmap suggestions, candidate index, dashboard |
| Target role changes | Goal/target version | Gaps, trajectory, role-specific plan |
| Milestone completes | Progress + evidence | Learning progress, gaps, Twin, dashboard |
| Interview ends | Transcript, rubric scores, feedback | Interview history, readiness inputs, ARIA context |
| Job published/updated | Job + requirements | Job embedding, recommendation cache |
| Application submitted | Application + resume snapshot | Recruiter pipeline, student application state |
| Recruiter updates outcome | Stage/outcome + feedback | College aggregates + future recommendations |

---

## 10. Environment Variables (Key)

> ⚠️ The frontend is **Vite**, so browser-visible variables must be prefixed
> `VITE_` (not `NEXT_PUBLIC_`) to be compiled in by `import.meta.env`. The
> original list below used Next.js naming; it has been corrected.

| Variable | Side | Purpose |
|---|---|---|
| `VITE_API_BASE_URL` | Frontend | FastAPI base URL, **including** `/api/v1` |
| `VITE_SUPABASE_URL` | Frontend | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Frontend | Public anon key |
| `SUPABASE_URL` | Backend | Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Backend secret | Privileged ops only |
| `GEMINI_API_KEY` | Backend secret | Gemini access |
| `GEMINI_MODEL` | Backend | Generation model ID |
| `GEMINI_EMBEDDING_MODEL` | Backend | Embedding model ID |
| `QDRANT_URL` / `QDRANT_API_KEY` | Backend | Vector service |
| `ELEVENLABS_API_KEY` | Backend secret | Voice provider |
| `N8N_BASE_URL` / `N8N_WEBHOOK_SECRET` | Backend | Workflow orchestration |
| `LANGSMITH_API_KEY` / `LANGSMITH_PROJECT` | Backend | Observability |
| `CORS_ALLOWED_ORIGINS` | Backend | Frontend origin allowlist |

---

## 11. Phased Implementation Order (14 Phases)

| Phase | Goal |
|---|---|
| **00** | Baseline inventory — inspect repo, reconcile decisions, create implementation board |
| **01** | Agree on flows, contracts, fixture catalog, shared data definitions |
| **02** | Repository setup, env config, CI baseline checks |
| **03** | ⭐ **Auth + Identity + Profile** — first implementation priority |
| **04** | Wire existing Career Twin → replace mock arrays |
| **05** | Resume ingestion, parsing, Qdrant indexing |
| **06** | Skill Gap Intelligence + dedicated `/roadmap` screen |
| **07** | ARIA context + bounded n8n-orchestrated agents |
| **08** | ECHO interview sessions + feedback persistence |
| **09** | Jobs, semantic matching, recruiter workflow |
| **10** | College analytics + Super Admin telemetry |
| **11** | Close the intelligence loop — versioned state across all modules |
| **12** | QA, accessibility, security, performance, operational readiness |
| **13** | Deploy + demo rehearsal + handover |

**Priority order (from system map):** Auth/Profile → Twin wiring → Resume → Skills/Roadmap → Interviews → Matching/Recruiter → College/Admin

> **Phase status on 2026-09-15:** 00 complete · 01/02/03 **in progress** — backend slice built and tested, migration written but not applied, **frontend not wired**. See §18 (implementation) and §19 (work log).

---

## 12. Hackathon Demo Priority (INNOVIK 6.0)

1. Reliable login + one prepared student profile
2. Real resume analysis → skills → dynamic Career Twin
3. Visible gaps + saved personalized roadmap
4. ARIA answering using that student's actual context
5. ECHO voice (if stable) + saved feedback
6. Relevant job match + persisted application
7. Recruiter pipeline + college view (same underlying data)
8. Recruiter feedback returning intelligence to student flow

---

## 13. Key Rules — Never Violate

- **Do NOT rebuild the frontend from scratch** — extend the Figma export
- **Do NOT trust "we have all features"** — audit the actual repo
- **Do NOT hardcode demo values** (72%, ₹28 LPA, etc.) as constants
- **Do NOT mix backend secrets with `NEXT_PUBLIC_`**
- **Do NOT claim a module complete** without: UI action → API → persistence → readback → failure case all working
- **Do NOT equate cosine similarity with hiring probability**
- **Do NOT generate confidence/personality conclusions from voice/appearance**
- **Do NOT silently replace provider failures with fixtures**
- Skill completion (checkbox) ≠ assessed competency
- PostgreSQL is authoritative; Qdrant is a derived index
- All role/tenant checks must be server-side; frontend routing is supplementary

---

## 14. Deployment Target (Unresolved — Must Decide)

**Primary candidate:** Vercel (frontend) + Railway + Docker (backend) + Supabase + Qdrant Cloud

**Later strategic alternative:** Google Cloud (Cloud Run for backend, managed hosting for FE, Vertex AI access)

No production URL, project ID, or final decision confirmed. Resolve before Phase 13.

---

## 15. Critical Unresolved Decisions

| Decision | Blocking Impact |
|---|---|
| Actual repo location + current completion | Required before any status claims |
| Figma export framework vs Next.js | Determines integration path |
| `/api/v1` prefix ownership + auth ownership | Blocks reliable API requests |
| Embedding model + dimensions | Blocks all vector indexing and matching |
| Organization membership/provisioning model | Blocks safe college/recruiter functionality |
| Candidate visibility + verification policy | Blocks trustworthy talent search |
| Score definitions + evidence scales | Blocks honest metrics display |
| Voice transport/ElevenLabs session lifecycle | Blocks ECHO streaming |
| Vercel/Railway vs Google Cloud | Blocks final deployment plan |

---

## 16. Repository Layout (Actual — Verified 2026-09-15)

```
D:\innovik_careerOs\
├── CareerOS_Brain.md                        ← this file
└── CareerOS-RuBI\
    ├── CareerOS_Development_Context.md
    ├── CareerOS_Phased_Development_Playbook.md
    └── frontend\                            ← Figma Make export (React+Vite)
        ├── .figma\make\site.json
        ├── src\
        │   ├── App.tsx                      ← RouterProvider only
        │   ├── main.tsx
        │   ├── index.css                    ← Tailwind v4 import
        │   ├── routes.tsx                   ← ALL routes defined here
        │   ├── vite-env.d.ts
        │   ├── context\
        │   │   ├── AuthContext.tsx          ← in-memory only, no Supabase
        │   │   ├── ThemeContext.tsx         ← Light/Dark/System + localStorage
        │   │   └── ToastContext.tsx
        │   ├── pages\
        │   │   ├── LandingPage.tsx          (126KB)
        │   │   ├── DashboardPage.tsx
        │   │   ├── CareerTwinPage.tsx
        │   │   ├── MentorPage.tsx
        │   │   ├── ResumePage.tsx
        │   │   ├── SkillsPage.tsx
        │   │   ├── RoadmapPage.tsx          ← /roadmap exists ✅
        │   │   ├── InterviewPage.tsx        ← used for /echo + /interview
        │   │   ├── JobsPage.tsx
        │   │   ├── ProfilePage.tsx
        │   │   ├── CollegePage.tsx
        │   │   ├── RecruiterPage.tsx
        │   │   ├── AdminDashboard.tsx
        │   │   ├── ProgressPage.tsx
        │   │   ├── RoleGateway.tsx          (77KB)
        │   │   ├── AuthPage.tsx             (28KB — unused? routes use auth/)
        │   │   ├── AdminAuthPage.tsx
        │   │   ├── SubscriptionPage.tsx     (43KB)
        │   │   ├── SubscriptionSuccess.tsx
        │   │   ├── SubscriptionFailed.tsx
        │   │   ├── auth\
        │   │   │   ├── StudentAuth.tsx
        │   │   │   ├── CollegeAuth.tsx
        │   │   │   └── RecruiterAuth.tsx
        │   │   └── onboarding\
        │   │       ├── StudentOnboarding.tsx (35KB)
        │   │       ├── CollegeOnboarding.tsx
        │   │       ├── RecruiterOnboarding.tsx
        │   │       └── AdminOnboarding.tsx
        │   ├── components\
        │   │   ├── AppShell.tsx             (sidebar + topbar)
        │   │   ├── AuthLoading.tsx          ← session-restore screen (added 2026-09-15)
        │   │   ├── auth\
        │   │   └── ui\
        │   │       ├── FormField.tsx
        │   │       ├── SkillChipGrid.tsx
        │   │       └── StepIndicator.tsx
        │   ├── lib\
        │   │   ├── api\                       ← real API client (added 2026-09-15)
        │   │   │   ├── client.ts · errors.ts · types.ts
        │   │   │   └── auth.ts · users.ts · index.ts
        │   │   └── session.ts                ← token persistence + expiry check
        │   ├── services\
        │   │   └── index.ts                 ← MOCKS FOR LATER PHASES ONLY
        │   │                                   (authService/profileService deleted)
        │   └── imports\
        │       ├── CareerOS_Figma_Frontend_Context.md
        │       └── image-*.png (reference screenshots)
        ├── package.json
        ├── pnpm-lock.yaml
        ├── vite.config.ts
        ├── tsconfig.json
        ├── .mise.toml                       ← Node 22, pnpm 10.34.3
        ├── AGENTS.md
        └── CLAUDE.md

    ├── backend\                                 ← FastAPI (created 2026-09-15)
    │   ├── app\
    │   │   ├── main.py                          ← app factory, middleware, router mount
    │   │   ├── core\                            ← config.py, security.py, errors.py, roles.py, version.py
    │   │   ├── api\deps.py                      ← auth deps, role guards, service providers
    │   │   ├── api\v1\                          ← health.py, auth.py, users.py, router.py
    │   │   ├── schemas\identity.py              ← Pydantic contracts
    │   │   ├── services\auth_service.py         ← business logic
    │   │   ├── repositories\                    ← base.py (RLS-scoped conn), profiles.py
    │   │   ├── integrations\supabase.py         ← Supabase Auth REST client
    │   │   └── agents\                          ← placeholder only; no agents implemented
    │   ├── tests\                               ← 40 passing tests (no live DB required)
    │   ├── requirements.txt · pytest.ini · .env.example · README.md
    │   └── .venv\                               ← local virtualenv (gitignored)
    │
    ├── supabase\migrations\20260915000001_core_identity.sql
    │                                            ← profiles + tenancy + RLS (NOT YET APPLIED)
    └── n8n\workflows\README.md                  ← orchestration rules; no workflows exported yet
```

---

## 17. Frontend Inventory (Verified 2026-09-15)

> **Dev server:** `pnpm dev` → **http://localhost:8443** ✅ Running, 0 JS errors

| Item | Finding |
|---|---|
| **Framework** | ⚠️ React 19 + **Vite 8** — NOT Next.js 15. Planning docs assumed Next.js. |
| **Package manager** | pnpm 10.34.3 (lockfile present) |
| **Node version** | 22 (specified in `.mise.toml`) — v22.17.0 installed |
| **Tailwind version** | v4 via `@tailwindcss/vite` plugin — no PostCSS, no config file |
| **shadcn/ui** | ❌ Not present — 3 custom UI components only (FormField, SkillChipGrid, StepIndicator) |
| **Router** | react-router v8.3.1 — `createBrowserRouter` in `src/routes.tsx` |
| **Charts** | recharts v3.10.1 |
| **Icons** | lucide-react v1.41.0 |
| **Auth** | ⚠️ In-memory React state only (`AuthContext.tsx`) — no Supabase SDK wired |
| **API client** | ⚠️ `src/services/index.ts` — **100% mock**, all methods are `Promise<delay(hardcoded_value)>` |
| **Theme** | ✅ Light/Dark/System with `localStorage` persistence (`ThemeContext.tsx`) |
| **Toast** | ✅ `ToastContext.tsx` present |
| **Dev server command** | `pnpm dev` (port 8443, not 3000) |

### Routes Found (All Render Without Errors)

| Route | Status | Auth Guard | Notes |
|---|---|---|---|
| `/landing` | ✅ Renders | None | Hero, role tabs, product preview |
| `/auth/student` | ✅ Renders | None | Email/password + Google sign-in UI |
| `/auth/college` | ✅ Renders | None | — |
| `/auth/recruiter` | ✅ Renders | None | — |
| `/auth/admin` | ✅ Renders | None | — |
| `/onboarding/student` | ✅ Renders | None | 35KB multi-step wizard |
| `/onboarding/college` | ✅ Renders | None | — |
| `/onboarding/recruiter` | ✅ Renders | None | — |
| `/subscription` | ✅ Renders | None | 43KB subscription page |
| `/dashboard` | ✅ Renders | → `/landing` if no user | 78% readiness, mock data |
| `/career-twin` | ✅ Renders | → `/landing` if no user | Radar chart, timeline, salary |
| `/mentor` | ✅ Renders | → `/landing` if no user | Chat UI, context panel |
| `/resume` | ✅ Renders | → `/landing` if no user | Upload zone + mock analysis |
| `/skills` | ✅ Renders | → `/landing` if no user | Skill gap UI |
| `/roadmap` | ✅ Renders | → `/landing` if no user | ✅ Dedicated separate route |
| `/echo` | ✅ Renders | → `/landing` if no user | Interview UI |
| `/jobs` | ✅ Renders | → `/landing` if no user | Job cards |
| `/profile` | ✅ Renders | → `/landing` if no user | Profile sections |
| `/college` | ✅ Renders | → `/landing` if no user | College analytics |
| `/recruiter` | ✅ Renders | → `/landing` if no user | Candidate search |
| `/admin` | ✅ Renders | → `/landing` if no user | Admin dashboard |
| `/progress` | ✅ Renders | → `/landing` if no user | Progress tracking |

### What Is Mocked (Everything except auth/profile)

`src/services/index.ts` still contains fake `delay()` stubs for later phases:
- `resumeService` — upload (returns hardcoded score: 81), analyze, improve, remove
- `skillsService` — getGaps, buildRoadmap
- `roadmapService` — markComplete, markIncomplete
- `jobsService` — apply, save
- `notificationService` — hardcoded 4 notifications
- `collegeService` — all stubs
- `recruiterService` — all stubs
- `adminService` — all stubs
- `supportService`, `subscriptionService` — all stubs

**Authentication is no longer mocked** (2026-09-15): the auth pages call the FastAPI endpoints through `src/lib/api`, the session is persisted and restored on load, and the role comes from `GET /users/me`. See *Frontend Integration* above. The mock `authService`/`profileService` were deleted.

### Critical Framework Mismatch

The planning documents (Context.md + Playbook.md) specify **Next.js 15 + App Router**. The actual Figma export is **React + Vite**. This is the first major reconciliation decision:

- **Option A:** Keep React+Vite, adapt all backend contracts to work with it
- **Option B:** Migrate to Next.js 15 (significant effort, risky)
- **Recommended:** Keep React+Vite — the UI is complete and renders correctly; the planning docs' framework preference was never implemented

### Frontend Integration — built 2026-09-15 (Phase 03)

**The fake authentication path is gone.** All HTTP goes through one client.

| File | Purpose |
|---|---|
| `src/lib/api/types.ts` | TS mirrors of the backend Pydantic contracts — no guessed field names |
| `src/lib/api/errors.ts` | `ApiError` + `userMessage()`; raw internals never reach the UI |
| `src/lib/api/client.ts` | Shared client: base URL, bearer token, timeout, envelope parsing, `/api/v1` de-duplication |
| `src/lib/api/auth.ts` | `/auth/login`, `/auth/signup`, `/auth/logout`, `/auth/password-reset`, `/health` |
| `src/lib/api/users.ts` | `GET /users/me`, `PUT /users/profile` |
| `src/lib/session.ts` | Session persistence (`careeros.session.v1`), expiry check, corrupt-payload recovery |
| `src/components/AuthLoading.tsx` | Session-restore screen — guards must not treat "loading" as "unauthenticated" |

- `AuthContext` exposes `user, identity, profile, role, isAuthenticated, isLoading, isSubmitting, sessionError, signIn, signUp, signOut, refreshUser, updateProfile` and keeps the legacy `AuthUser` shape so existing screens are untouched.
- **Role always comes from `GET /users/me`.** The login portal's `expectedRole` only *rejects* a mismatch (`403 role_mismatch` + a link to the correct portal). Never from the URL, localStorage, the signup form, or `user_metadata`.
- **Startup:** read stored session → expired (or no refresh path) → clear → `GET /users/me` → 401/403 clears the session; network/5xx sets `sessionError` and leaves the user **unauthenticated** (no fake success).
- **Logout:** clears local state first, then `POST /auth/logout`; a failed revocation never leaves stale authenticated UI. Existing confirmation dialog in the profile menu is reused.
- **Auth pages** (student/college/recruiter/admin) call the real endpoints, block double submit, and render loading + error states. `session: null` from signup shows "check your email" and does **not** sign the user in.
- **Admin portal:** the client-side OTP that accepted a hardcoded `123456` was **deleted**; admin access now requires the server-assigned `admin` role.
- **ProfilePage:** reads from context, saves via `PUT /users/profile`, and reports success only after the persisted row comes back. Sections with no backend yet (skills, resume, password/2FA, delete account) render explicit "not connected yet" states instead of invented data.
- `src/services/index.ts` now holds **only** the mocks for later phases — `authService` and `profileService` were deleted.
- Env: `VITE_API_BASE_URL=http://localhost:8000/api/v1` (see `frontend/.env.example`). Vite `VITE_` prefix only; no backend secrets in the frontend.

**Verified 2026-09-15:** `pnpm exec tsc --noEmit` clean · `pnpm build` ✓ · backend `pytest` **40 passed** · headless-Chrome probe: login submit → real `POST /auth/login` → `503 auth_not_configured` → controlled error in the UI, URL unchanged, **no session stored** · unauthenticated `/dashboard` → `/landing` · `/auth/admin` no longer shows the demo OTP.

> ⚠️ The browser origin must be in the backend's `CORS_ALLOWED_ORIGINS`. A blocked origin is indistinguishable from an outage in the browser and surfaces as "Cannot reach the CareerOS server".

---

## 18. Backend Implementation — built 2026-09-15 (Phases 01/02/03)

> **The backend now exists.** Everything below is real code in
> `CareerOS-RuBI/backend/`. It is **not** yet connected to a live Supabase
> project, and **the frontend still runs on mock services** — see §19 work log
> for exact status. Do not describe Phase 03 as complete until the migration is
> applied and the UI→API→persistence→readback loop is demonstrated.

### What was built

| Area | File(s) | Notes |
|---|---|---|
| App factory | `app/main.py` | Request-ID middleware, CORS from allowlist, error handlers, router mount at `/api/v1` |
| Config | `app/core/config.py` | `Settings` (pydantic-settings) + `capability_report()` used by `/health` |
| JWT verification | `app/core/security.py` | JWKS (ES256/RS256/EdDSA) with in-process key cache; legacy HS256 via `SUPABASE_JWT_SECRET`; audience `authenticated`; `exp`/`sub` required |
| Roles | `app/core/roles.py` | `student\|college\|recruiter\|admin`; self-service signup excludes `admin` |
| Errors | `app/core/errors.py` | `ApiError` + handlers → one envelope for every failure |
| Deps | `app/api/deps.py` | `get_current_user`, `require_roles(...)`, service providers (all overridable in tests) |
| Schemas | `app/schemas/identity.py` | All contracts, `extra="forbid"` on every request model |
| Service | `app/services/auth_service.py` | Signup/login/logout/reset/identity/profile logic |
| Repository | `app/repositories/base.py` | Pool + `user_scoped_connection` (RLS) and `admin_connection` |
| Repository | `app/repositories/profiles.py` | Read/update own profile, list memberships; explicit column list + write whitelist |
| Integration | `app/integrations/supabase.py` | GoTrue REST: password grant, admin create user, role grant, recover, logout |
| Agents | `app/agents/__init__.py` | Placeholder with the rules agents must follow. **No agents implemented.** |

### Endpoints (verified against the running app)

| Method | Path | Auth | Behaviour |
|---|---|---|---|
| GET | `/api/v1/health` | none | `status` = `ok` only when auth verification **and** a database are configured, else `degraded`; lists capability booleans, never secrets |
| POST | `/api/v1/auth/signup` | none | `201`. Roles accepted: student/college/recruiter. Role written to `app_metadata` (service-role only). Returns `session: null` + message when email confirmation is required |
| POST | `/api/v1/auth/login` | none | `200` + Supabase tokens; `401 invalid_credentials`; `403 role_not_assigned` when no server-assigned role exists |
| POST | `/api/v1/auth/logout` | bearer | `204`, revokes the Supabase session |
| POST | `/api/v1/auth/password-reset` | none | `202`, never discloses whether the account exists |
| GET | `/api/v1/users/me` | bearer | identity + profile + organisation memberships. `profile: null` (not a fake profile) when the row is absent |
| PUT | `/api/v1/users/profile` | bearer | Partial update, `200` with the persisted row. `422` on unknown/invalid field, `400` on empty body, `404` if no profile |

### Authorisation model — do not weaken

1. Supabase Auth stays the **single session authority**. The API brokers signup/login so the platform role is assigned server-side; there is no second password/JWT system.
2. Signature and audience are always verified. Identity comes from verified claims only.
3. The platform role is read from **`app_metadata.role`** — never `user_metadata` (user-editable), never a header/body/URL param.
4. Routes declare roles with `require_roles(...)`; `403` responses list `required_roles`.
5. SQL runs as PostgreSQL role **`authenticated`** with the verified claims published via `set_config('request.jwt.claims', ...)`, so RLS re-checks ownership at the database. `DATABASE_URL` must be able to `SET ROLE authenticated`; the connection deliberately leaves the table-owning role so RLS is not bypassed.
6. The service-role key is used only for account provisioning/role grants, server-side. It must never reach the browser and must not serve user requests.

### Database

`supabase/migrations/20260915000001_core_identity.sql` — **written, not yet applied**:

- Tables: `profiles`, `colleges`, `recruiter_organizations`, `role_requirements`, `organization_memberships`, `student_college_memberships`.
- `handle_new_user` trigger creates exactly one profile row per `auth.users` insert; platform role lives in `raw_app_meta_data`, not in `profiles`.
- `app.current_college_ids()` / `app.current_recruiter_organization_ids()` are `SECURITY DEFINER` helpers so policies on membership tables do not recurse.
- RLS: users read/write only their own profile; membership rows are read-scoped but **not writable** by `authenticated`; verified colleges/orgs are readable, plus own tenant.
- Not covered yet: resumes, skills, roadmaps, interviews, jobs, applications, chat, analytics, `ai_runs`, `audit_logs`.

### Commands

```bash
cd CareerOS-RuBI/backend
python -m venv .venv
./.venv/Scripts/python.exe -m pip install -r requirements.txt
./.venv/Scripts/python.exe -m uvicorn app.main:app --reload --port 8000   # /docs in non-production
./.venv/Scripts/python.exe -m pytest                                     # 40 tests, no DB required
```

Frontend-facing env (`CareerOS-RuBI/frontend/.env.local`, Vite prefix):
`VITE_API_BASE_URL=http://localhost:8000/api/v1`.
Backend env: copy `backend/.env.example` → `backend/.env`.

### Test coverage

`40 passed` — token verification (wrong key, expiry, wrong audience, `alg:none`, missing `sub`, missing secret config), role guards (`403` for wrong/missing role), auth flows (duplicate email, weak password, admin self-assignment rejected, confirmation-required path, invalid credentials, logout revocation, reset non-disclosure), profile update (whitelist blocks `user_id`, invalid values `422`, empty body `400`, missing row `404`), config/capability reporting. Providers and the repository are replaced by dependency overrides, so **no test proves the SQL or RLS policies** — that is the biggest verification gap.

### Known limitations

- **Migration not applied; RLS never executed against a real project.** This is
  the single biggest gap: nothing in the identity path has been proven against
  live Supabase yet.
- **No token refresh.** The backend exposes no refresh endpoint, so an expired
  access token ends the session and the user signs in again. Token storage is
  `localStorage` (XSS-readable) — hardening to an httpOnly cookie is a later task.
- Google OAuth not wired; users without `app_metadata.role` get `403 role_not_assigned`.
- College staff cannot read student fields yet (needs an explicit visibility decision + scoped view, e.g. readiness scores only).
- JWKS fetch is synchronous inside async handlers (keys are cached).
- No `/analytics/dashboard`, no agents, no Qdrant, no storage, no n8n workflows (only the rules document).
- `ProfilePage` cannot clear a field (empty input is treated as "unchanged") and
  the backend has no endpoint for education/experience edits beyond
  `PUT /users/profile`.

### Next step

Apply the identity migration to a real Supabase project and configure
`SUPABASE_URL`, anon key, service-role key and `DATABASE_URL`, then walk the full
loop — signup → confirm → login → `/users/me` → profile save → readback →
logout — in the browser. Needs from the user: the Supabase credentials.
Until that happens Phase 03 stays **in progress**, not complete.

---

## 19. Work Log

| Date | Action | Status |
|---|---|---|
| 2026-09-15 | Read & synthesized `CareerOS_Development_Context.md` (1032 lines, 67KB) | ✅ Done |
| 2026-09-15 | Read & synthesized `CareerOS_Phased_Development_Playbook.md` (1053 lines, 60KB) | ✅ Done |
| 2026-09-15 | Created brain file + moved to workspace root | ✅ Done |
| 2026-09-15 | Figma frontend imported into `CareerOS-RuBI/frontend/` | ✅ Done |
| 2026-09-15 | Installed pnpm 10.34.3 globally; ran `pnpm install` (85 packages, clean) | ✅ Done |
| 2026-09-15 | Started dev server → http://localhost:8443 — 0 errors | ✅ Done |
| 2026-09-15 | Browser-verified all 21 routes render without JS errors | ✅ Done |
| 2026-09-15 | Confirmed auth guard redirects unauthenticated users to `/landing` | ✅ Done |
| 2026-09-15 | Confirmed auth login works in-browser (in-memory mock) | ✅ Done |
| 2026-09-15 | **Phase 00.1 COMPLETE** — full frontend inventory documented | ✅ Done |
| 2026-09-15 | **Phase 00.2 COMPLETE** — decisions reconciled: keep React+Vite (no Next.js migration); **n8n replaces LangGraph**; FastAPI brokers Supabase auth so the platform role is assigned server-side; PostgreSQL is authoritative, Qdrant derived | ✅ Done |
| 2026-09-15 | **Phase 01 started** — identity/profile contracts defined in `backend/app/schemas/identity.py`; error envelope fixed | 🟡 In progress |
| 2026-09-15 | **Phase 02 started** — `backend/` scaffold created per the required module layout; typed settings; `.env.example` | 🟡 In progress |
| 2026-09-15 | **Phase 03 backend slice** — signup/login/logout/password-reset, `GET /users/me`, `PUT /users/profile`; Supabase JWT verification; RLS-scoped SQL; migration written | 🟡 In progress |
| 2026-09-15 | Backend test suite: **40 passed** (`backend/.venv/Scripts/python.exe -m pytest`) | ✅ Done |
| 2026-09-15 | Live smoke test: uvicorn boot, `/health` reports `degraded` (no credentials), unauth `/users/me` → 401 envelope, OpenAPI lists 7 paths | ✅ Done |
| 2026-09-15 | **Phase 03 frontend wiring** — created `src/lib/api/{types,errors,client,auth,users}.ts` + `src/lib/session.ts` + `AuthLoading`; `AuthContext` now backend-driven with session restore | ✅ Done |
| 2026-09-15 | Wired student/college/recruiter auth pages to `/auth/login` + `/auth/signup`; password reset to `/auth/password-reset`; role-mismatch rejected with portal link | ✅ Done |
| 2026-09-15 | Removed the fake admin OTP (hardcoded `123456`); admin login now requires the server-assigned `admin` role | ✅ Done |
| 2026-09-15 | `ProfilePage` reads real profile state and saves through `PUT /users/profile`; unbacked sections show honest "not connected yet" states | ✅ Done |
| 2026-09-15 | Deleted `authService`/`profileService` from `services/index.ts`; remaining mocks explicitly listed in the file header | ✅ Done |
| 2026-09-15 | Frontend checks: `pnpm exec tsc --noEmit` clean (fixed 1 pre-existing type error in `supportService`), `pnpm build` ✓ | ✅ Done |
| 2026-09-15 | Degraded-backend probe (headless Chrome + DevTools): login submit hit real `POST /auth/login`, backend returned `503 auth_not_configured`, UI showed a controlled error, **no session persisted, no fake login** | ✅ Done |
| 2026-09-15 | Browser checks: unauthenticated `/dashboard` → `/landing`; `/auth/student`, `/auth/college` render; `/auth/admin` shows no OTP step | ✅ Done |
| 2026-09-15 | Backend tests re-run after frontend work: **40 passed** (no contract breakage) | ✅ Done |
| — | **Phase 03 NOT complete**: apply the migration + configure live Supabase, then verify UI → API → Supabase → persistence → readback | ⬜ **Next — blocked on credentials** |

---

*Living document — update Work Log and Frontend Inventory after each action. Never mark a phase done without evidence.*
