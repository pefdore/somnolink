-- Script to add missing address columns to patients table
-- Execute this in Supabase SQL Editor

-- Check if columns exist first
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'patients'
AND column_name IN ('address', 'city', 'postal_code');

-- Add missing columns (these will be ignored if columns already exist)
ALTER TABLE patients ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS city VARCHAR(255);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20);

-- Add comments
COMMENT ON COLUMN patients.address IS 'Patient street address';
COMMENT ON COLUMN patients.city IS 'Patient city';
COMMENT ON COLUMN patients.postal_code IS 'Patient postal code';

-- Verify the columns were added
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'patients'
AND column_name IN ('address', 'city', 'postal_code', 'email', 'social_security_number', 'civility');

-- Check sample data
SELECT
    id,
    email,
    social_security_number,
    civility,
    address,
    city,
    postal_code
FROM patients
WHERE email = 'somnolink4@yopmail.com';