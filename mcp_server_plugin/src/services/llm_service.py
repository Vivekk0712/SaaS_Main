"""LLM service for generating natural language responses."""
import google.generativeai as genai
from typing import List, Dict, Any
from ..config import settings, logger
import json


class LLMService:
    """Service for interacting with Gemini LLM."""
    
    def __init__(self):
        """Initialize Gemini API."""
        genai.configure(api_key=settings.GEMINI_API_KEY)
        self.model = genai.GenerativeModel(settings.GEMINI_MODEL)
        logger.info(f"✅ Initialized Gemini model: {settings.GEMINI_MODEL}")
    
    def _build_system_prompt(self) -> str:
        """Build system instruction for the LLM."""
        return """You are a factual assistant for a School ERP system.

CRITICAL RULES:
1. Use ONLY the data provided in the 'DATABASE RESULTS' section below
2. Do NOT guess, invent, or assume any information
3. If the data is insufficient, say "I don't have enough information in the ERP records to answer that"
4. Provide brief, clear answers
5. For each fact you use, include a source reference like [table_name:row_id]
6. Do NOT output any sensitive fields like passwords or private medical information
7. Format your response in a clear, professional manner
8. If there are no results, clearly state that no records were found

Your goal is to help teachers, administrators, and staff quickly find information from the database."""
    
    def _format_database_results(self, rows: List[Dict[str, Any]], table_hint: str = "results") -> str:
        """Format database results for LLM context."""
        if not rows:
            return "No records found in the database."
        
        # Limit rows to prevent token overflow
        limited_rows = rows[:50]
        
        # Format as a readable table
        context = f"DATABASE RESULTS ({len(limited_rows)} records from {table_hint}):\n\n"
        
        for idx, row in enumerate(limited_rows, 1):
            context += f"Record {idx}:\n"
            for key, value in row.items():
                # Convert datetime to string
                if hasattr(value, 'isoformat'):
                    value = value.isoformat()
                context += f"  - {key}: {value}\n"
            context += "\n"
        
        if len(rows) > 50:
            context += f"\n(Note: Showing first 50 of {len(rows)} total records)\n"
        
        return context
    
    async def generate_answer(
        self, 
        question: str, 
        database_results: List[Dict[str, Any]],
        intent: str
    ) -> str:
        """Generate natural language answer from database results."""
        try:
            # Build prompt
            system_prompt = self._build_system_prompt()
            context = self._format_database_results(database_results, intent)
            
            full_prompt = f"""{system_prompt}

{context}

USER QUESTION: {question}

Please provide a clear, concise answer based ONLY on the database results above. Include source references."""
            
            # Generate response
            response = self.model.generate_content(
                full_prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=settings.GEMINI_TEMPERATURE,
                    max_output_tokens=settings.GEMINI_MAX_TOKENS,
                )
            )
            
            answer = response.text.strip()
            logger.info(f"Generated answer: {len(answer)} characters")
            
            return answer
            
        except Exception as e:
            logger.error(f"LLM generation failed: {e}")
            # Fallback to simple formatting
            return self._fallback_answer(database_results, question)
    
    def _fallback_answer(self, rows: List[Dict[str, Any]], question: str) -> str:
        """Fallback answer when LLM fails."""
        if not rows:
            return "No records found in the database for your query."
        
        # Simple formatting with better structure
        answer = f"📊 Found {len(rows)} record(s):\n\n"
        for idx, row in enumerate(rows[:10], 1):
            answer += f"Record {idx}:\n"
            for key, value in row.items():
                # Format datetime objects
                if hasattr(value, 'isoformat'):
                    value = value.isoformat()
                answer += f"  • {key}: {value}\n"
            answer += "\n"
        
        if len(rows) > 10:
            answer += f"(Showing first 10 of {len(rows)} records)\n"
        
        answer += "\n⚠️ Note: AI answer generation temporarily unavailable (quota limit). Showing raw data."
        
        return answer


# Global instance
llm_service = LLMService()
