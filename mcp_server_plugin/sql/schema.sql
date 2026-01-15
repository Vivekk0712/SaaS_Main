-- MCP Server Plugin - Database Schema
-- This file contains the audit logging table schema

-- Audit logs table
CREATE TABLE IF NOT EXISTS mcp_audit_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL,
    roles JSON NOT NULL,
    question TEXT NOT NULL,
    intent VARCHAR(50) NOT NULL,
    parameters JSON,
    sql_template TEXT,
    rows_returned INT DEFAULT 0,
    success BOOLEAN DEFAULT FALSE,
    error_message TEXT,
    response_time_ms INT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_timestamp (timestamp),
    INDEX idx_intent (intent),
    INDEX idx_success (success)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sample ERP tables (for reference - adjust to your actual schema)

-- Classes table
CREATE TABLE IF NOT EXISTS classes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    section VARCHAR(10),
    academic_year VARCHAR(20),
    class_teacher_id INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Students table
CREATE TABLE IF NOT EXISTS students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    roll_number VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    date_of_birth DATE,
    class_id INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(id),
    INDEX idx_roll_number (roll_number),
    INDEX idx_class_id (class_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Teachers table
CREATE TABLE IF NOT EXISTS teachers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    department VARCHAR(100),
    designation VARCHAR(100),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_employee_id (employee_id),
    INDEX idx_department (department)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Subjects table
CREATE TABLE IF NOT EXISTS subjects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    credits INT DEFAULT 0,
    teacher_id INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES teachers(id),
    INDEX idx_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Timetables table
CREATE TABLE IF NOT EXISTS timetables (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_id INT NOT NULL,
    subject_id INT NOT NULL,
    teacher_id INT NOT NULL,
    day_of_week TINYINT NOT NULL COMMENT '1=Monday, 7=Sunday',
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(id),
    FOREIGN KEY (subject_id) REFERENCES subjects(id),
    FOREIGN KEY (teacher_id) REFERENCES teachers(id),
    INDEX idx_class_day (class_id, day_of_week)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Attendance table
CREATE TABLE IF NOT EXISTS attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    class_id INT NOT NULL,
    date DATE NOT NULL,
    status ENUM('present', 'absent', 'late', 'excused') DEFAULT 'present',
    remarks TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (class_id) REFERENCES classes(id),
    UNIQUE KEY unique_attendance (student_id, date),
    INDEX idx_class_date (class_id, date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Fees table
CREATE TABLE IF NOT EXISTS fees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    paid_amount DECIMAL(10, 2) DEFAULT 0.00,
    due_date DATE NOT NULL,
    status ENUM('pending', 'partial', 'paid', 'overdue') DEFAULT 'pending',
    description VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id),
    INDEX idx_student_status (student_id, status),
    INDEX idx_due_date (due_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Exams table
CREATE TABLE IF NOT EXISTS exams (
    id INT AUTO_INCREMENT PRIMARY KEY,
    exam_name VARCHAR(100) NOT NULL,
    class_id INT NOT NULL,
    subject_id INT NOT NULL,
    exam_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    max_marks INT DEFAULT 100,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(id),
    FOREIGN KEY (subject_id) REFERENCES subjects(id),
    INDEX idx_class_date (class_id, exam_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Sample data for testing (optional)
-- Uncomment to insert sample data

/*
INSERT INTO classes (name, section, academic_year) VALUES
('10', 'A', '2024-2025'),
('10', 'B', '2024-2025'),
('9', 'A', '2024-2025');

INSERT INTO teachers (employee_id, first_name, last_name, email, department, designation) VALUES
('T001', 'John', 'Doe', 'john.doe@school.com', 'Mathematics', 'Senior Teacher'),
('T002', 'Jane', 'Smith', 'jane.smith@school.com', 'Science', 'HOD');

INSERT INTO subjects (name, code, credits, teacher_id) VALUES
('Mathematics', 'MATH101', 4, 1),
('Physics', 'PHY101', 4, 2),
('Chemistry', 'CHEM101', 4, 2);

INSERT INTO students (roll_number, first_name, last_name, email, class_id) VALUES
('2024001', 'Aditya', 'Sharma', 'aditya@example.com', 1),
('2024002', 'Priya', 'Patel', 'priya@example.com', 1),
('2024003', 'Rahul', 'Kumar', 'rahul@example.com', 2);
*/
