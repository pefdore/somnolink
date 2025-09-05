-- Simple RLS fix for doctors table
-- Execute this in Supabase SQL Editor

-- Check current state
SELECT 'Current RLS status:' as info;
SELECT schemaname, tablename, rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'doctors';

-- Check existing policies
SELECT 'Current policies:' as info;
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'doctors';

-- Enable RLS if not already enabled
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;

-- Drop overly restrictive policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON doctors;

-- Create a policy that allows patients to view doctors they have active relationships with
CREATE POLICY "allow_patients_view_their_doctors" ON doctors
FOR SELECT USING (
    EXISTS (
        SELECT 1
        FROM patient_doctor_relationships pdr
        JOIN patients p ON pdr.patient_id = p.id
        WHERE pdr.doctor_id = doctors.id
        AND p.user_id = auth.uid()
        AND pdr.status = 'active'
    )
);

-- Allow doctors to view their own profile
CREATE POLICY "allow_doctors_view_own_profile" ON doctors
FOR SELECT USING (auth.uid() = user_id);

-- Allow doctors to update their own profile
CREATE POLICY "allow_doctors_update_own_profile" ON doctors
FOR UPDATE USING (auth.uid() = user_id);

-- Check final state
SELECT 'Final policies:' as info;
SELECT policyname, cmd
FROM pg_policies
WHERE tablename = 'doctors';