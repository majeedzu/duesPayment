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

-- Insert Departments (All HTU Faculties)
INSERT INTO public.departments (id, name, faculty, dues_amount) VALUES
-- Faculty of Applied Sciences and Technology
('dept-cs-111', 'Department of Computer Science', 'Faculty of Applied Sciences and Technology', 150.00),
('dept-agro-222', 'Department of Agro Enterprise Development', 'Faculty of Applied Sciences and Technology', 150.00),
('dept-fst-333', 'Department of Food Science and Technology', 'Faculty of Applied Sciences and Technology', 150.00),
('dept-htm-444', 'Department of Hospitality and Tourism Management', 'Faculty of Applied Sciences and Technology', 150.00),
('dept-ms-555', 'Department of Mathematics and Statistics', 'Faculty of Applied Sciences and Technology', 150.00),
-- Faculty of Engineering
('dept-eee-601', 'Electrical & Electronic Engineering', 'Faculty of Engineering', 150.00),
('dept-auto-602', 'Automobile Engineering', 'Faculty of Engineering', 150.00),
('dept-civil-603', 'Civil Engineering', 'Faculty of Engineering', 150.00),
('dept-aee-604', 'Agricultural & Environmental Engineering', 'Faculty of Engineering', 150.00),
('dept-ageng-605', 'Agricultural Engineering', 'Faculty of Engineering', 150.00),
('dept-dme-606', 'Design & Manufacturing Engineering', 'Faculty of Engineering', 150.00),
('dept-btech-607', 'Building Technology', 'Faculty of Engineering', 150.00),
('dept-arch-608', 'Architectural Technology', 'Faculty of Engineering', 150.00),
('dept-fm-609', 'Facilities Management', 'Faculty of Engineering', 150.00),
-- Faculty of Art and Design
('dept-fdt-701', 'Fashion Design and Textiles', 'Faculty of Art and Design', 150.00),
('dept-ias-702', 'Industrial Art with Sculpture', 'Faculty of Art and Design', 150.00),
('dept-paint-703', 'Painting', 'Faculty of Art and Design', 150.00),
('dept-gd-704', 'Graphic Design', 'Faculty of Art and Design', 150.00),
('dept-cer-705', 'Ceramics', 'Faculty of Art and Design', 150.00),
('dept-tex-706', 'Textiles', 'Faculty of Art and Design', 150.00),
-- Faculty of Business and Management Studies
('dept-acct-801', 'Accounting & Taxation', 'Faculty of Business and Management Studies', 150.00),
('dept-mkt-802', 'Marketing & IT', 'Faculty of Business and Management Studies', 150.00),
('dept-psm-803', 'Procurement & Supply Chain Management', 'Faculty of Business and Management Studies', 150.00),
('dept-sms-804', 'Secretaryship & Management Studies', 'Faculty of Business and Management Studies', 150.00),
-- Faculty of Applied Social Sciences
('dept-comm-901', 'Communication Studies', 'Faculty of Applied Social Sciences', 150.00),
('dept-eng-902', 'English', 'Faculty of Applied Social Sciences', 150.00),
('dept-fr-903', 'French', 'Faculty of Applied Social Sciences', 150.00)
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
--------------------------------------------------------------------------------

-- Enable Row Level Security (RLS) for all tables
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 3.1. Policies for public.departments
CREATE POLICY "Allow public read access to departments" ON public.departments 
    FOR SELECT USING (true);

CREATE POLICY "Allow write access to departments for admins" ON public.departments 
    FOR ALL TO authenticated USING (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('dept_admin', 'super_admin')
    );

-- 3.2. Policies for public.profiles
CREATE POLICY "Allow users to view their own profile and admins to view all" ON public.profiles 
    FOR SELECT TO authenticated USING (
        auth.uid() = id OR 
        (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('dept_admin', 'super_admin')
    );

CREATE POLICY "Allow users to update their own profile and admins to update all" ON public.profiles 
    FOR UPDATE TO authenticated USING (
        auth.uid() = id OR 
        (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('dept_admin', 'super_admin')
    );

-- Note: Profile INSERT is handled by the server using the service_role key client (supabaseAdmin) 
-- during registration/admin creation, which bypasses RLS automatically.

-- 3.3. Policies for public.students
CREATE POLICY "Allow select access to student directory" ON public.students 
    FOR SELECT USING (true);

CREATE POLICY "Allow write access to students for admins" ON public.students 
    FOR ALL TO authenticated USING (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('dept_admin', 'super_admin')
    );

-- 3.4. Policies for public.payments
CREATE POLICY "Allow users to view their own payments and admins to view all" ON public.payments 
    FOR SELECT TO authenticated USING (
        (SELECT email FROM public.profiles WHERE id = auth.uid()) = (SELECT email FROM public.students WHERE index_number = student_index_number) OR 
        (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('dept_admin', 'super_admin')
    );

-- Note: Payment inserts (initialization) and status updates (verification webhook/callback) 
-- are executed on the backend via the service_role key client (supabaseAdmin) which bypasses RLS.

-- 3.5. Policies for public.notifications
CREATE POLICY "Allow users to view their own notifications and admins to view all" ON public.notifications 
    FOR SELECT TO authenticated USING (
        auth.uid() = user_id OR 
        (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('dept_admin', 'super_admin')
    );

CREATE POLICY "Allow users to update their own notifications (e.g. mark read)" ON public.notifications 
    FOR UPDATE TO authenticated USING (
        auth.uid() = user_id
    );

-- Note: Notification creation (insert) is performed by system triggers or the backend server using the service_role client.

-- 3.6. Policies for public.audit_logs
CREATE POLICY "Allow admins to view audit logs" ON public.audit_logs 
    FOR SELECT TO authenticated USING (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('dept_admin', 'super_admin')
    );

-- Note: Audit log inserts are performed by the backend server using the service_role client.
