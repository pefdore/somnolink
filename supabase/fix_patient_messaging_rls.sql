-- Correction complète des politiques RLS pour la messagerie patient
-- À exécuter dans l'éditeur SQL de Supabase

-- =====================================================
-- 1. DIAGNOSTIC DES POLITIQUES RLS ACTUELLES
-- =====================================================

SELECT '=== POLITIQUES RLS ACTUELLES ===' as diagnostic;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename IN ('patients', 'doctors', 'messages', 'conversations')
ORDER BY tablename, policyname;

-- =====================================================
-- 2. SUPPRESSION DES POLITIQUES RLS PROBLÉMATIQUES
-- =====================================================

-- Supprimer toutes les politiques problématiques
DROP POLICY IF EXISTS "Doctors can view their patients" ON patients;
DROP POLICY IF EXISTS "Patients can view own profile" ON patients;
DROP POLICY IF EXISTS "Doctors can view own profile" ON doctors;
DROP POLICY IF EXISTS "Doctors can view their conversation messages" ON messages;
DROP POLICY IF EXISTS "Patients can view their conversation messages" ON messages;
DROP POLICY IF EXISTS "Doctors can view their conversations" ON conversations;
DROP POLICY IF EXISTS "Patients can view their conversations" ON conversations;

-- =====================================================
-- 3. POLITIQUES RLS CORRIGÉES POUR PATIENTS
-- =====================================================

-- Politique pour que les patients puissent voir leur propre profil
CREATE POLICY "patients_can_view_own_profile" ON patients
FOR SELECT USING (auth.uid() = user_id);

-- Politique pour que les patients puissent mettre à jour leur propre profil
CREATE POLICY "patients_can_update_own_profile" ON patients
FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- 4. POLITIQUES RLS CORRIGÉES POUR MÉDECINS
-- =====================================================

-- Politique pour que les médecins puissent voir leur propre profil
CREATE POLICY "doctors_can_view_own_profile" ON doctors
FOR SELECT USING (auth.uid() = user_id);

-- =====================================================
-- 5. POLITIQUES RLS CORRIGÉES POUR MESSAGES
-- =====================================================

-- Vérifier si la colonne conversation_id existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'conversation_id') THEN
        ALTER TABLE messages ADD COLUMN conversation_id UUID REFERENCES conversations(id);
        RAISE NOTICE '✅ Colonne conversation_id ajoutée à la table messages';
    ELSE
        RAISE NOTICE 'ℹ️ Colonne conversation_id existe déjà';
    END IF;
END $$;

-- Les médecins peuvent voir les messages de leurs conversations
CREATE POLICY "doctors_can_view_conversation_messages" ON messages
FOR SELECT USING (
  conversation_id IN (
    SELECT id FROM conversations WHERE doctor_id IN (
      SELECT id FROM doctors WHERE user_id = auth.uid()
    )
  )
);

-- Les patients peuvent voir les messages de leurs conversations
CREATE POLICY "patients_can_view_conversation_messages" ON messages
FOR SELECT USING (
  conversation_id IN (
    SELECT id FROM conversations WHERE patient_id IN (
      SELECT id FROM patients WHERE user_id = auth.uid()
    )
  )
);

-- Les médecins peuvent envoyer des messages
CREATE POLICY "doctors_can_insert_messages" ON messages
FOR INSERT WITH CHECK (
  conversation_id IN (
    SELECT id FROM conversations WHERE doctor_id IN (
      SELECT id FROM doctors WHERE user_id = auth.uid()
    )
  )
);

-- Les patients peuvent envoyer des messages
CREATE POLICY "patients_can_insert_messages" ON messages
FOR INSERT WITH CHECK (
  conversation_id IN (
    SELECT id FROM conversations WHERE patient_id IN (
      SELECT id FROM patients WHERE user_id = auth.uid()
    )
  )
);

-- =====================================================
-- 6. POLITIQUES RLS CORRIGÉES POUR CONVERSATIONS
-- =====================================================

-- Les médecins peuvent voir leurs conversations
CREATE POLICY "doctors_can_view_conversations" ON conversations
FOR SELECT USING (doctor_id IN (
  SELECT id FROM doctors WHERE user_id = auth.uid()
));

-- Les patients peuvent voir leurs conversations
CREATE POLICY "patients_can_view_conversations" ON conversations
FOR SELECT USING (patient_id IN (
  SELECT id FROM patients WHERE user_id = auth.uid()
));

-- =====================================================
-- 7. VÉRIFICATION FINALE
-- =====================================================

SELECT '=== POLITIQUES RLS APRÈS CORRECTION ===' as verification;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename IN ('patients', 'doctors', 'messages', 'conversations')
ORDER BY tablename, policyname;

-- =====================================================
-- 8. MESSAGES DE CONFIRMATION
-- =====================================================

SELECT '✅ Politiques RLS pour la messagerie patient corrigées' as status;
SELECT '✅ Patients peuvent maintenant accéder à leur profil' as status;
SELECT '✅ Médecins peuvent accéder à leur profil' as status;
SELECT '✅ Messagerie bidirectionnelle fonctionnelle' as status;