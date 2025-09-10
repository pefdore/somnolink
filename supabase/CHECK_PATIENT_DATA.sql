-- Vérifier les données du patient somnolink4@yopmail.com

-- 1. Vérifier l'utilisateur dans auth.users
SELECT '=== AUTH.USERS ===' as section;
SELECT
    id,
    email,
    created_at,
    email_confirmed_at
FROM auth.users
WHERE email = 'somnolink4@yopmail.com';

-- 2. Vérifier les données du patient dans la table patients
SELECT '=== PATIENTS TABLE ===' as section;
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
    phone_number,
    gender,
    created_at,
    updated_at
FROM patients
WHERE email = 'somnolink4@yopmail.com';

-- 3. Vérifier si le patient a des données dans les colonnes address
SELECT '=== PATIENTS ADDRESS DATA ===' as section;
SELECT
    id,
    email,
    address,
    city,
    postal_code,
    CASE
        WHEN address IS NOT NULL AND address != '' THEN 'HAS_ADDRESS'
        ELSE 'NO_ADDRESS'
    END as address_status
FROM patients
WHERE email = 'somnolink4@yopmail.com';

-- 4. Vérifier la relation patient-médecin
SELECT '=== PATIENT-DOCTOR RELATIONSHIP ===' as section;

SELECT
    pdr.id,
    pdr.patient_id,
    pdr.doctor_id,
    pdr.status,
    p.first_name as patient_first,
    p.last_name as patient_last,
    p.email as patient_email,
    d.first_name as doctor_first,
    d.last_name as doctor_last,
    d.email as doctor_email
FROM patient_doctor_relationships pdr
JOIN patients p ON pdr.patient_id = p.id
JOIN doctors d ON pdr.doctor_id = d.id
WHERE p.email = 'somnolink4@yopmail.com'
AND d.email = 'pfdore.pro@gmail.com';

-- 5. Si pas d'adresse, en ajouter une pour les tests
SELECT '=== ADDING TEST ADDRESS IF MISSING ===' as section;

UPDATE patients
SET
    address = '123 Rue de Test',
    city = 'Paris',
    postal_code = '75001',
    social_security_number = '123456789012345',
    civility = 'M.',
    gender = 'male',
    updated_at = NOW()
WHERE email = 'somnolink4@yopmail.com'
AND (address IS NULL OR address = '');

-- Vérifier que la mise à jour a fonctionné
SELECT
    id,
    email,
    address,
    city,
    postal_code,
    social_security_number,
    civility,
    gender
FROM patients
WHERE email = 'somnolink4@yopmail.com';
SELECT '✅ CHECK COMPLETE - Execute this in Supabase SQL Editor' as result;