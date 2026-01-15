"""Database connection management."""
import aiomysql
from typing import Optional
from contextlib import asynccontextmanager
from .env import settings
from .logger import logger


class DatabasePool:
    """MySQL connection pool manager."""
    
    def __init__(self):
        self.pool: Optional[aiomysql.Pool] = None
        self.audit_pool: Optional[aiomysql.Pool] = None
    
    async def connect(self):
        """Create connection pools."""
        try:
            # Main database pool (read-only)
            self.pool = await aiomysql.create_pool(
                host=settings.DB_HOST,
                port=settings.DB_PORT,
                user=settings.DB_USER,
                password=settings.DB_PASSWORD,
                db=settings.DB_NAME,
                autocommit=True,
                minsize=1,
                maxsize=10,
                echo=not settings.is_production
            )
            logger.info(f"✅ Connected to main database: {settings.DB_NAME}")
            
            # Audit database pool (if configured)
            if settings.has_audit_db:
                self.audit_pool = await aiomysql.create_pool(
                    host=settings.AUDIT_DB_HOST,
                    port=settings.AUDIT_DB_PORT,
                    user=settings.AUDIT_DB_USER,
                    password=settings.AUDIT_DB_PASSWORD,
                    db=settings.AUDIT_DB_NAME,
                    autocommit=True,
                    minsize=1,
                    maxsize=5
                )
                logger.info(f"✅ Connected to audit database: {settings.AUDIT_DB_NAME}")
            else:
                # Use main pool for audit
                self.audit_pool = self.pool
                logger.info("ℹ️  Using main database for audit logs")
                
        except Exception as e:
            logger.error(f"❌ Database connection failed: {e}")
            raise
    
    async def close(self):
        """Close connection pools."""
        if self.pool:
            self.pool.close()
            await self.pool.wait_closed()
            logger.info("Database pool closed")
        
        if self.audit_pool and self.audit_pool != self.pool:
            self.audit_pool.close()
            await self.audit_pool.wait_closed()
            logger.info("Audit database pool closed")
    
    @asynccontextmanager
    async def get_connection(self):
        """Get a connection from the main pool."""
        async with self.pool.acquire() as conn:
            yield conn
    
    @asynccontextmanager
    async def get_audit_connection(self):
        """Get a connection from the audit pool."""
        async with self.audit_pool.acquire() as conn:
            yield conn
    
    async def test_connection(self) -> bool:
        """Test database connectivity."""
        try:
            async with self.get_connection() as conn:
                async with conn.cursor() as cursor:
                    await cursor.execute("SELECT 1")
                    result = await cursor.fetchone()
                    return result[0] == 1
        except Exception as e:
            logger.error(f"Database test failed: {e}")
            return False


# Global database pool instance
db_pool = DatabasePool()
