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
    # PostgREST is the primary database access path (supabase_url + supabase_anon_key).
    # Direct PostgreSQL is optional — used for migrations and admin jobs.
    # In the test environment, supabase_auth is configured so status is "ok".
    assert body["status"] == "ok"
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
    assert response.json()["error"]["code"] == "not_authenticated"


def test_me_returns_identity_with_profile(client: TestClient) -> None:
    user_id = str(uuid.uuid4())
    token = make_token(sub=user_id)
    fake_profile = profile_row(user_id)
    fake_memberships = [
        {
            "id": str(uuid.uuid4()),
            "membership_role": "student",
            "status": "active",
            "college_id": None,
            "recruiter_organization_id": str(uuid.uuid4()),
            "organization_name": "Acme Corp",
        }
    ]

    override_dependencies(
        FakeSupabaseAuthClient(grant=grant_payload(user_id)),
        FakeProfilesRepository(row=fake_profile, memberships=fake_memberships),
    )

    response = client.get(f"{API_PREFIX}/users/me", headers=auth_header(token))
    assert response.status_code == 200

    body = response.json()
    assert body["id"] == user_id
    assert body["role"] == "student"
    assert body["profile"] is not None
    assert body["profile"]["display_name"] == "Test Student"
    assert len(body["memberships"]) == 1
    assert body["memberships"][0]["organization_type"] == "recruiter_organization"
    assert body["memberships"][0]["organization_name"] == "Acme Corp"


def test_me_returns_null_profile_when_none_exists(client: TestClient) -> None:
    user_id = str(uuid.uuid4())
    token = make_token(sub=user_id)

    override_dependencies(
        FakeSupabaseAuthClient(grant=grant_payload(user_id)),
        FakeProfilesRepository(row=None),
    )

    response = client.get(f"{API_PREFIX}/users/me", headers=auth_header(token))
    assert response.status_code == 200
    body = response.json()
    assert body["profile"] is None
    assert body["memberships"] == []


def test_me_rejects_users_without_role(client: TestClient) -> None:
    user_id = str(uuid.uuid4())
    token = make_token(role=None, sub=user_id)

    override_dependencies(
        FakeSupabaseAuthClient(grant=grant_payload(user_id, role=None)),
        FakeProfilesRepository(),
    )

    response = client.get(f"{API_PREFIX}/users/me", headers=auth_header(token))
    assert response.status_code == 403
    assert response.json()["error"]["code"] == "role_not_assigned"


def test_signup_delegates_to_auth_provider(client: TestClient) -> None:
    user_id = str(uuid.uuid4())
    fake = FakeSupabaseAuthClient(
        created={"id": user_id},
        grant=grant_payload(user_id),
    )
    override_dependencies(fake, FakeProfilesRepository())

    response = client.post(
        f"{API_PREFIX}/auth/signup",
        json={
            "email": "new@example.com",
            "password": "Strong-Pass1",
            "role": "student",
            "full_name": "New Student",
        },
    )
    assert response.status_code == 201
    assert response.json()["user"]["id"] == user_id
    assert fake.create_payload is not None
    assert fake.create_payload["role"] == "student"


def test_signup_rejects_admin_role(client: TestClient) -> None:
    override_dependencies(FakeSupabaseAuthClient(), FakeProfilesRepository())

    response = client.post(
        f"{API_PREFIX}/auth/signup",
        json={
            "email": "admin@example.com",
            "password": "Strong-Pass1",
            "role": "admin",
            "full_name": "Admin User",
        },
    )
    assert response.status_code == 422


def test_login_returns_session(client: TestClient) -> None:
    user_id = str(uuid.uuid4())
    grant = grant_payload(user_id)
    override_dependencies(
        FakeSupabaseAuthClient(grant=grant),
        FakeProfilesRepository(),
    )

    response = client.post(
        f"{API_PREFIX}/auth/login",
        json={"email": "student@example.com", "password": "correct-password"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["session"] is not None
    assert body["session"]["access_token"] == "access-token-value"
    assert body["user"]["role"] == "student"


def test_login_rejects_wrong_password(client: TestClient) -> None:
    override_dependencies(
        FakeSupabaseAuthClient(grant_error=ApiError(401, "invalid_credentials", "Wrong")),
        FakeProfilesRepository(),
    )

    response = client.post(
        f"{API_PREFIX}/auth/login",
        json={"email": "student@example.com", "password": "wrong"},
    )
    assert response.status_code == 401
    assert response.json()["error"]["code"] == "invalid_credentials"


def test_login_rejects_users_without_role(client: TestClient) -> None:
    user_id = str(uuid.uuid4())
    override_dependencies(
        FakeSupabaseAuthClient(grant=grant_payload(user_id, role=None)),
        FakeProfilesRepository(),
    )

    response = client.post(
        f"{API_PREFIX}/auth/login",
        json={"email": "norole@example.com", "password": "password123"},
    )
    assert response.status_code == 403
    assert response.json()["error"]["code"] == "role_not_assigned"


def test_password_reset_always_returns_success(client: TestClient) -> None:
    fake = FakeSupabaseAuthClient()
    override_dependencies(fake, FakeProfilesRepository())

    response = client.post(
        f"{API_PREFIX}/auth/password-reset",
        json={"email": "anyone@example.com"},
    )
    assert response.status_code == 202
    assert fake.reset_requested_for == "anyone@example.com"


def test_profile_update_passes_fields_to_repository(client: TestClient) -> None:
    user_id = str(uuid.uuid4())
    token = make_token(sub=user_id)
    fake_profile = profile_row(user_id)

    fake_repo = FakeProfilesRepository(row=fake_profile)
    override_dependencies(
        FakeSupabaseAuthClient(grant=grant_payload(user_id)),
        fake_repo,
    )

    payload = {"display_name": "Updated Name", "location": "Mumbai"}
    response = client.put(
        f"{API_PREFIX}/users/profile",
        headers=auth_header(token),
        json=payload,
    )
    assert response.status_code == 200
    assert fake_repo.last_update is not None
    assert fake_repo.last_update["display_name"] == "Updated Name"
    assert fake_repo.last_update["location"] == "Mumbai"


def test_profile_update_rejects_unknown_fields(client: TestClient) -> None:
    user_id = str(uuid.uuid4())
    token = make_token(sub=user_id)

    override_dependencies(
        FakeSupabaseAuthClient(grant=grant_payload(user_id)),
        FakeProfilesRepository(row=profile_row(user_id)),
    )

    response = client.put(
        f"{API_PREFIX}/users/profile",
        headers=auth_header(token),
        json={"user_id": "hacked"},
    )
    assert response.status_code == 422


def test_profile_update_rejects_empty_body(client: TestClient) -> None:
    user_id = str(uuid.uuid4())
    token = make_token(sub=user_id)

    override_dependencies(
        FakeSupabaseAuthClient(grant=grant_payload(user_id)),
        FakeProfilesRepository(row=profile_row(user_id)),
    )

    response = client.put(
        f"{API_PREFIX}/users/profile",
        headers=auth_header(token),
        json={},
    )
    assert response.status_code == 400
    assert response.json()["error"]["code"] == "empty_update"


def test_profile_update_404_when_no_profile(client: TestClient) -> None:
    user_id = str(uuid.uuid4())
    token = make_token(sub=user_id)

    override_dependencies(
        FakeSupabaseAuthClient(grant=grant_payload(user_id)),
        FakeProfilesRepository(row=None),
    )

    response = client.put(
        f"{API_PREFIX}/users/profile",
        headers=auth_header(token),
        json={"display_name": "New Name"},
    )
    assert response.status_code == 404
    assert response.json()["error"]["code"] == "profile_not_found"


def test_logout_revokes_session(client: TestClient) -> None:
    user_id = str(uuid.uuid4())
    token = make_token(sub=user_id)
    fake = FakeSupabaseAuthClient()
    override_dependencies(fake, FakeProfilesRepository())

    response = client.post(
        f"{API_PREFIX}/auth/logout",
        headers=auth_header(token),
    )
    assert response.status_code == 204
    assert fake.revoked_token == token


def test_admin_role_is_rejected_at_signup(client: TestClient) -> None:
    """Public signup must never accept the admin role."""
    override_dependencies(FakeSupabaseAuthClient(), FakeProfilesRepository())

    response = client.post(
        f"{API_PREFIX}/auth/signup",
        json={
            "email": "admin@test.com",
            "password": "StrongPass1!",
            "role": "admin",
            "full_name": "Admin",
        },
    )
    assert response.status_code == 422
    body = response.json()
    assert body["error"]["code"] == "validation_error"


def test_all_schema_extra_fields_are_rejected(client: TestClient) -> None:
    """Every request model must use `extra=\"forbid\"`."""
    override_dependencies(FakeSupabaseAuthClient(), FakeProfilesRepository())

    # Signup with extra field
    response = client.post(
        f"{API_PREFIX}/auth/signup",
        json={
            "email": "x@test.com",
            "password": "StrongPass1!",
            "role": "student",
            "full_name": "X",
            "unknown_field": True,
        },
    )
    assert response.status_code == 422

    # Login with extra field
    response = client.post(
        f"{API_PREFIX}/auth/login",
        json={"email": "x@test.com", "password": "p", "sneaky": True},
    )
    assert response.status_code == 422


def test_signup_weak_password_is_rejected(client: TestClient) -> None:
    override_dependencies(FakeSupabaseAuthClient(), FakeProfilesRepository())

    # All-numeric
    response = client.post(
        f"{API_PREFIX}/auth/signup",
        json={
            "email": "weak@test.com",
            "password": "12345678",
            "role": "student",
            "full_name": "Weak",
        },
    )
    assert response.status_code == 422

    # All-alpha
    response = client.post(
        f"{API_PREFIX}/auth/signup",
        json={
            "email": "weak@test.com",
            "password": "abcdefgh",
            "role": "student",
            "full_name": "Weak",
        },
    )
    assert response.status_code == 422

    # Too short
    response = client.post(
        f"{API_PREFIX}/auth/signup",
        json={
            "email": "weak@test.com",
            "password": "Ab1!",
            "role": "student",
            "full_name": "Weak",
        },
    )
    assert response.status_code == 422


def test_signup_duplicate_email_is_409(client: TestClient) -> None:
    override_dependencies(
        FakeSupabaseAuthClient(create_error=ApiError(409, "email_already_registered", "Duplicate")),
        FakeProfilesRepository(),
    )

    response = client.post(
        f"{API_PREFIX}/auth/signup",
        json={
            "email": "taken@example.com",
            "password": "Strong-Pass1",
            "role": "student",
            "full_name": "Taken",
        },
    )
    assert response.status_code == 409
    assert response.json()["error"]["code"] == "email_already_registered"


def test_me_with_college_membership(client: TestClient) -> None:
    user_id = str(uuid.uuid4())
    token = make_token(sub=user_id, role="college")
    fake_profile = profile_row(user_id, display_name="College User")
    fake_memberships = [
        {
            "id": str(uuid.uuid4()),
            "membership_role": "admin",
            "status": "active",
            "college_id": str(uuid.uuid4()),
            "recruiter_organization_id": None,
            "organization_name": "Tech University",
        }
    ]

    override_dependencies(
        FakeSupabaseAuthClient(grant=grant_payload(user_id, role="college", full_name="College User")),
        FakeProfilesRepository(row=fake_profile, memberships=fake_memberships),
    )

    response = client.get(f"{API_PREFIX}/users/me", headers=auth_header(token))
    assert response.status_code == 200
    body = response.json()
    assert body["role"] == "college"
    assert body["memberships"][0]["organization_type"] == "college"
    assert body["memberships"][0]["organization_name"] == "Tech University"


def test_profile_update_with_list_fields(client: TestClient) -> None:
    user_id = str(uuid.uuid4())
    token = make_token(sub=user_id)
    fake_profile = profile_row(user_id)

    fake_repo = FakeProfilesRepository(row=fake_profile)
    override_dependencies(
        FakeSupabaseAuthClient(grant=grant_payload(user_id)),
        fake_repo,
    )

    education = [{"degree": "B.Tech", "institution": "IIT", "start_year": 2020, "end_year": 2024}]
    interests = ["AI", "ML", "NLP"]

    response = client.put(
        f"{API_PREFIX}/users/profile",
        headers=auth_header(token),
        json={"education": education, "interests": interests},
    )
    assert response.status_code == 200
    assert fake_repo.last_update is not None
    assert fake_repo.last_update["education"] == education
    assert fake_repo.last_update["interests"] == interests


def test_health_reports_all_configured_capabilities(client: TestClient) -> None:
    """Verify the full capability structure is returned."""
    response = client.get(f"{API_PREFIX}/health")
    body = response.json()

    expected_capabilities = {
        "supabase_auth",
        "supabase_admin",
        "supabase_storage",
        "database",
        "groq",
        "qdrant",
        "elevenlabs",
        "elevenlabs_agent",
        "n8n",
    }
    assert set(body["capabilities"].keys()) == expected_capabilities
    # All should be booleans
    for key, value in body["capabilities"].items():
        assert isinstance(value, bool), f"capability {key} should be a bool"


def test_request_id_propagates_through_errors(client: TestClient) -> None:
    """Request ID should be present even on 401 responses."""
    response = client.get(
        f"{API_PREFIX}/users/me",
        headers={"X-Request-ID": "error-trace"},
    )
    assert response.status_code == 401
    assert response.headers.get("X-Request-ID") == "error-trace"
