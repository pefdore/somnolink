-- Script de restauration complète du système original pour Supabase (PostgreSQL)
-- Ce script doit être exécuté dans l'éditeur SQL de Supabase

-- Étape 1: Supprimer la colonne doctor_id inutile de la table patients
ALTER TABLE patients 
DROP COLUMN IF EXISTS doctor_id;

-- Étape 2: Restaurer les politiques RLS originales pour les notes
-- Supprimer les politiques modifiées
DROP POLICY IF EXISTS "Doctors can view patient notes" ON notes;
DROP POLICY IF EXISTS "Doctors can view their patients" ON patients;

-- Restaurer la politique originale de visualisation des notes
CREATE POLICY "Doctors can view all patient notes" ON notes
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM doctors
    WHERE doctors.user_id = auth.uid()
  )
);

-- Restaurer la politique d'insertion originale
CREATE POLICY "Doctors can insert patient notes" ON notes
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM doctors 
    WHERE doctors.id = notes.doctor_id 
    AND doctors.user_id = auth.uid()
  )
);

-- Restaurer la politique de mise à jour originale
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

-- Restaurer la politique de suppression originale
CREATE POLICY "Doctors can delete their notes" ON notes
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM doctors 
    WHERE doctors.id = notes.doctor_id 
    AND doctors.user_id = auth.uid()
  )
);

-- Étape 3: Politiques pour les patients
-- Les patients voient leurs propres données
CREATE POLICY "Patients can view own profile" ON patients
FOR SELECT USING (auth.uid() = user_id);

-- Les patients voient leurs propres notes
CREATE POLICY "Patients can view own notes" ON notes
FOR SELECT USING (auth.uid() IN (SELECT user_id FROM patients WHERE patients.id = notes.patient_id));

-- Étape 4: S'assurer que RLS est activé
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Message de confirmation
SELECT 'Système restauré avec succès. Le questionnaire pré-consultation devrait maintenant fonctionner normalement.' as status;