from fastapi.testclient import TestClient
from main import app
from app.core.security import get_current_active_user, UserInfo
import pytest

client = TestClient(app)

# Mock user for authentication
def override_get_current_active_user():
    return UserInfo(id="test-user-id", email="test@example.com")

app.dependency_overrides[get_current_active_user] = override_get_current_active_user

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy", "version": "2.0.0"}

def test_get_portfolio_settings():
    response = client.get("/api/portfolio/settings")
    # Even if portfolio settings don't exist for 'test-user-id', it should return 200 with defaults
    assert response.status_code == 200
    data = response.json()
    assert "username" in data
    assert "theme" in data

def test_get_skills_insights():
    response = client.get("/api/insights/skills")
    # Should return a list of skills (might be empty for test user)
    assert response.status_code == 200
    data = response.json()
    assert "skills" in data
    assert "total" in data

def test_get_timeline():
    response = client.get("/api/timeline/")
    assert response.status_code == 200
    data = response.json()
    assert "events" in data

def test_get_integrations():
    response = client.get("/api/integrations/status")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    
if __name__ == "__main__":
    print("Running basic backend tests...")
    
    print("Testing /health")
    test_health_check()
    print("-> OK")

    print("Testing GET /api/portfolio/settings")
    test_get_portfolio_settings()
    print("-> OK")

    print("Testing GET /api/insights/skills")
    test_get_skills_insights()
    print("-> OK")
    
    print("Testing GET /api/timeline/")
    test_get_timeline()
    print("-> OK")
    
    print("Testing GET /api/integrations/status")
    test_get_integrations()
    print("-> OK")

    print("All tests passed successfully!")
