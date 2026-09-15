"""Apply the core identity migration to Supabase.

Usage (from backend directory):
    ./.venv/Scripts/python.exe scripts/apply_migration.py
"""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.config import get_settings


def main() -> int:
    settings = get_settings()
    if not settings.database_url:
        print("ERROR: DATABASE_URL is not configured.")
        return 1

    sql_path = Path(__file__).resolve().parent / "apply_migration.sql"
    if not sql_path.exists():
        print(f"ERROR: Migration file not found: {sql_path}")
        return 1

    sql = sql_path.read_text(encoding="utf-8")
    print(f"Migration file: {sql_path}")
    print(f"SQL length: {len(sql)} characters")
    print()

    try:
        import psycopg
        from psycopg.rows import dict_row
    except ImportError as exc:
        print(f"ERROR: psycopg unavailable ({type(exc).__name__}: {exc})")
        return 1

    try:
        with psycopg.connect(settings.database_url, row_factory=dict_row) as conn:
            with conn.cursor() as cur:
                # Split by semicolons and execute each statement
                # (psycopg doesn't support multi-statement execute)
                statements = [s.strip() for s in sql.split(";") if s.strip()]
                executed = 0
                errors = 0

                for i, stmt in enumerate(statements, 1):
                    # Skip pure comments
                    lines = [l for l in stmt.split("\n") if l.strip() and not l.strip().startswith("--")]
                    if not lines:
                        continue

                    try:
                        cur.execute(stmt)
                        executed += 1
                        # Show first meaningful line as preview
                        preview = lines[0][:80]
                        print(f"  [{i:3d}] OK  {preview}")
                    except Exception as exc:
                        errors += 1
                        preview = lines[0][:60] if lines else "(empty)"
                        print(f"  [{i:3d}] ERR {type(exc).__name__}: {exc}")
                        print(f"        Statement: {preview}...")

                conn.commit()
                print()
                print(f"Executed: {executed} statements")
                print(f"Errors:   {errors} statements")

                if errors > 0:
                    print()
                    print("WARNING: Some statements failed. Check errors above.")
                    print("The migration may have been partially applied.")
                    return 1

                print()
                print("Migration applied successfully.")
                return 0

    except Exception as exc:
        print(f"ERROR: Connection failed ({type(exc).__name__}: {exc})")
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
