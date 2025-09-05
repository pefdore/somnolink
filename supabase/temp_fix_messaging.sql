-- Solution temporaire pour corriger la messagerie patient
-- À exécuter dans Supabase SQL Editor

-- =====================================================
-- 1. DIAGNOSTIC DE LA STRUCTURE ACTUELLE
-- =====================================================

SELECT '=== STRUCTURE TABLE MESSAGES ===' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'messages'
ORDER BY ordinal_position;

SELECT '=== POLITIQUES RLS MESSAGES ===' as info;
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'messages';

-- =====================================================
-- 2. AJOUT DE LA COLONNE CONVERSATION_ID SI NÉCESSAIRE
-- =====================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'conversation_id') THEN
        ALTER TABLE messages ADD COLUMN conversation_id UUID REFERENCES conversations(id);
        RAISE NOTICE '✅ Colonne conversation_id ajoutée';
    ELSE
        RAISE NOTICE 'ℹ️ Colonne conversation_id existe déjà';
    END IF;
END $$;

-- =====================================================
-- 3. DÉSACTIVATION TEMPORAIRE RLS POUR TEST
-- =====================================================

ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE patients DISABLE ROW LEVEL SECURITY;
ALTER TABLE doctors DISABLE ROW LEVEL SECURITY;

SELECT '🚨 RLS DÉSACTIVÉ pour test - À RÉACTIVER APRÈS' as warning;

-- =====================================================
-- 4. CRÉATION D'UNE CONVERSATION DE TEST
-- =====================================================

-- Insérer une conversation de test si elle n'existe pas
INSERT INTO conversations (id, patient_id, doctor_id, last_message, last_message_at, unread_count_patient, allow_patient_reply)
SELECT
    '6f52787a-7ac4-4b2f-b20a-bbcdda9e7b18',
    '9b71938b-97d3-4419-8141-c0379e3ab224', -- patient_id du log
    (SELECT id FROM doctors LIMIT 1), -- premier médecin disponible
    'Conversation de test',
    NOW(),
    0,
    true
WHERE NOT EXISTS (SELECT 1 FROM conversations WHERE id = '6f52787a-7ac4-4b2f-b20a-bbcdda9e7b18');

SELECT '✅ Conversation de test créée' as status;

-- =====================================================
-- 5. AJOUT DE MESSAGES DE TEST
-- =====================================================

-- Supprimer les anciens messages de test
DELETE FROM messages WHERE conversation_id = '6f52787a-7ac4-4b2f-b20a-bbcdda9e7b18';

-- Ajouter des messages de test
INSERT INTO messages (conversation_id, sender_id, receiver_id, content, sender_type, allow_reply, created_at) VALUES
('6f52787a-7ac4-4b2f-b20a-bbcdda9e7b18',
 (SELECT id FROM doctors LIMIT 1),
 '9b71938b-97d3-4419-8141-c0379e3ab224',
 'Bonjour ! Comment allez-vous depuis notre dernière consultation ?',
 'doctor',
 true,
 NOW() - INTERVAL '2 hours');

INSERT INTO messages (conversation_id, sender_id, receiver_id, content, sender_type, allow_reply, created_at) VALUES
('6f52787a-7ac4-4b2f-b20a-bbcdda9e7b18',
 '9b71938b-97d3-4419-8141-c0379e3ab224',
 (SELECT id FROM doctors LIMIT 1),
 'Bonjour Docteur, je vais bien merci. Les médicaments prescrits fonctionnent bien.',
 'patient',
 true,
 NOW() - INTERVAL '1 hour');

SELECT '✅ Messages de test ajoutés' as status;

-- =====================================================
-- 6. VÉRIFICATION FINALE
-- =====================================================

SELECT '=== CONVERSATIONS DISPONIBLES ===' as info;
SELECT c.id, c.patient_id, c.doctor_id, c.last_message,
       COUNT(m.id) as message_count
FROM conversations c
LEFT JOIN messages m ON c.id = m.conversation_id
WHERE c.patient_id = '9b71938b-97d3-4419-8141-c0379e3ab224'
GROUP BY c.id, c.patient_id, c.doctor_id, c.last_message;

SELECT '=== MESSAGES DANS LA CONVERSATION ===' as info;
SELECT m.id, m.sender_type, m.content, m.created_at
FROM messages m
WHERE m.conversation_id = '6f52787a-7ac4-4b2f-b20a-bbcdda9e7b18'
ORDER BY m.created_at;

-- =====================================================
-- INSTRUCTIONS DE RÉACTIVATION
-- =====================================================

/*
APRÈS LES TESTS, RÉACTIVER RLS AVEC :

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;

PUIS EXÉCUTER : supabase/fix_patient_messaging_rls.sql
*/