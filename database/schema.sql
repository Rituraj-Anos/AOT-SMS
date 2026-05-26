-- ============================================================
-- AOT STUDENT MANAGEMENT SYSTEM — Full Database Schema
-- Academy of Technology | MAKAUT Affiliated
-- MySQL 8.0 | Character set: utf8mb4
-- ============================================================

-- Create and use database
CREATE DATABASE IF NOT EXISTS aot_sms
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE aot_sms;

-- ============================================================
-- TABLE 1: departments
-- ============================================================
CREATE TABLE departments (
  dept_id         INT AUTO_INCREMENT PRIMARY KEY,
  dept_code       VARCHAR(10)  NOT NULL UNIQUE,
  dept_name       VARCHAR(100) NOT NULL,
  total_semesters INT DEFAULT 8,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO departments (dept_code, dept_name) VALUES
  ('CSE',  'Computer Science & Engineering'),
  ('ECE',  'Electronics & Communication Engineering'),
  ('MECH', 'Mechanical Engineering'),
  ('MBA',  'Master of Business Administration'),
  ('EE',   'Electrical Engineering');

-- ============================================================
-- TABLE 2: subjects  (seeded with MAKAUT 4th-sem CSE)
-- ============================================================
CREATE TABLE subjects (
  subject_id    INT AUTO_INCREMENT PRIMARY KEY,
  subject_code  VARCHAR(20)  NOT NULL UNIQUE,
  subject_name  VARCHAR(150) NOT NULL,
  dept_id       INT,
  semester      INT NOT NULL,
  credits       INT NOT NULL,
  subject_type  ENUM('theory','lab','training') NOT NULL,
  l_hours       INT DEFAULT 0,
  t_hours       INT DEFAULT 0,
  p_hours       INT DEFAULT 0,
  FOREIGN KEY (dept_id) REFERENCES departments(dept_id)
);

INSERT INTO subjects
  (subject_code, subject_name, dept_id, semester, credits, subject_type, l_hours, t_hours, p_hours)
VALUES
  ('PCC-CS401', 'Discrete Mathematics',                1, 4, 4, 'theory',   3, 1, 0),
  ('PCC-CS402', 'Computer Organisation & Architecture', 1, 4, 3, 'theory',   3, 0, 0),
  ('PCC-CS403', 'Formal Language & Automata Theory',    1, 4, 3, 'theory',   3, 0, 0),
  ('PCC-CS404', 'Design & Analysis of Algorithms',      1, 4, 3, 'theory',   3, 0, 0),
  ('BSC-401',   'Biology',                              1, 4, 3, 'theory',   2, 1, 0),
  ('MC-401',    'Environmental Sciences',               1, 4, 1, 'theory',   1, 0, 0),
  ('PCC-CS492', 'Computer Architecture Lab',            1, 4, 2, 'lab',      0, 0, 4),
  ('PCC-CS494', 'DAA Lab',                              1, 4, 2, 'lab',      0, 0, 4),
  ('EET',       'Java Training (Industry)',             1, 4, 0, 'training', 0, 0, 0),
  ('ABP',       'Activity Based Project (EEE)',         1, 4, 0, 'training', 0, 0, 0);

-- ============================================================
-- TABLE 3: students
-- ============================================================
CREATE TABLE students (
  student_id      INT AUTO_INCREMENT PRIMARY KEY,
  roll_no         VARCHAR(20)  NOT NULL UNIQUE,
  student_name    VARCHAR(100) NOT NULL,
  student_type    ENUM('regular','lateral','transfer') DEFAULT 'regular',
  dept_id         INT NOT NULL,
  current_semester INT NOT NULL DEFAULT 1,
  section         VARCHAR(5) DEFAULT 'A',
  dob             DATE,
  gender          ENUM('Male','Female','Other'),
  blood_group     VARCHAR(5),
  aadhar_no       VARCHAR(20),
  phone           VARCHAR(15),
  email           VARCHAR(100),
  parent_name     VARCHAR(100),
  parent_phone    VARCHAR(15),
  address         TEXT,
  photo_path      VARCHAR(255),
  admission_year  INT,
  is_active       BOOLEAN DEFAULT TRUE,
  password_hash   VARCHAR(255) NOT NULL,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (dept_id) REFERENCES departments(dept_id)
);

-- ============================================================
-- TABLE 4: teachers
-- ============================================================
CREATE TABLE teachers (
  teacher_id    INT AUTO_INCREMENT PRIMARY KEY,
  emp_id        VARCHAR(20)  NOT NULL UNIQUE,
  teacher_name  VARCHAR(100) NOT NULL,
  dept_id       INT,
  designation   ENUM('Professor','Associate Professor',
                     'Assistant Professor','HOD','Lab Instructor'),
  phone         VARCHAR(15),
  email         VARCHAR(100),
  photo_path    VARCHAR(255),
  date_joined   DATE,
  is_active     BOOLEAN DEFAULT TRUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (dept_id) REFERENCES departments(dept_id)
);

-- ============================================================
-- TABLE 5: teacher_subject_mapping
-- ============================================================
CREATE TABLE teacher_subject_mapping (
  mapping_id    INT AUTO_INCREMENT PRIMARY KEY,
  teacher_id    INT NOT NULL,
  subject_id    INT NOT NULL,
  dept_id       INT NOT NULL,
  semester      INT NOT NULL,
  section       VARCHAR(5),
  academic_year VARCHAR(10),
  UNIQUE KEY unique_mapping (teacher_id, subject_id, section, academic_year),
  FOREIGN KEY (teacher_id) REFERENCES teachers(teacher_id),
  FOREIGN KEY (subject_id) REFERENCES subjects(subject_id),
  FOREIGN KEY (dept_id)    REFERENCES departments(dept_id)
);

-- ============================================================
-- TABLE 6: attendance
-- ============================================================
CREATE TABLE attendance (
  attendance_id   INT AUTO_INCREMENT PRIMARY KEY,
  student_id      INT NOT NULL,
  subject_id      INT NOT NULL,
  attendance_date DATE NOT NULL,
  status          ENUM('P','A','L','ML') NOT NULL,
  marked_by       INT,
  marked_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_att (student_id, subject_id, attendance_date),
  FOREIGN KEY (student_id) REFERENCES students(student_id),
  FOREIGN KEY (subject_id) REFERENCES subjects(subject_id),
  FOREIGN KEY (marked_by)  REFERENCES teachers(teacher_id)
);

-- ============================================================
-- TABLE 7: marks
-- ============================================================
CREATE TABLE marks (
  marks_id           INT AUTO_INCREMENT PRIMARY KEY,
  student_id         INT NOT NULL,
  subject_id         INT NOT NULL,
  semester           INT NOT NULL,
  academic_year      VARCHAR(10),
  ct1                DECIMAL(5,2) DEFAULT NULL,
  ct2                DECIMAL(5,2) DEFAULT NULL,
  ct3                DECIMAL(5,2) DEFAULT NULL,
  ct4                DECIMAL(5,2) DEFAULT NULL,
  best_two_marks     DECIMAL(5,2) DEFAULT NULL,
  ese_marks          DECIMAL(5,2) DEFAULT NULL,
  attendance_marks   INT DEFAULT 0,
  total_marks        DECIMAL(5,2) DEFAULT NULL,
  is_result_declared BOOLEAN DEFAULT FALSE,
  entered_by         INT,
  updated_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_marks (student_id, subject_id, semester, academic_year),
  FOREIGN KEY (student_id) REFERENCES students(student_id),
  FOREIGN KEY (subject_id) REFERENCES subjects(subject_id),
  FOREIGN KEY (entered_by) REFERENCES teachers(teacher_id)
);

-- ============================================================
-- TABLE 8: grades
-- ============================================================
CREATE TABLE grades (
  grade_id        INT AUTO_INCREMENT PRIMARY KEY,
  student_id      INT NOT NULL,
  subject_id      INT NOT NULL,
  semester        INT NOT NULL,
  academic_year   VARCHAR(10),
  grade           ENUM('O','E','A','B','C','D','F') NOT NULL,
  grade_point     INT NOT NULL,
  credits         INT NOT NULL,
  is_backlog      BOOLEAN DEFAULT FALSE,
  backlog_cleared BOOLEAN DEFAULT FALSE,
  UNIQUE KEY unique_grade (student_id, subject_id, semester, academic_year),
  FOREIGN KEY (student_id) REFERENCES students(student_id),
  FOREIGN KEY (subject_id) REFERENCES subjects(subject_id)
);

-- ============================================================
-- TABLE 9: sgpa_cgpa
-- ============================================================
CREATE TABLE sgpa_cgpa (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  student_id  INT NOT NULL UNIQUE,
  sem1_sgpa   DECIMAL(4,2),
  sem2_sgpa   DECIMAL(4,2),
  sem3_sgpa   DECIMAL(4,2),
  sem4_sgpa   DECIMAL(4,2),
  sem5_sgpa   DECIMAL(4,2),
  sem6_sgpa   DECIMAL(4,2),
  sem7_sgpa   DECIMAL(4,2),
  sem8_sgpa   DECIMAL(4,2),
  cgpa        DECIMAL(4,2),
  percentage  DECIMAL(5,2),
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(student_id)
);

-- ============================================================
-- TABLE 10: fees
-- ============================================================
CREATE TABLE fees (
  fee_id        INT AUTO_INCREMENT PRIMARY KEY,
  student_id    INT NOT NULL,
  academic_year VARCHAR(10),
  semester      INT,
  total_amount  DECIMAL(10,2) NOT NULL,
  amount_paid   DECIMAL(10,2) DEFAULT 0,
  balance_due   DECIMAL(10,2),
  due_date      DATE,
  payment_date  DATE,
  payment_mode  ENUM('Cash','Online','DD','Cheque'),
  receipt_no    VARCHAR(50),
  remarks       TEXT,
  FOREIGN KEY (student_id) REFERENCES students(student_id)
);

-- ============================================================
-- TABLE 11: notices
-- ============================================================
CREATE TABLE notices (
  notice_id      INT AUTO_INCREMENT PRIMARY KEY,
  title          VARCHAR(200) NOT NULL,
  body           TEXT NOT NULL,
  posted_by_role ENUM('admin','teacher') NOT NULL,
  posted_by_id   INT NOT NULL,
  target_type    ENUM('all','dept','section','student') DEFAULT 'all',
  target_dept_id INT,
  target_section VARCHAR(5),
  is_pinned      BOOLEAN DEFAULT FALSE,
  post_date      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expiry_date    DATE,
  FOREIGN KEY (target_dept_id) REFERENCES departments(dept_id)
);

-- ============================================================
-- TABLE 12: admin_users
-- ============================================================
CREATE TABLE admin_users (
  admin_id      INT AUTO_INCREMENT PRIMARY KEY,
  user_id       VARCHAR(20)  NOT NULL UNIQUE,
  admin_name    VARCHAR(100) NOT NULL,
  role_level    ENUM('superadmin','hod','office') DEFAULT 'office',
  email         VARCHAR(100),
  password_hash VARCHAR(255) NOT NULL,
  is_active     BOOLEAN DEFAULT TRUE,
  last_login    TIMESTAMP NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- TABLE 13: login_sessions
-- ============================================================
CREATE TABLE login_sessions (
  session_id  VARCHAR(100) PRIMARY KEY,
  user_id     VARCHAR(50)  NOT NULL,
  user_role   ENUM('admin','teacher','student') NOT NULL,
  login_time  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_active TIMESTAMP NULL,
  ip_address  VARCHAR(50),
  is_active   BOOLEAN DEFAULT TRUE
);

-- ============================================================
-- TABLE 14: login_attempts
-- ============================================================
CREATE TABLE login_attempts (
  attempt_id   INT AUTO_INCREMENT PRIMARY KEY,
  user_id      VARCHAR(50),
  success      BOOLEAN DEFAULT FALSE,
  ip_address   VARCHAR(50),
  attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- DATABASE VIEWS
-- ============================================================

-- Student attendance summary per subject
CREATE OR REPLACE VIEW v_attendance_summary AS
SELECT
  s.student_id,
  s.roll_no,
  s.student_name,
  sub.subject_id,
  sub.subject_code,
  sub.subject_name,
  COUNT(*) AS total_classes,
  SUM(CASE WHEN a.status IN ('P','L') THEN 1 ELSE 0 END) AS classes_attended,
  ROUND(
    SUM(CASE WHEN a.status IN ('P','L') THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2
  ) AS attendance_percent
FROM attendance a
JOIN students s  ON a.student_id = s.student_id
JOIN subjects sub ON a.subject_id = sub.subject_id
GROUP BY s.student_id, sub.subject_id;

-- Students below 75% attendance
CREATE OR REPLACE VIEW v_below_75 AS
SELECT * FROM v_attendance_summary
WHERE attendance_percent < 75;

-- ============================================================
-- NOTE: The default admin account will be seeded by the
-- Java BCrypt hash generator (see GenerateBCrypt.java).
-- Run that utility first, then execute the INSERT below
-- with the generated hash.
-- ============================================================

-- Placeholder — replace $BCRYPT_HASH with actual output:
-- INSERT INTO admin_users (user_id, admin_name, role_level, email, password_hash)
-- VALUES ('admin', 'AOT Admin', 'superadmin', 'admin@aot.edu.in', '$BCRYPT_HASH');
