-- Simple fix for doctor permissions
-- Execute this in Supabase SQL Editor

-- First, let's check what's happening
SELECT 'Checking doctors table...' as status;

-- Check if doctors table has data
SELECT COUNT(*) as doctor_count FROM doctors;

-- Check if there are patient-doctor relationships
SELECT COUNT(*) as relationship_count FROM patient_doctor_relationships;

-- Check current policies
SELECT policyname FROM pg_policies WHERE tablename = 'doctors';

-- The issue might be that patients can't see doctors due to RLS
-- Let's try a different approach - modify the patient messaging interface
-- to not query doctors directly, but get the info from conversations

SELECT 'Diagnosis complete - check the results above' as status;