-- Script de diagnostic pour les politiques RLS sur la table patients
-- À exécuter dans Supabase SQL Editor

-- 1. Vérifier si RLS est activé sur la table patients
SELECT
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'patients';

-- 2. Lister toutes les politiques RLS actuelles sur la table patients
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'patients'
ORDER BY policyname;

-- 3. Tester une requête SELECT simple (devrait fonctionner si RLS permet)
-- Cette requête devrait retourner les données du patient connecté
SELECT
    id,
    first_name,
    last_name,
    email,
    social_security_number,
    civility,
    gender,
    phone_number,
    updated_at
FROM patients
WHERE email = 'somnolink4@yopmail.com';

-- 4. Tester une mise à jour directe (pour voir si c'est un problème RLS)
-- ATTENTION: Ne pas exécuter en production sans backup !
/*
UPDATE patients
SET
    social_security_number = '123456789012345',
    civility = 'M.',
    gender = 'male',
    updated_at = NOW()
WHERE email = 'somnolink4@yopmail.com'
RETURNING id, social_security_number, civility, gender, updated_at;
*/

-- 5. Vérifier les permissions de l'utilisateur authentifié
-- (Cette requête doit être exécutée dans le contexte de l'application)
SELECT
    auth.role() as user_role,
    auth.uid() as user_id;

-- 6. Si les politiques RLS sont trop restrictives, voici une solution temporaire :
/*
-- Désactiver RLS temporairement pour test
ALTER TABLE patients DISABLE ROW LEVEL SECURITY;

-- Après test, réactiver avec une politique simple :
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_authenticated_users" ON patients;
CREATE POLICY "allow_authenticated_users" ON patients
FOR ALL USING (auth.role() = 'authenticated');
*/