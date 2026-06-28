-- HTU Dues Payment System - Supabase Database Schema Setup
-- Run this script in the Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

--------------------------------------------------------------------------------
-- 1. Create Tables
--------------------------------------------------------------------------------

-- Departments Table
CREATE TABLE IF NOT EXISTS public.departments (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    faculty TEXT NOT NULL,
    dues_amount NUMERIC NOT NULL DEFAULT 0.00
);

-- Profiles Table (maps to Supabase Auth users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL CHECK (role IN ('student', 'dept_admin', 'super_admin')),
    full_name TEXT NOT NULL,
    department_id TEXT REFERENCES public.departments(id) ON DELETE SET NULL,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Students Table (CSV Preloaded Records)
CREATE TABLE IF NOT EXISTS public.students (
    index_number TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    programme TEXT,
    level TEXT,
    faculty TEXT,
    department_id TEXT REFERENCES public.departments(id) ON DELETE SET NULL
);

-- Payments Table
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_index_number TEXT REFERENCES public.students(index_number) ON DELETE SET NULL,
    amount NUMERIC NOT NULL,
    paystack_reference TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL CHECK (status IN ('pending', 'success', 'failed')) DEFAULT 'pending',
    receipt_id TEXT UNIQUE,
    payment_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT CHECK (role IN ('student', 'dept_admin', 'super_admin')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    details TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

--------------------------------------------------------------------------------
-- 2. Insert Mock Seed Data (Initial Configuration)
--------------------------------------------------------------------------------

-- Insert Departments
INSERT INTO public.departments (id, name, faculty, dues_amount) VALUES
('dept-cs-111', 'Computer Science', 'Faculty of Applied Sciences and Technology', 150.00),
('dept-it-222', 'Information Technology', 'Faculty of Applied Sciences and Technology', 180.00),
('dept-ee-333', 'Electrical Engineering', 'Faculty of Engineering', 220.00),
('dept-htm-444', 'Hospitality and Tourism Management', 'Faculty of Applied Sciences and Technology', 200.00)
ON CONFLICT (id) DO UPDATE 
SET name = EXCLUDED.name, faculty = EXCLUDED.faculty, dues_amount = EXCLUDED.dues_amount;

-- Insert Mock Student Records (Required for students to register passwords)
INSERT INTO public.students (index_number, email, full_name, programme, level, faculty, department_id) VALUES
('0322080456', '0322080456@htu.edu.gh', 'John Doe', 'BTech Computer Science', '400', 'Faculty of Applied Sciences and Technology', 'dept-cs-111'),
('0322080999', '0322080999@htu.edu.gh', 'Jane Smith', 'BTech Computer Science', '300', 'Faculty of Applied Sciences and Technology', 'dept-cs-111'),
('0325080329', '0325080329@htu.edu.gh', 'Eugene Dushie', 'BTech Computer Science', '100', 'Faculty of Applied Sciences and Technology', 'dept-cs-111')
ON CONFLICT (index_number) DO UPDATE 
SET email = EXCLUDED.email, full_name = EXCLUDED.full_name, programme = EXCLUDED.programme, level = EXCLUDED.level, faculty = EXCLUDED.faculty, department_id = EXCLUDED.department_id;

--------------------------------------------------------------------------------
-- 3. Row Level Security (RLS) Configuration
-- For quick setup, you can keep RLS disabled. If you enable RLS, run the policies below.
--------------------------------------------------------------------------------

-- By default, we recommend keeping RLS disabled on these tables initially during testing,
-- or run the following to enable global read/write access for authenticated app queries:

ALTER TABLE public.departments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.students DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs DISABLE ROW LEVEL SECURITY;
