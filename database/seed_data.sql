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
-- Teachers (password: Teacher@123)
-- ============================================================
INSERT IGNORE INTO teachers (emp_id, teacher_name, dept_id, designation, phone, email, password_hash)
VALUES
  ('TCH2021001', 'Prof. A. A. Thakur',      1, 'Professor',           '9876543201', 'aat@aot.edu.in',
   '$2a$12$tkR58rWdR8tYtwFLQe.Qp.Gn6GFNRccrgHu3tgy5eTKL76ctZgp92'),
  ('TCH2021002', 'Prof. J. Chakraborty',    1, 'Associate Professor', '9876543202', 'jc@aot.edu.in',
   '$2a$12$tkR58rWdR8tYtwFLQe.Qp.Gn6GFNRccrgHu3tgy5eTKL76ctZgp92'),
  ('TCH2021003', 'Prof. D. K. Mandal',      1, 'Assistant Professor', '9876543203', 'dkm@aot.edu.in',
   '$2a$12$tkR58rWdR8tYtwFLQe.Qp.Gn6GFNRccrgHu3tgy5eTKL76ctZgp92'),
  ('TCH2021004', 'Prof. A. R. Das',         1, 'Assistant Professor', '9876543204', 'ard@aot.edu.in',
   '$2a$12$tkR58rWdR8tYtwFLQe.Qp.Gn6GFNRccrgHu3tgy5eTKL76ctZgp92'),
  ('TCH2021005', 'Prof. R. Pal',            1, 'HOD',                 '9876543205', 'rp@aot.edu.in',
   '$2a$12$tkR58rWdR8tYtwFLQe.Qp.Gn6GFNRccrgHu3tgy5eTKL76ctZgp92'),
  ('TCH2021006', 'Prof. Dr. Nabanita Das',  1, 'Professor',           '9876543206', 'nd@aot.edu.in',
   '$2a$12$tkR58rWdR8tYtwFLQe.Qp.Gn6GFNRccrgHu3tgy5eTKL76ctZgp92');

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
-- ============================================================
INSERT IGNORE INTO teacher_subject_mapping (teacher_id, subject_id, dept_id, semester, section, academic_year)
VALUES
  (1, 1, 1, 4, 'A', '2025-26'),   -- AAT  → Discrete Math
  (2, 2, 1, 4, 'A', '2025-26'),   -- JC   → Comp Arch
  (3, 3, 1, 4, 'A', '2025-26'),   -- DKM  → FLAT
  (4, 4, 1, 4, 'A', '2025-26'),   -- ARD  → DAA
  (5, 5, 1, 4, 'A', '2025-26');   -- RP   → Biology
