# CareerOS backend (FastAPI)

Request path: **Frontend → FastAPI → services → repositories → Supabase
PostgreSQL**. Multi-step AI workflows are orchestrated by **n8n**
(`../n8n/workflows`), which calls back into these APIs; normal CRUD does not go
through a workflow engine.

## Layout

```
backend/
  app/
    main.py            # FastAPI app factory, middleware, router mounting
    core/              # config, security (JWT), errors, roles, version
    api/               # HTTP layer
      deps.py          # auth deps, role guards, service providers
      v1/              # health, auth, users routers
    schemas/           # Pydantic request/response contracts
    services/          # business logic
    repositories/      # SQL through RLS-scoped connections
    integrations/      # Supabase Auth (Gemini/Qdrant/ElevenLabs/n8n later)
    agents/            # specialist AI agents (not implemented yet)
  tests/               # pytest suite
  requirements.txt
  .env.example
```

## Run locally

```bash
cd CareerOS-RuBI/backend
python -m venv .venv
./.venv/Scripts/python.exe -m pip install -r requirements.txt   # Windows
cp .env.example .env        # then fill in real values
./.venv/Scripts/python.exe -m uvicorn app.main:app --reload --port 8000
```

* Health: `GET http://127.0.0.1:8000/api/v1/health`
* OpenAPI docs (non-production only): `http://127.0.0.1:8000/docs`

The app boots without credentials. `/health` reports exactly which integrations
are configured, and endpoints that need a missing integration return an
explicit `503` instead of placeholder data.

## Tests

```bash
./.venv/Scripts/python.exe -m pytest
```

Tests never call a live provider: the Supabase integration and the repository
are replaced through FastAPI dependency overrides. There is no test that
requires a running database yet — see *Known limitations*.

## Authorisation model

1. Supabase Auth issues the access token; the frontend sends it as
   `Authorization: Bearer <token>`.
2. `app/core/security.py` verifies the signature (JWKS for ES256/RS256, shared
   secret for legacy HS256) and the `authenticated` audience.
3. The platform role is read from `app_metadata.role` only — `user_metadata` is
   user-editable and is never used for authorisation.
4. Routes declare accepted roles with `require_roles(...)`.
5. Data access runs as the PostgreSQL `authenticated` role with the verified
   claims published as `request.jwt.claims`, so RLS policies in
   `supabase/migrations` re-check ownership at the database.

The service-role key is used only for account provisioning and role grants.
It is never sent to the browser and never used to serve user requests, because
it bypasses RLS.

`DATABASE_URL` must be a role that is allowed to `SET ROLE authenticated` (the
standard Supabase `postgres`/pooler user is, and is what the SQL editor uses to
test RLS). The connection deliberately switches away from the table-owning role
per transaction, otherwise RLS would be bypassed.

## Error contract

Every failure returns:

```json
{ "error": { "code": "invalid_credentials", "message": "...", "request_id": "...", "details": {} } }
```

`X-Request-ID` is echoed on every response (server-generated when absent), and
`request_id` in the body matches it.

## Endpoints implemented

| Method | Path | Notes |
|---|---|---|
| GET | `/api/v1/health` | status + configured capabilities |
| POST | `/api/v1/auth/signup` | student/college/recruiter only; role assigned server-side |
| POST | `/api/v1/auth/login` | Supabase password grant |
| POST | `/api/v1/auth/logout` | revokes the current session |
| POST | `/api/v1/auth/password-reset` | never discloses whether an account exists |
| GET | `/api/v1/users/me` | identity, profile, organisation memberships |
| PUT | `/api/v1/users/profile` | partial update, readback returned |

Everything else in the product plan (Career Twin, resume, roadmap, ECHO, jobs,
college/admin) is **not implemented** yet.

## Known limitations

* No live-database test exists: the SQL and RLS policies are written but have
  not been executed against a real Supabase project from this environment.
* Google OAuth sign-in is not wired; users created outside `/auth/signup` have
  no `app_metadata.role` and therefore receive `403 role_not_assigned`.
* College staff cannot yet read student profile fields (a scoped view is
  needed before exposing them).
* Tokens are not cached: every request re-verifies the JWT. JWKS keys are
  cached in-process; the fetch itself is synchronous inside an async handler.
