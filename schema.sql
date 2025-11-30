-- Complete MySQL Schema for School SAS
-- Run this file to create all tables at once

-- Use the sas database
USE sas;

-- ============================================
-- 1. AUTH AND RBAC
-- ============================================

CREATE TABLE IF NOT EXISTS auth_users (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  email        VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARBINARY(255) NOT NULL,
  display_name VARCHAR(190) NOT NULL,
  status       ENUM('active','disabled') NOT NULL DEFAULT 'active',
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS auth_roles (
  id        BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name      VARCHAR(64) NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS auth_role_bindings (
  user_id  BIGINT UNSIGNED NOT NULL,
  role_id  BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (user_id, role_id),
  CONSTRAINT fk_role_user FOREIGN KEY (user_id) REFERENCES auth_users(id) ON DELETE CASCADE,
  CONSTRAINT fk_role_role FOREIGN KEY (role_id) REFERENCES auth_roles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- 2. CORE SCHOOL ENTITIES
-- ============================================

CREATE TABLE IF NOT EXISTS classes (
  id        BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name      VARCHAR(64) NOT NULL,
  UNIQUE KEY uk_class_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS sections (
  id        BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  class_id  BIGINT UNSIGNED NOT NULL,
  name      VARCHAR(8) NOT NULL,
  UNIQUE KEY uk_class_section (class_id, name),
  CONSTRAINT fk_sec_class FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS parents (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(190) NOT NULL,
  phone       VARCHAR(32) NOT NULL,
  email       VARCHAR(190) NULL,
  UNIQUE KEY uk_parent_phone (phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS students (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  usn        VARCHAR(32) NOT NULL,
  name       VARCHAR(190) NOT NULL,
  class_id   BIGINT UNSIGNED NOT NULL,
  section_id BIGINT UNSIGNED NOT NULL,
  status     ENUM('active','inactive') NOT NULL DEFAULT 'active',
  guardian_id BIGINT UNSIGNED NULL,
  UNIQUE KEY uk_student_usn (usn),
  KEY idx_student_class_section (class_id, section_id),
  CONSTRAINT fk_stu_class FOREIGN KEY (class_id) REFERENCES classes(id),
  CONSTRAINT fk_stu_section FOREIGN KEY (section_id) REFERENCES sections(id),
  CONSTRAINT fk_stu_parent FOREIGN KEY (guardian_id) REFERENCES parents(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS teachers (
  id     BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name   VARCHAR(190) NOT NULL,
  email  VARCHAR(190) NULL,
  phone  VARCHAR(32) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- 3. SUBJECTS AND ASSIGNMENTS
-- ============================================

CREATE TABLE IF NOT EXISTS subjects (
  id    BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name  VARCHAR(128) NOT NULL,
  UNIQUE KEY uk_subject_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS class_subjects (
  class_id   BIGINT UNSIGNED NOT NULL,
  section_id BIGINT UNSIGNED NOT NULL,
  subject_id BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (class_id, section_id, subject_id),
  CONSTRAINT fk_cs_class    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
  CONSTRAINT fk_cs_section  FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE,
  CONSTRAINT fk_cs_subject  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS teaching_assignments (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  teacher_id BIGINT UNSIGNED NOT NULL,
  class_id   BIGINT UNSIGNED NOT NULL,
  section_id BIGINT UNSIGNED NOT NULL,
  subject_id BIGINT UNSIGNED NOT NULL,
  UNIQUE KEY uk_assignment (teacher_id, class_id, section_id, subject_id),
  KEY idx_assignment_class_section (class_id, section_id),
  CONSTRAINT fk_ta_teacher FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
  CONSTRAINT fk_ta_class   FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
  CONSTRAINT fk_ta_section FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE,
  CONSTRAINT fk_ta_subject FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- 4. ATTENDANCE
-- ============================================

CREATE TABLE IF NOT EXISTS attendance (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  ymd        DATE NOT NULL,
  class_id   BIGINT UNSIGNED NOT NULL,
  section_id BIGINT UNSIGNED NOT NULL,
  hour_no    TINYINT UNSIGNED NOT NULL,
  subject_id BIGINT UNSIGNED NULL,
  UNIQUE KEY uk_att_slot (ymd, class_id, section_id, hour_no, subject_id),
  KEY idx_att_lookup (ymd, class_id, section_id),
  CONSTRAINT fk_att_class   FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
  CONSTRAINT fk_att_section FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE,
  CONSTRAINT fk_att_subject FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS attendance_entries (
  attendance_id BIGINT UNSIGNED NOT NULL,
  student_id    BIGINT UNSIGNED NOT NULL,
  present       BOOLEAN NOT NULL,
  PRIMARY KEY (attendance_id, student_id),
  CONSTRAINT fk_att_e_att FOREIGN KEY (attendance_id) REFERENCES attendance(id) ON DELETE CASCADE,
  CONSTRAINT fk_att_e_stu FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- 5. MARKS AND TESTS
-- ============================================

CREATE TABLE IF NOT EXISTS tests (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(64) NOT NULL,
  UNIQUE KEY uk_test_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS mark_sheets (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  test_id    BIGINT UNSIGNED NOT NULL,
  subject_id BIGINT UNSIGNED NOT NULL,
  class_id   BIGINT UNSIGNED NOT NULL,
  section_id BIGINT UNSIGNED NOT NULL,
  date_ymd   DATE NULL,
  max_marks  INT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_sheet (test_id, subject_id, class_id, section_id),
  KEY idx_sheet_lookup (class_id, section_id, test_id),
  CONSTRAINT fk_ms_test    FOREIGN KEY (test_id) REFERENCES tests(id) ON DELETE CASCADE,
  CONSTRAINT fk_ms_subject FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
  CONSTRAINT fk_ms_class   FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
  CONSTRAINT fk_ms_section FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS mark_entries (
  sheet_id  BIGINT UNSIGNED NOT NULL,
  student_id BIGINT UNSIGNED NOT NULL,
  marks     INT NOT NULL,
  PRIMARY KEY (sheet_id, student_id),
  CONSTRAINT fk_me_sheet FOREIGN KEY (sheet_id) REFERENCES mark_sheets(id) ON DELETE CASCADE,
  CONSTRAINT fk_me_stu   FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- 6. DIARIES AND CALENDAR
-- ============================================

CREATE TABLE IF NOT EXISTS diaries (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  ymd        DATE NOT NULL,
  class_id   BIGINT UNSIGNED NOT NULL,
  section_id BIGINT UNSIGNED NOT NULL,
  subject_id BIGINT UNSIGNED NOT NULL,
  teacher_id BIGINT UNSIGNED NULL,
  note       TEXT NOT NULL,
  attachments JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_diary_lookup (ymd, class_id, section_id, subject_id),
  CONSTRAINT fk_diary_class   FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
  CONSTRAINT fk_diary_section FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE,
  CONSTRAINT fk_diary_subject FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
  CONSTRAINT fk_diary_teacher FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS calendar_events (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  ymd         DATE NOT NULL,
  title       VARCHAR(255) NOT NULL,
  tag         VARCHAR(64) NOT NULL,
  color       ENUM('blue','green','orange','pink','violet') NOT NULL,
  description TEXT NULL,
  created_by  BIGINT UNSIGNED NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- 7. MATERIALS AND RESOURCES
-- ============================================

CREATE TABLE IF NOT EXISTS materials (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  class_id   BIGINT UNSIGNED NOT NULL,
  section_id BIGINT UNSIGNED NOT NULL,
  subject_id BIGINT UNSIGNED NOT NULL,
  type       ENUM('link','file') NOT NULL,
  name       VARCHAR(255) NULL,
  url        TEXT NULL,
  mime       VARCHAR(128) NULL,
  data_url   MEDIUMTEXT NULL,
  uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_mat_lookup (class_id, section_id, subject_id),
  CONSTRAINT fk_mat_class   FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
  CONSTRAINT fk_mat_section FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE,
  CONSTRAINT fk_mat_subject FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS textbooks (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  class_id   BIGINT UNSIGNED NOT NULL,
  section_id BIGINT UNSIGNED NOT NULL,
  subject_id BIGINT UNSIGNED NOT NULL,
  name       VARCHAR(255) NOT NULL,
  mime       VARCHAR(128) NOT NULL,
  data_url   MEDIUMTEXT NOT NULL,
  chapter_id VARCHAR(64) NULL,
  uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_tb_lookup (class_id, section_id, subject_id),
  CONSTRAINT fk_tb_class   FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
  CONSTRAINT fk_tb_section FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE,
  CONSTRAINT fk_tb_subject FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS pyqs (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  class_id   BIGINT UNSIGNED NOT NULL,
  section_id BIGINT UNSIGNED NOT NULL,
  subject_id BIGINT UNSIGNED NOT NULL,
  type       ENUM('link','file') NOT NULL,
  name       VARCHAR(255) NULL,
  url        TEXT NULL,
  mime       VARCHAR(128) NULL,
  data_url   MEDIUMTEXT NULL,
  uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_pyq_lookup (class_id, section_id, subject_id),
  CONSTRAINT fk_pyq_class   FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
  CONSTRAINT fk_pyq_section FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE,
  CONSTRAINT fk_pyq_subject FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- 8. SYLLABUS
-- ============================================

CREATE TABLE IF NOT EXISTS syllabus (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  class_id   BIGINT UNSIGNED NOT NULL,
  section_id BIGINT UNSIGNED NOT NULL,
  subject_id BIGINT UNSIGNED NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_syllabus (class_id, section_id, subject_id),
  CONSTRAINT fk_syl_class   FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
  CONSTRAINT fk_syl_section FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE,
  CONSTRAINT fk_syl_subject FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS syllabus_chapters (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  syllabus_id BIGINT UNSIGNED NOT NULL,
  title       VARCHAR(255) NOT NULL,
  position    INT UNSIGNED NOT NULL DEFAULT 0,
  CONSTRAINT fk_sylc_syl FOREIGN KEY (syllabus_id) REFERENCES syllabus(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS syllabus_subtopics (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  chapter_id BIGINT UNSIGNED NOT NULL,
  title      VARCHAR(255) NOT NULL,
  details    TEXT NULL,
  position   INT UNSIGNED NOT NULL DEFAULT 0,
  CONSTRAINT fk_syls_ch FOREIGN KEY (chapter_id) REFERENCES syllabus_chapters(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- 9. CIRCULARS
-- ============================================

CREATE TABLE IF NOT EXISTS circulars (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  title      VARCHAR(255) NOT NULL,
  body       TEXT NOT NULL,
  ymd        DATE NOT NULL,
  class_id   BIGINT UNSIGNED NOT NULL,
  section_id BIGINT UNSIGNED NOT NULL,
  created_by BIGINT UNSIGNED NULL,
  color      ENUM('blue','green','orange','pink','violet') NULL,
  attachments JSON NULL,
  ts         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_circ_class (class_id, section_id, ymd),
  CONSTRAINT fk_circ_class   FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
  CONSTRAINT fk_circ_section FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE,
  CONSTRAINT fk_circ_teacher FOREIGN KEY (created_by) REFERENCES teachers(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- 10. FEES AND PAYMENTS
-- ============================================

CREATE TABLE IF NOT EXISTS fees_catalog (
  id      BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name    VARCHAR(190) NOT NULL,
  amount  DECIMAL(12,2) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'INR'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS invoices (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  student_id BIGINT UNSIGNED NOT NULL,
  total      DECIMAL(12,2) NOT NULL DEFAULT 0,
  currency   CHAR(3) NOT NULL DEFAULT 'INR',
  status     ENUM('draft','pending','paid','void') NOT NULL DEFAULT 'pending',
  due_at     DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_inv_stu FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS invoice_line_items (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  invoice_id  BIGINT UNSIGNED NOT NULL,
  label       VARCHAR(190) NOT NULL,
  amount      DECIMAL(12,2) NOT NULL,
  position    INT UNSIGNED NOT NULL DEFAULT 0,
  CONSTRAINT fk_invli_inv FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS payments (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  invoice_id  BIGINT UNSIGNED NOT NULL,
  provider    VARCHAR(64) NOT NULL,
  provider_ref VARCHAR(190) NULL,
  amount      DECIMAL(12,2) NOT NULL,
  currency    CHAR(3) NOT NULL DEFAULT 'INR',
  status      ENUM('created','succeeded','failed') NOT NULL DEFAULT 'created',
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  captured_at TIMESTAMP NULL,
  CONSTRAINT fk_pay_inv FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- 10.1 RAZORPAY PAYMENT INTEGRATION
-- ============================================

-- Table: payment_attempts
-- Stores all payment initiation attempts
CREATE TABLE IF NOT EXISTS payment_attempts (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  invoice_id VARCHAR(255) NOT NULL,
  attempt_reference VARCHAR(128) NOT NULL UNIQUE,
  razorpay_order_id VARCHAR(128),
  razorpay_payment_id VARCHAR(128),
  amount DECIMAL(12,2) NOT NULL,
  currency VARCHAR(8) DEFAULT 'INR',
  status VARCHAR(24) DEFAULT 'created',
  metadata JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_invoice_id (invoice_id),
  INDEX idx_razorpay_order_id (razorpay_order_id),
  INDEX idx_razorpay_payment_id (razorpay_payment_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: razorpay_payments
-- Stores successful Razorpay payment records
CREATE TABLE IF NOT EXISTS razorpay_payments (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  payment_attempt_id BIGINT NOT NULL,
  razorpay_payment_id VARCHAR(128) UNIQUE NOT NULL,
  method VARCHAR(64),
  status VARCHAR(24),
  amount DECIMAL(12,2) NOT NULL,
  fee_charged DECIMAL(12,2) DEFAULT 0,
  response_json JSON,
  captured_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (payment_attempt_id) REFERENCES payment_attempts(id),
  INDEX idx_razorpay_payment_id (razorpay_payment_id),
  INDEX idx_status (status),
  INDEX idx_captured_at (captured_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: refunds
-- Stores refund records
CREATE TABLE IF NOT EXISTS refunds (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  payment_id BIGINT NOT NULL,
  razorpay_refund_id VARCHAR(128) UNIQUE NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  status VARCHAR(24) DEFAULT 'processing',
  response_json JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (payment_id) REFERENCES razorpay_payments(id),
  INDEX idx_razorpay_refund_id (razorpay_refund_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: webhook_events
-- Stores all webhook events from Razorpay
CREATE TABLE IF NOT EXISTS webhook_events (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  event_type VARCHAR(128) NOT NULL,
  event_payload JSON NOT NULL,
  received_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  processed BOOLEAN DEFAULT FALSE,
  processing_log TEXT,
  INDEX idx_event_type (event_type),
  INDEX idx_processed (processed),
  INDEX idx_received_at (received_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 11. ONBOARDING
-- ============================================

CREATE TABLE IF NOT EXISTS applications (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  applicant_name VARCHAR(190) NOT NULL,
  parent_phone   VARCHAR(32) NOT NULL,
  grade_applied  VARCHAR(64) NOT NULL,
  section_pref   VARCHAR(8) NULL,
  status      ENUM('submitted','confirmed','rejected') NOT NULL DEFAULT 'submitted',
  data_json   JSON NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- SCHEMA COMPLETE
-- ============================================

SELECT 'Schema created successfully!' AS message;
