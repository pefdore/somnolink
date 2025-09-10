-- Test rapide des politiques RLS sur la table patients
-- À exécuter dans Supabase SQL Editor

-- 1. Vérifier l'état RLS actuel
SELECT
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'patients';

-- 2. Lister les politiques actuelles
SELECT
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'patients'
ORDER BY policyname;

-- 3. Test rapide : désactiver temporairement RLS pour voir si ça résout le problème
-- (Exécutez cette commande si les politiques semblent problématiques)
-- ALTER TABLE patients DISABLE ROW LEVEL SECURITY;

-- 4. Après test, réactiver RLS avec une politique simple
-- ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "allow_all_authenticated" ON patients FOR ALL USING (auth.role() = 'authenticated');

-- 5. Vérifier les données du patient test
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