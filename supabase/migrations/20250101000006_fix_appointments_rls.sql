-- Migration pour corriger les politiques RLS de la table appointments
-- Date: 2025-01-01
-- Description: Remplacer la politique trop permissive par des politiques sécurisées

-- Supprimer l'ancienne politique trop permissive
DROP POLICY IF EXISTS "allow_all_authenticated_users_appointments" ON appointments;

-- Politiques pour les médecins : peuvent voir leurs propres rendez-vous
CREATE POLICY "Doctors can view their appointments" ON appointments
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM doctors
    WHERE doctors.id = appointments.doctor_id
    AND doctors.user_id = auth.uid()
  )
);

-- Politiques pour les médecins : peuvent modifier leurs propres rendez-vous
CREATE POLICY "Doctors can update their appointments" ON appointments
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM doctors
    WHERE doctors.id = appointments.doctor_id
    AND doctors.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM doctors
    WHERE doctors.id = appointments.doctor_id
    AND doctors.user_id = auth.uid()
  )
);

-- Politiques pour les patients : peuvent voir leurs propres rendez-vous
CREATE POLICY "Patients can view their appointments" ON appointments
FOR SELECT USING (
  patient_id = auth.uid()
);

-- Politiques pour les patients : peuvent créer leurs propres rendez-vous
CREATE POLICY "Patients can create appointments" ON appointments
FOR INSERT WITH CHECK (
  patient_id = auth.uid()
);

-- Message de confirmation
SELECT '✅ Politiques RLS pour les rendez-vous corrigées' as status;