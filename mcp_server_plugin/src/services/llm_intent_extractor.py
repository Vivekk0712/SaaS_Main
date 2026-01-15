"""LLM-based intent extraction for better flexibility."""
import google.generativeai as genai
from typing import Dict, Any
import json
from ..domain.types import Intent, IntentExtraction
from ..config import settings, logger


class LLMIntentExtractor:
    """Use LLM to extract intent and parameters from questions."""
    
    def __init__(self):
        """Initialize Gemini for intent extraction."""
        genai.configure(api_key=settings.GEMINI_API_KEY)
        self.model = genai.GenerativeModel(settings.GEMINI_MODEL)
    
    def extract_intent(self, question: str, context: Dict[str, Any] = None) -> IntentExtraction:
        """Extract intent using LLM."""
        try:
            prompt = self._build_prompt(question, context or {})
            
            response = self.model.generate_content(
                prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=0.0,  # Deterministic
                    max_output_tokens=200,
                )
            )
            
            # Parse JSON response - handle multi-part responses
            try:
                response_text = response.text
            except:
                # If response.text fails, try getting first part
                response_text = response.candidates[0].content.parts[0].text
            
            result = json.loads(response_text.strip())
            
            # Map to Intent enum
            intent_str = result.get("intent", "unknown")
            try:
                intent = Intent(intent_str)
            except ValueError:
                intent = Intent.UNKNOWN
            
            return IntentExtraction(
                intent=intent,
                parameters=result.get("parameters", {}),
                confidence=result.get("confidence", 0.5)
            )
            
        except Exception as e:
            logger.error(f"LLM intent extraction failed: {e}")
            return IntentExtraction(
                intent=Intent.UNKNOWN,
                parameters={},
                confidence=0.0
            )
    
    def _build_prompt(self, question: str, context: Dict[str, Any]) -> str:
        """Build prompt for intent extraction."""
        return f"""You are an intent classifier for a School ERP database query system.

Available intents:
- get_timetable: Get class schedules/timetables
- get_attendance: Get attendance records
- get_student_info: Get student information (by name, roll number, class)
- get_teacher_info: Get teacher information (by name, department, subject)
- get_fee_status: Get fee payment status
- get_exam_schedule: Get exam schedules
- get_class_info: Get class information
- get_subject_info: Get subject/course information

User question: "{question}"
Context: {json.dumps(context)}

Extract the intent and parameters from the question.

Rules:
1. Choose the most appropriate intent
2. Extract ALL relevant parameters (names, IDs, dates, etc.)
3. For names, extract first_name and/or last_name
4. For "list all X", set list_all=true
5. Return confidence 0-1

Return ONLY valid JSON in this format:
{{
  "intent": "intent_name",
  "parameters": {{
    "class_id": 1,
    "student_name": "John",
    "teacher_name": "Jane",
    "subject_name": "Mathematics",
    "list_all": false
  }},
  "confidence": 0.9
}}"""


# Global instance
llm_intent_extractor = LLMIntentExtractor()
