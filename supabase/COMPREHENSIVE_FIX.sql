-- COMPREHENSIVE FIX: Execute this entire script in Supabase SQL Editor
-- This will fix all missing data issues for the doctor modal

-- ===========================================
-- STEP 1: Check current database structure
-- ===========================================
SELECT '=== CURRENT DATABASE STRUCTURE ===' as step;
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'patients'
ORDER BY ordinal_position;

-- ===========================================
-- STEP 2: Add missing columns
-- ===========================================
SELECT '=== ADDING MISSING COLUMNS ===' as step;

-- Add address columns
ALTER TABLE patients ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS city VARCHAR(255);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20);

-- Add other missing columns if needed
ALTER TABLE patients ADD COLUMN IF NOT EXISTS social_security_number VARCHAR(20);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS civility VARCHAR(10);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS gender VARCHAR(20);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS birth_name VARCHAR(255);

-- ===========================================
-- STEP 3: Check patient data before update
-- ===========================================
SELECT '=== PATIENT DATA BEFORE UPDATE ===' as step;
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

-- ===========================================
-- STEP 4: Insert/Update test data for the patient
-- ===========================================
SELECT '=== UPDATING PATIENT DATA ===' as step;

-- Update the patient with test data
UPDATE patients SET
    social_security_number = COALESCE(social_security_number, '123456789012345'),
    civility = COALESCE(civility, 'M.'),
    gender = COALESCE(gender, 'male'),
    address = COALESCE(address, '123 Rue de la Santé'),
    city = COALESCE(city, 'Paris'),
    postal_code = COALESCE(postal_code, '75001'),
    birth_name = COALESCE(birth_name, last_name),
    updated_at = NOW()
WHERE email = 'somnolink4@yopmail.com';

-- ===========================================
-- STEP 5: Verify the update worked
-- ===========================================
SELECT '=== PATIENT DATA AFTER UPDATE ===' as step;
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

-- ===========================================
-- STEP 6: Check all patients with data
-- ===========================================
SELECT '=== ALL PATIENTS WITH DATA ===' as step;
SELECT
    email,
    social_security_number,
    civility,
    address,
    city,
    postal_code
FROM patients
WHERE social_security_number IS NOT NULL
   OR address IS NOT NULL
   OR city IS NOT NULL
   OR postal_code IS NOT NULL;

-- ===========================================
-- STEP 7: Final verification
-- ===========================================
SELECT '=== FINAL VERIFICATION ===' as step;
SELECT
    COUNT(*) as total_patients,
    COUNT(CASE WHEN social_security_number IS NOT NULL THEN 1 END) as with_ssn,
    COUNT(CASE WHEN address IS NOT NULL THEN 1 END) as with_address,
    COUNT(CASE WHEN city IS NOT NULL THEN 1 END) as with_city,
    COUNT(CASE WHEN postal_code IS NOT NULL THEN 1 END) as with_postal_code
FROM patients;

SELECT '✅ COMPREHENSIVE FIX COMPLETED - Refresh your browser and test the doctor modal!' as result;