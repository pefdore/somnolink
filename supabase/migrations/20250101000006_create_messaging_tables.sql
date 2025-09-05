-- Migration: Création des tables pour le système de messagerie
-- Date: 2025-01-01 00:00:06

-- Table des messages
CREATE TABLE IF NOT EXISTS messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID NOT NULL,
    receiver_id UUID NOT NULL,
    conversation_id UUID DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,
    allow_reply BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    read_at TIMESTAMPTZ,
    FOREIGN KEY (sender_id) REFERENCES doctors(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES patients(id) ON DELETE CASCADE
);

-- Table des pièces jointes
CREATE TABLE IF NOT EXISTS attachments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    message_id UUID NOT NULL,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE
);

-- Table des notifications
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    message_id UUID NOT NULL,
    type TEXT DEFAULT 'message',
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE
);

-- Activer RLS sur toutes les tables
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour la table messages
CREATE POLICY "Doctors can view messages they sent or received" ON messages
FOR SELECT USING (
    sender_id IN (SELECT id FROM doctors WHERE user_id = auth.uid()) OR
    receiver_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
);

CREATE POLICY "Doctors can insert messages" ON messages
FOR INSERT WITH CHECK (
    sender_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
);

CREATE POLICY "Doctors can update messages they sent" ON messages
FOR UPDATE USING (
    sender_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
)
WITH CHECK (
    sender_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
);

-- Politiques RLS pour la table attachments
CREATE POLICY "Users can view attachments for their messages" ON attachments
FOR SELECT USING (
    message_id IN (
        SELECT id FROM messages 
        WHERE sender_id IN (SELECT id FROM doctors WHERE user_id = auth.uid()) OR
              receiver_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
    )
);

CREATE POLICY "Doctors can insert attachments" ON attachments
FOR INSERT WITH CHECK (
    message_id IN (
        SELECT id FROM messages 
        WHERE sender_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
    )
);

-- Politiques RLS pour la table notifications
CREATE POLICY "Users can view their own notifications" ON notifications
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications" ON notifications
FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "System can insert notifications" ON notifications
FOR INSERT WITH CHECK (true); -- Les notifications sont insérées par le système

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_attachments_message_id ON attachments(message_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);