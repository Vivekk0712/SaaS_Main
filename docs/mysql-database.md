## MySQL Database - School SAS (Unified ERP)

This document defines the canonical MySQL schema for the unified SAS platform (onboarding + academics + payments + notifications), plus installation, setup, and migration from the local JSON store. All tables use InnoDB and `utf8mb4` for full Unicode support.

### 0) Install MySQL and Initialize

Pick one option that fits your system. Do not drop or overwrite any existing database; all steps are additive and idempotent.

- Windows (MySQL Installer):
  - Download “MySQL Community Server” via the MySQL Installer. During setup, choose Server + Shell Tools.
  - Note the root password. Enable MySQL to run as a service.
- Windows (WSL Ubuntu):
  - `sudo apt update && sudo apt install -y mysql-server`
  - Start and secure: `sudo service mysql start && sudo mysql_secure_installation`
- macOS (Homebrew):
  - `brew install mysql && brew services start mysql`
- Linux (APT):
  - `sudo apt update && sudo apt install -y mysql-server && sudo systemctl enable --now mysql`
- Linux (YUM/DNF):
  - `sudo dnf install -y @mysql && sudo systemctl enable --now mysqld`
- Docker (optional):
  - `docker run --name sas-mysql -e MYSQL_ROOT_PASSWORD=changeme -e MYSQL_DATABASE=sas -e MYSQL_USER=sas_app -e MYSQL_PASSWORD=sas_strong_password_123 -p 3306:3306 -d mysql:8`

Once MySQL is running, create the DB and application user (adjust passwords as needed):

```sql
CREATE DATABASE IF NOT EXISTS sas CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'sas_app'@'%' IDENTIFIED BY 'sas_strong_password_123';
GRANT ALL PRIVILEGES ON sas.* TO 'sas_app'@'%';
FLUSH PRIVILEGES;
```

Recommended MySQL config: enable `sql_require_primary_key=ON` (if supported) and use `lower_case_table_names=0` on Windows to match case‑sensitive environments.

---

### 1) Auth and RBAC

```sql
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
```

Roles typically include: `student`, `parent`, `teacher`, `hod`, `accountant`, `admin`.

---

### 2) Core School Entities

```sql
CREATE TABLE IF NOT EXISTS classes (
  id        BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name      VARCHAR(64) NOT NULL, -- e.g., "Class 8"
  UNIQUE KEY uk_class_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS sections (
  id        BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  class_id  BIGINT UNSIGNED NOT NULL,
  name      VARCHAR(8) NOT NULL,  -- e.g., "A"
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
  usn        VARCHAR(32) NOT NULL,  -- roll
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
```

Assignments (who teaches what):

```sql
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
```

---

### 3) Academics (Attendance, Marks, Diaries, Calendar)

Attendance per class hour:

```sql
CREATE TABLE IF NOT EXISTS attendance (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  ymd        DATE NOT NULL,
  class_id   BIGINT UNSIGNED NOT NULL,
  section_id BIGINT UNSIGNED NOT NULL,
  hour_no    TINYINT UNSIGNED NOT NULL,    -- 1..12
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
```

Marks (tests/assessments):

```sql
CREATE TABLE IF NOT EXISTS tests (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(64) NOT NULL, -- e.g., UT-1, UT-2, MID, FINAL
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
```

Diaries and Calendar:

```sql
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
  created_by  BIGINT UNSIGNED NULL, -- teacher_id (optional)
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

Materials/Textbooks/PYQs (resources):

```sql
CREATE TABLE IF NOT EXISTS materials (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  class_id   BIGINT UNSIGNED NOT NULL,
  section_id BIGINT UNSIGNED NOT NULL,
  subject_id BIGINT UNSIGNED NOT NULL,
  type       ENUM('link','file') NOT NULL,
  name       VARCHAR(255) NULL,
  url        TEXT NULL,
  mime       VARCHAR(128) NULL,
  data_url   MEDIUMTEXT NULL, -- for demo; in prod store in object storage
  uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_mat_lookup (class_id, section_id, subject_id),
  CONSTRAINT fk_mat_class   FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
  CONSTRAINT fk_mat_section FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE,
  CONSTRAINT fk_mat_subject FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- textbooks and pyqs can reuse `materials` with type + tags; kept separate for clarity
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
```

Syllabus (optional minimal structure):

```sql
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
```

---

### 4) Circulars

```sql
CREATE TABLE IF NOT EXISTS circulars (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  title      VARCHAR(255) NOT NULL,
  body       TEXT NOT NULL,
  ymd        DATE NOT NULL,
  class_id   BIGINT UNSIGNED NOT NULL,
  section_id BIGINT UNSIGNED NOT NULL,
  created_by BIGINT UNSIGNED NULL, -- teacher
  color      ENUM('blue','green','orange','pink','violet') NULL,
  attachments JSON NULL,
  ts         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_circ_class (class_id, section_id, ymd),
  CONSTRAINT fk_circ_class   FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
  CONSTRAINT fk_circ_section FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE,
  CONSTRAINT fk_circ_teacher FOREIGN KEY (created_by) REFERENCES teachers(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

### 5) Onboarding and Payments

Fees and invoicing (minimal representative set):

```sql
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
  provider    VARCHAR(64) NOT NULL,      -- e.g., "razorpay", "stripe"
  provider_ref VARCHAR(190) NULL,
  amount      DECIMAL(12,2) NOT NULL,
  currency    CHAR(3) NOT NULL DEFAULT 'INR',
  status      ENUM('created','succeeded','failed') NOT NULL DEFAULT 'created',
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  captured_at TIMESTAMP NULL,
  CONSTRAINT fk_pay_inv FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

Onboarding applications (optional minimal structure):

```sql
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
```

---

### 6) Indices and Performance Notes

- Frequently queried filters have supporting keys (e.g., `(class_id, section_id)`, `(ymd, class_id, section_id)`).
- Consider partitioning large tables by date (attendance, diaries, calendar) for very large deployments.
- For analytics, create materialized aggregate tables later (e.g., `agg_attendance`, `agg_marks`) if needed.

---

### 7) Migrations & Seeding

1) Apply the schema above to the `sas` database.
2) Seed master tables: `classes`, `sections`, `subjects`, `tests`.
3) ETL local demo data (from `data/local-db.json`) using the provided Node.js importer.

Run the ETL (imports are idempotent; existing rows are reused):

```
# Ensure DATABASE_URL or discrete DB_* env vars are set
# Example (adjust as needed):
export DATABASE_URL="mysql://sas_app:sas_strong_password_123@127.0.0.1:3306/sas"

# From repo root
node apps/frontend-next/scripts/etl-import.mjs
```

What it imports safely (no dropping existing data):
- Parents, Students, Classes, Sections
- Subjects, Class–Subject assignments
- Attendance (slots and entries)
- Tests, Mark sheets, Mark entries
- Diaries, Calendar events, Circulars
- Applications and Ad‑hoc invoices (mapped to `invoices`/`invoice_line_items`)

Dummy data (classes/sections/teachers/students + academics):

```
# 1) Seed master baseline (optional)
node apps/frontend-next/scripts/seed-master.mjs

# 2) Seed dummy students/parents/teachers for CLASS 1..10, A/B (600 students)
node apps/frontend-next/scripts/seed-dummy.mjs

# 3) Seed academics (attendance, UT-1 marks, diaries, calendar, circulars)
node apps/frontend-next/scripts/seed-academics.mjs
```

The UI teacher pages (attendance, marks, diary, calendar, circulars) already use `/api/mysql/...` endpoints and will render these seeded records.

---

### 8) Connection String (example)

Use environment variables in services/applications:

```
DATABASE_URL=mysql://sas_app:sas_strong_password_123@localhost:3306/sas?sslmode=disable
```

---

### 9) Backward‑Compatibility Strategy

- Initially, keep the frontend functional using current local APIs while introducing backend endpoints that read/write the MySQL DB.
- Gradually switch frontend BFF/API routes to call DB‑backed services.
- Provide ETL to migrate demo/local data into MySQL so existing users can continue without losing data.

---

### 10) Test Checklist

- Create class/section/subjects and assignments.
- Record attendance and verify queries by student/class/subject.
- Create mark sheets (UT‑1, UT‑2) and verify per‑test analytics.
- Publish diaries, calendar events, circulars and verify filters.
- Create invoices and payments; ensure status changes are persisted.

---

### 11) Notes on Existing DB and API Usage

- A subset of API routes under `apps/frontend-next` already targets MySQL (e.g., `/api/mysql/...`). This document and the ETL ensure those routes can work against the unified schema.
- Do not drop or rename existing tables in a live DB. If a conflicting table already exists, add only missing columns/indexes using `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` and backfill carefully.
- If you see build issues in the app while wiring DB (for example, a corrupted file tail in `apps/frontend-next/src/app/api/_lib/db.ts:57`), fix those before running the app.


