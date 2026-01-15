"""Query routes."""
from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Any
import time
from ..domain.types import QueryRequest, QueryResponse, ErrorResponse, Intent
from ..middleware import verify_jwt
from ..services import (
    intent_extractor,
    query_planner,
    database_service,
    llm_service,
    audit_service
)
from ..services.llm_intent_extractor import llm_intent_extractor
from ..domain.types import AuditLog
from ..config import logger, settings

router = APIRouter(prefix="/api/v1", tags=["query"])


@router.post("/query", response_model=QueryResponse)
async def query_database(
    request: QueryRequest,
    user: Dict[str, Any] = Depends(verify_jwt)
):
    """
    Query the ERP database using natural language.
    
    This endpoint:
    1. Extracts intent from the question
    2. Checks user permissions
    3. Executes safe parameterized SQL
    4. Generates natural language answer using Gemini
    5. Logs the query for audit
    """
    start_time = time.time()
    user_id = user["user_id"]
    user_roles = user["roles"]
    
    audit_log = AuditLog(
        user_id=user_id,
        roles=user_roles,
        question=request.question,
        intent="",
        parameters={},
        rows_returned=0,
        success=False,
        response_time_ms=0
    )
    
    try:
        # Rate limiting check
        query_count = await audit_service.get_user_query_count(user_id, minutes=1)
        if query_count >= settings.RATE_LIMIT_PER_MINUTE:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Rate limit exceeded. Please try again later."
            )
        
        # 1. Extract intent (try pattern matching first, then LLM)
        intent_result = intent_extractor.extract_intent(request.question, request.context)
        
        # If pattern matching fails, try LLM
        if intent_result.intent == Intent.UNKNOWN:
            logger.info("Pattern matching failed, trying LLM intent extraction...")
            intent_result = llm_intent_extractor.extract_intent(request.question, request.context)
        
        if intent_result.intent == Intent.UNKNOWN:
            audit_log.intent = "unknown"
            audit_log.success = False
            audit_log.error_message = "Could not understand the question"
            return QueryResponse(
                answer="I couldn't understand your question. Please try rephrasing it or be more specific.",
                sources=[],
                confidence=0.0,
                rows_count=0,
                intent="unknown"
            )
        
        audit_log.intent = intent_result.intent.value
        audit_log.parameters = intent_result.parameters
        
        # 2. Plan query and check permissions
        sql, params = query_planner.plan_query(
            intent_result.intent,
            intent_result.parameters,
            user_roles
        )
        
        if not sql:
            audit_log.success = False
            audit_log.error_message = "Permission denied or invalid query"
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to access this information"
            )
        
        audit_log.sql_template = sql[:200]  # Store first 200 chars
        
        # 3. Execute database query
        rows = await database_service.execute_query(sql, params)
        audit_log.rows_returned = len(rows)
        
        # 4. Generate natural language answer
        answer = await llm_service.generate_answer(
            request.question,
            rows,
            intent_result.intent.value
        )
        
        # 5. Build response
        sources = []
        for idx, row in enumerate(rows[:10]):  # First 10 sources
            if "id" in row:
                sources.append({
                    "table": intent_result.intent.value,
                    "row_id": row["id"]
                })
        
        audit_log.success = True
        
        response = QueryResponse(
            answer=answer,
            sources=sources,
            confidence=intent_result.confidence,
            rows_count=len(rows),
            intent=intent_result.intent.value
        )
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Query processing failed: {e}")
        audit_log.success = False
        audit_log.error_message = str(e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process query"
        )
    finally:
        # Log audit
        audit_log.response_time_ms = int((time.time() - start_time) * 1000)
        await audit_service.log_query(audit_log)


@router.get("/intents")
async def list_intents(user: Dict[str, Any] = Depends(verify_jwt)):
    """
    List all supported intents and their descriptions.
    """
    intents = {
        "get_timetable": "Get class timetable/schedule",
        "get_attendance": "Get attendance records",
        "get_student_info": "Get student information",
        "get_teacher_info": "Get teacher information",
        "get_fee_status": "Get fee payment status",
        "get_exam_schedule": "Get exam schedule",
        "get_class_info": "Get class information",
        "get_subject_info": "Get subject information"
    }
    
    return {
        "intents": intents,
        "user_roles": user["roles"]
    }
