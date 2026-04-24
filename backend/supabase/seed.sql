-- ============================================================
-- Campus Pocket – Seed Data
-- ============================================================
-- Run AFTER schema.sql, functions.sql, and rls_policies.sql.
--
-- This uses fixed UUIDs so that foreign keys line up.
-- In production, IDs are auto-generated.
-- ============================================================


-- ----------------------------------------------------------
-- Shared school ID (everyone is in the same school for demo)
-- ----------------------------------------------------------
-- school_id = '00000000-0000-0000-0000-000000000001'


-- ----------------------------------------------------------
-- ⚠️  IMPORTANT: Run createAuthUsers.js BEFORE this file!
-- ----------------------------------------------------------
-- Auth users must exist in auth.users before we can insert
-- into public."user" (because of the foreign key).
--
-- Run this command first:
--   node scripts/createAuthUsers.js
--
-- That script creates 6 auth users via the Supabase Admin API.
-- Only AFTER that succeeds should you run this seed.sql.
-- ----------------------------------------------------------


-- ----------------------------------------------------------
-- 1. APP USERS  (4 students + 2 parents = 6 users)
-- ----------------------------------------------------------
-- Now we can insert into public."user" because auth.users rows exist.

INSERT INTO public."user" (id, auth_user_id, role, school_id, full_name, username) VALUES
-- Students
('aaaaaaaa-0001-0000-0000-000000000001',  -- student 1 app id
 '11111111-0001-0000-0000-000000000001',  -- auth user id (placeholder)
 'student',
 '00000000-0000-0000-0000-000000000001',
 'Arjun Sharma',
 'arjun_s'),

('aaaaaaaa-0002-0000-0000-000000000002',  -- student 2
 '11111111-0002-0000-0000-000000000002',
 'student',
 '00000000-0000-0000-0000-000000000001',
 'Priya Patel',
 'priya_p'),

('aaaaaaaa-0003-0000-0000-000000000003',  -- student 3
 '11111111-0003-0000-0000-000000000003',
 'student',
 '00000000-0000-0000-0000-000000000001',
 'Rohan Gupta',
 'rohan_g'),

('aaaaaaaa-0004-0000-0000-000000000004',  -- student 4
 '11111111-0004-0000-0000-000000000004',
 'student',
 '00000000-0000-0000-0000-000000000001',
 'Meera Nair',
 'meera_n'),

-- Parents
('bbbbbbbb-0001-0000-0000-000000000001',  -- parent 1
 '22222222-0001-0000-0000-000000000001',
 'parent',
 '00000000-0000-0000-0000-000000000001',
 'Vikram Sharma',
 'vikram_parent'),

('bbbbbbbb-0002-0000-0000-000000000002',  -- parent 2
 '22222222-0002-0000-0000-000000000002',
 'parent',
 '00000000-0000-0000-0000-000000000001',
 'Sunita Patel',
 'sunita_parent');


-- ----------------------------------------------------------
-- 2. PARENT-STUDENT LINKS
-- ----------------------------------------------------------
-- Vikram is Arjun's parent; Sunita is Priya's parent.
INSERT INTO public.parent_student_link (parent_user_id, student_user_id) VALUES
('bbbbbbbb-0001-0000-0000-000000000001', 'aaaaaaaa-0001-0000-0000-000000000001'),
('bbbbbbbb-0002-0000-0000-000000000002', 'aaaaaaaa-0002-0000-0000-000000000002');


-- ----------------------------------------------------------
-- 3. CLASSROOMS  (3 classrooms)
-- ----------------------------------------------------------
INSERT INTO public.classroom (id, school_id, name, subject, teacher_name) VALUES
('cccccccc-0001-0000-0000-000000000001',
 '00000000-0000-0000-0000-000000000001',
 'Grade 10 – Section A', 'Mathematics', 'Mr. Iyer'),

('cccccccc-0002-0000-0000-000000000002',
 '00000000-0000-0000-0000-000000000001',
 'Grade 10 – Section A', 'Science', 'Ms. Desai'),

('cccccccc-0003-0000-0000-000000000003',
 '00000000-0000-0000-0000-000000000001',
 'Grade 10 – Section B', 'English', 'Mrs. Thomas');


-- ----------------------------------------------------------
-- 4. CLASSROOM MEMBERSHIPS
-- ----------------------------------------------------------
-- Arjun & Priya are in Math + Science; Rohan & Meera in English + Science.
INSERT INTO public.classroom_membership (classroom_id, student_user_id) VALUES
-- Math (classroom 1)
('cccccccc-0001-0000-0000-000000000001', 'aaaaaaaa-0001-0000-0000-000000000001'),
('cccccccc-0001-0000-0000-000000000001', 'aaaaaaaa-0002-0000-0000-000000000002'),
-- Science (classroom 2)
('cccccccc-0002-0000-0000-000000000002', 'aaaaaaaa-0001-0000-0000-000000000001'),
('cccccccc-0002-0000-0000-000000000002', 'aaaaaaaa-0002-0000-0000-000000000002'),
('cccccccc-0002-0000-0000-000000000002', 'aaaaaaaa-0003-0000-0000-000000000003'),
('cccccccc-0002-0000-0000-000000000002', 'aaaaaaaa-0004-0000-0000-000000000004'),
-- English (classroom 3)
('cccccccc-0003-0000-0000-000000000003', 'aaaaaaaa-0003-0000-0000-000000000003'),
('cccccccc-0003-0000-0000-000000000003', 'aaaaaaaa-0004-0000-0000-000000000004');


-- ----------------------------------------------------------
-- 5. CLASS SESSIONS  (2 per classroom = 6 sessions)
-- ----------------------------------------------------------
INSERT INTO public.class_session (id, classroom_id, session_date, topic) VALUES
-- Math sessions
('dddddddd-0001-0000-0000-000000000001', 'cccccccc-0001-0000-0000-000000000001', '2025-04-14', 'Quadratic Equations'),
('dddddddd-0002-0000-0000-000000000002', 'cccccccc-0001-0000-0000-000000000001', '2025-04-16', 'Polynomials'),
-- Science sessions
('dddddddd-0003-0000-0000-000000000003', 'cccccccc-0002-0000-0000-000000000002', '2025-04-14', 'Newton Laws'),
('dddddddd-0004-0000-0000-000000000004', 'cccccccc-0002-0000-0000-000000000002', '2025-04-16', 'Friction'),
-- English sessions
('dddddddd-0005-0000-0000-000000000005', 'cccccccc-0003-0000-0000-000000000003', '2025-04-15', 'Shakespeare Intro'),
('dddddddd-0006-0000-0000-000000000006', 'cccccccc-0003-0000-0000-000000000003', '2025-04-17', 'Essay Writing');


-- ----------------------------------------------------------
-- 6. ATTENDANCE
-- ----------------------------------------------------------
INSERT INTO public.attendance (class_session_id, student_user_id, status) VALUES
-- Math session 1
('dddddddd-0001-0000-0000-000000000001', 'aaaaaaaa-0001-0000-0000-000000000001', 'present'),
('dddddddd-0001-0000-0000-000000000001', 'aaaaaaaa-0002-0000-0000-000000000002', 'late'),
-- Math session 2
('dddddddd-0002-0000-0000-000000000002', 'aaaaaaaa-0001-0000-0000-000000000001', 'present'),
('dddddddd-0002-0000-0000-000000000002', 'aaaaaaaa-0002-0000-0000-000000000002', 'absent'),
-- Science session 1
('dddddddd-0003-0000-0000-000000000003', 'aaaaaaaa-0001-0000-0000-000000000001', 'present'),
('dddddddd-0003-0000-0000-000000000003', 'aaaaaaaa-0002-0000-0000-000000000002', 'present'),
('dddddddd-0003-0000-0000-000000000003', 'aaaaaaaa-0003-0000-0000-000000000003', 'late'),
('dddddddd-0003-0000-0000-000000000003', 'aaaaaaaa-0004-0000-0000-000000000004', 'present'),
-- Science session 2
('dddddddd-0004-0000-0000-000000000004', 'aaaaaaaa-0001-0000-0000-000000000001', 'absent'),
('dddddddd-0004-0000-0000-000000000004', 'aaaaaaaa-0002-0000-0000-000000000002', 'present'),
('dddddddd-0004-0000-0000-000000000004', 'aaaaaaaa-0003-0000-0000-000000000003', 'present'),
('dddddddd-0004-0000-0000-000000000004', 'aaaaaaaa-0004-0000-0000-000000000004', 'absent'),
-- English session 1
('dddddddd-0005-0000-0000-000000000005', 'aaaaaaaa-0003-0000-0000-000000000003', 'present'),
('dddddddd-0005-0000-0000-000000000005', 'aaaaaaaa-0004-0000-0000-000000000004', 'present'),
-- English session 2
('dddddddd-0006-0000-0000-000000000006', 'aaaaaaaa-0003-0000-0000-000000000003', 'late'),
('dddddddd-0006-0000-0000-000000000006', 'aaaaaaaa-0004-0000-0000-000000000004', 'present');


-- ----------------------------------------------------------
-- 7. ASSIGNMENTS  (2 per classroom = 6 assignments)
-- ----------------------------------------------------------
INSERT INTO public.assignment (id, classroom_id, title, description, due_date, max_marks) VALUES
-- Math
('eeeeeeee-0001-0000-0000-000000000001', 'cccccccc-0001-0000-0000-000000000001',
 'Quadratics Homework', 'Solve problems 1-10', '2025-04-20', 50),
('eeeeeeee-0002-0000-0000-000000000002', 'cccccccc-0001-0000-0000-000000000001',
 'Polynomials Quiz', 'Chapter 3 quiz', '2025-04-22', 30),
-- Science
('eeeeeeee-0003-0000-0000-000000000003', 'cccccccc-0002-0000-0000-000000000002',
 'Newton Laws Lab Report', 'Write up the lab', '2025-04-21', 100),
('eeeeeeee-0004-0000-0000-000000000004', 'cccccccc-0002-0000-0000-000000000002',
 'Friction Worksheet', 'Worksheet pages 45-48', '2025-04-23', 40),
-- English
('eeeeeeee-0005-0000-0000-000000000005', 'cccccccc-0003-0000-0000-000000000003',
 'Shakespeare Essay', 'Analyse Act 1 of Macbeth', '2025-04-25', 100),
('eeeeeeee-0006-0000-0000-000000000006', 'cccccccc-0003-0000-0000-000000000003',
 'Grammar Test', 'Tenses and voice', '2025-04-27', 50);


-- ----------------------------------------------------------
-- 8. ASSIGNMENT SUBMISSIONS
-- ----------------------------------------------------------
INSERT INTO public.assignment_submission (assignment_id, student_user_id, marks_obtained, percentage) VALUES
-- Math – Quadratics (max 50)
('eeeeeeee-0001-0000-0000-000000000001', 'aaaaaaaa-0001-0000-0000-000000000001', 42, 84.00),
('eeeeeeee-0001-0000-0000-000000000001', 'aaaaaaaa-0002-0000-0000-000000000002', 38, 76.00),
-- Math – Polynomials (max 30)
('eeeeeeee-0002-0000-0000-000000000002', 'aaaaaaaa-0001-0000-0000-000000000001', 27, 90.00),
('eeeeeeee-0002-0000-0000-000000000002', 'aaaaaaaa-0002-0000-0000-000000000002', 21, 70.00),
-- Science – Newton (max 100)
('eeeeeeee-0003-0000-0000-000000000003', 'aaaaaaaa-0001-0000-0000-000000000001', 78, 78.00),
('eeeeeeee-0003-0000-0000-000000000003', 'aaaaaaaa-0002-0000-0000-000000000002', 85, 85.00),
('eeeeeeee-0003-0000-0000-000000000003', 'aaaaaaaa-0003-0000-0000-000000000003', 65, 65.00),
('eeeeeeee-0003-0000-0000-000000000003', 'aaaaaaaa-0004-0000-0000-000000000004', 92, 92.00),
-- Science – Friction (max 40)
('eeeeeeee-0004-0000-0000-000000000004', 'aaaaaaaa-0003-0000-0000-000000000003', 30, 75.00),
('eeeeeeee-0004-0000-0000-000000000004', 'aaaaaaaa-0004-0000-0000-000000000004', 36, 90.00),
-- English – Shakespeare (max 100)
('eeeeeeee-0005-0000-0000-000000000005', 'aaaaaaaa-0003-0000-0000-000000000003', 70, 70.00),
('eeeeeeee-0005-0000-0000-000000000005', 'aaaaaaaa-0004-0000-0000-000000000004', 88, 88.00),
-- English – Grammar (max 50)
('eeeeeeee-0006-0000-0000-000000000006', 'aaaaaaaa-0003-0000-0000-000000000003', 40, 80.00),
('eeeeeeee-0006-0000-0000-000000000006', 'aaaaaaaa-0004-0000-0000-000000000004', 45, 90.00);


-- ----------------------------------------------------------
-- 9. FEES
-- ----------------------------------------------------------
INSERT INTO public.fees (student_user_id, title, amount, paid, due_date, paid_at) VALUES
-- Arjun
('aaaaaaaa-0001-0000-0000-000000000001', 'Tuition Fee – March 2025', 5000, true,  '2025-03-10', '2025-03-08'),
('aaaaaaaa-0001-0000-0000-000000000001', 'Tuition Fee – April 2025', 5000, false, '2025-04-10', NULL),
-- Priya
('aaaaaaaa-0002-0000-0000-000000000002', 'Tuition Fee – March 2025', 5000, true,  '2025-03-10', '2025-03-09'),
('aaaaaaaa-0002-0000-0000-000000000002', 'Lab Fee – April 2025',     1500, false, '2025-04-15', NULL),
-- Rohan
('aaaaaaaa-0003-0000-0000-000000000003', 'Tuition Fee – March 2025', 5000, true,  '2025-03-10', '2025-03-07'),
('aaaaaaaa-0003-0000-0000-000000000003', 'Tuition Fee – April 2025', 5000, false, '2025-04-10', NULL),
-- Meera
('aaaaaaaa-0004-0000-0000-000000000004', 'Tuition Fee – March 2025', 5000, true,  '2025-03-10', '2025-03-10'),
('aaaaaaaa-0004-0000-0000-000000000004', 'Tuition Fee – April 2025', 5000, true,  '2025-04-10', '2025-04-08');


-- ----------------------------------------------------------
-- 10. CAMPUS EVENTS
-- ----------------------------------------------------------
INSERT INTO public.campus_event (school_id, title, description, event_date, event_type) VALUES
('00000000-0000-0000-0000-000000000001', 'Annual Sports Day',       'Track & field events for all grades.',    '2025-05-01', 'sports'),
('00000000-0000-0000-0000-000000000001', 'Mid-Term Examinations',   'Mid-term exams begin.',                   '2025-05-10', 'exam'),
('00000000-0000-0000-0000-000000000001', 'Summer Break Starts',     'School closes for summer holidays.',      '2025-05-25', 'holiday'),
('00000000-0000-0000-0000-000000000001', 'Science Fair',            'Inter-class science project exhibition.', '2025-05-05', 'event');


-- ----------------------------------------------------------
-- 11. DIGITAL CIRCULARS
-- ----------------------------------------------------------
INSERT INTO public.digital_circular (school_id, title, body) VALUES
('00000000-0000-0000-0000-000000000001',
 'Uniform Policy Update',
 'Starting May 1, students must wear the new summer uniform. Details on the school website.'),
('00000000-0000-0000-0000-000000000001',
 'Parent-Teacher Meeting – April 28',
 'All parents are requested to attend the PTM on April 28 at 10 AM in the auditorium.'),
('00000000-0000-0000-0000-000000000001',
 'Library Week',
 'Library week runs April 21-25. Special read-a-thon event for Grades 8-10.');


-- ----------------------------------------------------------
-- 12. EXTRACURRICULAR ACTIVITIES
-- ----------------------------------------------------------
INSERT INTO public.extracurricular_activity (id, school_id, name, description, day_of_week, time_slot) VALUES
('ffffffff-0001-0000-0000-000000000001',
 '00000000-0000-0000-0000-000000000001',
 'Chess Club',      'Learn and compete in chess.',        'Monday',    '3:00 PM – 4:00 PM'),
('ffffffff-0002-0000-0000-000000000002',
 '00000000-0000-0000-0000-000000000001',
 'Football Team',   'Practice and inter-school matches.', 'Wednesday', '4:00 PM – 5:30 PM'),
('ffffffff-0003-0000-0000-000000000003',
 '00000000-0000-0000-0000-000000000001',
 'Art Workshop',    'Painting, sketching, and crafts.',   'Friday',    '3:00 PM – 4:30 PM');


-- ----------------------------------------------------------
-- 13. STUDENT ACTIVITIES
-- ----------------------------------------------------------
INSERT INTO public.student_activity (student_user_id, activity_id) VALUES
('aaaaaaaa-0001-0000-0000-000000000001', 'ffffffff-0001-0000-0000-000000000001'),  -- Arjun → Chess
('aaaaaaaa-0001-0000-0000-000000000001', 'ffffffff-0002-0000-0000-000000000002'),  -- Arjun → Football
('aaaaaaaa-0002-0000-0000-000000000002', 'ffffffff-0003-0000-0000-000000000003'),  -- Priya → Art
('aaaaaaaa-0003-0000-0000-000000000003', 'ffffffff-0002-0000-0000-000000000002'),  -- Rohan → Football
('aaaaaaaa-0004-0000-0000-000000000004', 'ffffffff-0001-0000-0000-000000000001'),  -- Meera → Chess
('aaaaaaaa-0004-0000-0000-000000000004', 'ffffffff-0003-0000-0000-000000000003');  -- Meera → Art


-- ============================================================
-- End of seed.sql
-- ============================================================
