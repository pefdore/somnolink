-- Correction de la politique RLS pour les patients dans la table appointments
-- Le problème : patient_id = auth.uid() ne fonctionne pas car patient_id fait référence à l'ID dans la table patients
-- Solution : vérifier que l'utilisateur authentifié est bien le propriétaire du profil patient

-- Supprimer l'ancienne politique incorrecte
DROP POLICY IF EXISTS "Patients can view their appointments" ON appointments;

-- Nouvelle politique : les patients peuvent voir leurs rendez-vous via leur profil patient
CREATE POLICY "Patients can view their appointments" ON appointments
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM patients
    WHERE patients.id = appointments.patient_id
    AND patients.user_id = auth.uid()
  )
);

-- Supprimer et recréer la politique de création aussi
DROP POLICY IF EXISTS "Patients can create appointments" ON appointments;

CREATE POLICY "Patients can create appointments" ON appointments
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM patients
    WHERE patients.id = appointments.patient_id
    AND patients.user_id = auth.uid()
  )
);

-- Message de confirmation
SELECT '✅ Politiques RLS pour les patients corrigées dans appointments' as status;