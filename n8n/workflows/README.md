# n8n workflows

n8n is the **orchestration layer** for multi-step CareerOS workflows (the
LangGraph option named in earlier planning documents was dropped). It
coordinates agents and long-running jobs; it does **not** replace ordinary CRUD
APIs.

## Rules

* CRUD and simple reads stay in FastAPI. n8n is used only when a task spans
  multiple steps, retries, or providers (for example: resume upload → parse →
  analyse → embed → refresh derived state).
* PostgreSQL (Supabase) is the source of truth. A workflow writes results
  through the FastAPI service layer, never by reaching into tables on its own
  initiative.
* Every workflow must be idempotent and safe to retry, and must record its run
  in `ai_runs` (later migration) with status, not silently swallow failures.
* No workflow may return fixture data when a provider fails.
* Webhook authentication uses `N8N_WEBHOOK_SECRET`; secrets stay in the n8n
  instance environment, never in exported workflow JSON.

## Status

No workflows exist yet. This directory is a placeholder created so workflow
exports have a documented home once the services they orchestrate are
implemented. Adding an export here without a working API behind it would be a
false claim of integration.
