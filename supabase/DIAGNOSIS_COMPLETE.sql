-- COMPLETE DIAGNOSIS: Execute this to find the real issue
-- Copy and paste this entire script into Supabase SQL Editor

-- ===========================================
-- STEP 1: Check if user exists in auth.users
-- ===========================================
SELECT '=== CHECKING AUTH.USERS ===' as step;
SELECT
    id,
    email,
    created_at,
    last_sign_in_at,
    email_confirmed_at
FROM auth.users
WHERE email = 'somnolink4@yopmail.com';

-- ===========================================
-- STEP 2: Check if patient exists in patients table
-- ===========================================
SELECT '=== CHECKING PATIENTS TABLE ===' as step;
SELECT
    id,
    user_id,
    first_name,
    last_name,
    email,
    social_security_number,
    civility,
    address,
    city,
    postal_code,
    created_at
FROM patients
WHERE email = 'somnolink4@yopmail.com';

-- ===========================================
-- STEP 3: Check relationship between auth and patients
-- ===========================================
SELECT '=== CHECKING RELATIONSHIP ===' as step;
SELECT
    u.id as auth_user_id,
    u.email as auth_email,
    p.id as patient_id,
    p.user_id as patient_user_id,
    p.email as patient_email,
    p.social_security_number,
    p.address,
    p.city,
    p.postal_code
FROM auth.users u
LEFT JOIN patients p ON u.id = p.user_id
WHERE u.email = 'somnolink4@yopmail.com';

-- ===========================================
-- STEP 4: List all patients (first 10)
-- ===========================================
SELECT '=== ALL PATIENTS (FIRST 10) ===' as step;
SELECT
    id,
    user_id,
    first_name,
    last_name,
    email,
    social_security_number,
    address,
    created_at
FROM patients
ORDER BY created_at DESC
LIMIT 10;

-- ===========================================
-- STEP 5: Check RLS policies
-- ===========================================
SELECT '=== CHECKING RLS POLICIES ===' as step;
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'patients'
ORDER BY policyname;

-- ===========================================
-- STEP 6: If patient doesn't exist, create it
-- ===========================================
SELECT '=== CREATING PATIENT IF MISSING ===' as step;

-- This will only create if the user exists in auth but not in patients
INSERT INTO patients (
    user_id,
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
)
SELECT
    u.id,
    'Test',  -- You can change this
    'Patient',  -- You can change this
    u.email,
    '123456789012345',  -- Default SSN
    'M.',  -- Default civility
    '123 Rue de Test',  -- Default address
    'Paris',  -- Default city
    '75001',  -- Default postal code
    NOW(),
    NOW()
FROM auth.users u
WHERE u.email = 'somnolink4@yopmail.com'
AND NOT EXISTS (
    SELECT 1 FROM patients p WHERE p.user_id = u.id
);

-- Check if it was created
SELECT
    id,
    user_id,
    first_name,
    last_name,
    email,
    social_security_number,
    civility,
    address,
    city,
    postal_code
FROM patients
WHERE email = 'somnolink4@yopmail.com';

SELECT '✅ DIAGNOSIS COMPLETE - Check the results above!' as result;