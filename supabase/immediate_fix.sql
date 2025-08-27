-- Script de correction immédiate pour les politiques RLS et fonctions RPC
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Création ou remplacement de la fonction get_patient_notes
CREATE OR REPLACE FUNCTION get_patient_notes(p_patient_id UUID)
RETURNS TABLE (
  id UUID,
  patient_id UUID,
  doctor_id UUID,
  content TEXT,
  created_at TIMESTAMPTZ,
  first_name TEXT,
  last_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    n.id,
    n.patient_id,
    n.doctor_id,
    n.content,
    n.created_at,
    d.first_name,
    d.last_name
  FROM notes n
  LEFT JOIN doctors d ON n.doctor_id = d.id
  WHERE n.patient_id = p_patient_id
  ORDER BY n.created_at DESC;
END;
$$;

-- 2. Correction des politiques RLS
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Supprimer les politiques existantes
DROP POLICY IF EXISTS "Doctors can view all patient notes" ON notes;
DROP POLICY IF EXISTS "Doctors can insert patient notes" ON notes;
DROP POLICY IF EXISTS "Doctors can update their notes" ON notes;
DROP POLICY IF EXISTS "Doctors can delete their notes" ON notes;

-- Politique: Les médecins peuvent voir toutes les notes
CREATE POLICY "Doctors can view all patient notes" ON notes
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM doctors 
    WHERE doctors.user_id = auth.uid()
  )
);

-- Politique: Les médecins peuvent insérer des notes
CREATE POLICY "Doctors can insert patient notes" ON notes
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM doctors 
    WHERE doctors.id = notes.doctor_id 
    AND doctors.user_id = auth.uid()
  )
);

-- Politique: Les médecins peuvent mettre à jour leurs notes
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

-- Politique: Les médecins peuvent supprimer leurs notes
CREATE POLICY "Doctors can delete their notes" ON notes
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM doctors 
    WHERE doctors.id = notes.doctor_id 
    AND doctors.user_id = auth.uid()
  )
);

-- 3. Vérification des données existantes
SELECT COUNT(*) as total_notes FROM notes;
SELECT * FROM get_patient_notes('28e2cbb2-e5a2-4292-acca-2afab316fafe');