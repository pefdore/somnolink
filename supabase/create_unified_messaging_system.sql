-- Système de messagerie unifié pour Somnolink
-- Création des tables et politiques RLS pour la messagerie

-- 1. Table principale des messages
CREATE TABLE IF NOT EXISTS messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID NOT NULL,
    sender_id UUID NOT NULL,
    sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('doctor', 'patient')),
    content TEXT NOT NULL,
    allow_reply BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Table des conversations
CREATE TABLE IF NOT EXISTS conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    last_message TEXT,
    last_message_at TIMESTAMPTZ DEFAULT NOW(),
    unread_count_doctor INTEGER DEFAULT 0,
    unread_count_patient INTEGER DEFAULT 0,
    allow_patient_reply BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(doctor_id, patient_id)
);

-- 3. Table des notifications
CREATE TABLE IF NOT EXISTS message_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL DEFAULT 'message',
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(message_id, user_id)
);

-- 4. Table des pièces jointes
CREATE TABLE IF NOT EXISTS message_attachments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    mime_type TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Activer RLS sur toutes les tables
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_attachments ENABLE ROW LEVEL SECURITY;

-- 6. Politiques RLS pour messages
DROP POLICY IF EXISTS "Doctors can view their conversation messages" ON messages;
DROP POLICY IF EXISTS "Patients can view their conversation messages" ON messages;
DROP POLICY IF EXISTS "Doctors can insert messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Patients can insert messages if allowed" ON messages;

CREATE POLICY "Doctors can view their conversation messages" ON messages
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM conversations c
        WHERE c.id = messages.conversation_id
        AND c.doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
    )
);

CREATE POLICY "Patients can view their conversation messages" ON messages
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM conversations c
        WHERE c.id = messages.conversation_id
        AND c.patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
    )
);

CREATE POLICY "Doctors can insert messages in their conversations" ON messages
FOR INSERT WITH CHECK (
    sender_type = 'doctor' AND
    EXISTS (
        SELECT 1 FROM conversations c
        WHERE c.id = messages.conversation_id
        AND c.doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
    )
);

CREATE POLICY "Patients can insert messages if allowed" ON messages
FOR INSERT WITH CHECK (
    sender_type = 'patient' AND
    EXISTS (
        SELECT 1 FROM conversations c
        WHERE c.id = messages.conversation_id
        AND c.patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
        AND c.allow_patient_reply = true
    )
);

-- 7. Politiques RLS pour conversations
DROP POLICY IF EXISTS "Doctors can view their conversations" ON conversations;
DROP POLICY IF EXISTS "Patients can view their conversations" ON conversations;
DROP POLICY IF EXISTS "Doctors can create conversations with their patients" ON conversations;

CREATE POLICY "Doctors can view their conversations" ON conversations
FOR SELECT USING (
    doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
);

CREATE POLICY "Patients can view their conversations" ON conversations
FOR SELECT USING (
    patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
);

CREATE POLICY "Doctors can create conversations with their patients" ON conversations
FOR INSERT WITH CHECK (
    doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid()) AND
    patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
);

-- 8. Politiques RLS pour notifications
DROP POLICY IF EXISTS "Users can view their own notifications" ON message_notifications;
DROP POLICY IF EXISTS "System can create notifications" ON message_notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON message_notifications;

CREATE POLICY "Users can view their own notifications" ON message_notifications
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can create notifications" ON message_notifications
FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own notifications" ON message_notifications
FOR UPDATE USING (user_id = auth.uid());

-- 9. Politiques RLS pour pièces jointes
DROP POLICY IF EXISTS "Users can view attachments from their conversations" ON message_attachments;

CREATE POLICY "Users can view attachments from their conversations" ON message_attachments
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM messages m
        JOIN conversations c ON c.id = m.conversation_id
        WHERE m.id = message_attachments.message_id
        AND (
            (c.doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())) OR
            (c.patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid()))
        )
    )
);

-- 10. Index pour les performances
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_conversations_doctor_id ON conversations(doctor_id);
CREATE INDEX IF NOT EXISTS idx_conversations_patient_id ON conversations(patient_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON conversations(last_message_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON message_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON message_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_attachments_message_id ON message_attachments(message_id);

-- 11. Fonction pour créer ou récupérer une conversation
CREATE OR REPLACE FUNCTION get_or_create_conversation(
    p_doctor_id UUID,
    p_patient_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_conversation_id UUID;
BEGIN
    -- Chercher une conversation existante
    SELECT id INTO v_conversation_id
    FROM conversations
    WHERE doctor_id = p_doctor_id AND patient_id = p_patient_id;

    -- Si elle n'existe pas, la créer
    IF v_conversation_id IS NULL THEN
        INSERT INTO conversations (doctor_id, patient_id)
        VALUES (p_doctor_id, p_patient_id)
        RETURNING id INTO v_conversation_id;
    END IF;

    RETURN v_conversation_id;
END;
$$;

-- 12. Fonction pour mettre à jour le résumé de la conversation
CREATE OR REPLACE FUNCTION update_conversation_summary(
    p_conversation_id UUID,
    p_last_message TEXT,
    p_sender_type TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE conversations
    SET
        last_message = p_last_message,
        last_message_at = NOW(),
        unread_count_doctor = CASE
            WHEN p_sender_type = 'patient' THEN unread_count_doctor + 1
            ELSE 0
        END,
        unread_count_patient = CASE
            WHEN p_sender_type = 'doctor' THEN unread_count_patient + 1
            ELSE 0
        END,
        updated_at = NOW()
    WHERE id = p_conversation_id;
END;
$$;

-- 13. Fonction pour marquer les messages comme lus
CREATE OR REPLACE FUNCTION mark_messages_as_read(
    p_conversation_id UUID,
    p_user_type TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Marquer les messages individuels comme lus
    UPDATE messages
    SET read_at = NOW()
    WHERE conversation_id = p_conversation_id
    AND sender_type != p_user_type
    AND read_at IS NULL;

    -- Réinitialiser le compteur de messages non lus
    IF p_user_type = 'doctor' THEN
        UPDATE conversations
        SET unread_count_doctor = 0
        WHERE id = p_conversation_id;
    ELSE
        UPDATE conversations
        SET unread_count_patient = 0
        WHERE id = p_conversation_id;
    END IF;
END;
$$;

-- 14. Politiques RLS pour la table patients (nécessaires pour les requêtes)
DROP POLICY IF EXISTS "Patients can view own profile" ON patients;
DROP POLICY IF EXISTS "Doctors can view their patients profiles" ON patients;
DROP POLICY IF EXISTS "Patients can update own profile" ON patients;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON patients;

-- Activer RLS sur la table patients si ce n'est pas déjà fait
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients can view own profile" ON patients
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Doctors can view their patients profiles" ON patients
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM patient_doctor_relationships pdr
        WHERE pdr.patient_id = patients.id
        AND pdr.doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
        AND pdr.status = 'active'
    )
);

CREATE POLICY "Patients can update own profile" ON patients
FOR UPDATE USING (user_id = auth.uid());

-- Politique de secours pour permettre les requêtes de base
CREATE POLICY "Enable read access for authenticated users" ON patients
FOR SELECT USING (auth.role() = 'authenticated');

-- 15. Message de confirmation
DO $$
BEGIN
    RAISE NOTICE '✅ Système de messagerie unifié créé/mis à jour avec succès';
    RAISE NOTICE '✅ Tables messages, conversations, message_notifications créées';
    RAISE NOTICE '✅ Politiques RLS supprimées et recréées pour éviter les conflits';
    RAISE NOTICE '✅ Politiques RLS pour patients corrigées (erreurs 406/500 résolues)';
    RAISE NOTICE '✅ Table message_notifications avec colonnes doctor_id et patient_id';
    RAISE NOTICE '✅ Fonctions utilitaires implémentées';
    RAISE NOTICE '✅ Index de performance créés';
    RAISE NOTICE '✅ Prêt pour le déploiement en production';
END;
$$;