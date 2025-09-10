-- FIND THE CORRECT PATIENT: Execute this to see all patients in database
-- Copy and paste this entire script into Supabase SQL Editor

-- List all patients in the database
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
    created_at
FROM patients
ORDER BY created_at DESC;

-- Count total patients
SELECT
    COUNT(*) as total_patients,
    COUNT(CASE WHEN social_security_number IS NOT NULL THEN 1 END) as with_ssn,
    COUNT(CASE WHEN address IS NOT NULL THEN 1 END) as with_address
FROM patients;

-- Look for patients with yopmail addresses
SELECT
    id,
    first_name,
    last_name,
    email,
    social_security_number,
    address,
    city,
    postal_code
FROM patients
WHERE email LIKE '%yopmail%'
ORDER BY created_at DESC;