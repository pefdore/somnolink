-- Script de restauration finale pour Supabase
-- Exécutez ce script dans l'éditeur SQL de Supabase

-- Étape 1: Supprimer les politiques qui dépendent de doctor_id
DROP POLICY IF EXISTS "Doctors can view patients" ON patients;
DROP POLICY IF EXISTS "Doctors can view patient notes" ON notes;
DROP POLICY IF EXISTS "Doctors can view their patients" ON patients;

-- Étape 2: Supprimer la colonne doctor_id avec CASCADE pour gérer les dépendances
ALTER TABLE patients DROP COLUMN IF EXISTS doctor_id CASCADE;

-- Étape 3: Restaurer les politiques RLS originales basées sur appointments.doctor_id

-- Politique pour que les médecins voient toutes les notes des patients
CREATE POLICY "Doctors can view all patient notes" ON notes
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM doctors
    WHERE doctors.user_id = auth.uid()
  )
);

-- Politique pour que les médecins insèrent des notes pour leurs patients
CREATE POLICY "Doctors can insert patient notes" ON notes
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM doctors 
    WHERE doctors.id = notes.doctor_id 
    AND doctors.user_id = auth.uid()
  )
);

-- Politique pour que les médecins mettent à jour leurs notes
CREATE POLICY "Doctors can update their notes" ON notes
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM doctors 
    WHERE doctors.id = notes.doctor_id 
    AND doctors.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM doctors 
    WHERE doctors.id = notes.doctor_id 
    AND doctors.user_id = auth.uid()
  )
);

-- Politique pour que les médecins suppriment leurs notes
CREATE POLICY "Doctors can delete their notes" ON notes
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM doctors 
    WHERE doctors.id = notes.doctor_id 
    AND doctors.user_id = auth.uid()
  )
);

-- Politique pour que les patients voient leur propre profil
CREATE POLICY "Patients can view own profile" ON patients
FOR SELECT USING (auth.uid() = user_id);

-- Politique pour que les patients voient leurs propres notes
CREATE POLICY "Patients can view own notes" ON notes
FOR SELECT USING (auth.uid() IN (SELECT user_id FROM patients WHERE patients.id = notes.patient_id));

-- S'assurer que RLS est activé
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Message de confirmation
SELECT 'Restauration terminée avec succès! Le système original a été restauré.' as status;