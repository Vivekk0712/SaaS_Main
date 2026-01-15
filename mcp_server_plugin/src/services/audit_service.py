"""Audit logging service."""
from typing import Dict, Any, Optional
from datetime import datetime
from ..config import db_pool, logger
from ..domain.types import AuditLog


class AuditService:
    """Service for logging all queries and responses."""
    
    async def log_query(self, audit_log: AuditLog):
        """Log a query to the audit database."""
        try:
            sql = """
                INSERT INTO mcp_audit_logs (
                    user_id, roles, question, intent, parameters,
                    sql_template, rows_returned, success, error_message,
                    response_time_ms, timestamp
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            
            import json
            
            params = (
                audit_log.user_id,
                json.dumps(audit_log.roles),
                audit_log.question,
                audit_log.intent,
                json.dumps(audit_log.parameters),
                audit_log.sql_template,
                audit_log.rows_returned,
                audit_log.success,
                audit_log.error_message,
                audit_log.response_time_ms,
                audit_log.timestamp
            )
            
            async with db_pool.get_audit_connection() as conn:
                async with conn.cursor() as cursor:
                    await cursor.execute(sql, params)
                    await conn.commit()
            
            logger.debug(f"Audit log created for user {audit_log.user_id}")
            
        except Exception as e:
            # Don't fail the request if audit logging fails
            logger.error(f"Failed to create audit log: {e}")
    
    async def get_user_query_count(self, user_id: str, minutes: int = 60) -> int:
        """Get query count for a user in the last N minutes."""
        try:
            sql = """
                SELECT COUNT(*) as count
                FROM mcp_audit_logs
                WHERE user_id = %s 
                AND timestamp >= DATE_SUB(NOW(), INTERVAL %s MINUTE)
            """
            
            async with db_pool.get_audit_connection() as conn:
                async with conn.cursor() as cursor:
                    await cursor.execute(sql, (user_id, minutes))
                    result = await cursor.fetchone()
                    return result[0] if result else 0
                    
        except Exception as e:
            logger.error(f"Failed to get query count: {e}")
            return 0


# Global instance
audit_service = AuditService()
