#!/usr/bin/env python3
"""Generate JWT token for testing MCP Server."""

import jwt
from datetime import datetime, timedelta
import sys

def generate_token(user_id: str, roles: list, secret: str) -> str:
    """Generate a JWT token for testing."""
    payload = {
        "sub": user_id,
        "roles": roles,
        "iss": "https://erp.example.com",
        "aud": "erp_mcp",
        "exp": datetime.utcnow() + timedelta(hours=24),
        "iat": datetime.utcnow()
    }
    
    token = jwt.encode(payload, secret, algorithm="HS256")
    return token

def main():
    """Main function."""
    print("=== JWT Token Generator for MCP Server ===\n")
    
    # Get inputs
    user_id = input("Enter user ID (default: teacher123): ").strip() or "teacher123"
    
    print("\nAvailable roles:")
    print("1. student")
    print("2. teacher")
    print("3. hod")
    print("4. principal")
    print("5. accountant")
    print("6. admin")
    
    role_input = input("\nEnter role numbers (comma-separated, default: 2,3): ").strip() or "2,3"
    
    role_map = {
        "1": "student",
        "2": "teacher",
        "3": "hod",
        "4": "principal",
        "5": "accountant",
        "6": "admin"
    }
    
    roles = [role_map[r.strip()] for r in role_input.split(",") if r.strip() in role_map]
    
    secret = input("\nEnter JWT secret (from .env): ").strip()
    
    if not secret:
        print("Error: JWT secret is required")
        sys.exit(1)
    
    # Generate token
    token = generate_token(user_id, roles, secret)
    
    print("\n" + "="*60)
    print("Generated JWT Token:")
    print("="*60)
    print(token)
    print("="*60)
    
    print(f"\nUser ID: {user_id}")
    print(f"Roles: {', '.join(roles)}")
    print(f"Expires: 24 hours from now")
    
    print("\n" + "="*60)
    print("Test with curl:")
    print("="*60)
    print(f"""
curl -X POST http://localhost:5003/api/v1/query \\
  -H "Authorization: Bearer {token}" \\
  -H "Content-Type: application/json" \\
  -d '{{"question": "Show me the timetable for Class 10A", "context": {{"class_id": 1}}}}'
""")
    
    # Decode and show payload
    print("\n" + "="*60)
    print("Token Payload:")
    print("="*60)
    decoded = jwt.decode(token, options={"verify_signature": False})
    for key, value in decoded.items():
        if key == "exp" or key == "iat":
            value = datetime.fromtimestamp(value).strftime("%Y-%m-%d %H:%M:%S")
        print(f"{key}: {value}")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nCancelled by user")
        sys.exit(0)
    except Exception as e:
        print(f"\nError: {e}")
        sys.exit(1)
