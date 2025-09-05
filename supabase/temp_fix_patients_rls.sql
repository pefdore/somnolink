-- Correction temporaire des politiques RLS pour les patients
-- À exécuter dans Supabase SQL Editor

-- Supprimer toutes les politiques actuelles
DROP POLICY IF EXISTS "Doctors can view their patients" ON patients;
DROP POLICY IF EXISTS "Doctors can update their patients" ON patients;
DROP POLICY IF EXISTS "Patients can view own profile" ON patients;
DROP POLICY IF EXISTS "Patients can update own profile" ON patients;
DROP POLICY IF EXISTS "Doctors can view all patients" ON patients;
DROP POLICY IF EXISTS "Doctors can update all patients" ON patients;

-- Politique temporaire très permissive pour permettre au système de fonctionner
CREATE POLICY "Temporary allow all for patients" ON patients
FOR ALL USING (true);

-- Message de confirmation
SELECT '✅ Politiques RLS temporaires appliquées pour les patients' as status;