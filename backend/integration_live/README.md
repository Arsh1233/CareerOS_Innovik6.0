# Live Supabase verification suite

Proof that the identity path works against a **real** Supabase project: real
GoTrue, real PostgreSQL, real RLS policies. Nothing is mocked and no FastAPI
dependency is overridden (the suite asserts that).

This directory sits **outside** `testpaths`, so the normal test run never touches
the network:

```bash
./.venv/Scripts/python.exe -m pytest              # unit suite only (offline)
./.venv/Scripts/python.exe -m pytest integration_live   # this suite (live)
```

## Requirements

1. `backend/.env` configured with `SUPABASE_URL`, `SUPABASE_ANON_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`.
   Run `./.venv/Scripts/python.exe scripts/preflight.py` first — it reports
   presence and schema state without printing any secret.
2. The identity migration applied:
   `supabase/migrations/20260915000001_core_identity.sql` (preflight verifies the
   tables, functions, triggers and that RLS is enabled on each table).
3. Opt in explicitly:

```bash
CAREEROS_LIVE_SUPABASE=1 ./.venv/Scripts/python.exe -m pytest integration_live -v
```

Without the flag, every test skips with the reason shown — that is intentional,
so CI can never depend on a live project.

## What it proves

`test_live_identity.py`

| Check | Evidence produced |
|---|---|
| `/health` reflects real configuration | capability booleans + `status` |
| Signup creates an `auth.users` row | row read with the owner connection |
| Profile auto-creation by trigger | exactly **one** `public.profiles` row, correct `display_name` |
| Trigger is not duplicate-prone | re-running the provisioning insert leaves one row |
| Role stored in `app_metadata.role` only | `raw_app_meta_data` vs `raw_user_meta_data`, plus `role` from `/users/me` |
| Public admin signup rejected | `422 validation_error` |
| college / recruiter signup carry their own role | `app_metadata.role` per account |
| Login → session → `/users/me` | tokens + persisted profile from PostgreSQL |
| **Profile save + readback** | `PUT /users/profile` → API readback → owner DB read → RLS read, all three agreeing |
| Validation | unknown field `422`, empty update `400`, bad salary `422` |
| Negative auth | wrong password `401`, invalid token `401`, missing token `401` |
| Password reset | `202` for an address with no account (no mail sent) |
| Logout | `204`, then unauthenticated `/users/me` → `401`; post-logout access-token behaviour is **recorded, not asserted** (Supabase access tokens are stateless) |

`test_live_rls.py`

| Check | Evidence produced |
|---|---|
| Own profile read / update | allowed, and the change is visible with the owner connection |
| Cross-user profile **read** | A gets 0 rows for B, and a full-table read returns only A |
| Cross-user profile **update** | rowcount 0, B's row verified unchanged afterwards |
| Cross-user **delete** | rowcount 0, B's row still present |
| Insert for another user | refused by `WITH CHECK` |
| Tenant memberships | B's rows exist (owner sees them) while A sees none of them |
| Self-granting membership | `organization_memberships` / `student_college_memberships` inserts refused |
| College-role escalation | a college token cannot alter its own membership row (`rowcount 0`, row unchanged) |
| Positive control | verified colleges and `role_requirements` stay readable |

The RLS tests run SQL as PostgreSQL role `authenticated` with real claims using
`app.repositories.base.claims_session_statements` — the *same* session setup the
API uses, so a denial here is the denial a real request receives.

## Rules this suite follows

- **Never fabricate a pass.** If a step cannot be completed, the test fails or
  skips and prints the real reason (for example: the project requires email
  confirmation and no confirmed account is available — the suite will not fake
  confirmation).
- **Clean up after itself.** Accounts it creates are deleted through the Supabase
  admin API in teardown; the seeded college is deleted by fixture teardown.
- **Read-only with respect to existing data.** It never resets, drops or seeds
  schemas, and only inserts rows it removes afterwards.
- **No secrets in output.** Failures print status codes and identifiers, never
  tokens or keys.
