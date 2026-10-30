import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.mark.asyncio
async def test_get_roles():
    """Verify /api/v1/auth/roles returns 4 official stakeholder personas and permission matrix."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/v1/auth/roles")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert len(data["roles"]) == 4

        role_keys = {r["role"] for r in data["roles"]}
        expected_roles = {
            "NATIONAL_ADMIN",
            "INSTITUTION_REGISTRAR",
            "STUDENT_DATA_PRINCIPAL",
            "UNIVERSITY_CONTROLLER",
        }
        assert role_keys == expected_roles

        admin = next(r for r in data["roles"] if r["role"] == "NATIONAL_ADMIN")
        assert "command:read" in admin["scopes"]
        assert "/" in admin["allowed_portals"]


@pytest.mark.asyncio
async def test_login_and_token():
    """Verify /api/v1/auth/login issues signed JWT token and Merkle audit sequence."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Test valid login
        response = await client.post(
            "/api/v1/auth/login",
            json={"role": "NATIONAL_ADMIN", "auth_method": "JANPARICHAY_SSO"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["role"] == "NATIONAL_ADMIN"
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert data["allowed_dashboard_path"] == "/dashboard/admin"
        assert data["audit_sequence_id"] >= 1
        assert len(data["audit_record_hash"]) == 64

        # Test token inspection via /me
        token = data["access_token"]
        me_resp = await client.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert me_resp.status_code == 200
        me_data = me_resp.json()
        assert me_data["authenticated"] is True
        assert me_data["claims"]["role"] == "NATIONAL_ADMIN"
        assert me_data["claims"]["allowed_dashboard_path"] == "/dashboard/admin"
        assert "command:read" in me_data["claims"]["scopes"]


@pytest.mark.asyncio
async def test_email_password_login():
    """Verify email/password login works for all 4 strict stakeholder personas."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        test_accounts = [
            ("admin@aicte-india.org", "NATIONAL_ADMIN", "/dashboard/admin"),
            ("registrar@apex-inst.ac.in", "INSTITUTION_REGISTRAR", "/institution-portal"),
            ("aarav.sharma@student.apaar.in", "STUDENT_DATA_PRINCIPAL", "/consent-wallet"),
            ("coe@tech-univ.ac.in", "UNIVERSITY_CONTROLLER", "/degree-studio"),
        ]

        for email, expected_role, expected_path in test_accounts:
            resp = await client.post(
                "/api/v1/auth/login",
                json={"email": email, "password": "password123"},
            )
            assert resp.status_code == 200, f"Login failed for {email}: {resp.text}"
            data = resp.json()
            assert data["email"] == email
            assert data["role"] == expected_role
            assert data["allowed_dashboard_path"] == expected_path
            assert "access_token" in data

            # Verify claims via /me
            me_resp = await client.get(
                "/api/v1/auth/me",
                headers={"Authorization": f"Bearer {data['access_token']}"},
            )
            assert me_resp.status_code == 200
            claims = me_resp.json()["claims"]
            assert claims["role"] == expected_role
            assert claims["allowed_dashboard_path"] == expected_path


@pytest.mark.asyncio
async def test_email_password_invalid_credentials():
    """Verify login with invalid credentials returns HTTP 401."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Wrong password
        resp1 = await client.post(
            "/api/v1/auth/login",
            json={"email": "admin@aicte-india.org", "password": "wrong_password"},
        )
        assert resp1.status_code == 401

        # Unknown email
        resp2 = await client.post(
            "/api/v1/auth/login",
            json={"email": "unknown@hacker.org", "password": "password123"},
        )
        assert resp2.status_code == 401


@pytest.mark.asyncio
async def test_login_invalid_role():
    """Verify login with invalid role returns HTTP 400."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post(
            "/api/v1/auth/login",
            json={"role": "UNKNOWN_HACKER", "auth_method": "JANPARICHAY_SSO"},
        )
        assert response.status_code == 400
