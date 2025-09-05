-- Fix permissions for doctors table
-- Execute this script in Supabase SQL Editor

-- 1. Check current RLS policies on doctors table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'doctors';

-- 2. Drop existing policies that might be causing issues
DROP POLICY IF EXISTS "Doctors can view own profile" ON doctors;
DROP POLICY IF EXISTS "Doctors can update own profile" ON doctors;
DROP POLICY IF EXISTS "Public can view doctors for invitations" ON doctors;
DROP POLICY IF EXISTS "Patients can view doctors for messaging" ON doctors;

-- 3. Create proper RLS policies for doctors table
CREATE POLICY "Doctors can view own profile" ON doctors
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Doctors can update own profile" ON doctors
FOR UPDATE USING (auth.uid() = user_id);

-- Allow patients to view doctors for messaging (needed for conversation display)
CREATE POLICY "Patients can view doctors for messaging" ON doctors
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM patient_doctor_relationships
    WHERE patient_doctor_relationships.doctor_id = doctors.id
    AND patient_doctor_relationships.patient_id IN (
      SELECT id FROM patients WHERE user_id = auth.uid()
    )
    AND patient_doctor_relationships.status = 'active'
  )
);

-- 4. Ensure RLS is enabled
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;

-- 5. Check if user_id column exists
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'doctors' AND column_name = 'user_id';

-- 6. Success message
SELECT '✅ Permissions doctors corrigées' as status;
SELECT '✅ RLS activé sur doctors' as status;
SELECT '✅ Politiques de sécurité appliquées' as status;