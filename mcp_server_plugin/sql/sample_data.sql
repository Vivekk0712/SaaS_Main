-- Sample Data for Testing MCP Server
-- Run this to populate your database with test data

USE mcp_server_erp;

-- Insert sample classes
INSERT INTO classes (name, section, academic_year) VALUES
('10', 'A', '2024-2025'),
('10', 'B', '2024-2025'),
('9', 'A', '2024-2025'),
('9', 'B', '2024-2025'),
('8', 'A', '2024-2025');

-- Insert sample teachers
INSERT INTO teachers (employee_id, first_name, last_name, email, phone, department, designation) VALUES
('T001', 'John', 'Doe', 'john.doe@school.com', '+919876543210', 'Mathematics', 'Senior Teacher'),
('T002', 'Jane', 'Smith', 'jane.smith@school.com', '+919876543211', 'Science', 'HOD'),
('T003', 'Robert', 'Johnson', 'robert.j@school.com', '+919876543212', 'English', 'Teacher'),
('T004', 'Mary', 'Williams', 'mary.w@school.com', '+919876543213', 'Mathematics', 'Teacher'),
('T005', 'David', 'Brown', 'david.b@school.com', '+919876543214', 'Science', 'Teacher');

-- Insert sample subjects
INSERT INTO subjects (name, code, credits, teacher_id) VALUES
('Mathematics', 'MATH101', 4, 1),
('Physics', 'PHY101', 4, 2),
('Chemistry', 'CHEM101', 4, 2),
('English', 'ENG101', 3, 3),
('Computer Science', 'CS101', 4, 1),
('Biology', 'BIO101', 4, 5);

-- Insert sample students
INSERT INTO students (roll_number, first_name, last_name, email, phone, date_of_birth, class_id) VALUES
('2024001', 'Aditya', 'Sharma', 'aditya.sharma@student.com', '+919876543220', '2008-05-15', 1),
('2024002', 'Priya', 'Patel', 'priya.patel@student.com', '+919876543221', '2008-07-22', 1),
('2024003', 'Rahul', 'Kumar', 'rahul.kumar@student.com', '+919876543222', '2008-03-10', 1),
('2024004', 'Sneha', 'Singh', 'sneha.singh@student.com', '+919876543223', '2008-09-18', 2),
('2024005', 'Amit', 'Verma', 'amit.verma@student.com', '+919876543224', '2008-11-25', 2),
('2024006', 'Neha', 'Gupta', 'neha.gupta@student.com', '+919876543225', '2009-01-30', 3),
('2024007', 'Vikram', 'Reddy', 'vikram.reddy@student.com', '+919876543226', '2009-04-12', 3),
('2024008', 'Anjali', 'Mehta', 'anjali.mehta@student.com', '+919876543227', '2009-06-08', 4);

-- Insert sample timetable (for Class 10A - Monday to Friday)
INSERT INTO timetables (class_id, subject_id, teacher_id, day_of_week, start_time, end_time) VALUES
-- Monday
(1, 1, 1, 1, '09:00:00', '10:00:00'),  -- Math
(1, 2, 2, 1, '10:15:00', '11:15:00'),  -- Physics
(1, 4, 3, 1, '11:30:00', '12:30:00'),  -- English
-- Tuesday
(1, 3, 2, 2, '09:00:00', '10:00:00'),  -- Chemistry
(1, 5, 1, 2, '10:15:00', '11:15:00'),  -- Computer Science
(1, 1, 1, 2, '11:30:00', '12:30:00'),  -- Math
-- Wednesday
(1, 2, 2, 3, '09:00:00', '10:00:00'),  -- Physics
(1, 4, 3, 3, '10:15:00', '11:15:00'),  -- English
(1, 3, 2, 3, '11:30:00', '12:30:00'),  -- Chemistry
-- Thursday
(1, 1, 1, 4, '09:00:00', '10:00:00'),  -- Math
(1, 5, 1, 4, '10:15:00', '11:15:00'),  -- Computer Science
(1, 2, 2, 4, '11:30:00', '12:30:00'),  -- Physics
-- Friday
(1, 4, 3, 5, '09:00:00', '10:00:00'),  -- English
(1, 3, 2, 5, '10:15:00', '11:15:00'),  -- Chemistry
(1, 1, 1, 5, '11:30:00', '12:30:00');  -- Math

-- Insert sample attendance (today's date)
INSERT INTO attendance (student_id, class_id, date, status, remarks) VALUES
(1, 1, CURDATE(), 'present', NULL),
(2, 1, CURDATE(), 'present', NULL),
(3, 1, CURDATE(), 'absent', 'Sick leave'),
(4, 2, CURDATE(), 'present', NULL),
(5, 2, CURDATE(), 'present', NULL),
(6, 3, CURDATE(), 'late', 'Arrived at 9:30 AM'),
(7, 3, CURDATE(), 'present', NULL),
(8, 4, CURDATE(), 'present', NULL);

-- Insert sample fees
INSERT INTO fees (student_id, amount, paid_amount, due_date, status, description) VALUES
(1, 50000.00, 50000.00, '2024-04-30', 'paid', 'Annual Tuition Fee'),
(2, 50000.00, 30000.00, '2024-04-30', 'partial', 'Annual Tuition Fee'),
(3, 50000.00, 0.00, '2024-04-30', 'pending', 'Annual Tuition Fee'),
(4, 50000.00, 50000.00, '2024-04-30', 'paid', 'Annual Tuition Fee'),
(5, 50000.00, 0.00, '2024-04-30', 'overdue', 'Annual Tuition Fee'),
(6, 45000.00, 45000.00, '2024-04-30', 'paid', 'Annual Tuition Fee'),
(7, 45000.00, 20000.00, '2024-04-30', 'partial', 'Annual Tuition Fee'),
(8, 45000.00, 0.00, '2024-04-30', 'pending', 'Annual Tuition Fee');

-- Insert sample exams
INSERT INTO exams (exam_name, class_id, subject_id, exam_date, start_time, end_time, max_marks) VALUES
('Mid-Term Exam', 1, 1, '2024-12-15', '09:00:00', '12:00:00', 100),
('Mid-Term Exam', 1, 2, '2024-12-16', '09:00:00', '12:00:00', 100),
('Mid-Term Exam', 1, 3, '2024-12-17', '09:00:00', '12:00:00', 100),
('Mid-Term Exam', 1, 4, '2024-12-18', '09:00:00', '11:00:00', 80),
('Mid-Term Exam', 1, 5, '2024-12-19', '09:00:00', '12:00:00', 100);

SELECT 'Sample data inserted successfully!' as message;
