#!/usr/bin/env python3
"""Quick JWT token generator - no dependencies needed."""

import jwt
from datetime import datetime, timedelta

# Get JWT secret from .env
try:
    with open('.env', 'r') as f:
        for line in f:
            if line.startswith('ERP_JWT_SECRET='):
                JWT_SECRET = line.split('=', 1)[1].strip()
                break
        else:
            JWT_SECRET = "test_secret_key"
except:
    JWT_SECRET = "test_secret_key"

# Generate token
token = jwt.encode(
    {
        "sub": "teacher123",
        "roles": ["teacher", "hod", "principal"],  # Give all permissions for testing
        "iss": "https://erp.example.com",
        "aud": "erp_mcp",
        "exp": datetime.utcnow() + timedelta(hours=24)
    },
    JWT_SECRET,
    algorithm="HS256"
)

print("\n" + "="*70)
print("JWT TOKEN FOR TESTING")
print("="*70)
print(token)
print("="*70)
print("\nCopy this token and paste it in the UI at http://localhost:5003")
print("\nToken is valid for 24 hours")
print("Roles: teacher, hod, principal (full access)")
print("="*70 + "\n")
