-- ============================================================
-- Campus Pocket – Database Schema
-- ============================================================
-- Run this FIRST before functions.sql, rls_policies.sql, seed.sql.
-- ============================================================

-- Enable pgcrypto for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ----------------------------------------------------------
-- CORE TABLES
-- ----------------------------------------------------------

-- "user" – App profile for every person (student or parent).
-- Links to Supabase Auth via auth_user_id.
CREATE TABLE public."user" (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id    UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    role            TEXT NOT NULL CHECK (role IN ('student', 'parent')),
    school_id       UUID NOT NULL,
    full_name       TEXT NOT NULL,
    username        TEXT NOT NULL UNIQUE,
    avatar_url      TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_auth_user_id ON public."user" (auth_user_id);

-- parent_student_link – Connects a parent to their child(ren).
CREATE TABLE public.parent_student_link (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_user_id  UUID NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
    student_user_id UUID NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
    linked_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (parent_user_id, student_user_id)
);

-- classroom – A class like "Grade 10 – Section A".
CREATE TABLE public.classroom (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id       UUID NOT NULL,
    name            TEXT NOT NULL,
    subject         TEXT,
    teacher_name    TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- classroom_membership – Which students belong to which classrooms.
CREATE TABLE public.classroom_membership (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    classroom_id    UUID NOT NULL REFERENCES public.classroom(id) ON DELETE CASCADE,
    student_user_id UUID NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
    joined_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (classroom_id, student_user_id)
);

-- class_session – One class period on a particular date.
CREATE TABLE public.class_session (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    classroom_id    UUID NOT NULL REFERENCES public.classroom(id) ON DELETE CASCADE,
    session_date    DATE NOT NULL,
    topic           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- attendance – One row per student per session.
-- status: 'present', 'absent', or 'late'.
-- Attendance% = (PRESENT + LATE) / Total Sessions * 100
CREATE TABLE public.attendance (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_session_id UUID NOT NULL REFERENCES public.class_session(id) ON DELETE CASCADE,
    student_user_id  UUID NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
    status           TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late')),
    recorded_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (class_session_id, student_user_id)
);

-- assignment – An assignment in a classroom.
CREATE TABLE public.assignment (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    classroom_id    UUID NOT NULL REFERENCES public.classroom(id) ON DELETE CASCADE,
    title           TEXT NOT NULL,
    description     TEXT,
    due_date        DATE,
    max_marks       NUMERIC NOT NULL DEFAULT 100,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- assignment_submission – A student's grade for an assignment.
-- "percentage" is used to compute average grade.
CREATE TABLE public.assignment_submission (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id   UUID NOT NULL REFERENCES public.assignment(id) ON DELETE CASCADE,
    student_user_id UUID NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
    marks_obtained  NUMERIC,
    percentage      NUMERIC,
    submitted_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (assignment_id, student_user_id)
);

-- fees – Fee records for students.
CREATE TABLE public.fees (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_user_id UUID NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
    title           TEXT NOT NULL,
    amount          NUMERIC NOT NULL,
    paid            BOOLEAN NOT NULL DEFAULT false,
    due_date        DATE,
    paid_at         TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------
-- EXTRA FEATURE TABLES
-- ----------------------------------------------------------

-- campus_event – School-wide calendar events.
CREATE TABLE public.campus_event (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id       UUID NOT NULL,
    title           TEXT NOT NULL,
    description     TEXT,
    event_date      DATE NOT NULL,
    event_type      TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- digital_circular – Notices published by the school.
CREATE TABLE public.digital_circular (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id       UUID NOT NULL,
    title           TEXT NOT NULL,
    body            TEXT,
    published_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- extracurricular_activity – Activities at a school (chess, football, etc.).
CREATE TABLE public.extracurricular_activity (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id       UUID NOT NULL,
    name            TEXT NOT NULL,
    description     TEXT,
    day_of_week     TEXT,
    time_slot       TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- student_activity – Links a student to an activity they joined.
CREATE TABLE public.student_activity (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_user_id UUID NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
    activity_id     UUID NOT NULL REFERENCES public.extracurricular_activity(id) ON DELETE CASCADE,
    joined_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (student_user_id, activity_id)
);
