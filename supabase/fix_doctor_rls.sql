-- Fix RLS permissions for doctors table
-- Execute this in Supabase SQL Editor

-- Enable RLS on doctors table
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;

-- Drop existing policies that might be too restrictive
DROP POLICY IF EXISTS "Doctors can view own profile" ON doctors;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON doctors;

-- Create a policy that allows patients to view doctors they have relationships with
CREATE POLICY "Patients can view their doctors" ON doctors
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM patient_doctor_relationships pdr
    WHERE pdr.doctor_id = doctors.id
    AND pdr.patient_id IN (
      SELECT id FROM patients WHERE user_id = auth.uid()
    )
    AND pdr.status = 'active'
  )
);

-- Allow doctors to view their own profile
CREATE POLICY "Doctors can view own profile" ON doctors
FOR SELECT USING (auth.uid() = user_id);

-- Allow doctors to update their own profile
CREATE POLICY "Doctors can update own profile" ON doctors
FOR UPDATE USING (auth.uid() = user_id);

-- Check the policies
SELECT 'RLS Policies for doctors table:' as info;
SELECT schemaname, tablename, policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'doctors';