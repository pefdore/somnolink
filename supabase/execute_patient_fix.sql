-- Script de correction pour restaurer l'accès des patients
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Supprimer les politiques RLS problématiques
DROP POLICY IF EXISTS "Doctors can view their patients" ON patients;
DROP POLICY IF EXISTS "Doctors can view patient notes" ON notes;

-- 2. Créer des politiques qui permettent aux patients d'accéder à leurs données
CREATE POLICY "Patients can view their own profile" ON patients
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Doctors can view patients" ON patients
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM doctors 
    WHERE doctors.id = patients.doctor_id 
    AND doctors.user_id = auth.uid()
  )
);

-- 3. Politiques pour les notes
CREATE POLICY "Patients can view their own notes" ON notes
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM patients
    WHERE patients.id = notes.patient_id
    AND patients.user_id = auth.uid()
  )
);

CREATE POLICY "Doctors can view notes" ON notes
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM doctors 
    WHERE doctors.id = notes.doctor_id 
    AND doctors.user_id = auth.uid()
  )
);

-- 4. Vérification des données
SELECT 'Total patients: ' || COUNT(*) as info FROM patients;
SELECT 'Patients with doctor_id: ' || COUNT(doctor_id) as info FROM patients;
SELECT 'Patients without doctor_id: ' || (COUNT(*) - COUNT(doctor_id)) as info FROM patients;

-- 5. Si nécessaire, mettre à jour les patients sans doctor_id
-- UPDATE patients SET doctor_id = NULL WHERE doctor_id IS NULL;

-- 6. Vérification des politiques RLS
SELECT tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('patients', 'notes')
ORDER BY tablename, policyname;