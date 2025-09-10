-- QUICK CHECK: Execute this first to see current database state
-- Copy and paste this entire script into Supabase SQL Editor

-- Check if the patient exists and what data they have
SELECT
    id,
    first_name,
    last_name,
    email,
    social_security_number,
    civility,
    gender,
    address,
    city,
    postal_code,
    birth_name,
    created_at,
    updated_at
FROM patients
WHERE email = 'somnolink4@yopmail.com';

-- Check what columns exist in the patients table
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'patients'
AND column_name IN ('address', 'city', 'postal_code', 'social_security_number', 'civility', 'email', 'gender')
ORDER BY column_name;

-- Count patients with data in these fields
SELECT
    COUNT(*) as total_patients,
    COUNT(CASE WHEN social_security_number IS NOT NULL THEN 1 END) as with_ssn,
    COUNT(CASE WHEN address IS NOT NULL THEN 1 END) as with_address,
    COUNT(CASE WHEN email IS NOT NULL THEN 1 END) as with_email
FROM patients;