"""Database query execution service."""
from typing import List, Dict, Any, Optional
from ..config import db_pool, logger, settings


class DatabaseService:
    """Execute safe database queries."""
    
    async def execute_query(self, sql: str, params: tuple) -> List[Dict[str, Any]]:
        """Execute a parameterized SQL query and return results."""
        try:
            async with db_pool.get_connection() as conn:
                async with conn.cursor() as cursor:
                    # Execute parameterized query
                    await cursor.execute(sql, params)
                    
                    # Fetch results
                    rows = await cursor.fetchall()
                    
                    # Get column names
                    columns = [desc[0] for desc in cursor.description] if cursor.description else []
                    
                    # Convert to list of dicts
                    results = []
                    for row in rows:
                        results.append(dict(zip(columns, row)))
                    
                    logger.info(f"Query executed successfully, returned {len(results)} rows")
                    return results
                    
        except Exception as e:
            logger.error(f"Database query failed: {e}")
            raise
    
    async def get_table_schema(self, table_name: str) -> Optional[List[Dict[str, Any]]]:
        """Get schema information for a table."""
        if table_name not in settings.ALLOWED_TABLES:
            logger.warning(f"Table {table_name} not in allowed list")
            return None
        
        try:
            sql = """
                SELECT 
                    COLUMN_NAME as column_name,
                    DATA_TYPE as data_type,
                    IS_NULLABLE as is_nullable,
                    COLUMN_KEY as column_key
                FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_SCHEMA = %s AND TABLE_NAME = %s
                ORDER BY ORDINAL_POSITION
            """
            
            async with db_pool.get_connection() as conn:
                async with conn.cursor() as cursor:
                    await cursor.execute(sql, (settings.DB_NAME, table_name))
                    rows = await cursor.fetchall()
                    
                    columns = [desc[0] for desc in cursor.description]
                    return [dict(zip(columns, row)) for row in rows]
                    
        except Exception as e:
            logger.error(f"Failed to get schema for {table_name}: {e}")
            return None
    
    async def get_all_schemas(self) -> Dict[str, List[Dict[str, Any]]]:
        """Get schemas for all allowed tables."""
        schemas = {}
        for table in settings.ALLOWED_TABLES:
            schema = await self.get_table_schema(table)
            if schema:
                schemas[table] = schema
        return schemas


# Global instance
database_service = DatabaseService()
