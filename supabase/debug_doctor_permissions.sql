-- Debug script for doctor permissions
-- Execute this in Supabase SQL Editor

-- Check if doctors table exists
SELECT 'doctors table exists' as check_result
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'doctors');

-- Check columns in doctors table
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'doctors';

-- Check current RLS policies
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'doctors';

-- Test a simple query
SELECT COUNT(*) as total_doctors FROM doctors;

-- Check sample data
SELECT id, first_name, last_name FROM doctors;