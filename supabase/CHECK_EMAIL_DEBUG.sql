-- Script de débogage pour vérifier l'email du patient

-- 1. Vérifier l'utilisateur dans auth.users
SELECT '=== CHECKING AUTH.USERS ===' as section;
SELECT
    id,
    email,
    email_confirmed_at,
    created_at,
    last_sign_in_at
FROM auth.users
WHERE email = 'somnolink4@yopmail.com';

-- 2. Vérifier le patient dans la table patients
SELECT '=== CHECKING PATIENTS TABLE ===' as section;
SELECT
    id,
    user_id,
    first_name,
    last_name,
    email,
    created_at
FROM patients
WHERE email = 'somnolink4@yopmail.com';

-- 3. Vérifier si l'user_id du patient correspond à auth.users
SELECT '=== CHECKING USER_ID MATCH ===' as section;
SELECT
    p.id as patient_id,
    p.user_id as patient_user_id,
    p.email as patient_email,
    au.id as auth_user_id,
    au.email as auth_email,
    CASE
        WHEN p.user_id = au.id THEN 'MATCH - OK'
        ELSE 'NO MATCH - PROBLEM'
    END as user_id_match
FROM patients p
LEFT JOIN auth.users au ON p.user_id = au.id
WHERE p.email = 'somnolink4@yopmail.com';

-- 4. Si pas de correspondance, essayer de trouver l'utilisateur auth par email
SELECT '=== TRYING TO FIND AUTH USER BY EMAIL ===' as section;
SELECT
    au.id as auth_user_id,
    au.email as auth_email,
    p.id as patient_id,
    p.user_id as patient_user_id,
    CASE
        WHEN au.email = p.email THEN 'EMAIL MATCH'
        ELSE 'EMAIL MISMATCH'
    END as email_comparison
FROM auth.users au
CROSS JOIN patients p
WHERE au.email = 'somnolink4@yopmail.com'
AND p.email = 'somnolink4@yopmail.com';

-- 5. Mettre à jour le user_id si nécessaire
SELECT '=== FIXING USER_ID IF NEEDED ===' as section;

UPDATE patients
SET user_id = (
    SELECT id FROM auth.users WHERE email = 'somnolink4@yopmail.com'
)
WHERE email = 'somnolink4@yopmail.com'
AND user_id != (
    SELECT id FROM auth.users WHERE email = 'somnolink4@yopmail.com'
);

-- Vérifier la correction
SELECT
    p.id,
    p.user_id,
    p.email,
    au.email as auth_email,
    CASE
        WHEN p.user_id = au.id THEN 'FIXED - OK'
        ELSE 'STILL BROKEN'
    END as status
FROM patients p
LEFT JOIN auth.users au ON p.user_id = au.id
WHERE p.email = 'somnolink4@yopmail.com';

SELECT '✅ EMAIL DEBUG COMPLETE - Execute this in Supabase SQL Editor' as result;