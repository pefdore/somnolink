-- SOLUTION D'URGENCE POUR LES POLITIQUES RLS
-- À exécuter dans Supabase SQL Editor si l'API retourne une erreur 500

-- Étape 1: Vérifier l'état actuel
SELECT '=== ÉTAT ACTUEL ===' as status;
SELECT
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'patients';

-- Étape 2: Supprimer TOUTES les politiques problématiques
-- (Exécutez ces commandes une par une dans Supabase SQL Editor)
-- DROP POLICY IF EXISTS "Doctors can view their patients" ON patients;
-- DROP POLICY IF EXISTS "Patients can view own profile" ON patients;
-- DROP POLICY IF EXISTS "Patients can update own profile" ON patients;
-- DROP POLICY IF EXISTS "allow_authenticated_users" ON patients;
-- DROP POLICY IF EXISTS "simple_patients_policy" ON patients;
-- DROP POLICY IF EXISTS "patients_rls_policy" ON patients;
-- DROP POLICY IF EXISTS "temp_allow_all_authenticated" ON patients;

-- Étape 3: Créer une politique simple et fonctionnelle
-- CREATE POLICY "emergency_allow_authenticated" ON patients FOR ALL USING (auth.role() = 'authenticated');

-- Étape 4: Vérifier que la politique a été créée
SELECT '=== POLITIQUES APRÈS CORRECTION ===' as status;
SELECT
    policyname,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'patients';

-- Étape 5: Tester une mise à jour directe
-- UPDATE patients SET social_security_number = '123456789012345', civility = 'M.', gender = 'male', updated_at = NOW() WHERE email = 'somnolink4@yopmail.com';

-- Étape 6: Vérifier les données après mise à jour
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
-- Après avoir confirmé que ça fonctionne, remplacez la politique temporaire par des politiques plus sécurisées:
/*
-- Supprimer la politique temporaire
DROP POLICY IF EXISTS "emergency_allow_authenticated" ON patients;

-- Créer des politiques sécurisées
CREATE POLICY "patients_read_own_data" ON patients
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "patients_update_own_data" ON patients
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "doctors_read_patient_data" ON patients
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