#!/usr/bin/env python3
"""Simple test script for MCP Server."""

import jwt
import requests
import json
from datetime import datetime, timedelta

# Configuration
BASE_URL = "http://localhost:5003"
JWT_SECRET = "test_secret_key"  # Change this to match your .env

def test_health():
    """Test health endpoint."""
    print("\n=== Testing Health Endpoint ===")
    try:
        response = requests.get(f"{BASE_URL}/health")
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def generate_token(user_id="teacher123", roles=["teacher", "hod"]):
    """Generate JWT token."""
    payload = {
        "sub": user_id,
        "roles": roles,
        "iss": "https://erp.example.com",
        "aud": "erp_mcp",
        "exp": datetime.utcnow() + timedelta(hours=1)
    }
    token = jwt.encode(payload, JWT_SECRET, algorithm="HS256")
    return token

def test_query(token, question="Show me all classes"):
    """Test query endpoint."""
    print(f"\n=== Testing Query: {question} ===")
    try:
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        data = {
            "question": question,
            "context": {"class_id": 1}
        }
        response = requests.post(f"{BASE_URL}/api/v1/query", headers=headers, json=data)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"Intent: {result.get('intent')}")
            print(f"Rows: {result.get('rows_count')}")
            print(f"Answer: {result.get('answer')[:200]}...")
        else:
            print(f"Error: {response.text}")
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def main():
    """Run all tests."""
    print("=" * 60)
    print("MCP Server Simple Test")
    print("=" * 60)
    
    # Test 1: Health
    health_ok = test_health()
    
    if not health_ok:
        print("\n❌ Health check failed. Make sure server is running:")
        print("   python -m uvicorn src.main:app --reload --port 5003")
        return
    
    # Test 2: Generate token
    print("\n=== Generating Test Token ===")
    token = generate_token()
    print(f"Token: {token[:50]}...")
    
    # Test 3: Query
    test_query(token, "Show me the timetable for Class 10A")
    
    print("\n" + "=" * 60)
    print("✅ Tests Complete!")
    print("=" * 60)
    print("\nNext steps:")
    print("1. Open http://localhost:5003 for test UI")
    print("2. Check http://localhost:5003/docs for API docs")
    print("3. Update JWT_SECRET in this script to match your .env")

if __name__ == "__main__":
    main()
