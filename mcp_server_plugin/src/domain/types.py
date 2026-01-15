"""Domain types and schemas."""
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime
from enum import Enum


class UserRole(str, Enum):
    """User roles in the ERP system."""
    STUDENT = "student"
    TEACHER = "teacher"
    HOD = "hod"
    PRINCIPAL = "principal"
    ACCOUNTANT = "accountant"
    ADMIN = "admin"


class Intent(str, Enum):
    """Supported query intents."""
    GET_TIMETABLE = "get_timetable"
    GET_ATTENDANCE = "get_attendance"
    GET_STUDENT_INFO = "get_student_info"
    GET_TEACHER_INFO = "get_teacher_info"
    GET_FEE_STATUS = "get_fee_status"
    GET_EXAM_SCHEDULE = "get_exam_schedule"
    GET_CLASS_INFO = "get_class_info"
    GET_SUBJECT_INFO = "get_subject_info"
    # New intents
    GET_MARKS = "get_marks"
    GET_DIARY = "get_diary"
    GET_CALENDAR = "get_calendar"
    GET_PARENT_INFO = "get_parent_info"
    GET_CIRCULAR = "get_circular"
    GET_ATTENDANCE_STATS = "get_attendance_stats"
    GET_FEE_SUMMARY = "get_fee_summary"
    GET_CLASS_PERFORMANCE = "get_class_performance"
    UNKNOWN = "unknown"


class QueryRequest(BaseModel):
    """Request to query the database."""
    question: str = Field(..., min_length=3, max_length=500)
    context: Optional[Dict[str, Any]] = Field(default_factory=dict)
    
    class Config:
        json_schema_extra = {
            "example": {
                "question": "Show me the timetable for Class 10A tomorrow",
                "context": {"class_id": 10}
            }
        }


class QueryResponse(BaseModel):
    """Response from database query."""
    answer: str
    sources: List[Dict[str, Any]] = Field(default_factory=list)
    confidence: float = Field(ge=0.0, le=1.0)
    rows_count: int = Field(ge=0)
    intent: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "answer": "Tomorrow's timetable for Class 10A includes Math at 9:00 AM...",
                "sources": [{"table": "timetables", "row_id": 123}],
                "confidence": 0.85,
                "rows_count": 5,
                "intent": "get_timetable"
            }
        }


class IntentExtraction(BaseModel):
    """Extracted intent from user question."""
    intent: Intent
    parameters: Dict[str, Any] = Field(default_factory=dict)
    confidence: float = Field(ge=0.0, le=1.0)


class AuditLog(BaseModel):
    """Audit log entry."""
    user_id: str
    roles: List[str]
    question: str
    intent: str
    parameters: Dict[str, Any]
    sql_template: Optional[str] = None
    rows_returned: int
    success: bool
    error_message: Optional[str] = None
    response_time_ms: int
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class HealthResponse(BaseModel):
    """Health check response."""
    status: str
    service: str
    database: bool
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class ErrorResponse(BaseModel):
    """Error response."""
    error: str
    detail: Optional[str] = None
    code: Optional[str] = None
