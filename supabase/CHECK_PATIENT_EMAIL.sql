-- Script pour vérifier et corriger l'email du patient somnolink4@yopmail.com

-- 1. Vérifier l'état actuel du patient
SELECT '=== ÉTAT ACTUEL DU PATIENT ===' as section;
SELECT
    id,
    user_id,
    first_name,
    last_name,
    email,
    address,
    city,
    postal_code,
    social_security_number,
    civility,
    gender
FROM patients
WHERE email = 'somnolink4@yopmail.com';

-- 2. Vérifier si l'utilisateur existe dans auth.users
SELECT '=== UTILISATEUR DANS AUTH.USERS ===' as section;
SELECT
    id,
    email,
    email_confirmed_at,
    created_at
FROM auth.users
WHERE email = 'somnolink4@yopmail.com';

-- 3. CORRECTION : Mettre à jour l'email si nécessaire
SELECT '=== CORRECTION DE L EMAIL ===' as section;

-- Mettre à jour l'email dans la table patients
UPDATE patients
SET email = 'somnolink4@yopmail.com'
WHERE email IS NULL OR email = ''
   AND user_id IN (
       SELECT id FROM auth.users WHERE email = 'somnolink4@yopmail.com'
   );

-- Mettre à jour l'adresse si elle est vide
UPDATE patients
SET
    address = '29 rue surcoufs',
    city = 'Rennes',
    postal_code = '35000'
WHERE email = 'somnolink4@yopmail.com'
  AND (address IS NULL OR address = '');

-- Mettre à jour le numéro de sécurité sociale
UPDATE patients
SET social_security_number = '18812'
WHERE email = 'somnolink4@yopmail.com'
  AND (social_security_number IS NULL OR social_security_number = '');

-- Mettre à jour la civilité
UPDATE patients
SET civility = 'M.'
WHERE email = 'somnolink4@yopmail.com'
  AND (civility IS NULL OR civility = '');

-- Mettre à jour le genre
UPDATE patients
SET gender = 'male'
WHERE email = 'somnolink4@yopmail.com'
  AND (gender IS NULL OR gender = '');

-- 4. Vérifier le résultat après correction
SELECT '=== RÉSULTAT APRÈS CORRECTION ===' as section;
SELECT
    id,
    user_id,
    first_name,
    last_name,
    email,
    address,
    city,
    postal_code,
    social_security_number,
    civility,
    gender
FROM patients
WHERE email = 'somnolink4@yopmail.com';

SELECT '✅ CORRECTION TERMINÉE - Execute this in Supabase SQL Editor' as result;