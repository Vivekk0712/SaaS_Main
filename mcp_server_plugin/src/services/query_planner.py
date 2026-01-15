"""Query planner - maps intents to safe SQL queries."""
from typing import Dict, Any, Tuple, Optional
from ..domain.types import Intent, UserRole
from ..config import settings, logger
from datetime import datetime, timedelta


class QueryPlannerService:
    """Plan and generate safe SQL queries based on intent."""
    
    # SQL templates for each intent (parameterized queries only)
    SQL_TEMPLATES = {
        Intent.GET_TIMETABLE: """
            SELECT 
                t.id, t.day_of_week, t.start_time, t.end_time,
                s.name as subject_name, 
                te.name as teacher_name,
                c.name as class_name
            FROM timetables t
            JOIN subjects s ON t.subject_id = s.id
            JOIN teachers te ON t.teacher_id = te.id
            JOIN classes c ON t.class_id = c.id
            WHERE t.class_id = %s
            ORDER BY t.day_of_week, t.start_time
            LIMIT %s
        """,
        
        Intent.GET_ATTENDANCE: """
            SELECT 
                a.id, a.ymd as date,
                ae.present,
                s.name as student_name,
                s.usn as roll_number,
                c.name as class_name
            FROM attendance a
            JOIN attendance_entries ae ON a.id = ae.attendance_id
            JOIN students s ON ae.student_id = s.id
            JOIN classes c ON a.class_id = c.id
            WHERE a.class_id = %s AND a.ymd = %s
            ORDER BY s.usn
            LIMIT %s
        """,
        
        Intent.GET_STUDENT_INFO: """
            SELECT 
                s.id, s.usn as roll_number, 
                s.name as full_name,
                s.status,
                c.name as class_name,
                sec.name as section_name
            FROM students s
            JOIN classes c ON s.class_id = c.id
            JOIN sections sec ON s.section_id = sec.id
            WHERE (s.id = %s OR s.usn = %s 
                   OR s.name LIKE %s
                   OR s.class_id = %s)
            LIMIT %s
        """,
        
        Intent.GET_TEACHER_INFO: """
            SELECT 
                t.id,
                t.name as full_name,
                t.email, t.phone
            FROM teachers t
            WHERE (t.id = %s OR t.name LIKE %s)
            LIMIT %s
        """,
        
        Intent.GET_FEE_STATUS: """
            SELECT 
                i.id, i.total_amount as amount, i.paid_amount, i.due_date, i.status,
                s.name as student_name,
                s.usn as roll_number,
                c.name as class_name
            FROM invoices i
            JOIN students s ON i.student_id = s.id
            JOIN classes c ON s.class_id = c.id
            WHERE i.student_id = %s OR s.class_id = %s
            ORDER BY i.due_date DESC
            LIMIT %s
        """,
        
        Intent.GET_EXAM_SCHEDULE: """
            SELECT 
                t.id, t.name as exam_name, t.date as exam_date,
                s.name as subject_name,
                c.name as class_name
            FROM tests t
            JOIN subjects s ON t.subject_id = s.id
            JOIN classes c ON t.class_id = c.id
            WHERE t.class_id = %s
            ORDER BY t.date
            LIMIT %s
        """,
        
        Intent.GET_CLASS_INFO: """
            SELECT 
                c.id, c.name,
                COUNT(DISTINCT s.id) as student_count
            FROM classes c
            LEFT JOIN students s ON c.id = s.class_id AND s.status = 'active'
            WHERE c.id = %s OR c.name LIKE %s
            GROUP BY c.id
            LIMIT %s
        """,
        
        Intent.GET_SUBJECT_INFO: """
            SELECT 
                s.id, s.name,
                t.name as teacher_name,
                t.email as teacher_email,
                t.phone as teacher_phone
            FROM subjects s
            LEFT JOIN teaching_assignments ta ON s.id = ta.subject_id
            LEFT JOIN teachers t ON ta.teacher_id = t.id
            WHERE s.id = %s OR s.name LIKE %s
            LIMIT %s
        """,
        
        # NEW INTENTS
        
        Intent.GET_MARKS: """
            SELECT 
                me.marks,
                s.name as student_name,
                s.usn as roll_number,
                sub.name as subject_name,
                ms.max_marks,
                t.name as test_name,
                ms.date_ymd as test_date,
                c.name as class_name
            FROM mark_entries me
            JOIN mark_sheets ms ON me.sheet_id = ms.id
            JOIN students s ON me.student_id = s.id
            JOIN subjects sub ON ms.subject_id = sub.id
            JOIN tests t ON ms.test_id = t.id
            JOIN classes c ON ms.class_id = c.id
            WHERE (s.id = %s OR s.usn = %s OR ms.class_id = %s)
            ORDER BY ms.date_ymd DESC
            LIMIT %s
        """,
        
        Intent.GET_DIARY: """
            SELECT 
                d.id, d.ymd as date, d.note,
                d.attachments,
                c.name as class_name,
                sec.name as section_name,
                sub.name as subject_name,
                t.name as teacher_name
            FROM diaries d
            JOIN classes c ON d.class_id = c.id
            JOIN sections sec ON d.section_id = sec.id
            LEFT JOIN subjects sub ON d.subject_id = sub.id
            LEFT JOIN teachers t ON d.teacher_id = t.id
            WHERE (d.class_id = %s OR d.ymd = %s)
            ORDER BY d.ymd DESC
            LIMIT %s
        """,
        
        Intent.GET_CALENDAR: """
            SELECT 
                ce.id, ce.ymd as date, ce.title, ce.tag, ce.color, ce.description
            FROM calendar_events ce
            WHERE ce.ymd >= %s AND ce.ymd <= %s
            ORDER BY ce.ymd
            LIMIT %s
        """,
        
        Intent.GET_PARENT_INFO: """
            SELECT 
                p.id, p.name, p.phone, p.email,
                s.name as student_name,
                s.usn as student_usn,
                c.name as class_name
            FROM parents p
            JOIN students s ON p.id = s.guardian_id
            JOIN classes c ON s.class_id = c.id
            WHERE (p.id = %s OR p.phone = %s OR s.id = %s OR s.usn = %s OR s.name LIKE %s)
            LIMIT %s
        """,
        
        Intent.GET_CIRCULAR: """
            SELECT 
                cir.id, cir.title, cir.body, cir.ymd as date, cir.color,
                c.name as class_name,
                sec.name as section_name
            FROM circulars cir
            JOIN classes c ON cir.class_id = c.id
            JOIN sections sec ON cir.section_id = sec.id
            WHERE (cir.class_id = %s OR cir.ymd = %s)
            ORDER BY cir.ymd DESC
            LIMIT %s
        """,
        
        Intent.GET_ATTENDANCE_STATS: """
            SELECT 
                c.name as class_name,
                COUNT(DISTINCT ae.student_id) as total_students,
                SUM(CASE WHEN ae.present = 1 THEN 1 ELSE 0 END) as present_count,
                SUM(CASE WHEN ae.present = 0 THEN 1 ELSE 0 END) as absent_count,
                ROUND(SUM(CASE WHEN ae.present = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as attendance_percentage
            FROM attendance a
            JOIN attendance_entries ae ON a.id = ae.attendance_id
            JOIN classes c ON a.class_id = c.id
            WHERE a.class_id = %s AND a.ymd >= %s AND a.ymd <= %s
            GROUP BY c.id, c.name
            LIMIT 1
        """,
        
        Intent.GET_FEE_SUMMARY: """
            SELECT 
                c.name as class_name,
                COUNT(DISTINCT i.student_id) as total_students,
                SUM(i.total_amount) as total_fees,
                SUM(i.paid_amount) as total_paid,
                SUM(i.total_amount - i.paid_amount) as total_pending,
                SUM(CASE WHEN i.status = 'paid' THEN 1 ELSE 0 END) as paid_count,
                SUM(CASE WHEN i.status = 'pending' THEN 1 ELSE 0 END) as pending_count
            FROM invoices i
            JOIN students s ON i.student_id = s.id
            JOIN classes c ON s.class_id = c.id
            WHERE c.id = %s OR c.name LIKE %s
            GROUP BY c.id, c.name
            LIMIT 1
        """,
        
        Intent.GET_CLASS_PERFORMANCE: """
            SELECT 
                c.name as class_name,
                sub.name as subject_name,
                COUNT(DISTINCT me.student_id) as students_count,
                AVG(me.marks) as average_marks,
                MAX(me.marks) as highest_marks,
                MIN(me.marks) as lowest_marks,
                ms.max_marks,
                t.name as test_name
            FROM mark_entries me
            JOIN mark_sheets ms ON me.sheet_id = ms.id
            JOIN classes c ON ms.class_id = c.id
            JOIN subjects sub ON ms.subject_id = sub.id
            JOIN tests t ON ms.test_id = t.id
            WHERE ms.class_id = %s
            GROUP BY c.id, c.name, sub.id, sub.name, ms.id, ms.max_marks, t.name
            ORDER BY ms.date_ymd DESC
            LIMIT %s
        """,
    }
    
    # Role-based access control
    ROLE_PERMISSIONS = {
        UserRole.STUDENT: [
            Intent.GET_TIMETABLE,
            Intent.GET_EXAM_SCHEDULE,
            Intent.GET_FEE_STATUS,  # Own fees only
            Intent.GET_MARKS,  # Own marks only
            Intent.GET_DIARY,
            Intent.GET_CALENDAR,
            Intent.GET_CIRCULAR,
        ],
        UserRole.TEACHER: [
            Intent.GET_TIMETABLE,
            Intent.GET_ATTENDANCE,
            Intent.GET_STUDENT_INFO,
            Intent.GET_EXAM_SCHEDULE,
            Intent.GET_CLASS_INFO,
            Intent.GET_SUBJECT_INFO,
            Intent.GET_MARKS,
            Intent.GET_DIARY,
            Intent.GET_CALENDAR,
            Intent.GET_PARENT_INFO,
            Intent.GET_CIRCULAR,
            Intent.GET_ATTENDANCE_STATS,
            Intent.GET_CLASS_PERFORMANCE,
        ],
        UserRole.HOD: [
            Intent.GET_TIMETABLE,
            Intent.GET_ATTENDANCE,
            Intent.GET_STUDENT_INFO,
            Intent.GET_TEACHER_INFO,
            Intent.GET_EXAM_SCHEDULE,
            Intent.GET_CLASS_INFO,
            Intent.GET_SUBJECT_INFO,
            Intent.GET_MARKS,
            Intent.GET_DIARY,
            Intent.GET_CALENDAR,
            Intent.GET_PARENT_INFO,
            Intent.GET_CIRCULAR,
            Intent.GET_ATTENDANCE_STATS,
            Intent.GET_FEE_SUMMARY,
            Intent.GET_CLASS_PERFORMANCE,
        ],
        UserRole.PRINCIPAL: [intent for intent in Intent if intent != Intent.UNKNOWN],
        UserRole.ACCOUNTANT: [
            Intent.GET_STUDENT_INFO,
            Intent.GET_FEE_STATUS,
            Intent.GET_CLASS_INFO,
            Intent.GET_PARENT_INFO,
            Intent.GET_FEE_SUMMARY,
        ],
        UserRole.ADMIN: [intent for intent in Intent if intent != Intent.UNKNOWN],
    }
    
    def check_permission(self, user_roles: list, intent: Intent) -> bool:
        """Check if user has permission for intent."""
        for role_str in user_roles:
            try:
                role = UserRole(role_str)
                if intent in self.ROLE_PERMISSIONS.get(role, []):
                    return True
            except ValueError:
                logger.warning(f"Unknown role: {role_str}")
        return False
    
    def plan_query(
        self, 
        intent: Intent, 
        parameters: Dict[str, Any],
        user_roles: list
    ) -> Tuple[Optional[str], Optional[tuple]]:
        """Plan SQL query based on intent and parameters."""
        
        # Check permission
        if not self.check_permission(user_roles, intent):
            logger.warning(f"Permission denied for intent {intent} with roles {user_roles}")
            return None, None
        
        # Get SQL template
        sql_template = self.SQL_TEMPLATES.get(intent)
        if not sql_template:
            logger.error(f"No SQL template for intent: {intent}")
            return None, None
        
        # Build parameters based on intent
        try:
            params = self._build_parameters(intent, parameters)
            return sql_template, params
        except Exception as e:
            logger.error(f"Failed to build parameters: {e}")
            return None, None
    
    def _build_parameters(self, intent: Intent, params: Dict[str, Any]) -> tuple:
        """Build SQL parameters based on intent."""
        max_rows = settings.MAX_ROWS_RETURNED
        
        if intent == Intent.GET_TIMETABLE:
            class_id = params.get("class_id", 1)
            return (class_id, max_rows)
        
        elif intent == Intent.GET_ATTENDANCE:
            class_id = params.get("class_id", 1)
            date = params.get("date", datetime.now().date())
            
            # Handle date references
            if params.get("date_ref") == "today":
                date = datetime.now().date()
            elif params.get("date_ref") == "tomorrow":
                date = (datetime.now() + timedelta(days=1)).date()
            elif params.get("date_ref") == "yesterday":
                date = (datetime.now() - timedelta(days=1)).date()
            
            return (class_id, date, max_rows)
        
        elif intent == Intent.GET_STUDENT_INFO:
            student_id = params.get("student_id", 0)
            roll_number = params.get("roll_number", "")
            student_name = params.get("student_name", "")
            class_id = params.get("class_id", 0)
            list_all = params.get("list_all", False)
            
            # Build LIKE patterns
            name_pattern = f"%{student_name}%" if student_name else "%"
            
            # If list_all, increase limit
            limit = max_rows * 10 if list_all else max_rows
            
            return (student_id, roll_number, name_pattern, class_id, limit)
        
        elif intent == Intent.GET_TEACHER_INFO:
            teacher_id = params.get("teacher_id", 0)
            teacher_name = params.get("teacher_name", "")
            
            # Build LIKE patterns
            name_pattern = f"%{teacher_name}%" if teacher_name else "%"
            
            return (teacher_id, name_pattern, max_rows)
        
        elif intent == Intent.GET_FEE_STATUS:
            student_id = params.get("student_id", 0)
            class_id = params.get("class_id", 0)
            return (student_id, class_id, max_rows)
        
        elif intent == Intent.GET_EXAM_SCHEDULE:
            class_id = params.get("class_id", 1)
            return (class_id, max_rows)
        
        elif intent == Intent.GET_CLASS_INFO:
            class_id = params.get("class_id", 0)
            class_name = params.get("class_name", "")
            name_pattern = f"%{class_name}%" if class_name else "%"
            return (class_id, name_pattern, max_rows)
        
        elif intent == Intent.GET_SUBJECT_INFO:
            subject_id = params.get("subject_id", 0)
            subject_name = params.get("subject_name", "")
            # Use LIKE pattern for name search
            subject_name_pattern = f"%{subject_name}%" if subject_name else "%"
            return (subject_id, subject_name_pattern, max_rows)
        
        # NEW INTENTS
        
        elif intent == Intent.GET_MARKS:
            student_id = params.get("student_id", 0)
            roll_number = params.get("roll_number", "")
            class_id = params.get("class_id", 0)
            return (student_id, roll_number, class_id, max_rows)
        
        elif intent == Intent.GET_DIARY:
            class_id = params.get("class_id", 0)
            date = params.get("date", datetime.now().date())
            
            # Handle date references
            if params.get("date_ref") == "today":
                date = datetime.now().date()
            elif params.get("date_ref") == "yesterday":
                date = (datetime.now() - timedelta(days=1)).date()
            
            return (class_id, date, max_rows)
        
        elif intent == Intent.GET_CALENDAR:
            start_date = params.get("start_date", datetime.now().date())
            end_date = params.get("end_date", (datetime.now() + timedelta(days=30)).date())
            
            # Handle date references
            if params.get("date_ref") == "this_week":
                start_date = datetime.now().date()
                end_date = start_date + timedelta(days=7)
            elif params.get("date_ref") == "this_month":
                start_date = datetime.now().date()
                end_date = start_date + timedelta(days=30)
            elif params.get("date_ref") == "next_week":
                start_date = datetime.now().date() + timedelta(days=7)
                end_date = start_date + timedelta(days=7)
            
            return (start_date, end_date, max_rows)
        
        elif intent == Intent.GET_PARENT_INFO:
            parent_id = params.get("parent_id", 0)
            phone = params.get("phone", "")
            student_id = params.get("student_id", 0)
            student_usn = params.get("student_usn", "")
            student_name = params.get("student_name", "")
            # Build LIKE pattern for student name
            name_pattern = f"%{student_name}%" if student_name else "%"
            return (parent_id, phone, student_id, student_usn, name_pattern, max_rows)
        
        elif intent == Intent.GET_CIRCULAR:
            class_id = params.get("class_id", 0)
            date = params.get("date", datetime.now().date())
            
            # Handle date references
            if params.get("date_ref") == "today":
                date = datetime.now().date()
            elif params.get("date_ref") == "recent":
                date = datetime.now().date() - timedelta(days=7)
            
            return (class_id, date, max_rows)
        
        elif intent == Intent.GET_ATTENDANCE_STATS:
            class_id = params.get("class_id", 1)
            start_date = params.get("start_date", datetime.now().date() - timedelta(days=30))
            end_date = params.get("end_date", datetime.now().date())
            
            # Handle date references
            if params.get("date_ref") == "this_month":
                start_date = datetime.now().replace(day=1).date()
                end_date = datetime.now().date()
            elif params.get("date_ref") == "this_week":
                start_date = datetime.now().date() - timedelta(days=7)
                end_date = datetime.now().date()
            
            return (class_id, start_date, end_date)
        
        elif intent == Intent.GET_FEE_SUMMARY:
            class_id = params.get("class_id", 0)
            class_name = params.get("class_name", "")
            name_pattern = f"%{class_name}%" if class_name else "%"
            return (class_id, name_pattern)
        
        elif intent == Intent.GET_CLASS_PERFORMANCE:
            class_id = params.get("class_id", 1)
            return (class_id, max_rows)
        
        return ()


# Global instance
query_planner = QueryPlannerService()
