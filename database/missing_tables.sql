-- Tables added after initial schema that are missing from Aiven

-- Study Materials
CREATE TABLE IF NOT EXISTS study_materials (
  material_id   INT AUTO_INCREMENT PRIMARY KEY,
  teacher_id    INT NOT NULL,
  subject_id    INT NOT NULL,
  dept_id       INT NOT NULL,
  semester      INT NOT NULL,
  section       VARCHAR(5),
  title         VARCHAR(200) NOT NULL,
  description   TEXT,
  material_type ENUM('notes','assignment','question_paper','syllabus','other') DEFAULT 'notes',
  file_name     VARCHAR(255),
  file_path     VARCHAR(500),
  file_size     BIGINT DEFAULT 0,
  due_date      DATE,
  is_pinned     BOOLEAN DEFAULT FALSE,
  posted_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (teacher_id) REFERENCES teachers(teacher_id),
  FOREIGN KEY (subject_id) REFERENCES subjects(subject_id),
  FOREIGN KEY (dept_id)    REFERENCES departments(dept_id)
);

-- Submissions
CREATE TABLE IF NOT EXISTS submissions (
  submission_id  INT AUTO_INCREMENT PRIMARY KEY,
  material_id    INT NOT NULL,
  student_id     INT NOT NULL,
  file_name      VARCHAR(255),
  file_path      VARCHAR(500),
  submitted_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status         ENUM('submitted','late','graded') DEFAULT 'submitted',
  grade          VARCHAR(10),
  feedback       TEXT,
  UNIQUE KEY unique_submission (material_id, student_id),
  FOREIGN KEY (material_id) REFERENCES study_materials(material_id),
  FOREIGN KEY (student_id)  REFERENCES students(student_id)
);

-- Material Comments
CREATE TABLE IF NOT EXISTS material_comments (
  comment_id     INT AUTO_INCREMENT PRIMARY KEY,
  material_id    INT NOT NULL,
  posted_by_role ENUM('admin','teacher','student') NOT NULL,
  posted_by_id   INT NOT NULL,
  posted_by_name VARCHAR(100) NOT NULL,
  comment_text   TEXT NOT NULL,
  posted_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (material_id) REFERENCES study_materials(material_id) ON DELETE CASCADE
);

-- Class Schedule
CREATE TABLE IF NOT EXISTS class_schedule (
  schedule_id    INT AUTO_INCREMENT PRIMARY KEY,
  teacher_id     INT NOT NULL,
  subject_id     INT NOT NULL,
  dept_id        INT NOT NULL,
  semester       INT NOT NULL,
  section        VARCHAR(5) NOT NULL,
  day_of_week    ENUM('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday') NOT NULL,
  period_number  INT NOT NULL,
  start_time     TIME,
  end_time       TIME,
  class_type     ENUM('theory','lab','tutorial') DEFAULT 'theory',
  room_no        VARCHAR(20),
  academic_year  VARCHAR(10),
  is_active      BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (teacher_id) REFERENCES teachers(teacher_id),
  FOREIGN KEY (subject_id) REFERENCES subjects(subject_id),
  FOREIGN KEY (dept_id)    REFERENCES departments(dept_id)
);

-- Schedule Attendance (student self-record)
CREATE TABLE IF NOT EXISTS schedule_attendance (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  schedule_id         INT NOT NULL,
  student_id          INT NOT NULL,
  class_date          DATE NOT NULL,
  status              ENUM('attended','missed','off','substituted') NOT NULL,
  substitute_teacher  VARCHAR(100),
  substitute_subject  VARCHAR(100),
  notes               TEXT,
  marked_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_sched_att (schedule_id, student_id, class_date),
  FOREIGN KEY (schedule_id) REFERENCES class_schedule(schedule_id),
  FOREIGN KEY (student_id)  REFERENCES students(student_id)
);

-- Attendance Phases
CREATE TABLE IF NOT EXISTS attendance_phases (
  phase_id      INT AUTO_INCREMENT PRIMARY KEY,
  dept_id       INT NOT NULL,
  semester      INT NOT NULL,
  academic_year VARCHAR(10) NOT NULL,
  phase_name    VARCHAR(50) NOT NULL,
  start_date    DATE NOT NULL,
  end_date      DATE NOT NULL,
  FOREIGN KEY (dept_id) REFERENCES departments(dept_id)
);

INSERT IGNORE INTO attendance_phases (dept_id, semester, academic_year, phase_name, start_date, end_date) VALUES
(1, 4, '2025-26', 'Phase 1', '2026-01-01', '2026-03-15'),
(1, 4, '2025-26', 'Phase 2', '2026-03-16', '2026-05-08'),
(1, 4, '2025-26', 'Overall', '2026-01-01', '2026-06-30');

-- Attendance Disputes
CREATE TABLE IF NOT EXISTS attendance_disputes (
  dispute_id     INT AUTO_INCREMENT PRIMARY KEY,
  student_id     INT NOT NULL,
  subject_id     INT NOT NULL,
  class_date     DATE NOT NULL,
  student_note   TEXT NOT NULL,
  status         ENUM('pending','resolved','rejected') DEFAULT 'pending',
  teacher_note   TEXT,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_at    TIMESTAMP NULL,
  resolved_by    INT NULL,
  UNIQUE KEY unique_dispute (student_id, subject_id, class_date),
  FOREIGN KEY (student_id) REFERENCES students(student_id),
  FOREIGN KEY (subject_id) REFERENCES subjects(subject_id)
);
