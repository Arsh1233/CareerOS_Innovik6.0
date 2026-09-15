"""Auth and identity endpoint behaviour, including failure paths."""

from __future__ import annotations

import uuid

from fastapi.testclient import TestClient

from app.core.errors import ApiError
from tests.conftest import (
    API_PREFIX,
    FakeProfilesRepository,
    FakeSupabaseAuthClient,
    auth_header,
    grant_payload,
    make_token,
    override_dependencies,
    profile_row,
)


def test_health_reports_configured_capabilities(client: TestClient) -> None:
    response = client.get(f"{API_PREFIX}/health")

    assert response.status_code == 200
    body = response.json()
    assert body["service"] == "careeros-api"
    assert body["environment"] == "test"
    # No database is configured in the test environment: the API must say so
    # rather than reporting a healthy stack.
    assert body["status"] == "degraded"
    assert body["capabilities"]["supabase_auth"] is True
    assert body["capabilities"]["database"] is False
    # Secrets are never echoed back.
    assert "test-service-role-key" not in response.text


def test_health_sets_request_id_header(client: TestClient) -> None:
    response = client.get(f"{API_PREFIX}/health", headers={"X-Request-ID": "trace-me"})
    assert response.headers["X-Request-ID"] == "trace-me"


def test_request_id_is_generated_when_absent(client: TestClient) -> None:
    response = client.get(f"{API_PREFIX}/health")
    assert len(response.headers["X-Request-ID"]) == 32


def test_me_requires_authentication(client: TestClient) -> None:
    response = client.get(f"{API_PREFIX}/users/me")

    assert response.status_code == 401
    error = response.json()["error"]
    assert error["code"] == "not_authenticated"
    assert error["request_id"]


def test_me_rejects_token_signed_with_wrong_key(client: TestClient) -> None:
    token = make_token(secret="not-the-project-secret-padded-32b")
    response = client.get(f"{API_PREFIX}/users/me", headers=auth_header(token))

    assert response.status_code == 401
    assert response.json()["error"]["code"] == "invalid_token"


def test_me_rejects_expired_token(client: TestClient) -> None:
    token = make_token(expires_in_seconds=-60)
    response = client.get(f"{API_PREFIX}/users/me", headers=auth_header(token))

    assert response.status_code == 401
    assert response.json()["error"]["code"] == "token_expired"


def test_me_rejects_token_without_platform_role(client: TestClient) -> None:
    token = make_token(role=None)
    response = client.get(f"{API_PREFIX}/users/me", headers=auth_header(token))

    assert response.status_code == 403
    assert response.json()["error"]["code"] == "role_not_assigned"


def test_me_returns_persisted_profile_and_memberships(client: TestClient) -> None:
    user_id = str(uuid.uuid4())
    repository = FakeProfilesRepository(
        row=profile_row(user_id, display_name="Rohan Kumar", onboarding_state="complete"),
        memberships=[
            {
                "id": str(uuid.uuid4()),
                "college_id": str(uuid.uuid4()),
                "recruiter_organization_id": None,
                "organization_name": "SRM Institute",
                "membership_role": "admin",
                "status": "active",
            }
        ],
    )
    override_dependencies(FakeSupabaseAuthClient(), repository)

    response = client.get(f"{API_PREFIX}/users/me", headers=auth_header(make_token(sub=user_id)))

    assert response.status_code == 200
    body = response.json()
    assert body["id"] == user_id
    assert body["role"] == "student"
    assert body["profile"]["display_name"] == "Rohan Kumar"
    assert body["profile"]["onboarding_state"] == "complete"
    assert body["memberships"][0]["organization_type"] == "college"
    assert body["memberships"][0]["organization_name"] == "SRM Institute"
    # The repository is called with the verified claims, not client input.
    assert repository.last_claims is not None
    assert repository.last_claims["sub"] == user_id


def test_me_succeeds_without_profile_row(client: TestClient) -> None:
    """A missing profile must not masquerade as an authenticated profile."""
    override_dependencies(FakeSupabaseAuthClient(), FakeProfilesRepository(row=None))

    response = client.get(f"{API_PREFIX}/users/me", headers=auth_header(make_token()))

    assert response.status_code == 200
    assert response.json()["profile"] is None


def test_update_profile_persists_and_reads_back(client: TestClient) -> None:
    user_id = str(uuid.uuid4())
    repository = FakeProfilesRepository(row=profile_row(user_id))
    override_dependencies(FakeSupabaseAuthClient(), repository)

    response = client.put(
        f"{API_PREFIX}/users/profile",
        headers=auth_header(make_token(sub=user_id)),
        json={
            "display_name": "Rohan Kumar",
            "target_role_name": "AI Engineer",
            "target_salary_inr": 2_800_000,
            "timeframe_years": 5,
            "discoverability": True,
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["display_name"] == "Rohan Kumar"
    assert body["target_salary_inr"] == 2_800_000
    assert body["discoverability"] is True
    assert repository.last_update == {
        "display_name": "Rohan Kumar",
        "target_role_name": "AI Engineer",
        "target_salary_inr": 2_800_000,
        "timeframe_years": 5,
        "discoverability": True,
    }


def test_update_profile_never_writes_the_owner_column(client: TestClient) -> None:
    user_id = str(uuid.uuid4())
    repository = FakeProfilesRepository(row=profile_row(user_id))
    override_dependencies(FakeSupabaseAuthClient(), repository)

    response = client.put(
        f"{API_PREFIX}/users/profile",
        headers=auth_header(make_token(sub=user_id)),
        json={"user_id": str(uuid.uuid4())},
    )

    assert response.status_code == 422
    assert response.json()["error"]["code"] == "validation_error"
    assert repository.last_update is None


def test_update_profile_rejects_invalid_values(client: TestClient) -> None:
    override_dependencies(FakeSupabaseAuthClient(), FakeProfilesRepository())

    response = client.put(
        f"{API_PREFIX}/users/profile",
        headers=auth_header(make_token()),
        json={"target_salary_inr": -1},
    )

    assert response.status_code == 422
    fields = response.json()["error"]["details"]["fields"]
    assert any(field["location"] == "body.target_salary_inr" for field in fields)


def test_update_profile_requires_something_to_change(client: TestClient) -> None:
    override_dependencies(FakeSupabaseAuthClient(), FakeProfilesRepository())

    response = client.put(
        f"{API_PREFIX}/users/profile",
        headers=auth_header(make_token()),
        json={},
    )

    assert response.status_code == 400
    assert response.json()["error"]["code"] == "empty_update"


def test_update_profile_reports_missing_profile(client: TestClient) -> None:
    override_dependencies(FakeSupabaseAuthClient(), FakeProfilesRepository(row=None))

    response = client.put(
        f"{API_PREFIX}/users/profile",
        headers=auth_header(make_token()),
        json={"display_name": "Nobody"},
    )

    assert response.status_code == 404
    assert response.json()["error"]["code"] == "profile_not_found"


def test_signup_creates_account_and_returns_session(client: TestClient) -> None:
    user_id = str(uuid.uuid4())
    auth_client = FakeSupabaseAuthClient(
        created={"id": user_id, "email": "new@example.com"},
        # GoTrue echoes back the metadata the server stored at creation time.
        grant=grant_payload(user_id, full_name="New Student", email="new@example.com"),
    )
    override_dependencies(auth_client, FakeProfilesRepository(profile_row(user_id)))

    response = client.post(
        f"{API_PREFIX}/auth/signup",
        json={
            "email": "new@example.com",
            "password": "Str0ng-Pass",
            "role": "student",
            "full_name": "  New   Student ",
        },
    )

    assert response.status_code == 201
    body = response.json()
    assert body["user"]["id"] == user_id
    assert body["user"]["role"] == "student"
    assert body["user"]["full_name"] == "New Student"
    assert body["session"]["access_token"] == "access-token-value"
    assert auth_client.create_payload is not None
    # The role is assigned server-side into app_metadata, which clients cannot edit.
    assert auth_client.create_payload["role"] == "student"
    assert auth_client.create_payload["full_name"] == "New Student"


def test_signup_cannot_self_assign_admin(client: TestClient) -> None:
    auth_client = FakeSupabaseAuthClient()
    override_dependencies(auth_client, FakeProfilesRepository())

    response = client.post(
        f"{API_PREFIX}/auth/signup",
        json={
            "email": "attacker@example.com",
            "password": "Str0ng-Pass",
            "role": "admin",
            "full_name": "Attacker",
        },
    )

    assert response.status_code == 422
    assert response.json()["error"]["code"] == "validation_error"
    assert auth_client.create_payload is None


def test_signup_rejects_weak_password(client: TestClient) -> None:
    override_dependencies(FakeSupabaseAuthClient(), FakeProfilesRepository())

    response = client.post(
        f"{API_PREFIX}/auth/signup",
        json={
            "email": "weak@example.com",
            "password": "password",
            "role": "student",
            "full_name": "Weak Password",
        },
    )

    assert response.status_code == 422


def test_signup_reports_duplicate_email(client: TestClient) -> None:
    auth_client = FakeSupabaseAuthClient(
        create_error=ApiError(409, "email_already_registered", "An account already exists for this email.")
    )
    override_dependencies(auth_client, FakeProfilesRepository())

    response = client.post(
        f"{API_PREFIX}/auth/signup",
        json={
            "email": "taken@example.com",
            "password": "Str0ng-Pass",
            "role": "recruiter",
            "full_name": "Taken Email",
        },
    )

    assert response.status_code == 409
    assert response.json()["error"]["code"] == "email_already_registered"


def test_signup_without_immediate_session_reports_confirmation(client: TestClient) -> None:
    user_id = str(uuid.uuid4())
    auth_client = FakeSupabaseAuthClient(
        created={"id": user_id, "email": "pending@example.com"},
        grant_error=ApiError(401, "invalid_credentials", "Email or password is incorrect."),
    )
    override_dependencies(auth_client, FakeProfilesRepository())

    response = client.post(
        f"{API_PREFIX}/auth/signup",
        json={
            "email": "pending@example.com",
            "password": "Str0ng-Pass",
            "role": "student",
            "full_name": "Pending User",
        },
    )

    assert response.status_code == 201
    body = response.json()
    assert body["session"] is None
    assert body["message"] == "Account created. Confirm your email address to sign in."


def test_login_returns_session(client: TestClient) -> None:
    user_id = str(uuid.uuid4())
    override_dependencies(
        FakeSupabaseAuthClient(grant=grant_payload(user_id, role="college")),
        FakeProfilesRepository(),
    )

    response = client.post(
        f"{API_PREFIX}/auth/login",
        json={"email": "college@example.com", "password": "Str0ng-Pass"},
    )

    assert response.status_code == 200
    assert response.json()["user"]["role"] == "college"
    assert response.json()["session"]["expires_in"] == 3600


def test_login_rejects_bad_credentials(client: TestClient) -> None:
    override_dependencies(
        FakeSupabaseAuthClient(
            grant_error=ApiError(401, "invalid_credentials", "Email or password is incorrect.")
        ),
        FakeProfilesRepository(),
    )

    response = client.post(
        f"{API_PREFIX}/auth/login",
        json={"email": "nobody@example.com", "password": "WrongPass1"},
    )

    assert response.status_code == 401
    assert response.json()["error"]["code"] == "invalid_credentials"


def test_login_blocks_account_without_role(client: TestClient) -> None:
    user_id = str(uuid.uuid4())
    override_dependencies(
        FakeSupabaseAuthClient(grant=grant_payload(user_id, role=None)),
        FakeProfilesRepository(),
    )

    response = client.post(
        f"{API_PREFIX}/auth/login",
        json={"email": "norole@example.com", "password": "Str0ng-Pass"},
    )

    assert response.status_code == 403
    assert response.json()["error"]["code"] == "role_not_assigned"


def test_logout_revokes_the_session_token(client: TestClient) -> None:
    auth_client = FakeSupabaseAuthClient()
    override_dependencies(auth_client, FakeProfilesRepository())

    response = client.post(f"{API_PREFIX}/auth/logout", headers=auth_header(make_token()))

    assert response.status_code == 204
    assert auth_client.revoked_token is not None


def test_logout_requires_authentication(client: TestClient) -> None:
    override_dependencies(FakeSupabaseAuthClient(), FakeProfilesRepository())
    assert client.post(f"{API_PREFIX}/auth/logout").status_code == 401


def test_password_reset_does_not_disclose_account_existence(client: TestClient) -> None:
    auth_client = FakeSupabaseAuthClient()
    override_dependencies(auth_client, FakeProfilesRepository())

    response = client.post(
        f"{API_PREFIX}/auth/password-reset", json={"email": "someone@example.com"}
    )

    assert response.status_code == 202
    assert auth_client.reset_requested_for == "someone@example.com"


def test_protected_route_forbidden_for_wrong_role() -> None:
    """Role guards reject a valid token that lacks the required role."""
    from fastapi import Depends, FastAPI

    from app.api.deps import require_roles
    from app.core.errors import register_exception_handlers

    probe = FastAPI()
    register_exception_handlers(probe)

    @probe.get("/admin-only", dependencies=[Depends(require_roles("admin"))])
    async def admin_only() -> dict[str, str]:
        return {"ok": "yes"}

    with TestClient(probe) as probe_client:
        allowed = probe_client.get("/admin-only", headers=auth_header(make_token(role="admin")))
        denied = probe_client.get("/admin-only", headers=auth_header(make_token(role="student")))
        no_role = probe_client.get("/admin-only", headers=auth_header(make_token(role=None)))

    assert allowed.status_code == 200
    assert denied.status_code == 403
    assert denied.json()["error"]["code"] == "forbidden"
    assert denied.json()["error"]["details"]["required_roles"] == ["admin"]
    assert no_role.status_code == 403
    assert no_role.json()["error"]["code"] == "role_not_assigned"
