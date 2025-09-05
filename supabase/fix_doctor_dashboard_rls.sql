-- Script pour corriger les politiques RLS du dashboard médecin
-- Permet aux médecins d'accéder à leur profil et à leurs patients

-- 1. Supprimer les politiques problématiques
DROP POLICY IF EXISTS "allow_all_authenticated_users_doctors" ON doctors;
DROP POLICY IF EXISTS "allow_all_authenticated_users_patients" ON patients;

-- 2. Politiques pour la table doctors
CREATE POLICY "Doctors can view own profile" ON doctors
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Doctors can update own profile" ON doctors
FOR UPDATE USING (auth.uid() = user_id);

-- 3. Politiques pour la table patients
-- Médecins peuvent voir les patients qui ont des rendez-vous avec eux
CREATE POLICY "Doctors can view their patients" ON patients
FOR SELECT USING (
    id IN (
        SELECT DISTINCT patient_id FROM appointments
        WHERE doctor_id IN (
            SELECT id FROM doctors WHERE user_id = auth.uid()
        )
    )
);

CREATE POLICY "Doctors can update their patients" ON patients
FOR UPDATE USING (
    id IN (
        SELECT DISTINCT patient_id FROM appointments
        WHERE doctor_id IN (
            SELECT id FROM doctors WHERE user_id = auth.uid()
        )
    )
);

-- 4. Politiques pour les patients (accès à leur propre profil)
CREATE POLICY "Patients can view own profile" ON patients
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Patients can update own profile" ON patients
FOR UPDATE USING (auth.uid() = user_id);

-- 5. S'assurer que RLS est activé
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

-- Message de confirmation
SELECT '✅ Politiques RLS du dashboard médecin corrigées' as status;