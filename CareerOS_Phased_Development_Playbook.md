# CareerOS — Phased Development Playbook

> Prepared: 2026-09-05. A detailed execution guide for Google Antigravity or another coding agent.
> Companion files: **CareerOS_Development_Context.md** (product/contracts/status) and **CareerOS_Figma_Frontend_Playbook.md** (Figma design, frontend tasks, prompts, and quality).
> This is a plan for implementation, not a claim that the repository has been built or tested.

## 1. How to use this playbook

The frontend will be made in Figma. Use the separate frontend playbook to design/refine it and prepare the code handoff. Use this file for repository work, backend/data/AI implementation, frontend wiring, testing, deployment, and demo readiness. Earlier frontend exports may exist: inspect and reuse useful work instead of assuming a mandatory clean rebuild.

**Confirmed scope:** Students, Recruiters, College Admins, Super Admins, and public visitors. Include a separate **/roadmap** screen. The product's core is the connected student–college–recruiter feedback loop.

For each subphase:

1. Read its prerequisites and the relevant context sections.
2. Give the agent the repository, this file, the context, and the corresponding Figma handoff when available.
3. Paste the universal wrapper below, then the subphase prompt.
4. Work through the tasks and inspect the actual output.
5. Check the phase gate with evidence before proceeding to dependent work.
6. Update the phase report and unfinished-ticket list. Do not restart completed phases unnecessarily.

Prompts are scoped work orders, not guarantees. Replace bracketed inputs with real information. If a repository, credential, or required decision is absent, record it; never invent a successful operation. Routine reversible work within the user's authorization can continue without ceremonial approval between files.

### Evidence and decision rules

- Product intent and established paths come from the context; preserve their semantics.
- Field-level additions, proposed endpoint names, scoring formulas, token values, and operational targets remain implementation choices until reconciled with actual code.
- Historical “implemented” status must be checked. The old map lists ARIA working, Twin partial, and several stubs; a later statement claims all features exist without a technical audit.
- Use actual dependency lockfiles and provider configuration. This guide does not verify current SDK availability or prescribe unverified commands.
- Read current official provider documentation when implementing provider-specific details. A historical model name is not evidence it is available on the deployment account.

## 2. Universal coding-agent wrapper

Paste this before a subphase prompt.

```text
You are implementing CareerOS, an AI career platform connecting students,
colleges, and recruiters. Read CareerOS_Development_Context.md and repository
instructions. Use CareerOS_Phased_Development_Playbook.md for execution and
CareerOS_Figma_Frontend_Playbook.md for approved frontend expectations.

Current subphase: [ID AND TITLE]
Repository/branch: [ACTUAL LOCATION]
Figma screen/component reference: [AVAILABLE REFERENCE OR NOT YET READY]
Known constraints: [CONSTRAINTS]

Inspect existing implementation before editing. Preserve working code and the
approved Figma design. Use the established stack and API contracts; explicitly
label and document necessary additions. Implement this subphase end to end:
UI action -> authorized API -> validated service/agent -> persistence -> readback
-> honest UI state. Include failure and unauthorized cases.

Do not rewrite unrelated modules, hardcode production metrics, expose secrets,
claim unrun tests, or silently replace provider failures with fixtures.
Follow current user authorization; do not create a new approval ritual.

Return: findings, exact changes, contract/migration changes, verification results,
remaining gaps, and the next dependency-ordered action. Update implementation
status using evidence. If blocked, state the exact missing input and continue
independent authorized work where possible.
```

## 3. Sequence and dependencies

Design and engineering can progress independently where dependencies allow; this is a workstream plan, not an instruction to spawn additional agents.

| Engineering work | Figma/frontend counterpart | Integration condition |
|---|---|---|
| 00–01 inventory/contracts | F00–F02 brief, IA, wireframes | Agree on route/action/data map |
| 02 foundation | F03 tokens/components | Real manifests and export shape understood |
| 03 identity/profile | F04 shell/auth/profile/dashboard | Auth and form states designed |
| 04–06 Twin/resume/skills/roadmap | F05 connected intelligence screens | Contract-shaped components available |
| 07–09 ARIA/ECHO/jobs/recruiter | F06–F07 | Lifecycle states and response types agreed |
| 10 institutional/admin | F07 | Metric definitions and permission scope agreed |
| 11 integration | F08–F09 | Full state catalog and exported frontend available |
| 12–13 QA/release | F10 | Rendered design and real behavior both verified |

The established implementation priority remains Auth/Profile → existing Twin wiring → Resume → Skills/Roadmap → Interviews → Matching/Recruiter → College/Admin telemetry. ARIA already exists historically: preserve it and extend context when evidence is ready. Shared AI/provider plumbing may be introduced in the earliest phase that needs it; phase 07 refines orchestration rather than delaying all AI until then.

### Phase overview

| Phase | Outcome |
|---|---|
| 00 — Establish the baseline and execution scope | A trustworthy inventory of existing code, selected Figma work, and missing integrations. |
| 01 — Agree on flows, contracts, and the Figma handoff boundary | Design and backend work share the same actions and data definitions. |
| 02 — Prepare repository, environments, and continuous checks | A reproducible development environment with safe configuration and a runnable foundation. |
| 03 — Identity, organization model, and profile persistence | Every request has verified identity and a correct access scope. |
| 04 — Wire the existing Career Twin and define score semantics | The hero screen shows a saved backend result rather than mock arrays. |
| 05 — Resume ingestion, structured evidence, and vector indexing | One uploaded resume becomes trustworthy shared input across modules. |
| 06 — Skill Gap Intelligence and the dedicated Roadmap screen | A student can diagnose a gap, follow a saved plan, and resume progress. |
| 07 — ARIA context and bounded agent orchestration | Mentoring responds to the user's actual career state and returns actionable guidance. |
| 08 — ECHO interview sessions and feedback | A complete interview session ends in saved, explainable feedback. |
| 09 — Jobs, matching, and recruiter workflow | A recommendation becomes an actual application managed by the correct recruiter. |
| 10 — College intelligence and Super Admin operations | Institutional and operational dashboards describe real scoped data. |
| 11 — Close the intelligence loop and remove integration gaps | All modules act on coherent versioned state rather than isolated snapshots. |
| 12 — Quality, accessibility, security, and operational readiness | Evidence supports release of the intended scope. |
| 13 — Deploy, rehearse, and hand over | A verified running release and a reliable connected demo. |

## 4. Detailed phases and subphases

## Phase 00 — Establish the baseline and execution scope

**Prerequisites:** None. Read the context file and this playbook first.

**Outcome:** A trustworthy inventory of existing code, selected Figma work, and missing integrations.

### 00.1 — Inspect existing work

**Tasks:** Locate the actual repository, branch, exported Figma code, manifests, migrations, API routers, tests, environment examples, and deployment files. Record working screens and modules with evidence. Preserve any functioning ARIA and Twin integrations.

**Deliverable:** A baseline inventory with paths, run results, and verified/partial/stubbed/absent statuses.

**Copy-paste prompt:**

```text
Inspect the actual CareerOS repository without changing code. Inventory frontend routes, API clients, routers, agents, tables, migrations, tests, and environment configuration. Compare against CareerOS_Development_Context.md. Report evidence for each status and identify the earliest incomplete dependency.
Scope: subphase 00.1. Inspect existing code, complete the described behavior,
and verify the deliverable. Apply the universal coding-agent wrapper.
```

### 00.2 — Reconcile decisions

**Tasks:** Record dedicated /roadmap as required. Use the new Figma frontend track for new or revised screens; preserve useful existing components instead of deleting previous exports. Resolve API prefix, actual frontend framework, organization model, and which deployment configuration already exists.

**Deliverable:** A decision ledger separating confirmed requirements, proposed choices, and blockers.

**Copy-paste prompt:**

```text
Reconcile CareerOS requirements with the repository. Preserve the required /roadmap screen and existing working code. List contradictory framework, auth, contract, and deployment assumptions. Choose reversible defaults where supported; identify only decisions that materially block the next phase.
Scope: subphase 00.2. Inspect existing code, complete the described behavior,
and verify the deliverable. Apply the universal coding-agent wrapper.
```

### 00.3 — Create the implementation board

**Tasks:** Create one ticket per subphase with dependencies, affected screen, API, persistence, and acceptance evidence. Distinguish backend tickets from Figma design and integration tickets. Mark placeholders visibly.

**Deliverable:** A dependency-ordered board and a reproducible baseline.

**Copy-paste prompt:**

```text
Create a CareerOS implementation board from this playbook. Each ticket must state prerequisites, user-visible behavior, UI entry point, API, database effects, negative cases, and definition of done. Do not mark a ticket complete based on a file or router existing.
Scope: subphase 00.3. Inspect existing code, complete the described behavior,
and verify the deliverable. Apply the universal coding-agent wrapper.
```

### Phase 00 — do's, don'ts, and gate

- **Do:** inspect before coding; preserve working paths; attach evidence to status.
- **Don't:** trust old completion claims blindly, start with a rewrite, or choose a new stack for novelty.
- **Exit gate:** The project can be located and its actual state explained; any inability to run it is documented with an actionable fix.
- **Evidence to record:** affected files; UI/action result; API/schema changes; saved-record readback; relevant negative case; checks run and actual results.

## Phase 01 — Agree on flows, contracts, and the Figma handoff boundary

**Prerequisites:** 00; frontend phases F00–F02 can run alongside contract planning.

**Outcome:** Design and backend work share the same actions and data definitions.

### 01.1 — Action-to-contract map

**Tasks:** Map all 14 routes and their primary/secondary actions. Include loading, empty, pending, failure, permission-denied, and success states. Preserve source API paths; label additions as proposed.

**Deliverable:** A complete screen/action/request/response/persistence matrix.

**Copy-paste prompt:**

```text
Build a contract matrix for all CareerOS routes including /roadmap, /college, /recruiter, and /admin. Preserve established API paths. For each interactive control define payload, response fields, authorization, persistence, and UI states. Flag missing contracts before implementing their controls.
Scope: subphase 01.1. Inspect existing code, complete the described behavior,
and verify the deliverable. Apply the universal coding-agent wrapper.
```

### 01.2 — Shared data definitions

**Tasks:** Define score scales, timestamps, INR salary units, IDs, pagination, status enums, error envelopes, and structured AI schemas. Specify null/unknown separately from zero. Resolve /api/v1 once.

**Deliverable:** Typed schemas/OpenAPI plan and representative fixtures.

**Copy-paste prompt:**

```text
Define shared CareerOS data contracts that match the current backend and Figma view needs. Specify score ranges, unknown values, status transitions, pagination, timestamps, errors, and API prefix ownership. Use adapters for legacy differences rather than silently breaking the UI.
Scope: subphase 01.2. Inspect existing code, complete the described behavior,
and verify the deliverable. Apply the universal coding-agent wrapper.
```

### 01.3 — Fixture and handoff agreement

**Tasks:** Create consistent fictional personas and contract-shaped data for design. Include sparse, long, failed, and stale cases. Export component mapping and asset expectations. Fixtures must never be silent production fallbacks.

**Deliverable:** A fixture catalog and design-to-code handoff checklist.

**Copy-paste prompt:**

```text
Prepare contract-shaped development fixtures for one connected CareerOS student, college, recruiter, job, application, and learning plan. Include first-use, populated, error, stale, and completed variants. Separate fixture adapters from live API adapters and document the production boundary.
Scope: subphase 01.3. Inspect existing code, complete the described behavior,
and verify the deliverable. Apply the universal coding-agent wrapper.
```

### Phase 01 — do's, don'ts, and gate

- **Do:** settle names and units before drawing detailed charts; design difficult states early.
- **Don't:** invent an endpoint for each decorative widget or hardcode the 72% example into production logic.
- **Exit gate:** A designer and backend engineer can independently build the same flow from the contracts.
- **Evidence to record:** affected files; UI/action result; API/schema changes; saved-record readback; relevant negative case; checks run and actual results.

## Phase 02 — Prepare repository, environments, and continuous checks

**Prerequisites:** 00–01.

**Outcome:** A reproducible development environment with safe configuration and a runnable foundation.

### 02.1 — Preserve and organize the codebase

**Tasks:** Keep actual framework structure where viable. Separate API, schema, service, agent, repository, and provider responsibilities. Establish frontend token/component/API-client directories after reviewing the Figma export.

**Deliverable:** A runnable repository with documented boundaries.

**Copy-paste prompt:**

```text
Prepare the CareerOS project structure around existing code. Preserve working modules and exported visual components. Introduce only necessary boundaries for schemas, services, agents, repositories, provider adapters, frontend tokens, and the API client. Explain every move.
Scope: subphase 02.1. Inspect existing code, complete the described behavior,
and verify the deliverable. Apply the universal coding-agent wrapper.
```

### 02.2 — Configure services

**Tasks:** Validate required settings without printing secrets. Configure development Supabase, private buckets, Gemini, Qdrant, and later ElevenLabs. Pin compatible versions from actual manifests; do not claim historical version numbers are current recommendations.

**Deliverable:** Sanitized .env.example and setup instructions.

**Copy-paste prompt:**

```text
Implement validated CareerOS configuration using the actual manifests and provider integration. Document public frontend settings separately from backend secrets. Add startup checks with actionable missing-setting errors and no secret values in logs.
Scope: subphase 02.2. Inspect existing code, complete the described behavior,
and verify the deliverable. Apply the universal coding-agent wrapper.
```

### 02.3 — Baseline checks

**Tasks:** Add appropriate lint/type/build and backend test commands to CI. Use test databases/fixtures. Record health check behavior. Defer deployment until the release phase.

**Deliverable:** A baseline CI run with explicit results.

**Copy-paste prompt:**

```text
Set up or repair CareerOS baseline CI using the repository's package manager and test tooling. Run frontend type/build checks and backend tests without live paid AI dependencies. Record existing failures separately from new changes.
Scope: subphase 02.3. Inspect existing code, complete the described behavior,
and verify the deliverable. Apply the universal coding-agent wrapper.
```

### Phase 02 — do's, don'ts, and gate

- **Do:** commit sanitized examples and lockfiles; use reproducible commands.
- **Don't:** commit credentials, run tests on production data, or replace dependencies without need.
- **Exit gate:** Another developer can follow setup, start both services, and reproduce baseline checks.
- **Evidence to record:** affected files; UI/action result; API/schema changes; saved-record readback; relevant negative case; checks run and actual results.

## Phase 03 — Identity, organization model, and profile persistence

**Prerequisites:** 02. This is the first implementation priority from the context.

**Outcome:** Every request has verified identity and a correct access scope.

### 03.1 — Supabase identity lifecycle

**Tasks:** Implement or verify email authentication, Google OAuth, refresh, logout, callback errors, protected routes, and /users/me. Reconcile direct SDK login versus backend auth wrappers; maintain one session authority.

**Deliverable:** Working auth flows and session restoration.

**Copy-paste prompt:**

```text
Complete CareerOS authentication using the existing Supabase integration. Connect /auth and protected navigation, handle expired sessions and OAuth callback failure, and derive backend identity from verified tokens. Do not create a competing password/JWT system.
Scope: subphase 03.1. Inspect existing code, complete the described behavior,
and verify the deliverable. Apply the universal coding-agent wrapper.
```

### 03.2 — Organization grants and RLS

**Tasks:** Model student-college relationships and recruiter/college staff memberships. Use server-controlled role grants. Implement database and API restrictions. Test two students, two colleges, and two recruiter organizations.

**Deliverable:** Migrations, policies, and negative access tests.

**Copy-paste prompt:**

```text
Implement CareerOS role and tenant authorization for Student, Recruiter, College Admin, and Super Admin. Public role selection must not grant privileged access. Enforce membership on APIs, RLS, storage, and future search filters. Test cross-user and cross-organization denial.
Scope: subphase 03.2. Inspect existing code, complete the described behavior,
and verify the deliverable. Apply the universal coding-agent wrapper.
```

### 03.3 — Profile and onboarding

**Tasks:** Persist target role, education, experience, interests, study pace where appropriate, and discoverability. Design explicit unknown/empty states. Let independent students onboard without a college.

**Deliverable:** Profile save/readback and onboarding progression.

**Copy-paste prompt:**

```text
Wire the Figma Profile and onboarding flows to real persisted CareerOS data. Implement validated save, unsaved-change handling, readback, and session restoration. Avoid requiring users to reenter the same target or skills on every page.
Scope: subphase 03.3. Inspect existing code, complete the described behavior,
and verify the deliverable. Apply the universal coding-agent wrapper.
```

### Phase 03 — do's, don'ts, and gate

- **Do:** use server-derived identity and test denied access.
- **Don't:** trust role switches, URL IDs, or frontend hidden menus as authorization.
- **Exit gate:** All roles route correctly; profile changes survive login; unrelated accounts cannot read or modify each other's data.
- **Evidence to record:** affected files; UI/action result; API/schema changes; saved-record readback; relevant negative case; checks run and actual results.

## Phase 04 — Wire the existing Career Twin and define score semantics

**Prerequisites:** 03; complete richer evidence refresh after phases 05–06.

**Outcome:** The hero screen shows a saved backend result rather than mock arrays.

### 04.1 — Validate Twin contract

**Tasks:** Preserve POST /career-twin/get-career-twin and its legacy request/response fields. Validate timeframe, target salary, role, and source evidence. Document fidelity/alignment meaning and unknowns.

**Deliverable:** Compatible typed endpoint and honest score descriptions.

**Copy-paste prompt:**

```text
Audit and complete the existing Career Twin endpoint without breaking its contract. Preserve target_role, timeframe_years, target_salary_inr and existing response names. Document score semantics and insufficient-evidence behavior; do not label generated scores as calibrated accuracy.
Scope: subphase 04.1. Inspect existing code, complete the described behavior,
and verify the deliverable. Apply the universal coding-agent wrapper.
```

### 04.2 — Persist versioned results

**Tasks:** Save input/evidence version, target, output, generated time, and model/schema version. Provide authorized latest/readback behavior. Reject stale writes when newer input has superseded a request.

**Deliverable:** Saved, retrievable Twin records.

**Copy-paste prompt:**

```text
Add authorized Career Twin persistence and readback. Record evidence and target versions, prevent older in-flight requests from overwriting newer targets, and return a clear stale/insufficient-data state.
Scope: subphase 04.2. Inspect existing code, complete the described behavior,
and verify the deliverable. Apply the universal coding-agent wrapper.
```

### 04.3 — Connect Figma view

**Tasks:** Map real fields into trajectory, gaps, and actions. Handle null/empty trajectory, loading, failure, and regenerate. Navigate relevant actions to /skills, /roadmap, or /mentor.

**Deliverable:** A functional /career-twin screen.

**Copy-paste prompt:**

```text
Connect the approved Figma Career Twin screen to the backend through the shared typed API client. Remove production mock arrays. Preserve the design while supporting saved results, target changes, errors, and navigation to Skills and Roadmap.
Scope: subphase 04.3. Inspect existing code, complete the described behavior,
and verify the deliverable. Apply the universal coding-agent wrapper.
```

### Phase 04 — do's, don'ts, and gate

- **Do:** show provenance and scenario assumptions.
- **Don't:** promise salary/placement outcomes or fill missing values with impressive numbers.
- **Exit gate:** Target changes produce corresponding data, reload restores results, and missing evidence is clearly represented.
- **Evidence to record:** affected files; UI/action result; API/schema changes; saved-record readback; relevant negative case; checks run and actual results.

## Phase 05 — Resume ingestion, structured evidence, and vector indexing

**Prerequisites:** 03; 04 wiring can be retained while evidence improves.

**Outcome:** One uploaded resume becomes trustworthy shared input across modules.

### 05.1 — File lifecycle

**Tasks:** Implement multipart upload, size/type checks, private storage, owner access, statuses, content hash/versioning, and deletion. Decide explicit scanned/encrypted PDF handling.

**Deliverable:** A secure upload lifecycle and honest failure states.

**Copy-paste prompt:**

```text
Implement POST /resumes/upload-resume file handling with validated PDF input, private storage, ownership, versioning, and observable processing states. Unsupported or unparseable documents must fail clearly without inventing analysis.
Scope: subphase 05.1. Inspect existing code, complete the described behavior,
and verify the deliverable. Apply the universal coding-agent wrapper.
```

### 05.2 — Parse and analyze

**Tasks:** Extract text, run typed Gemini analysis, persist structured education/experience/skills and ATS feedback. Preserve evidence source and allow later correction instead of overwriting verified skills with guesses.

**Deliverable:** Validated resume analysis and normalized skills.

**Copy-paste prompt:**

```text
Implement resume extraction and schema-validated Gemini analysis. Save extracted claims with provenance, normalize skill names, preserve existing evidence, and distinguish ATS feedback from verified qualifications. Handle malformed model output and provider timeouts.
Scope: subphase 05.2. Inspect existing code, complete the described behavior,
and verify the deliverable. Apply the universal coding-agent wrapper.
```

### 05.3 — Index and refresh

**Tasks:** Choose embedding model/dimensions, upsert deterministic Qdrant IDs, track index status, retry partial failures, and remove stale vectors. Invalidate Twin/gaps/matching after evidence changes.

**Deliverable:** A repeatable indexing flow and downstream refresh.

**Copy-paste prompt:**

```text
Connect resume analysis to Qdrant using compatible configured embeddings and scoped payloads. Make indexing retryable and idempotent, clean obsolete vectors on replacement/deletion, and trigger versioned refresh of dependent CareerOS results.
Scope: subphase 05.3. Inspect existing code, complete the described behavior,
and verify the deliverable. Apply the universal coding-agent wrapper.
```

### Phase 05 — do's, don'ts, and gate

- **Do:** preserve database success if indexing needs retry; show processing status.
- **Don't:** use public resume URLs or equate extraction with verification.
- **Exit gate:** A real sample PDF produces saved evidence used by another module; invalid input and partial indexing failure are recoverable.
- **Evidence to record:** affected files; UI/action result; API/schema changes; saved-record readback; relevant negative case; checks run and actual results.

## Phase 06 — Skill Gap Intelligence and the dedicated Roadmap screen

**Prerequisites:** 03–05 and frontend F05 screen specifications.

**Outcome:** A student can diagnose a gap, follow a saved plan, and resume progress.

### 06.1 — Role requirements and diagnosis

**Tasks:** Define an authorized source or labeled demo catalog for role requirements. Version scoring, represent unknown proficiency, rank gaps with explainable weights, and recalculate on target change.

**Deliverable:** Dynamic /skills data with traceable priorities.

**Copy-paste prompt:**

```text
Implement CareerOS Skill Gap Intelligence using normalized evidence and versioned target-role requirements. Return current/required skills, readiness, gaps, priorities, recommendations, and uncertainty. Define heuristic scoring explicitly and avoid counting unknown evidence as confirmed failure.
Scope: subphase 06.1. Inspect existing code, complete the described behavior,
and verify the deliverable. Apply the universal coding-agent wrapper.
```

### 06.2 — Learning-plan generation

**Tasks:** Use existing POST /roadmap/get-roadmap. Validate pace and selected target; resolve canonical skills server-side. Generate bounded weekly milestones with prerequisites, resources, and outcomes; persist before returning success.

**Deliverable:** Typed, saved roadmaps with feasible weekly effort.

**Copy-paste prompt:**

```text
Implement the Learning Agent and existing roadmap generation API. Use real skill gaps and available hours, validate a structured weekly plan, include Learn/Build/Practice milestones and resource provenance, and save the plan with target/evidence version.
Scope: subphase 06.2. Inspect existing code, complete the described behavior,
and verify the deliverable. Apply the universal coding-agent wrapper.
```

### 06.3 — Roadmap execution and revision

**Tasks:** Build /roadmap as separate navigation. Add active/read endpoints, complete/reopen persistence, per-student ownership, next incomplete milestone, stale-plan banner, and reviewable new versions preserving completed work.

**Deliverable:** Skills → Roadmap → progress → Dashboard → resume flow.

**Copy-paste prompt:**

```text
Wire /roadmap to the saved-plan APIs. Add direct load, Continue Roadmap, focused skill entry, milestone complete/reopen, saving failures, and stale-plan revision. Preserve completed work and distinguish learning completion from assessed proficiency. Test reload and cross-user access.
Scope: subphase 06.3. Inspect existing code, complete the described behavior,
and verify the deliverable. Apply the universal coding-agent wrapper.
```

### Phase 06 — do's, don'ts, and gate

- **Do:** make /skills diagnosis and /roadmap execution distinct; preserve version history.
- **Don't:** generate a new plan on every visit, duplicate plans per click, or silently award skill mastery.
- **Exit gate:** The student completes and reloads a milestone, resumes from Dashboard, and sees consistent progress and context in ARIA.
- **Evidence to record:** affected files; UI/action result; API/schema changes; saved-record readback; relevant negative case; checks run and actual results.

## Phase 07 — ARIA context and bounded agent orchestration

**Prerequisites:** 03–06. Preserve the historically working chat integration.

**Outcome:** Mentoring responds to the user's actual career state and returns actionable guidance.

### 07.1 — Chat persistence and context

**Tasks:** Preserve POST /chat/ and adapt legacy ai role format. Persist conversations; retrieve owned profile, resume, Twin, gaps, and plan context. Limit history and redact logs.

**Deliverable:** Contextual saved conversations.

**Copy-paste prompt:**

```text
Extend existing ARIA without a rewrite. Preserve its API, persist conversations, and retrieve authorized current CareerOS evidence and roadmap context. Treat client history as untrusted text; validate agent_type and prevent cross-user memory mixing.
Scope: subphase 07.1. Inspect existing code, complete the described behavior,
and verify the deliverable. Apply the universal coding-agent wrapper.
```

### 07.2 — LangGraph responsibilities

**Tasks:** Map Career, Resume, Learning, Interview, Job, and Analytics responsibilities without duplicate agents for brand names. Define typed shared state, retries, timeouts, provenance, and tool permissions.

**Deliverable:** A bounded, observable workflow.

**Copy-paste prompt:**

```text
Implement or refine LangGraph routing only where multi-step orchestration is needed. Use typed state with request ID, authorized context, evidence versions, sources, results, and errors. Keep tool authorization outside model prompts and avoid unnecessary agent calls for CRUD.
Scope: subphase 07.2. Inspect existing code, complete the described behavior,
and verify the deliverable. Apply the universal coding-agent wrapper.
```

### 07.3 — Actions and grounded advice

**Tasks:** Support links into plan/milestone, gaps, resume suggestions, and interview preparation. Use retrieval with provenance. Any proposed mutation becomes an explicit UI action, not an invisible chat side effect.

**Deliverable:** Actionable mentoring with safe persisted behavior.

**Copy-paste prompt:**

```text
Connect ARIA quick actions to real CareerOS routes and owned entities. Ground advice in saved context and retrieved sources. Return structured suggested actions; do not silently modify goals, applications, or roadmap progress from free-form model text.
Scope: subphase 07.3. Inspect existing code, complete the described behavior,
and verify the deliverable. Apply the universal coding-agent wrapper.
```

### Phase 07 — do's, don'ts, and gate

- **Do:** test context-dependent answers and failure recovery.
- **Don't:** attach all database records to every prompt or call every agent for each chat.
- **Exit gate:** ARIA can explain this student's next roadmap step using persisted evidence, and cannot expose another user's data.
- **Evidence to record:** affected files; UI/action result; API/schema changes; saved-record readback; relevant negative case; checks run and actual results.

## Phase 08 — ECHO interview sessions and feedback

**Prerequisites:** 03, 05, 07; provider credentials and transport decision.

**Outcome:** A complete interview session ends in saved, explainable feedback.

### 08.1 — Session lifecycle

**Tasks:** Define interview type/difficulty enums and setup; authorize start, reconnect, and end. Select actual ElevenLabs transport and short-lived credentials; include microphone-denied path.

**Deliverable:** Documented session states and authorized start endpoint.

**Copy-paste prompt:**

```text
Implement ECHO session lifecycle using the selected ElevenLabs integration. Preserve POST /voice/start-session and reconcile WS /voice/ws/{session_id}. Define session ownership, expiry, reconnect, cancellation, and microphone-denied behavior without exposing provider keys.
Scope: subphase 08.1. Inspect existing code, complete the described behavior,
and verify the deliverable. Apply the universal coding-agent wrapper.
```

### 08.2 — Conversation transport

**Tasks:** Handle live input/output, mute, interruption if supported, transcript, reconnect, and accessible non-audio feedback. Never animate fake listening or scoring.

**Deliverable:** Working live conversation with truthful states.

**Copy-paste prompt:**

```text
Connect the Figma ECHO UI to actual voice transport. Show connecting/listening/speaking/disconnected states based on real events, persist necessary transcript segments, handle retries, and provide an explicitly labeled alternative if voice is unavailable.
Scope: subphase 08.2. Inspect existing code, complete the described behavior,
and verify the deliverable. Apply the universal coding-agent wrapper.
```

### 08.3 — End and assess

**Tasks:** Finalize transcript once; evaluate with a versioned answer-based rubric, persist feedback, and attach relevant skill evidence. Define retention before recording audio.

**Deliverable:** Saved interview results and evidence refresh.

**Copy-paste prompt:**

```text
Finalize ECHO interviews idempotently, validate rubric-based feedback, and persist results for readback. Score answer quality and observable communication criteria, not inferred personality or voice identity. Update only relevant career evidence and test interrupted sessions.
Scope: subphase 08.3. Inspect existing code, complete the described behavior,
and verify the deliverable. Apply the universal coding-agent wrapper.
```

### Phase 08 — do's, don'ts, and gate

- **Do:** rehearse permissions and unstable network behavior.
- **Don't:** infer personality from voice or show random live confidence values.
- **Exit gate:** A user starts, completes, reloads, and reviews a session; disconnect does not fabricate completion.
- **Evidence to record:** affected files; UI/action result; API/schema changes; saved-record readback; relevant negative case; checks run and actual results.

## Phase 09 — Jobs, matching, and recruiter workflow

**Prerequisites:** 03, 05, 07; jobs and visibility policy.

**Outcome:** A recommendation becomes an actual application managed by the correct recruiter.

### 09.1 — Jobs and semantic retrieval

**Tasks:** Implement job ownership, status, requirements, authorized sources or fixtures, embeddings, filtering and ranking explanations. Distinguish similarity from probability.

**Deliverable:** Matching jobs and eligible candidates.

**Copy-paste prompt:**

```text
Implement CareerOS job data and POST /recommendations/jobs using configured Qdrant embeddings and explicit filters. Support empty results, stale jobs, and explanations. Do not present cosine similarity as a probability of getting hired.
Scope: subphase 09.1. Inspect existing code, complete the described behavior,
and verify the deliverable. Apply the universal coding-agent wrapper.
```

### 09.2 — Applications and pipeline

**Tasks:** Persist application/resume version, enforce duplicate policy, define allowed transitions, and expose owned recruiter lists/details. Keep stage updates auditable.

**Deliverable:** Student submission and recruiter pipeline readback.

**Copy-paste prompt:**

```text
Implement POST /applications/apply and recruiter application management. Persist the submitted resume version, prevent duplicate accidental submissions, enforce job organization ownership, validate stage transitions, and return actionable errors to the frontend.
Scope: subphase 09.2. Inspect existing code, complete the described behavior,
and verify the deliverable. Apply the universal coding-agent wrapper.
```

### 09.3 — Talent search and feedback

**Tasks:** Implement search-candidates with authorized visibility, detail drilldown, shortlists, and outcome feedback. Store feedback audience/scope and version before reuse.

**Deliverable:** Recruiter discovery and persisted feedback.

**Copy-paste prompt:**

```text
Complete POST /recruiter/search-candidates, authorized candidate detail, shortlists, and application feedback. Filter visibility before returning vector results and recheck database authorization. Store hiring outcomes and feedback with provenance and scope for the closed loop.
Scope: subphase 09.3. Inspect existing code, complete the described behavior,
and verify the deliverable. Apply the universal coding-agent wrapper.
```

### Phase 09 — do's, don'ts, and gate

- **Do:** preserve resume snapshots and recruiter ownership.
- **Don't:** expose private chats or treat a shortlist as a job offer.
- **Exit gate:** One student application appears for its recruiter only; feedback persists and has a defined downstream consumer.
- **Evidence to record:** affected files; UI/action result; API/schema changes; saved-record readback; relevant negative case; checks run and actual results.

## Phase 10 — College intelligence and Super Admin operations

**Prerequisites:** 03, 05–09; actual student activity and outcomes.

**Outcome:** Institutional and operational dashboards describe real scoped data.

### 10.1 — College roster and metrics

**Tasks:** Implement department/batch filters, enrollment scope, readiness coverage, learning/interview summaries, and outcome aggregates. Define denominators and unknowns.

**Deliverable:** Accurate tenant-scoped college views.

**Copy-paste prompt:**

```text
Build College Admin APIs from actual student memberships and persisted activity. Return roster, department/batch filters, readiness coverage, learning progress, and placement outcomes with definitions and denominators. Enforce organization scope in all queries.
Scope: subphase 10.1. Inspect existing code, complete the described behavior,
and verify the deliverable. Apply the universal coding-agent wrapper.
```

### 10.2 — Interventions and reports

**Tasks:** Design concrete follow-up actions, recruiter engagement, candidate sharing, and exports only where implementation supports them. AI summaries explain aggregate results.

**Deliverable:** Actionable drilldowns and working report actions.

**Copy-paste prompt:**

```text
Connect the Figma College screen to roster drilldowns and supported intervention/report workflows. Any export must respect current filters and authorization. Use AI only to summarize real metrics; represent insufficient cohort data explicitly.
Scope: subphase 10.2. Inspect existing code, complete the described behavior,
and verify the deliverable. Apply the universal coding-agent wrapper.
```

### 10.3 — Admin telemetry

**Tasks:** Implement privileged user/system views, provider run status, health, usage, and audit access. Avoid logging raw resumes/chat in dashboards.

**Deliverable:** Restricted operational tools.

**Copy-paste prompt:**

```text
Implement the necessary Super Admin telemetry and role checks. Show actual service/run status, failures, and usage with useful filtering. Protect privileged actions server-side and redact secrets and private user content from operational logs.
Scope: subphase 10.3. Inspect existing code, complete the described behavior,
and verify the deliverable. Apply the universal coding-agent wrapper.
```

### Phase 10 — do's, don'ts, and gate

- **Do:** label observation periods and metric definitions.
- **Don't:** let an LLM invent totals, show false live badges, or expose global data to colleges.
- **Exit gate:** Known seeded records reconcile with counts; a second college sees only its authorized students.
- **Evidence to record:** affected files; UI/action result; API/schema changes; saved-record readback; relevant negative case; checks run and actual results.

## Phase 11 — Close the intelligence loop and remove integration gaps

**Prerequisites:** 04–10.

**Outcome:** All modules act on coherent versioned state rather than isolated snapshots.

### 11.1 — Event and invalidation graph

**Tasks:** Define resume analyzed, target changed, milestone updated, interview finalized, job changed, application submitted, and outcome recorded. Assign persistence, derived updates, and UI invalidation.

**Deliverable:** An explicit dependency/event map.

**Copy-paste prompt:**

```text
Implement CareerOS event-driven or explicit service-triggered refresh for the documented lifecycle. Persist authoritative changes first, update derived results with input versions, and invalidate relevant frontend queries. Avoid recursive regeneration loops.
Scope: subphase 11.1. Inspect existing code, complete the described behavior,
and verify the deliverable. Apply the universal coding-agent wrapper.
```

### 11.2 — Retries and consistency

**Tasks:** Handle partial index failure, duplicated webhook/event, interrupted generation, stale result, and concurrent updates. Use idempotent operations and user-readable pending status.

**Deliverable:** Recoverable behavior and targeted regression cases.

**Copy-paste prompt:**

```text
Audit CareerOS for partial failures and duplicate events. Add idempotency, stale-result protection, and recoverable statuses where needed. Preserve previous valid data during provider failure and ensure retries do not duplicate plans, applications, or evidence.
Scope: subphase 11.2. Inspect existing code, complete the described behavior,
and verify the deliverable. Apply the universal coding-agent wrapper.
```

### 11.3 — Whole-flow audit

**Tasks:** Walk student → college → recruiter → feedback. Check every visible button, empty state, deep link, and saved state. Remove or label unfinished controls.

**Deliverable:** A documented full-loop walkthrough.

**Copy-paste prompt:**

```text
Run the full CareerOS journey from authentication to recruiter outcome and refreshed guidance. Inspect every primary control for real persistence, error handling, and correct navigation. Report any fixture leakage, dead controls, stale metrics, or access gaps and fix the highest-impact failures.
Scope: subphase 11.3. Inspect existing code, complete the described behavior,
and verify the deliverable. Apply the universal coding-agent wrapper.
```

### Phase 11 — do's, don'ts, and gate

- **Do:** ensure a clear causal link between action and updated information.
- **Don't:** regenerate everything on every render or hide provider failure with fixtures.
- **Exit gate:** One outcome is visible in the authorized related views and improves guidance through a traceable data path.
- **Evidence to record:** affected files; UI/action result; API/schema changes; saved-record readback; relevant negative case; checks run and actual results.

## Phase 12 — Quality, accessibility, security, and operational readiness

**Prerequisites:** 11; frontend F09/F10.

**Outcome:** Evidence supports release of the intended scope.

### 12.1 — Functional and contract testing

**Tasks:** Use Pytest and Playwright per repository. Validate schemas, ownership, persistence, invalid inputs, and negative cases with deterministic provider doubles.

**Deliverable:** Repeatable unit/API/integration/E2E results.

**Copy-paste prompt:**

```text
Implement and run meaningful tests for CareerOS auth, tenant isolation, resume lifecycle, Twin, Skills, Roadmap, ARIA, ECHO, matching, applications, and analytics. Use deterministic AI doubles in CI and report exact commands/results without claiming unrun checks.
Scope: subphase 12.1. Inspect existing code, complete the described behavior,
and verify the deliverable. Apply the universal coding-agent wrapper.
```

### 12.2 — Frontend and accessibility verification

**Tasks:** Compare implemented pages to Figma at agreed widths; test keyboard, focus, dialogs, labels, contrast, zoom, reduced motion, table overflow, and long content. Resolve failures rather than only producing screenshots.

**Deliverable:** Visual and interaction acceptance evidence.

**Copy-paste prompt:**

```text
Audit the actual CareerOS frontend against its Figma handoff and quality checklist. Test responsive layouts, keyboard flows, dialog focus, labels, long content, chart alternatives, and reduced motion. Fix concrete defects without redesigning unrelated pages.
Scope: subphase 12.2. Inspect existing code, complete the described behavior,
and verify the deliverable. Apply the universal coding-agent wrapper.
```

### 12.3 — Performance and failure rehearsal

**Tasks:** Measure chosen user journeys, AI/voice cost and latency, DB queries, and large roster behavior. Verify rate limiting, secrets, retention, deletion, and recovery. Record measured limits.

**Deliverable:** A readiness report with actual findings and unresolved risks.

**Copy-paste prompt:**

```text
Measure CareerOS performance on the agreed pilot dataset and rehearse provider/network failures. Audit rate limits, sensitive logs, deletion/index cleanup, and backup/rollback readiness. Distinguish measured behavior from aspirational scale.
Scope: subphase 12.3. Inspect existing code, complete the described behavior,
and verify the deliverable. Apply the universal coding-agent wrapper.
```

### Phase 12 — do's, don'ts, and gate

- **Do:** record exact scope and evidence; use realistic sparse and large fixtures.
- **Don't:** claim millions of users from a local smoke test or equate a clean build with working flows.
- **Exit gate:** Critical functional and access checks pass; remaining limitations are visible and do not undermine the release scope.
- **Evidence to record:** affected files; UI/action result; API/schema changes; saved-record readback; relevant negative case; checks run and actual results.

## Phase 13 — Deploy, rehearse, and hand over

**Prerequisites:** 12; deployment target explicitly resolved.

**Outcome:** A verified running release and a reliable connected demo.

### 13.1 — Select and configure deployment

**Tasks:** Reconcile Vercel/Railway/Supabase/Qdrant with later Google Cloud direction. Inspect actual configs and choose one topology. Configure secrets, origins, callbacks, migrations, health, logs, and rollback.

**Deliverable:** A concrete deploy plan and environment configuration.

**Copy-paste prompt:**

```text
Prepare CareerOS deployment using the selected topology and actual repository. Resolve the historical Vercel/Railway versus Google Cloud ambiguity before provisioning. Document migration order, secrets, CORS, OAuth redirects, HTTPS/WSS, health, and rollback.
Scope: subphase 13.1. Inspect existing code, complete the described behavior,
and verify the deliverable. Apply the universal coding-agent wrapper.
```

### 13.2 — Release and smoke test

**Tasks:** Deploy within current authorization, apply safe migrations, verify configured providers and URLs, and run the full journey against the target environment. Never claim success based only on build logs.

**Deliverable:** Verified URL, release identifier, and smoke results.

**Copy-paste prompt:**

```text
Deploy the authorized CareerOS release and verify the public/private target as configured. Test login, resume, Twin, Roadmap progress, ARIA, interview availability, application, recruiter view, and college scope. Report verified URLs, version, failures, and rollback status.
Scope: subphase 13.2. Inspect existing code, complete the described behavior,
and verify the deliverable. Apply the universal coding-agent wrapper.
```

### 13.3 — Demo and next backlog

**Tasks:** Prepare labeled fictional records, rehearse voice and provider quota, record fallback honestly, document limitations and support steps. Prioritize pilot feedback before speculative expansion.

**Deliverable:** Demo runbook and updated development context.

**Copy-paste prompt:**

```text
Create a concise CareerOS demo runbook showing resume evidence → Twin → Skills → dedicated Roadmap → ARIA/ECHO → application → recruiter/college loop. Label seeded or recorded material. Update handoff status with actual completion, tests, deployment, limitations, and next actions.
Scope: subphase 13.3. Inspect existing code, complete the described behavior,
and verify the deliverable. Apply the universal coding-agent wrapper.
```

### Phase 13 — do's, don'ts, and gate

- **Do:** demonstrate causality and have an honest provider-failure fallback.
- **Don't:** ship unfinished demo controls as working features or invent a deployed URL.
- **Exit gate:** The target URL and core loop are verified; another developer can operate and continue the project.
- **Evidence to record:** affected files; UI/action result; API/schema changes; saved-record readback; relevant negative case; checks run and actual results.

## 5. The vertical-slice ticket template

Use a ticket like this for every real feature, not just “build the backend.”

```text
Ticket ID / phase:
User role and problem:
Screen / route / Figma reference:
Entry state and required data:
User action:
API method/path and request schema:
Response schema and error states:
Identity, role, tenant, and object ownership:
Service / agent / provider:
Database reads/writes and migration:
Derived updates / vector indexing / cache invalidation:
Pending / empty / failure / success UI:
Reload and repeated-request behavior:
Acceptance steps:
Negative access/failure case:
Files changed:
Checks run and results:
Remaining limitation:
```

### Example: complete a Roadmap milestone

- Entry: authenticated student opens their saved active plan at /roadmap.
- Action: Mark Complete for one milestone.
- Proposed API: PATCH /roadmaps/{id}/milestones/{milestone_id}; reconcile actual route before coding.
- Request: target milestone status and an expected version if concurrency control uses it.
- Authorization: both plan and milestone must belong to the current student; a nested ID must actually belong to the named plan.
- Persistence: one status transition and completion timestamp; repeat submission must not duplicate evidence.
- Response: authoritative milestone state and recomputed plan completion.
- UI: pending button, saved state on success, retryable inline error on failure; never mark the plan permanently complete if save fails.
- Downstream: Dashboard progress invalidates; learning completion becomes evidence with an appropriate status, not an automatic claim of mastery.
- Verification: reload, reopen, repeat click, and a second student's forbidden request.

## 6. Contract and data guardrails

### Preserve established routes

The frontend routes are /, /auth, /dashboard, /career-twin, /mentor, /resume, /skills, /roadmap, /interview, /jobs, /profile, /recruiter, /college, /admin.

Established backend paths include /users/me, /users/profile, /analytics/dashboard, /career-twin/get-career-twin, /chat/, /resumes/upload-resume, /roadmap/get-roadmap, /voice/start-session, /voice/ws/{session_id}, /recommendations/jobs, /applications/apply, and /recruiter/search-candidates. Reconcile the /api/v1 base prefix once. Proposed read/revision/management APIs must be documented separately.

### Data responsibilities

- PostgreSQL is authoritative for user/profile/organization state, evidence, plans, interviews, applications, and outcomes.
- Supabase Storage holds private files; browser URLs must follow authorized access policy.
- Qdrant is a derived retrieval index with ownership/visibility metadata and versioned embeddings.
- Gemini/Pydantic output must validate before it becomes persisted product state.
- LangGraph coordinates relevant tasks with bounded execution; it is not required for ordinary profile reads.
- Browser state is not durable persistence, identity authority, or the source of truth for scores.

### Migration discipline

1. Inspect existing migrations and current schema.
2. Add the smallest change needed for the phase with explicit constraints/indexes/policies.
3. Exercise it in development/test data, including an existing-record scenario.
4. Document deployment order, compatibility, and recovery.
5. Never use destructive database resets against real user data to solve a local mismatch.

### Scoring discipline

Keep ATS feedback, current skill proficiency, readiness, completion, similarity, and scenario forecasts distinct. Unknown is not zero. Display evidence age and score version when relevant. No validated salary prediction or placement probability model was established in the original conversation. A model-generated percentage must not become a business promise.

## 7. Frontend handoff acceptance before wiring

The Figma package is ready for engineering when it includes:

- All required screens and navigation, including a separate Roadmap screen.
- Desktop and mobile behavior, not only fixed screenshots.
- Semantic tokens, reusable components, state variants, and exported assets.
- Realistic fictional fixtures matching API shapes.
- An action/state catalog and component-to-route map.
- Empty/loading/error/pending/stale/permission states.
- API field annotations for metrics, lists, forms, and generated outputs.
- Notes about controls awaiting backend contracts.

A Figma prototype or exported app is not automatically a secure, integrated application. Validate actual framework, semantics, and dependency behavior before changing it. Preserve visual intent while replacing mock adapters with the real API client.

## 8. Global do's and don'ts

| Do | Don't |
|---|---|
| Inspect and extend working modules | Regenerate the whole project every phase |
| Work from contracts and user actions | Build disconnected routers with no screen consumer |
| Save and read back results | Treat a successful toast as proof of persistence |
| Enforce identity/tenant boundaries on the server | Trust user IDs, role dropdowns, or hidden navigation |
| Use explicit fixture mode in design/development | Fall back to believable mock data after API failure |
| Preserve completed Roadmap work when revising | Replace a student's plan silently |
| Provide evidence and explain metric meaning | Invent confidence, placement probability, or verified status |
| Observe provider cost, latency, and failure | Call every agent or regenerate every result on every page load |
| Keep revisions and changes narrow | Migrate frameworks merely because another one seems newer |
| Record checks actually run | Report production readiness from screenshots or scaffolding |

## 9. Repair prompts for common failure modes

### The backend exists but the frontend remains static

```text
Trace [SCREEN/ACTION] through its rendered component, API client, backend router,
service, and database. Identify the first broken link. Replace only the mock or
missing adapter necessary to complete the flow. Add loading/error/readback behavior
and verify it through the actual UI. Preserve the approved Figma layout.
```

### The agent keeps redesigning the frontend

```text
Stop cosmetic changes outside this ticket. Treat the approved Figma screen and
design tokens as the visual contract. List the minimum integration changes and
restore accidental unrelated visual changes without discarding user work.
Complete [ACTION/API] and verify state behavior at the existing layouts.
```

### Generated outputs are malformed or inconsistent

```text
Audit the [AGENT] input/output schema, prompt version, validation, and error path.
Add bounded validation/retry behavior and a truthful failure state. Never coerce an
invalid output into a plausible score. Preserve the last valid result and record
model/schema versions. Add a deterministic regression case for the failure.
```

### Data is different across screens

```text
Trace the source of [METRIC/ENTITY] across CareerOS screens. Identify duplicated
calculations, stale caches, fixture data, or incompatible score units. Establish
one authoritative versioned result and explicit invalidation after relevant
mutations. Test the triggering action, navigation, and reload across affected views.
```

## 10. Scope cuts for a deadline

Keep a complete connected core: auth/profile, resume evidence, dynamic Twin, Skills, **dedicated Roadmap with saved progress**, contextual ARIA, application/recruiter path, and a truthful college view. ECHO voice is a demo priority when stable; if it cannot be completed, show that limitation explicitly rather than simulating a live feature.

Defer optional avatars, social MCP integrations, billing automation, speculative government dashboards, elaborate microservices, and ornamental visual effects. Do not cut authorization, persistence, error handling, or score honesty to fit a deadline. This is a prioritization rule, not permission to leave requested scope silently unfinished.

## 11. Phase report and continuation prompt

```text
Phase/subphase:
Status: not started / in progress / verified / blocked
Behavior completed:
Figma/UI reference:
Changed files:
API/schema/migration changes:
Evidence of saved/read-back state:
Negative/failure cases tested:
Commands/checks and exact results:
Known limitations:
Next ticket and prerequisite:
```

```text
Continue CareerOS from the latest phase report and repository state. Do not restart
completed work. Verify the reported prerequisite, then execute the next incomplete
subphase in CareerOS_Phased_Development_Playbook.md. Preserve the Figma visual
contract and dedicated Roadmap screen. Update the report with actual evidence.
```

## 12. Final completion checklist

- [ ] All required routes exist, with meaningful role-aware navigation.
- [ ] /roadmap is separate, saved, resumable, and linked from Skills and Dashboard.
- [ ] Primary flows use authorized live services and persistence.
- [ ] Student activity and recruiter outcomes feed the related institutional/guidance views.
- [ ] Fixtures are isolated and demo content is labeled.
- [ ] Relevant functional, access, contract, visual, and failure checks pass.
- [ ] Deployment target ambiguity is resolved and target smoke tests pass.
- [ ] Real release URL/version and operational limitations are recorded.
- [ ] The development context is updated with verified status.


## 13. Required cross-cutting feature — switchable themes

Implement Light, Dark, and System preferences across all 14 routes. Follow Section 19 of CareerOS_Figma_Frontend_Playbook.md. Establish shared semantic theme tokens/controller in phase 02; integrate the shared Appearance and Profile controls in phase 03; maintain compatibility through phases 04–10; verify persistence, device preference changes, initial render, overlays, contrast, and uninterrupted workflows in phase 12.

Use System initially, persist local preference, and preserve active form/chat/interview/upload/Roadmap state during switching. Account synchronization is optional until its settings contract and precedence are defined. Earlier light-only language is superseded by this requirement. Do not mark frontend QA complete without checking Light and Dark renderings and all three preference options.
