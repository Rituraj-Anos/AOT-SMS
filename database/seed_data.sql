-- ============================================================
-- AOT-SMS: Seed Data — Admin, Teachers, Students, Mappings
-- Generated BCrypt hashes (cost factor 12)
-- ============================================================
USE aot_sms;

-- ============================================================
-- Default superadmin: admin / Admin@AOT2026
-- ============================================================
INSERT IGNORE INTO admin_users (user_id, admin_name, role_level, email, password_hash)
VALUES ('admin', 'AOT Admin', 'superadmin', 'admin@aot.edu.in',
        '$2a$12$TWJGSKWNJxVgkx6Qc1tgnuvVCQYhVC7V7zXW5PUKF75CLLhXcZVh.');

-- ============================================================
-- Teachers (password: Teacher@123) — Real CSE faculty codes
-- ============================================================
INSERT IGNORE INTO teachers (emp_id, teacher_name, dept_id, designation, phone, email, password_hash)
VALUES
  ('ABP',  'Prof. ABP',  1, 'Professor',           '9876543201', 'abp@aot.edu.in',  '$2a$12$tkR58rWdR8tYtwFLQe.Qp.Gn6GFNRccrgHu3tgy5eTKL76ctZgp92'),
  ('JC',   'Prof. JC',   1, 'Associate Professor', '9876543202', 'jc@aot.edu.in',   '$2a$12$tkR58rWdR8tYtwFLQe.Qp.Gn6GFNRccrgHu3tgy5eTKL76ctZgp92'),
  ('DKM',  'Prof. DKM',  1, 'Assistant Professor', '9876543203', 'dkm@aot.edu.in',  '$2a$12$tkR58rWdR8tYtwFLQe.Qp.Gn6GFNRccrgHu3tgy5eTKL76ctZgp92'),
  ('ARD',  'Prof. ARD',  1, 'Assistant Professor', '9876543204', 'ard@aot.edu.in',  '$2a$12$tkR58rWdR8tYtwFLQe.Qp.Gn6GFNRccrgHu3tgy5eTKL76ctZgp92'),
  ('RP',   'Prof. RP',   1, 'HOD',                 '9876543205', 'rp@aot.edu.in',   '$2a$12$tkR58rWdR8tYtwFLQe.Qp.Gn6GFNRccrgHu3tgy5eTKL76ctZgp92'),
  ('ND',   'Prof. ND',   1, 'Professor',           '9876543206', 'nd@aot.edu.in',   '$2a$12$tkR58rWdR8tYtwFLQe.Qp.Gn6GFNRccrgHu3tgy5eTKL76ctZgp92'),
  ('AAT',  'Prof. AAT',  1, 'Assistant Professor', '9876543207', 'aat@aot.edu.in',  '$2a$12$tkR58rWdR8tYtwFLQe.Qp.Gn6GFNRccrgHu3tgy5eTKL76ctZgp92'),
  ('SRJS', 'Prof. SRJS', 1, 'Assistant Professor', '9876543208', 'srjs@aot.edu.in', '$2a$12$tkR58rWdR8tYtwFLQe.Qp.Gn6GFNRccrgHu3tgy5eTKL76ctZgp92'),
  ('SBR',  'Prof. SBR',  1, 'Assistant Professor', '9876543209', 'sbr@aot.edu.in',  '$2a$12$tkR58rWdR8tYtwFLQe.Qp.Gn6GFNRccrgHu3tgy5eTKL76ctZgp92'),
  ('BBH',  'Prof. BBH',  1, 'Assistant Professor', '9876543210', 'bbh@aot.edu.in',  '$2a$12$tkR58rWdR8tYtwFLQe.Qp.Gn6GFNRccrgHu3tgy5eTKL76ctZgp92'),
  ('DG',   'Prof. DG',   1, 'Assistant Professor', '9876543211', 'dg@aot.edu.in',   '$2a$12$tkR58rWdR8tYtwFLQe.Qp.Gn6GFNRccrgHu3tgy5eTKL76ctZgp92'),
  ('SD',   'Prof. SD',   1, 'Lab Instructor',      '9876543212', 'sd@aot.edu.in',   '$2a$12$tkR58rWdR8tYtwFLQe.Qp.Gn6GFNRccrgHu3tgy5eTKL76ctZgp92');

-- ============================================================
-- Students — CSE Dept, Sem 4, Section A, 2024 batch
-- Password: Student@123
-- ============================================================

-- Regular students
INSERT IGNORE INTO students (roll_no, student_name, student_type, dept_id, current_semester, section, gender, admission_year, password_hash)
VALUES
  ('24CSE001', 'Amit Kumar',                'regular', 1, 4, 'A', 'Male',   2024, '$2a$12$vBv6x/limqiHgCUhlJ3pL.a8sb6fOTcMK739i/LrgWiku5xUp2l6O'),
  ('24CSE002', 'Akash Kumar',               'regular', 1, 4, 'A', 'Male',   2024, '$2a$12$vBv6x/limqiHgCUhlJ3pL.a8sb6fOTcMK739i/LrgWiku5xUp2l6O'),
  ('24CSE003', 'Anshu Kumari Pandey',       'regular', 1, 4, 'A', 'Female', 2024, '$2a$12$vBv6x/limqiHgCUhlJ3pL.a8sb6fOTcMK739i/LrgWiku5xUp2l6O'),
  ('24CSE004', 'Aryan Raj',                 'regular', 1, 4, 'A', 'Male',   2024, '$2a$12$vBv6x/limqiHgCUhlJ3pL.a8sb6fOTcMK739i/LrgWiku5xUp2l6O'),
  ('24CSE005', 'Harshit Kumar Upadhyay',    'regular', 1, 4, 'A', 'Male',   2024, '$2a$12$vBv6x/limqiHgCUhlJ3pL.a8sb6fOTcMK739i/LrgWiku5xUp2l6O'),
  ('24CSE006', 'Pragya Bhatt',              'regular', 1, 4, 'A', 'Female', 2024, '$2a$12$vBv6x/limqiHgCUhlJ3pL.a8sb6fOTcMK739i/LrgWiku5xUp2l6O'),
  ('24CSE007', 'Pratik Supkar',             'regular', 1, 4, 'A', 'Male',   2024, '$2a$12$vBv6x/limqiHgCUhlJ3pL.a8sb6fOTcMK739i/LrgWiku5xUp2l6O'),
  ('24CSE008', 'Rupak Kumar',               'regular', 1, 4, 'A', 'Male',   2024, '$2a$12$vBv6x/limqiHgCUhlJ3pL.a8sb6fOTcMK739i/LrgWiku5xUp2l6O'),
  ('24CSE009', 'Rudra Phani',               'regular', 1, 4, 'A', 'Male',   2024, '$2a$12$vBv6x/limqiHgCUhlJ3pL.a8sb6fOTcMK739i/LrgWiku5xUp2l6O'),
  ('24CSE010', 'Sarthak Arun',              'regular', 1, 4, 'A', 'Male',   2024, '$2a$12$vBv6x/limqiHgCUhlJ3pL.a8sb6fOTcMK739i/LrgWiku5xUp2l6O'),
  ('24CSE011', 'Shivani Kumari',            'regular', 1, 4, 'A', 'Female', 2024, '$2a$12$vBv6x/limqiHgCUhlJ3pL.a8sb6fOTcMK739i/LrgWiku5xUp2l6O'),
  ('24CSE012', 'Srayash Raj',               'regular', 1, 4, 'A', 'Male',   2024, '$2a$12$vBv6x/limqiHgCUhlJ3pL.a8sb6fOTcMK739i/LrgWiku5xUp2l6O'),
  ('24CSE013', 'Sudhanshu Kumar',           'regular', 1, 4, 'A', 'Male',   2024, '$2a$12$vBv6x/limqiHgCUhlJ3pL.a8sb6fOTcMK739i/LrgWiku5xUp2l6O'),
  ('24CSE014', 'Surbhi Kumari',             'regular', 1, 4, 'A', 'Female', 2024, '$2a$12$vBv6x/limqiHgCUhlJ3pL.a8sb6fOTcMK739i/LrgWiku5xUp2l6O'),
  ('24CSE015', 'Vineet Kumar Singh',        'regular', 1, 4, 'A', 'Male',   2024, '$2a$12$vBv6x/limqiHgCUhlJ3pL.a8sb6fOTcMK739i/LrgWiku5xUp2l6O'),
  ('24CSE016', 'Raghavendra Yadav',         'regular', 1, 4, 'A', 'Male',   2024, '$2a$12$vBv6x/limqiHgCUhlJ3pL.a8sb6fOTcMK739i/LrgWiku5xUp2l6O'),
  ('24CSE017', 'Raghaw Shukla',             'regular', 1, 4, 'A', 'Male',   2024, '$2a$12$vBv6x/limqiHgCUhlJ3pL.a8sb6fOTcMK739i/LrgWiku5xUp2l6O'),
  ('24CSE018', 'Ranit Das',                 'regular', 1, 4, 'A', 'Male',   2024, '$2a$12$vBv6x/limqiHgCUhlJ3pL.a8sb6fOTcMK739i/LrgWiku5xUp2l6O'),
  ('24CSE019', 'Ranita Paul',               'regular', 1, 4, 'A', 'Female', 2024, '$2a$12$vBv6x/limqiHgCUhlJ3pL.a8sb6fOTcMK739i/LrgWiku5xUp2l6O'),
  ('24CSE020', 'Pratyayan Halder',          'regular', 1, 4, 'A', 'Male',   2024, '$2a$12$vBv6x/limqiHgCUhlJ3pL.a8sb6fOTcMK739i/LrgWiku5xUp2l6O'),
  ('24CSE021', 'Prerana Hait',              'regular', 1, 4, 'A', 'Female', 2024, '$2a$12$vBv6x/limqiHgCUhlJ3pL.a8sb6fOTcMK739i/LrgWiku5xUp2l6O'),
  ('24CSE022', 'Priyangshu Nandi',          'regular', 1, 4, 'A', 'Male',   2024, '$2a$12$vBv6x/limqiHgCUhlJ3pL.a8sb6fOTcMK739i/LrgWiku5xUp2l6O'),
  ('24CSE023', 'Priyanshu De',              'regular', 1, 4, 'A', 'Male',   2024, '$2a$12$vBv6x/limqiHgCUhlJ3pL.a8sb6fOTcMK739i/LrgWiku5xUp2l6O'),
  ('24CSE024', 'Priyansu Bera',             'regular', 1, 4, 'A', 'Male',   2024, '$2a$12$vBv6x/limqiHgCUhlJ3pL.a8sb6fOTcMK739i/LrgWiku5xUp2l6O'),
  ('24CSE026', 'Rupanjana Dutta',           'regular', 1, 4, 'A', 'Female', 2024, '$2a$12$vBv6x/limqiHgCUhlJ3pL.a8sb6fOTcMK739i/LrgWiku5xUp2l6O'),
  ('24CSE027', 'Rupsha Banerjee',           'regular', 1, 4, 'A', 'Female', 2024, '$2a$12$vBv6x/limqiHgCUhlJ3pL.a8sb6fOTcMK739i/LrgWiku5xUp2l6O'),
  ('24CSE028', 'Sajal Pakira',              'regular', 1, 4, 'A', 'Male',   2024, '$2a$12$vBv6x/limqiHgCUhlJ3pL.a8sb6fOTcMK739i/LrgWiku5xUp2l6O'),
  ('24CSE029', 'Sakshi Choudhary',          'regular', 1, 4, 'A', 'Female', 2024, '$2a$12$vBv6x/limqiHgCUhlJ3pL.a8sb6fOTcMK739i/LrgWiku5xUp2l6O'),
  ('24CSE031', 'Sania Ghosh',               'regular', 1, 4, 'A', 'Female', 2024, '$2a$12$vBv6x/limqiHgCUhlJ3pL.a8sb6fOTcMK739i/LrgWiku5xUp2l6O'),
  ('24CSE032', 'Sanjoy Das',                'regular', 1, 4, 'A', 'Male',   2024, '$2a$12$vBv6x/limqiHgCUhlJ3pL.a8sb6fOTcMK739i/LrgWiku5xUp2l6O'),
  ('24CSE033', 'Sannidhya Banerjee',        'regular', 1, 4, 'A', 'Male',   2024, '$2a$12$vBv6x/limqiHgCUhlJ3pL.a8sb6fOTcMK739i/LrgWiku5xUp2l6O'),
  ('24CSE034', 'Santadeep Das',             'regular', 1, 4, 'A', 'Male',   2024, '$2a$12$vBv6x/limqiHgCUhlJ3pL.a8sb6fOTcMK739i/LrgWiku5xUp2l6O'),
  ('24CSE035', 'Shramana Bandyopadhyay',    'regular', 1, 4, 'A', 'Female', 2024, '$2a$12$vBv6x/limqiHgCUhlJ3pL.a8sb6fOTcMK739i/LrgWiku5xUp2l6O'),
  ('24CSE036', 'Satavisa Kesh',             'regular', 1, 4, 'A', 'Female', 2024, '$2a$12$vBv6x/limqiHgCUhlJ3pL.a8sb6fOTcMK739i/LrgWiku5xUp2l6O'),
  ('24CSE037', 'Gourab Mashat',             'regular', 1, 4, 'A', 'Male',   2024, '$2a$12$vBv6x/limqiHgCUhlJ3pL.a8sb6fOTcMK739i/LrgWiku5xUp2l6O'),
  ('24CSE038', 'Sayantika Das',             'regular', 1, 4, 'A', 'Female', 2024, '$2a$12$vBv6x/limqiHgCUhlJ3pL.a8sb6fOTcMK739i/LrgWiku5xUp2l6O'),
  ('24CSE039', 'Rudranil Nandi',            'regular', 1, 4, 'A', 'Male',   2024, '$2a$12$vBv6x/limqiHgCUhlJ3pL.a8sb6fOTcMK739i/LrgWiku5xUp2l6O'),
  ('24CSE040', 'Ritesh Mallik',             'regular', 1, 4, 'A', 'Male',   2024, '$2a$12$vBv6x/limqiHgCUhlJ3pL.a8sb6fOTcMK739i/LrgWiku5xUp2l6O'),
  ('24CSE041', 'Rituraj Mukhopadhyay',      'regular', 1, 4, 'A', 'Male',   2024, '$2a$12$vBv6x/limqiHgCUhlJ3pL.a8sb6fOTcMK739i/LrgWiku5xUp2l6O'),
  ('24CSE042', 'Sayan Chakraborty',         'regular', 1, 4, 'A', 'Male',   2024, '$2a$12$vBv6x/limqiHgCUhlJ3pL.a8sb6fOTcMK739i/LrgWiku5xUp2l6O'),
  ('24CSE043', 'Sayan Goswami',             'regular', 1, 4, 'A', 'Male',   2024, '$2a$12$vBv6x/limqiHgCUhlJ3pL.a8sb6fOTcMK739i/LrgWiku5xUp2l6O'),
  ('24CSE044', 'Sayan Pal',                 'regular', 1, 4, 'A', 'Male',   2024, '$2a$12$vBv6x/limqiHgCUhlJ3pL.a8sb6fOTcMK739i/LrgWiku5xUp2l6O'),
  ('24CSE045', 'Swastik Saha',              'regular', 1, 4, 'A', 'Male',   2024, '$2a$12$vBv6x/limqiHgCUhlJ3pL.a8sb6fOTcMK739i/LrgWiku5xUp2l6O'),
  ('24CSE046', 'Tanisha Samanta',           'regular', 1, 4, 'A', 'Female', 2024, '$2a$12$vBv6x/limqiHgCUhlJ3pL.a8sb6fOTcMK739i/LrgWiku5xUp2l6O'),
  ('24CSE047', 'Sudip Samanta',             'regular', 1, 4, 'A', 'Male',   2024, '$2a$12$vBv6x/limqiHgCUhlJ3pL.a8sb6fOTcMK739i/LrgWiku5xUp2l6O'),
  ('24CSE048', 'Suman Ghorai',              'regular', 1, 4, 'A', 'Male',   2024, '$2a$12$vBv6x/limqiHgCUhlJ3pL.a8sb6fOTcMK739i/LrgWiku5xUp2l6O'),
  ('24CSE049', 'Suman Khan',                'regular', 1, 4, 'A', 'Male',   2024, '$2a$12$vBv6x/limqiHgCUhlJ3pL.a8sb6fOTcMK739i/LrgWiku5xUp2l6O'),
  ('24CSE050', 'Sumit Dey',                 'regular', 1, 4, 'A', 'Male',   2024, '$2a$12$vBv6x/limqiHgCUhlJ3pL.a8sb6fOTcMK739i/LrgWiku5xUp2l6O'),
  ('24CSE051', 'Sumit Kumar Mishra',        'regular', 1, 4, 'A', 'Male',   2024, '$2a$12$vBv6x/limqiHgCUhlJ3pL.a8sb6fOTcMK739i/LrgWiku5xUp2l6O'),
  ('24CSE052', 'Suprabho Dey',              'regular', 1, 4, 'A', 'Male',   2024, '$2a$12$vBv6x/limqiHgCUhlJ3pL.a8sb6fOTcMK739i/LrgWiku5xUp2l6O'),
  ('24CSE053', 'Srinjoyee Dey',             'regular', 1, 4, 'A', 'Female', 2024, '$2a$12$vBv6x/limqiHgCUhlJ3pL.a8sb6fOTcMK739i/LrgWiku5xUp2l6O');

-- Lateral entry students
INSERT IGNORE INTO students (roll_no, student_name, student_type, dept_id, current_semester, section, gender, admission_year, password_hash)
VALUES
  ('L204', 'Anik Debnath',       'lateral', 1, 4, 'A', 'Male', 2024, '$2a$12$vBv6x/limqiHgCUhlJ3pL.a8sb6fOTcMK739i/LrgWiku5xUp2l6O'),
  ('L205', 'Animesh Layek',      'lateral', 1, 4, 'A', 'Male', 2024, '$2a$12$vBv6x/limqiHgCUhlJ3pL.a8sb6fOTcMK739i/LrgWiku5xUp2l6O'),
  ('L206', 'Ankit Pal',          'lateral', 1, 4, 'A', 'Male', 2024, '$2a$12$vBv6x/limqiHgCUhlJ3pL.a8sb6fOTcMK739i/LrgWiku5xUp2l6O'),
  ('L207', 'Ansh Kumar Verma',   'lateral', 1, 4, 'A', 'Male', 2024, '$2a$12$vBv6x/limqiHgCUhlJ3pL.a8sb6fOTcMK739i/LrgWiku5xUp2l6O'),
  ('L208', 'Aritra Santra',      'lateral', 1, 4, 'A', 'Male', 2024, '$2a$12$vBv6x/limqiHgCUhlJ3pL.a8sb6fOTcMK739i/LrgWiku5xUp2l6O');

-- Transfer students
INSERT IGNORE INTO students (roll_no, student_name, student_type, dept_id, current_semester, section, gender, admission_year, password_hash)
VALUES
  ('T006', 'Suhani Srivastava',  'transfer', 1, 4, 'A', 'Female', 2024, '$2a$12$vBv6x/limqiHgCUhlJ3pL.a8sb6fOTcMK739i/LrgWiku5xUp2l6O'),
  ('T063', 'Soumaditya Roy',     'transfer', 1, 4, 'A', 'Male',   2024, '$2a$12$vBv6x/limqiHgCUhlJ3pL.a8sb6fOTcMK739i/LrgWiku5xUp2l6O'),
  ('T098', 'Priyanka Sett',      'transfer', 1, 4, 'A', 'Female', 2024, '$2a$12$vBv6x/limqiHgCUhlJ3pL.a8sb6fOTcMK739i/LrgWiku5xUp2l6O'),
  ('T191', 'Ankit Shaw',         'transfer', 1, 4, 'A', 'Male',   2024, '$2a$12$vBv6x/limqiHgCUhlJ3pL.a8sb6fOTcMK739i/LrgWiku5xUp2l6O');

-- ============================================================
-- Teacher-subject mappings (Sem 4, Section A, 2025-26)
-- Uses emp_id lookups for portability across DBs
-- ============================================================
INSERT IGNORE INTO teacher_subject_mapping (teacher_id, subject_id, dept_id, semester, section, academic_year)
SELECT t.teacher_id, s.subject_id, 1, 4, 'A', '2025-26'
FROM teachers t, subjects s
WHERE (t.emp_id, s.subject_code) IN (
  ('RP',   'PCC-CS401'),
  ('SBR',  'PCC-CS402'),
  ('SRJS', 'PCC-CS403'),
  ('DKM',  'PCC-CS404'),
  ('ARD',  'BSC-401'),
  ('DG',   'MC-401'),
  ('JC',   'PCC-CS492'),
  ('DKM',  'PCC-CS494'),
  ('SD',   'PCC-CS492'),
  ('SD',   'PCC-CS494'),
  ('ND',   'SST-JAVA'),
  ('ABP',  'AAT'),
  ('BBH',  'EET')
);

-- ============================================================
-- Class Schedule (CSE1 Sem4 2025-26 — real timetable)
-- Inserted via emp_id+subject_code lookup for portability
-- ============================================================
INSERT IGNORE INTO class_schedule (teacher_id, subject_id, dept_id, semester, section, day_of_week, period_number, start_time, end_time, class_type, room_no, academic_year, is_active)
SELECT t.teacher_id, s.subject_id, 1, 4, 'A', d.day_of_week, d.period, d.start_time, d.end_time, d.class_type, d.room_no, '2025-26', TRUE
FROM teachers t, subjects s,
(SELECT 'DKM' AS emp, 'PCC-CS404' AS code, 'Tuesday' AS day_of_week, 1 AS period, '09:45:00' AS start_time, '10:45:00' AS end_time, 'theory' AS class_type, NULL AS room_no UNION ALL
 SELECT 'SRJS','PCC-CS403','Tuesday',2,'10:45:00','11:45:00','theory',NULL UNION ALL
 SELECT 'SBR', 'PCC-CS402','Tuesday',3,'11:45:00','12:45:00','theory',NULL UNION ALL
 SELECT 'ARD', 'BSC-401',  'Tuesday',4,'13:30:00','14:30:00','theory','Auditorium-A' UNION ALL
 SELECT 'DKM', 'PCC-CS404','Wednesday',1,'09:45:00','10:45:00','theory',NULL UNION ALL
 SELECT 'RP',  'PCC-CS401','Wednesday',2,'10:45:00','11:45:00','theory',NULL UNION ALL
 SELECT 'BBH', 'EET',      'Wednesday',3,'11:45:00','12:45:00','tutorial',NULL UNION ALL
 SELECT 'SRJS','PCC-CS403','Wednesday',4,'13:30:00','14:30:00','theory',NULL UNION ALL
 SELECT 'SBR', 'PCC-CS402','Wednesday',5,'14:30:00','15:30:00','theory',NULL UNION ALL
 SELECT 'DG',  'MC-401',   'Wednesday',6,'15:30:00','16:30:00','tutorial',NULL UNION ALL
 SELECT 'RP',  'PCC-CS401','Thursday',1,'09:45:00','10:45:00','theory',NULL UNION ALL
 SELECT 'ABP', 'AAT',      'Thursday',2,'10:45:00','11:45:00','tutorial',NULL UNION ALL
 SELECT 'DKM', 'PCC-CS404','Thursday',3,'11:45:00','12:45:00','theory',NULL UNION ALL
 SELECT 'SRJS','PCC-CS403','Thursday',4,'13:30:00','14:30:00','theory',NULL UNION ALL
 SELECT 'JC',  'PCC-CS492','Thursday',4,'13:30:00','14:30:00','lab','Lab-9' UNION ALL
 SELECT 'DKM', 'PCC-CS494','Thursday',4,'13:30:00','14:30:00','lab','Lab-5' UNION ALL
 SELECT 'RP',  'PCC-CS401','Friday',1,'09:45:00','10:45:00','theory',NULL UNION ALL
 SELECT 'JC',  'PCC-CS492','Friday',2,'10:45:00','11:45:00','lab','Lab-9' UNION ALL
 SELECT 'SD',  'PCC-CS492','Friday',2,'10:45:00','11:45:00','lab','Lab-1' UNION ALL
 SELECT 'SRJS','PCC-CS403','Friday',4,'13:30:00','14:30:00','theory',NULL UNION ALL
 SELECT 'SBR', 'PCC-CS402','Friday',5,'14:30:00','15:30:00','theory',NULL UNION ALL
 SELECT 'SBR', 'PCC-CS402','Saturday',1,'09:45:00','10:45:00','theory',NULL UNION ALL
 SELECT 'ND',  'SST-JAVA', 'Saturday',2,'10:45:00','11:45:00','tutorial',NULL UNION ALL
 SELECT 'DKM', 'PCC-CS404','Saturday',3,'11:45:00','12:45:00','theory',NULL UNION ALL
 SELECT 'RP',  'PCC-CS401','Saturday',4,'13:30:00','14:30:00','theory',NULL UNION ALL
 SELECT 'SD',  'PCC-CS492','Saturday',5,'14:30:00','15:30:00','lab','Lab-1' UNION ALL
 SELECT 'DKM', 'PCC-CS494','Saturday',5,'14:30:00','15:30:00','lab','Lab-5'
) AS d
WHERE t.emp_id = d.emp AND s.subject_code = d.code;

-- ============================================================
-- Attendance Phases (CSE Sem 4 2025-26)
-- ============================================================
INSERT IGNORE INTO attendance_phases (dept_id, semester, academic_year, phase_name, start_date, end_date) VALUES
(1, 4, '2025-26', 'Phase 1', '2026-01-01', '2026-03-15'),
(1, 4, '2025-26', 'Phase 2', '2026-03-16', '2026-05-08'),
(1, 4, '2025-26', 'Overall', '2026-01-01', '2026-06-30');
