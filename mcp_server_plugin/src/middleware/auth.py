"""Authentication middleware."""
from fastapi import HTTPException, Security, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from typing import Dict, Any, Optional
from ..config import settings, logger


security = HTTPBearer(auto_error=False)


async def verify_jwt(credentials: Optional[HTTPAuthorizationCredentials] = Security(security)) -> Dict[str, Any]:
    """Verify JWT token from ERP system."""
    
    # Development mode: bypass authentication
    if settings.ENVIRONMENT == "development" and settings.DISABLE_AUTH:
        logger.warning("⚠️  Authentication disabled in development mode")
        return {
            "user_id": "dev_user",
            "roles": ["teacher", "hod", "admin"],  # All roles for testing
            "payload": {"dev": True}
        }
    
    # Production mode: require valid JWT
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication token",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    try:
        token = credentials.credentials
        
        # Decode and verify JWT
        payload = jwt.decode(
            token,
            settings.ERP_JWT_SECRET,
            algorithms=["HS256"],
            audience=settings.ERP_JWT_AUDIENCE,
            issuer=settings.ERP_JWT_ISSUER
        )
        
        # Extract user information
        user_id = payload.get("sub") or payload.get("user_id")
        roles = payload.get("roles", [])
        
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: missing user_id"
            )
        
        return {
            "user_id": user_id,
            "roles": roles,
            "payload": payload
        }
        
    except JWTError as e:
        logger.error(f"JWT verification failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"}
        )
    except Exception as e:
        logger.error(f"Authentication error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Authentication failed"
        )


def check_permission(user_roles: list, required_roles: list) -> bool:
    """Check if user has required role."""
    return any(role in user_roles for role in required_roles)
