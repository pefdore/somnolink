-- Migration pour corriger les politiques RLS de la table patients
-- Date: 2025-01-01
-- Description: Permettre aux médecins de voir les patients qui ont des rendez-vous avec eux

-- Supprimer les anciennes politiques problématiques
DROP POLICY IF EXISTS "Doctors can view their patients" ON patients;
DROP POLICY IF EXISTS "Doctors can update their patients" ON patients;

-- Nouvelle politique : Médecins peuvent voir les patients qui ont des rendez-vous avec eux
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
)
WITH CHECK (
    id IN (
        SELECT DISTINCT patient_id FROM appointments
        WHERE doctor_id IN (
            SELECT id FROM doctors WHERE user_id = auth.uid()
        )
    )
);

-- Message de confirmation
SELECT '✅ Politiques RLS pour les patients corrigées' as status;