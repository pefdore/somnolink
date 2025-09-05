-- CORRECTIONS MANUELLES À EXÉCUTER DANS SUPABASE SQL EDITOR
-- Copiez-collez ces commandes une par une dans Supabase > SQL Editor

-- =====================================================
-- 1. CORRECTION DES RELATIONS (si nécessaire)
-- =====================================================

-- Vérifier si les clés étrangères existent
SELECT
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name IN ('appointments', 'patient_doctor_relationships');

-- =====================================================
-- 2. CORRECTION DES POLITIQUES RLS ANTECEDENTS
-- =====================================================

-- Supprimer les anciennes politiques incorrectes
DROP POLICY IF EXISTS "Doctors can view patient antecedents" ON antecedents;
DROP POLICY IF EXISTS "Doctors can insert patient antecedents" ON antecedents;
DROP POLICY IF EXISTS "Doctors can update patient antecedents" ON antecedents;
DROP POLICY IF EXISTS "Doctors can delete patient antecedents" ON antecedents;

-- Créer les nouvelles politiques correctes
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

-- =====================================================
-- 3. VÉRIFICATION FINALE
-- =====================================================

-- Vérifier que les politiques ont été créées
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'antecedents';

-- Tester une requête simple
SELECT '✅ Corrections appliquées avec succès' as status;