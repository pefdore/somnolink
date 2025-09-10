-- URGENT: Execute this script in Supabase SQL Editor to fix missing columns
-- This will add the missing address columns that are preventing data from displaying

-- Step 1: Check current columns
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'patients'
AND column_name IN ('address', 'city', 'postal_code', 'social_security_number', 'civility', 'email');

-- Step 2: Add missing columns
ALTER TABLE patients ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS city VARCHAR(255);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20);

-- Step 3: Add comments
COMMENT ON COLUMN patients.address IS 'Patient street address';
COMMENT ON COLUMN patients.city IS 'Patient city';
COMMENT ON COLUMN patients.postal_code IS 'Patient postal code';

-- Step 4: Verify the patient data exists
SELECT
    id,
    first_name,
    last_name,
    email,
    social_security_number,
    civility,
    address,
    city,
    postal_code,
    created_at,
    updated_at
FROM patients
WHERE email = 'somnolink4@yopmail.com';

-- Step 5: Check if there are any patients with address data
SELECT
    COUNT(*) as total_patients,
    COUNT(CASE WHEN address IS NOT NULL THEN 1 END) as patients_with_address,
    COUNT(CASE WHEN social_security_number IS NOT NULL THEN 1 END) as patients_with_ssn
FROM patients;