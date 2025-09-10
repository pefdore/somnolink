-- Script de test pour vérifier la sauvegarde du profil patient
-- À exécuter dans Supabase SQL Editor

-- 1. Vérifier les données actuelles du patient somnolink4@yopmail.com
SELECT
    id,
    first_name,
    last_name,
    email,
    social_security_number,
    civility,
    gender,
    phone_number,
    date_of_birth,
    address,
    city,
    postal_code,
    created_at,
    updated_at
FROM patients
WHERE email = 'somnolink4@yopmail.com';

-- 2. Tester une mise à jour directe en SQL
-- (Remplacer les valeurs selon vos besoins de test)
-- UPDATE patients
-- SET
--     social_security_number = '123456789012345',
--     civility = 'M.',
--     gender = 'male',
--     phone_number = '+33123456789',
--     updated_at = NOW()
-- WHERE email = 'somnolink4@yopmail.com';

-- 3. Vérifier après mise à jour
-- SELECT
--     id,
--     first_name,
--     last_name,
--     email,
--     social_security_number,
--     civility,
--     gender,
--     phone_number,
--     updated_at
-- FROM patients
-- WHERE email = 'somnolink4@yopmail.com';