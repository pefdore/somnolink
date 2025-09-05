-- Correction des politiques RLS pour la table antecedents
-- Le problème : référence à patients.doctor_id qui n'existe pas
-- Solution : utiliser patient_doctor_relationships pour vérifier l'accès

-- Supprimer les anciennes politiques incorrectes
DROP POLICY IF EXISTS "Doctors can view patient antecedents" ON antecedents;
DROP POLICY IF EXISTS "Doctors can insert patient antecedents" ON antecedents;
DROP POLICY IF EXISTS "Doctors can update patient antecedents" ON antecedents;
DROP POLICY IF EXISTS "Doctors can delete patient antecedents" ON antecedents;

-- Nouvelle politique : Les médecins peuvent voir les antécédents de leurs patients
CREATE POLICY "Doctors can view patient antecedents" ON antecedents
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM patient_doctor_relationships pdr
    WHERE pdr.patient_id = antecedents.patient_id
    AND pdr.doctor_id = antecedents.doctor_id
    AND pdr.doctor_id IN (
      SELECT id FROM doctors WHERE user_id = auth.uid()
    )
    AND pdr.status = 'active'
  )
);

-- Nouvelle politique : Les médecins peuvent insérer des antécédents pour leurs patients
CREATE POLICY "Doctors can insert patient antecedents" ON antecedents
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM patient_doctor_relationships pdr
    WHERE pdr.patient_id = antecedents.patient_id
    AND pdr.doctor_id = antecedents.doctor_id
    AND pdr.doctor_id IN (
      SELECT id FROM doctors WHERE user_id = auth.uid()
    )
    AND pdr.status = 'active'
  )
);

-- Nouvelle politique : Les médecins peuvent mettre à jour les antécédents de leurs patients
CREATE POLICY "Doctors can update patient antecedents" ON antecedents
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM patient_doctor_relationships pdr
    WHERE pdr.patient_id = antecedents.patient_id
    AND pdr.doctor_id = antecedents.doctor_id
    AND pdr.doctor_id IN (
      SELECT id FROM doctors WHERE user_id = auth.uid()
    )
    AND pdr.status = 'active'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM patient_doctor_relationships pdr
    WHERE pdr.patient_id = antecedents.patient_id
    AND pdr.doctor_id = antecedents.doctor_id
    AND pdr.doctor_id IN (
      SELECT id FROM doctors WHERE user_id = auth.uid()
    )
    AND pdr.status = 'active'
  )
);

-- Nouvelle politique : Les médecins peuvent supprimer les antécédents de leurs patients
CREATE POLICY "Doctors can delete patient antecedents" ON antecedents
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM patient_doctor_relationships pdr
    WHERE pdr.patient_id = antecedents.patient_id
    AND pdr.doctor_id = antecedents.doctor_id
    AND pdr.doctor_id IN (
      SELECT id FROM doctors WHERE user_id = auth.uid()
    )
    AND pdr.status = 'active'
  )
);

-- Message de confirmation
SELECT '✅ Politiques RLS de la table antecedents corrigées' as status;