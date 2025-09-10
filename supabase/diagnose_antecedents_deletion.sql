-- Diagnostic et correction du problème de suppression des antécédents
-- À exécuter dans l'interface SQL de Supabase

-- 1. Vérifier les politiques RLS actuelles
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'antecedents'
ORDER BY policyname;

-- 2. Vérifier si RLS est activé
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'antecedents';

-- 3. Tester une suppression directe (sans RLS)
-- ATTENTION: Ne pas exécuter en production !
-- SET LOCAL row_security = off;
-- DELETE FROM antecedents WHERE id = '066a9a2f-d152-494f-bcb3-d8385a1c12b9';
-- SET LOCAL row_security = on;

-- 4. Vérifier les relations patient_doctor_relationships
SELECT pdr.*, d.user_id as doctor_user_id
FROM patient_doctor_relationships pdr
JOIN doctors d ON d.id = pdr.doctor_id
WHERE pdr.patient_id = '9b71938b-97d3-4419-8141-c0379e3ab224'
AND d.user_id = 'c2da6cb6-589f-4a25-91f2-3126edb9c931';

-- 5. Vérifier l'antécédent spécifique
SELECT a.*, d.user_id as doctor_user_id
FROM antecedents a
JOIN doctors d ON d.id = a.doctor_id
WHERE a.id = '066a9a2f-d152-494f-bcb3-d8385a1c12b9';

-- 6. Recréer les politiques RLS avec une approche simplifiée
DROP POLICY IF EXISTS "Doctors can view patient antecedents" ON antecedents;
DROP POLICY IF EXISTS "Doctors can insert patient antecedents" ON antecedents;
DROP POLICY IF EXISTS "Doctors can update patient antecedents" ON antecedents;
DROP POLICY IF EXISTS "Doctors can delete patient antecedents" ON antecedents;

-- Politique simplifiée pour la suppression
CREATE POLICY "Doctors can delete patient antecedents" ON antecedents
FOR DELETE USING (
  doctor_id IN (
    SELECT id FROM doctors WHERE user_id = auth.uid()
  )
);

-- Politique simplifiée pour la lecture
CREATE POLICY "Doctors can view patient antecedents" ON antecedents
FOR SELECT USING (
  doctor_id IN (
    SELECT id FROM doctors WHERE user_id = auth.uid()
  )
);

-- Politique simplifiée pour l'insertion
CREATE POLICY "Doctors can insert patient antecedents" ON antecedents
FOR INSERT WITH CHECK (
  doctor_id IN (
    SELECT id FROM doctors WHERE user_id = auth.uid()
  )
);

-- Politique simplifiée pour la mise à jour
CREATE POLICY "Doctors can update patient antecedents" ON antecedents
FOR UPDATE USING (
  doctor_id IN (
    SELECT id FROM doctors WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  doctor_id IN (
    SELECT id FROM doctors WHERE user_id = auth.uid()
  )
);

-- Message de confirmation
SELECT '✅ Politiques RLS simplifiées appliquées pour les antécédents' as status;