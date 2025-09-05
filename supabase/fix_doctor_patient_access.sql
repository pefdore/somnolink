-- Correction de l'accès des médecins aux dossiers patients
-- Le problème : Les médecins ne peuvent voir que les patients qui ont des rendez-vous
-- Solution : Permettre l'accès via les relations patient-médecin

-- Supprimer l'ancienne politique trop restrictive
DROP POLICY IF EXISTS "Doctors can view their patients" ON patients;

-- Nouvelle politique : Les médecins peuvent voir les patients associés via patient_doctor_relationships
CREATE POLICY "Doctors can view their patients" ON patients
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM patient_doctor_relationships pdr
    WHERE pdr.patient_id = patients.id
    AND pdr.doctor_id IN (
      SELECT id FROM doctors WHERE user_id = auth.uid()
    )
    AND pdr.status = 'active'
  )
);

-- Politique pour la mise à jour (conservée)
DROP POLICY IF EXISTS "Doctors can update their patients" ON patients;

CREATE POLICY "Doctors can update their patients" ON patients
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM patient_doctor_relationships pdr
    WHERE pdr.patient_id = patients.id
    AND pdr.doctor_id IN (
      SELECT id FROM doctors WHERE user_id = auth.uid()
    )
    AND pdr.status = 'active'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM patient_doctor_relationships pdr
    WHERE pdr.patient_id = patients.id
    AND pdr.doctor_id IN (
      SELECT id FROM doctors WHERE user_id = auth.uid()
    )
    AND pdr.status = 'active'
  )
);

-- Message de confirmation
SELECT '✅ Accès des médecins aux dossiers patients corrigé' as status;