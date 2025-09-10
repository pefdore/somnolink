-- DEBUG: Check patient access and relationships
-- Execute this to find why patient file cannot be opened

-- ===========================================
-- STEP 1: Find patient by email
-- ===========================================
SELECT '=== FINDING PATIENT BY EMAIL ===' as step;

SELECT
    id,
    user_id,
    first_name,
    last_name,
    email,
    social_security_number,
    adress,
    city,
    postal_code,
    created_at
FROM patients
WHERE email = 'somnolink4@yopmail.com';

-- ===========================================
-- STEP 2: Check if user exists in auth
-- ===========================================
SELECT '=== CHECKING AUTH.USERS ===' as step;

SELECT
    id,
    email,
    created_at,
    email_confirmed_at
FROM auth.users
WHERE email = 'somnolink4@yopmail.com';

-- ===========================================
-- STEP 3: Check doctor info
-- ===========================================
SELECT '=== CHECKING DOCTOR INFO ===' as step;

SELECT
    id,
    user_id,
    first_name,
    last_name,
    email
FROM doctors
WHERE email = 'pfdore.pro@gmail.com';

-- ===========================================
-- STEP 4: Check patient-doctor relationships
-- ===========================================
SELECT '=== CHECKING PATIENT-DOCTOR RELATIONSHIPS ===' as step;

SELECT
    pdr.id,
    pdr.patient_id,
    pdr.doctor_id,
    pdr.status,
    pdr.created_at,
    p.first_name as patient_first_name,
    p.last_name as patient_last_name,
    p.email as patient_email,
    d.first_name as doctor_first_name,
    d.last_name as doctor_last_name,
    d.email as doctor_email
FROM patient_doctor_relationships pdr
JOIN patients p ON pdr.patient_id = p.id
JOIN doctors d ON pdr.doctor_id = d.id
WHERE p.email = 'somnolink4@yopmail.com'
   OR d.email = 'pfdore.pro@gmail.com';

-- ===========================================
-- STEP 5: List all patients (to see available IDs)
-- ===========================================
SELECT '=== ALL PATIENTS (RECENT 10) ===' as step;

SELECT
    id,
    user_id,
    first_name,
    last_name,
    email,
    created_at
FROM patients
ORDER BY created_at DESC
LIMIT 10;

-- ===========================================
-- STEP 6: If patient doesn't exist, create it
-- ===========================================
SELECT '=== CREATING PATIENT IF MISSING ===' as step;

-- Get the user ID from auth.users and create patient if missing
INSERT INTO patients (
    user_id,
    first_name,
    last_name,
    email,
    social_security_number,
    civility,
    adress,
    city,
    postal_code,
    created_at,
    updated_at
)
SELECT
    u.id,
    'Test',
    'Patient',
    u.email,
    '123456789012345',
    'M.',
    '123 Rue de Test',
    'Paris',
    '75001',
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
    adress,
    city,
    postal_code
FROM patients
WHERE email = 'somnolink4@yopmail.com';

-- ===========================================
-- STEP 7: Create patient-doctor relationship if missing
-- ===========================================
SELECT '=== CREATING PATIENT-DOCTOR RELATIONSHIP IF MISSING ===' as step;

INSERT INTO patient_doctor_relationships (
    patient_id,
    doctor_id,
    status,
    created_at,
    updated_at
)
SELECT
    p.id,
    d.id,
    'active',
    NOW(),
    NOW()
FROM patients p
CROSS JOIN doctors d
WHERE p.email = 'somnolink4@yopmail.com'
AND d.email = 'pfdore.pro@gmail.com'
AND NOT EXISTS (
    SELECT 1 FROM patient_doctor_relationships pdr
    WHERE pdr.patient_id = p.id AND pdr.doctor_id = d.id
);

-- Check if relationship was created
SELECT
    pdr.id,
    pdr.patient_id,
    pdr.doctor_id,
    pdr.status,
    p.first_name as patient_first_name,
    p.email as patient_email,
    d.first_name as doctor_first_name,
    d.email as doctor_email
FROM patient_doctor_relationships pdr
JOIN patients p ON pdr.patient_id = p.id
JOIN doctors d ON pdr.doctor_id = d.id
WHERE p.email = 'somnolink4@yopmail.com'
AND d.email = 'pfdore.pro@gmail.com';

SELECT '✅ DEBUG COMPLETE - Check results above!' as result;