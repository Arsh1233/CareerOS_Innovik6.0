"""PostgreSQL access with Supabase-compatible row level security.

PostgreSQL is the source of truth. Every user-facing query runs on a connection
where the PostgreSQL role is switched to `authenticated` and the *verified* JWT
claims are published as `request.jwt.claims`. RLS policies in
`supabase/migrations` therefore enforce ownership server-side, at the database,
in addition to the API's own authorisation checks.

Using the service-role connection to serve user requests would bypass RLS, so
that connection is reserved for administrative migrations/jobs only.
"""

from __future__ import annotations

import json
from contextlib import asynccontextmanager
from typing import Any, AsyncIterator, Sequence

from psycopg.rows import dict_row
from psycopg_pool import AsyncConnectionPool

from app.core.config import get_settings
from app.core.errors import ApiError

_pool: AsyncConnectionPool | None = None


async def get_pool() -> AsyncConnectionPool:
    """Lazily create the shared connection pool.

    Deferred so the API can boot (and report `/health`) before a database is
    configured.
    """
    global _pool
    settings = get_settings()
    if not settings.database_url:
        raise ApiError(
            503,
            "database_not_configured",
            "The server is not connected to its database yet.",
        )

    if _pool is None:
        _pool = AsyncConnectionPool(
            conninfo=settings.database_url,
            min_size=0,
            max_size=settings.database_pool_max_size,
            open=False,
            kwargs={"row_factory": dict_row, "autocommit": False},
        )
        await _pool.open()

    return _pool


async def close_pool() -> None:
    global _pool
    if _pool is not None:
        await _pool.close()
        _pool = None


def claims_session_statements(
    claims: dict[str, Any],
) -> Sequence[tuple[str, tuple[Any, ...]]]:
    """Statements that reproduce the API's authenticated database context.

    Defined once and reused, so the live RLS tests exercise exactly the same
    session setup the API uses rather than a hand-rolled approximation.

    1. Leave the table-owning role, which would otherwise bypass RLS.
    2. Publish the *verified* JWT claims, which `auth.uid()` reads.
    """
    subject = str(claims.get("sub", ""))
    return (
        ("set local role authenticated", ()),
        ("select set_config('request.jwt.claims', %s, true)", (json.dumps(claims),)),
        ("select set_config('request.jwt.claim.sub', %s, true)", (subject,)),
    )


async def apply_claims_session(conn: Any, claims: dict[str, Any]) -> None:
    """Put an open connection into the authenticated, claims-scoped context."""
    for statement, params in claims_session_statements(claims):
        await conn.execute(statement, params)


@asynccontextmanager
async def user_scoped_connection(claims: dict[str, Any]) -> AsyncIterator[Any]:
    """Connection that executes as `authenticated` with the caller's claims."""
    pool = await get_pool()
    async with pool.connection() as conn:
        async with conn.transaction():
            await apply_claims_session(conn, claims)
            yield conn


@asynccontextmanager
async def admin_connection() -> AsyncIterator[Any]:
    """Privileged connection for maintenance jobs run by the server itself."""
    pool = await get_pool()
    async with pool.connection() as conn:
        async with conn.transaction():
            await conn.execute("set local role service_role")
            yield conn
