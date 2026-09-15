# Live Supabase Verification Suite

This directory contains **opt-in** integration tests that run against a **real
Supabase project** — real GoTrue, real PostgREST over HTTPS, real PostgreSQL
RLS policies. Nothing is mocked.

## Data Access Architecture

```
FastAPI → Supabase PostgREST (HTTPS) → PostgreSQL RLS
```

All user-scoped operations go through PostgREST using the authenticated
user's JWT. Supabase evaluates PostgreSQL RLS policies against this token
automatically.

Direct PostgreSQL (port 5432) is **optional** — used only for privileged admin
checks in the test suite. The API itself does not require direct DB access.

## Gating

Two conditions must both hold:

1. `CAREEROS_LIVE_SUPABASE=1` environment variable must be set.
2. `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` must be
   configured in the backend environment.

If `DATABASE_URL` is also configured and reachable, admin-level direct database
checks will run. Otherwise, the suite verifies everything through PostgREST.

## What It Proves

| Capability | Verified |
|---|---|
| Signup creates user + profile | ✅ |
| Profile trigger fires on signup | ✅ |
| Login returns valid session | ✅ |
| JWT verification works (ES256 JWKS) | ✅ |
| GET /users/me returns persisted profile | ✅ |
| PUT /users/profile persists changes | ✅ |
| Profile readback through PostgREST | ✅ |
| Cross-user profile read blocked (RLS) | ✅ |
| Cross-user profile update blocked (RLS) | ✅ |
| Membership self-grant blocked (RLS) | ✅ |
| Public admin signup rejected | ✅ |
| Session logout + revocation | ✅ |

## Running

```bash
cd CareerOS-RuBI/backend

# Set up the environment
cp .env.example .env
# Fill in real Supabase credentials

# Run with PostgREST verification (no direct DB needed)
CAREEROS_LIVE_SUPABASE=1 ./.venv/Scripts/python.exe -m pytest integration_live -v

# If DATABASE_URL is also reachable, admin checks run automatically
```

## Important Notes

- **The suite is deliberately not part of `testpaths`** — CI runs only the
  offline unit suite by default.
- **The suite asserts no dependency overrides are active** — it cannot
  accidentally grade a mocked app.
- **Account cleanup** — test accounts are created during the run and deleted
  afterwards.
- **RLS denials** — PostgREST returns empty results or 403 for denied
  operations. Both are acceptable evidence of RLS enforcement.
