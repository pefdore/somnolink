-- Script temporaire pour corriger les politiques RLS sur la table patients
-- À exécuter dans Supabase SQL Editor si les données ne se sauvegardent pas

-- 1. Vérifier l'état actuel des politiques RLS
SELECT '=== ÉTAT ACTUEL RLS ===' as diagnostic;
SELECT
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'patients';

SELECT '=== POLITIQUES RLS ACTUELLES ===' as policies;
SELECT
    policyname,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'patients';

-- 2. Supprimer les politiques RLS problématiques
-- Note: Utilisez ces commandes une par une dans Supabase SQL Editor
/*
DROP POLICY IF EXISTS "Doctors can view their patients" ON patients;
DROP POLICY IF EXISTS "Patients can view own profile" ON patients;
DROP POLICY IF EXISTS "Patients can update own profile" ON patients;
DROP POLICY IF EXISTS "allow_authenticated_users" ON patients;
DROP POLICY IF EXISTS "simple_patients_policy" ON patients;
DROP POLICY IF EXISTS "patients_rls_policy" ON patients;
*/

-- 3. Créer une politique RLS simple et permissive pour les tests
-- Note: Exécutez cette commande dans Supabase SQL Editor
/*
CREATE POLICY "temp_allow_all_authenticated" ON patients
FOR ALL USING (auth.role() = 'authenticated');
*/

-- 4. Vérifier que la politique a été créée
SELECT '=== POLITIQUES RLS APRÈS CORRECTION ===' as verification;
SELECT
    policyname,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'patients';

-- 5. Tester une mise à jour directe
-- (Décommentez et exécutez pour tester)
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

-- 6. Vérifier les données après mise à jour
SELECT
    id,
    first_name,
    last_name,
    email,
    social_security_number,
    civility,
    gender,
    updated_at
FROM patients
WHERE email = 'somnolink4@yopmail.com';

-- MESSAGE IMPORTANT:
-- Après avoir testé que la sauvegarde fonctionne, réactivez des politiques RLS plus sécurisées :
/*
-- Supprimer la politique temporaire
DROP POLICY IF EXISTS "temp_allow_all_authenticated" ON patients;

-- Créer des politiques plus sécurisées
CREATE POLICY "patients_can_read_own_data" ON patients
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "patients_can_update_own_data" ON patients
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "doctors_can_read_patient_data" ON patients
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM appointments
        WHERE appointments.patient_id = patients.id
        AND appointments.doctor_id IN (
            SELECT id FROM doctors WHERE user_id = auth.uid()
        )
    )
);
*/