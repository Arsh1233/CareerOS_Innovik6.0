"""Read-only configuration and schema preflight for CareerOS.

Reports which environment values are present (never their contents) and, when a
database is configured, which identity-migration objects exist.

This script writes nothing and never prints a secret value. It exists so that
"is this environment ready?" has a checkable answer instead of an assumption.

Usage (from the backend directory):

    ./.venv/Scripts/python.exe scripts/preflight.py

Exit code 0 when the Phase 03 (auth + identity + profile) requirements are met,
1 otherwise.
"""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.config import get_settings  # noqa: E402

# ── what each value is needed for ────────────────────────────────────────────
# value -> (required_for_phase_03, why)
REQUIREMENTS: dict[str, tuple[bool, str]] = {
    "SUPABASE_URL": (True, "verify tokens (JWKS) + reach Supabase Auth"),
    "SUPABASE_ANON_KEY": (True, "password login and password-reset calls to GoTrue"),
    "SUPABASE_SERVICE_ROLE_KEY": (True, "create users with a server-assigned role"),
    "DATABASE_URL": (True, "read/write profiles through PostgreSQL + RLS"),
    "SUPABASE_JWT_SECRET": (False, "legacy HS256 projects only; not needed with JWKS signing keys"),
    "CORS_ALLOWED_ORIGINS": (False, "must include the frontend origin (default http://localhost:8443)"),
    "GROQ_API_KEY": (False, "later phases (agents - Groq LLM)"),
    "QDRANT_URL": (False, "later phases (vector search)"),
    "ELEVENLABS_API_KEY": (False, "later phases (ECHO voice)"),
    "N8N_BASE_URL": (False, "later phases (workflow orchestration)"),
    "LANGSMITH_API_KEY": (False, "optional observability"),
}

EXPECTED_TABLES = (
    "profiles",
    "colleges",
    "recruiter_organizations",
    "role_requirements",
    "organization_memberships",
    "student_college_memberships",
)

EXPECTED_FUNCTIONS = (
    "public.handle_new_user",
    "public.set_updated_at",
    "app.current_college_ids",
    "app.current_recruiter_organization_ids",
)

EXPECTED_TRIGGERS = (
    ("auth", "users", "on_auth_user_created"),
    ("public", "profiles", "profiles_set_updated_at"),
)

TABLES_WITH_RLS = EXPECTED_TABLES


def _present(value: str | None) -> bool:
    return bool(value and value.strip())


def report_configuration() -> tuple[bool, list[str]]:
    settings = get_settings()
    values = {
        "SUPABASE_URL": settings.supabase_url,
        "SUPABASE_ANON_KEY": settings.supabase_anon_key,
        "SUPABASE_SERVICE_ROLE_KEY": settings.supabase_service_role_key,
        "DATABASE_URL": settings.database_url,
        "SUPABASE_JWT_SECRET": settings.supabase_jwt_secret,
        "CORS_ALLOWED_ORIGINS": settings.cors_allowed_origins,
        "GROQ_API_KEY": settings.groq_api_key,
        "QDRANT_URL": settings.qdrant_url,
        "ELEVENLABS_API_KEY": settings.elevenlabs_api_key,
        "N8N_BASE_URL": settings.n8n_base_url,
        "LANGSMITH_API_KEY": settings.langsmith_api_key,
    }

    print("CONFIGURATION (presence only - values are never printed)")
    print("-" * 68)

    missing_required: list[str] = []
    for name, (required, why) in REQUIREMENTS.items():
        configured = _present(values.get(name))
        if required and not configured:
            missing_required.append(name)
        label = "required" if required else "optional"
        state = "configured" if configured else "MISSING"
        print(f"  {name:<28} {state:<11} [{label}] {why}")

    # The API never exposes secrets; sanity-check that the public capability
    # report agrees with what we just found.
    capabilities = settings.capability_report()
    print("\n  capability_report():", {k: v for k, v in capabilities.items()})

    return (not missing_required), missing_required


def report_database() -> tuple[bool, str]:
    settings = get_settings()
    if not _present(settings.database_url):
        return False, "skipped: DATABASE_URL is not configured"

    try:
        import psycopg  # type: ignore
        from psycopg.rows import dict_row  # type: ignore
    except ImportError as exc:  # pragma: no cover - dependency guard
        return False, f"skipped: psycopg unavailable ({type(exc).__name__})"

    try:
        with psycopg.connect(settings.database_url, row_factory=dict_row) as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    select c.relname as table_name, c.relrowsecurity as rls_enabled
                    from pg_class c
                    join pg_namespace n on n.oid = c.relnamespace
                    where n.nspname = 'public' and c.relname = any(%s)
                    """,
                    (list(EXPECTED_TABLES),),
                )
                tables = {row["table_name"]: row["rls_enabled"] for row in cur.fetchall()}

                cur.execute(
                    """
                    select n.nspname || '.' || p.proname as name
                    from pg_proc p
                    join pg_namespace n on n.oid = p.pronamespace
                    where (n.nspname, p.proname) in (
                        ('public', 'handle_new_user'),
                        ('public', 'set_updated_at'),
                        ('app', 'current_college_ids'),
                        ('app', 'current_recruiter_organization_ids')
                    )
                    """
                )
                functions = {row["name"] for row in cur.fetchall()}

                cur.execute(
                    """
                    select n.nspname as schema_name, c.relname as table_name, t.tgname as trigger_name
                    from pg_trigger t
                    join pg_class c on c.oid = t.tgrelid
                    join pg_namespace n on n.oid = c.relnamespace
                    where not t.tgisinternal
                    """
                )
                triggers = {
                    (row["schema_name"], row["table_name"], row["trigger_name"])
                    for row in cur.fetchall()
                }
    except Exception as exc:  # noqa: BLE001 - never surface DSN/credentials
        return False, f"connection failed ({type(exc).__name__})"

    print("\nDATABASE OBJECTS")
    print("-" * 68)

    ok = True
    for table in EXPECTED_TABLES:
        if table not in tables:
            ok = False
            print(f"  table    {table:<42} MISSING")
        elif not tables[table]:
            ok = False
            print(f"  table    {table:<42} present, RLS DISABLED (policy problem)")
        else:
            print(f"  table    {table:<42} present, RLS enabled")

    for function in EXPECTED_FUNCTIONS:
        if function not in functions:
            ok = False
            print(f"  function {function:<42} MISSING")
        else:
            print(f"  function {function:<42} present")

    for schema, table, trigger in EXPECTED_TRIGGERS:
        if (schema, table, trigger) not in triggers:
            ok = False
            print(f"  trigger  {schema}.{table}.{trigger:<30} MISSING")
        else:
            print(f"  trigger  {schema}.{table}.{trigger:<30} present")

    return ok, "verified" if ok else "incomplete"


def main() -> int:
    config_ok, missing = report_configuration()

    print()
    if not config_ok:
        print("RESULT: BLOCKED - missing required value(s): " + ", ".join(missing))
        print(
            "        Live auth, profile persistence and RLS verification cannot be\n"
            "        demonstrated until these are configured in backend/.env.\n"
            "        See backend/.env.example for the expected names."
        )

    db_ok, db_status = report_database()
    print(f"RESULT: database schema - {db_status}")

    if not config_ok:
        return 1
    return 0 if db_ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
