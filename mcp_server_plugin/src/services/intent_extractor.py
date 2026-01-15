"""Intent extraction service."""
from typing import Dict, Any
from ..domain.types import Intent, IntentExtraction
from ..config import logger
import re


class IntentExtractorService:
    """Extract intent from natural language questions."""
    
    # Intent patterns (simple rule-based, can be enhanced with LLM)
    # NOTE: Order matters! More specific patterns should come first
    PATTERNS = {
        # NEW INTENTS (More specific - check these first)
        Intent.GET_MARKS: [
            r"marks?|grades?|scores?|result|marks.*student",
            r"show.*marks|get.*marks|check.*marks",
            r"what.*marks|how.*marks|marks.*for",
            r"test.*result|exam.*result",
        ],
        Intent.GET_ATTENDANCE_STATS: [
            r"attendance.*stat|attendance.*percent|attendance.*rate",
            r"attendance.*summary|attendance.*report",
            r"how.*many.*present|how.*many.*absent",
            r"calculate.*attendance|attendance.*this\s+month",
        ],
        Intent.GET_CLASS_PERFORMANCE: [
            r"class.*performance|average.*marks|class.*average",
            r"performance.*class|how.*class.*perform",
            r"highest.*marks|lowest.*marks",
            r"class.*result|performance.*stat",
        ],
        Intent.GET_FEE_SUMMARY: [
            r"fee.*summary|fee.*total|fee.*collect",
            r"total.*fee|pending.*fee.*total",
            r"how.*much.*fee|fee.*stat",
        ],
        Intent.GET_PARENT_INFO: [
            r"parent|guardian|father|mother",
            r"parent.*info|parent.*contact|parent.*phone",
            r"guardian.*info|guardian.*contact",
            r"contact.*parent|phone.*parent",
        ],
        Intent.GET_DIARY: [
            r"diary|homework|assignment.*diary",
            r"what.*diary|show.*diary|check.*diary",
            r"what.*taught|what.*teacher.*write",
            r"diary.*entry|diary.*note",
        ],
        Intent.GET_CALENDAR: [
            r"calendar|events?|upcoming|schedule.*event",
            r"what.*event|show.*event|list.*event",
            r"this\s+week|next\s+week|this\s+month",
            r"holiday|ptm|parent.*teacher.*meeting",
        ],
        Intent.GET_CIRCULAR: [
            r"circular|announcement|notice|notification",
            r"show.*circular|get.*circular|list.*circular",
            r"what.*circular|recent.*circular",
        ],
        # ORIGINAL INTENTS (More general - check these after)
        Intent.GET_TIMETABLE: [
            r"timetable|schedule|time\s*table|class\s*schedule",
            r"what.*class.*when|when.*class",
            r"show.*timetable|show.*schedule|get.*timetable",
        ],
        Intent.GET_ATTENDANCE: [
            r"attendance|present|absent|attendance\s*report",
            r"who.*present|who.*absent",
            r"show.*attendance|check.*attendance|get.*attendance",
        ],
        Intent.GET_FEE_STATUS: [
            r"fee|fees|payment|pending.*fee|fee.*status",
            r"how\s*much.*pay|outstanding.*fee",
            r"show.*fee|check.*fee|get.*fee",
        ],
        Intent.GET_EXAM_SCHEDULE: [
            r"exam|test|examination|exam\s*schedule",
            r"when.*exam|exam.*date",
            r"show.*exam|get.*exam|check.*exam",
        ],
        Intent.GET_STUDENT_INFO: [
            r"student.*info|student.*detail|student.*record",
            r"phone.*student|contact.*student|email.*student",
            r"details.*student|get.*student|show.*student",
            r"roll\s*number|student\s+with",
            r"find.*student|search.*student",
            r"list.*student|all.*student",
            r"whose.*last\s*name|last\s*name.*is",
            r"first\s*name.*is|whose.*first\s*name",
            r"usn\s+for|what.*usn|which.*usn",
        ],
        Intent.GET_TEACHER_INFO: [
            r"teacher.*info|teacher.*detail|teacher.*record",
            r"phone.*teacher|contact.*teacher|email.*teacher",
            r"find.*teacher|show.*teacher|get.*teacher",
            r"designation|who\s+has\s+designation",
            r"what.*designation|whats.*designation",
        ],
        Intent.GET_CLASS_INFO: [
            r"class.*info|class.*detail|class.*list",
            r"how\s*many.*student.*class",
            r"show.*class|get.*class|about.*class",
        ],
        Intent.GET_SUBJECT_INFO: [
            r"subject|course|syllabus",
            r"what.*subject|subject.*teach",
            r"who.*teach|teaches|teaching",
            r"show.*subject|get.*subject",
        ],
    }
    
    def extract_intent(self, question: str, context: Dict[str, Any] = None) -> IntentExtraction:
        """Extract intent from question using pattern matching."""
        question_lower = question.lower()
        
        # Try to match patterns
        for intent, patterns in self.PATTERNS.items():
            for pattern in patterns:
                if re.search(pattern, question_lower):
                    parameters = self._extract_parameters(question, context or {})
                    return IntentExtraction(
                        intent=intent,
                        parameters=parameters,
                        confidence=0.8
                    )
        
        # No match found
        logger.warning(f"Could not extract intent from: {question}")
        return IntentExtraction(
            intent=Intent.UNKNOWN,
            parameters={},
            confidence=0.0
        )
    
    def _extract_parameters(self, question: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Extract parameters from question and context."""
        params = {}
        
        # Get from context first
        if "class_id" in context:
            params["class_id"] = context["class_id"]
        if "student_id" in context:
            params["student_id"] = context["student_id"]
        if "teacher_id" in context:
            params["teacher_id"] = context["teacher_id"]
        if "date" in context:
            params["date"] = context["date"]
        if "roll_number" in context:
            params["roll_number"] = context["roll_number"]
        
        # Extract USN (University Seat Number / Roll Number)
        usn_match = re.search(r"usn\s+([A-Z0-9]+)", question, re.IGNORECASE)
        if usn_match:
            params["roll_number"] = usn_match.group(1)
        
        # Extract roll number from question
        roll_match = re.search(r"roll\s*number\s*(\d+)", question, re.IGNORECASE)
        if roll_match:
            params["roll_number"] = roll_match.group(1)
        
        # Extract class name/number from question
        class_match = re.search(r"class\s+(\d+[A-Z]?)", question, re.IGNORECASE)
        if class_match:
            params["class_name"] = class_match.group(1)
        
        # Extract CLASS X format
        class_match2 = re.search(r"CLASS\s+(\d+)", question)
        if class_match2:
            params["class_name"] = f"CLASS {class_match2.group(1)}"
        
        # Extract subject name from question
        subject_keywords = ["Mathematics", "Math", "Physics", "Chemistry", "English", "Computer Science", "Biology", "Science"]
        for subject in subject_keywords:
            if re.search(rf"\b{subject}\b", question, re.IGNORECASE):
                params["subject_name"] = subject
                break
        
        # Extract designation from question
        designation_match = re.search(r"designation\s+(?:as|is|of)?\s*(\w+)", question, re.IGNORECASE)
        if designation_match:
            params["designation"] = designation_match.group(1)
        
        # Extract student name (improved)
        student_name_match = re.search(r"student\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)", question)
        if student_name_match:
            params["student_name"] = student_name_match.group(1)
        
        # Extract name after "for" or "of"
        name_match = re.search(r"(?:for|of)\s+(?:student\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)", question)
        if name_match:
            params["student_name"] = name_match.group(1)
        
        # Extract last name
        last_name_match = re.search(r"last\s*name\s+(?:is|of)?\s*([A-Za-z]+)", question, re.IGNORECASE)
        if last_name_match:
            params["student_name"] = last_name_match.group(1)
            params["teacher_name"] = last_name_match.group(1)
        
        # Extract first name
        first_name_match = re.search(r"first\s*name\s+(?:is|of)?\s*([A-Za-z]+)", question, re.IGNORECASE)
        if first_name_match:
            params["student_name"] = first_name_match.group(1)
            params["teacher_name"] = first_name_match.group(1)
        
        # Extract phone number
        phone_match = re.search(r"phone\s+(?:number\s+)?(\d{10})", question, re.IGNORECASE)
        if phone_match:
            params["phone"] = phone_match.group(1)
        
        # Extract "list all" or "all students/teachers"
        if re.search(r"list\s+all|all\s+(?:student|teacher|class)", question, re.IGNORECASE):
            params["list_all"] = True
        
        # Extract date references
        if re.search(r"today", question, re.IGNORECASE):
            params["date_ref"] = "today"
        elif re.search(r"tomorrow", question, re.IGNORECASE):
            params["date_ref"] = "tomorrow"
        elif re.search(r"yesterday", question, re.IGNORECASE):
            params["date_ref"] = "yesterday"
        elif re.search(r"this\s+week", question, re.IGNORECASE):
            params["date_ref"] = "this_week"
        elif re.search(r"next\s+week", question, re.IGNORECASE):
            params["date_ref"] = "next_week"
        elif re.search(r"this\s+month", question, re.IGNORECASE):
            params["date_ref"] = "this_month"
        elif re.search(r"recent", question, re.IGNORECASE):
            params["date_ref"] = "recent"
        
        return params


# Global instance
intent_extractor = IntentExtractorService()
