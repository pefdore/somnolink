-- Système de contrôle des conversations médicales
-- Seules les médecins peuvent initier et contrôler les conversations

-- =====================================================
-- 1. AJOUT DES CHAMPS DE CONTRÔLE
-- =====================================================

-- Ajouter les champs de contrôle aux conversations
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'conversations' AND column_name = 'allow_patient_reply') THEN
        ALTER TABLE conversations ADD COLUMN allow_patient_reply BOOLEAN DEFAULT false;
        RAISE NOTICE '✅ Colonne allow_patient_reply ajoutée';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'conversations' AND column_name = 'is_closed') THEN
        ALTER TABLE conversations ADD COLUMN is_closed BOOLEAN DEFAULT false;
        RAISE NOTICE '✅ Colonne is_closed ajoutée';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'conversations' AND column_name = 'closed_at') THEN
        ALTER TABLE conversations ADD COLUMN closed_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE '✅ Colonne closed_at ajoutée';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'conversations' AND column_name = 'closed_by') THEN
        ALTER TABLE conversations ADD COLUMN closed_by UUID REFERENCES doctors(id);
        RAISE NOTICE '✅ Colonne closed_by ajoutée';
    END IF;
END $$;

-- =====================================================
-- 2. FONCTIONS DE CONTRÔLE
-- =====================================================

-- Fonction pour créer une conversation (médecins uniquement)
CREATE OR REPLACE FUNCTION create_doctor_conversation(
    p_doctor_id UUID,
    p_patient_id UUID,
    p_allow_reply BOOLEAN DEFAULT false
) RETURNS UUID AS $$
DECLARE
    conversation_id UUID;
BEGIN
    -- Vérifier que l'appelant est bien un médecin
    IF NOT EXISTS (SELECT 1 FROM doctors WHERE id = p_doctor_id) THEN
        RAISE EXCEPTION 'Seuls les médecins peuvent créer des conversations';
    END IF;

    -- Vérifier que le patient existe et appartient au médecin
    IF NOT EXISTS (
        SELECT 1 FROM patients
        WHERE id = p_patient_id AND doctor_id = p_doctor_id
    ) THEN
        RAISE EXCEPTION 'Patient introuvable ou n''appartient pas à ce médecin';
    END IF;

    -- Créer la conversation
    INSERT INTO conversations (
        id, doctor_id, patient_id, last_message, last_message_at,
        unread_count_patient, allow_patient_reply, is_closed
    ) VALUES (
        gen_random_uuid(), p_doctor_id, p_patient_id,
        'Nouvelle conversation initiée par le médecin', NOW(),
        0, p_allow_reply, false
    ) RETURNING id INTO conversation_id;

    RETURN conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour mettre à jour les permissions de réponse
CREATE OR REPLACE FUNCTION update_conversation_reply_permission(
    p_conversation_id UUID,
    p_doctor_id UUID,
    p_allow_reply BOOLEAN
) RETURNS BOOLEAN AS $$
BEGIN
    -- Vérifier que l'appelant est le médecin de la conversation
    IF NOT EXISTS (
        SELECT 1 FROM conversations
        WHERE id = p_conversation_id AND doctor_id = p_doctor_id
    ) THEN
        RAISE EXCEPTION 'Permission refusée : vous n''êtes pas le médecin de cette conversation';
    END IF;

    -- Mettre à jour la permission
    UPDATE conversations
    SET allow_patient_reply = p_allow_reply,
        is_closed = CASE WHEN NOT p_allow_reply THEN true ELSE false END,
        closed_at = CASE WHEN NOT p_allow_reply THEN NOW() ELSE NULL END,
        closed_by = CASE WHEN NOT p_allow_reply THEN p_doctor_id ELSE NULL END
    WHERE id = p_conversation_id;

    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 3. POLITIQUES RLS MISES À JOUR
-- =====================================================

-- Mise à jour des politiques pour les conversations
DROP POLICY IF EXISTS "doctors_can_view_conversations" ON conversations;
CREATE POLICY "doctors_can_view_conversations" ON conversations
FOR SELECT USING (doctor_id IN (
  SELECT id FROM doctors WHERE user_id = auth.uid()
));

DROP POLICY IF EXISTS "patients_can_view_conversations" ON conversations;
CREATE POLICY "patients_can_view_conversations" ON conversations
FOR SELECT USING (
  patient_id IN (
    SELECT id FROM patients WHERE user_id = auth.uid()
  ) AND NOT is_closed
);

-- Mise à jour des politiques pour les messages
DROP POLICY IF EXISTS "doctors_can_insert_messages" ON messages;
CREATE POLICY "doctors_can_insert_messages" ON messages
FOR INSERT WITH CHECK (
  conversation_id IN (
    SELECT id FROM conversations WHERE doctor_id IN (
      SELECT id FROM doctors WHERE user_id = auth.uid()
    )
  )
);

DROP POLICY IF EXISTS "patients_can_insert_messages" ON messages;
CREATE POLICY "patients_can_insert_messages" ON messages
FOR INSERT WITH CHECK (
  conversation_id IN (
    SELECT id FROM conversations
    WHERE patient_id IN (
      SELECT id FROM patients WHERE user_id = auth.uid()
    ) AND allow_patient_reply = true AND NOT is_closed
  )
);

-- =====================================================
-- 4. VÉRIFICATION
-- =====================================================

SELECT '=== NOUVELLES COLONNES CONVERSATIONS ===' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'conversations'
ORDER BY ordinal_position;

SELECT '=== FONCTIONS CRÉÉES ===' as info;
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_name IN ('create_doctor_conversation', 'update_conversation_reply_permission')
  AND routine_type = 'FUNCTION';

SELECT '✅ Système de contrôle des conversations configuré' as status;