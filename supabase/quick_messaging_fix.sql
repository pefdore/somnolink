-- Correction rapide de la messagerie patient
-- À exécuter dans Supabase SQL Editor

-- 1. Désactiver RLS temporairement pour test
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE patients DISABLE ROW LEVEL SECURITY;
ALTER TABLE doctors DISABLE ROW LEVEL SECURITY;

-- 2. Ajouter la colonne conversation_id si elle n'existe pas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'messages' AND column_name = 'conversation_id'
    ) THEN
        ALTER TABLE messages ADD COLUMN conversation_id UUID REFERENCES conversations(id);
        RAISE NOTICE 'Colonne conversation_id ajoutée';
    END IF;
END $$;

-- 3. Créer une conversation de test
INSERT INTO conversations (
    id, patient_id, doctor_id, last_message, last_message_at,
    unread_count_patient, allow_patient_reply
) VALUES (
    '6f52787a-7ac4-4b2f-b20a-bbcdda9e7b18',
    '9b71938b-97d3-4419-8141-c0379e3ab224',
    (SELECT id FROM doctors LIMIT 1),
    'Conversation de test',
    NOW(),
    0,
    true
) ON CONFLICT (id) DO NOTHING;

-- 4. Ajouter des messages de test (approche simplifiée)
DELETE FROM messages WHERE conversation_id = '6f52787a-7ac4-4b2f-b20a-bbcdda9e7b18';

-- Récupérer les IDs nécessaires
DO $$
DECLARE
    doctor_id_val UUID;
    patient_id_val UUID := '9b71938b-97d3-4419-8141-c0379e3ab224';
BEGIN
    -- Récupérer le premier médecin disponible
    SELECT id INTO doctor_id_val FROM doctors LIMIT 1;

    IF doctor_id_val IS NOT NULL THEN
        -- Message du médecin au patient
        INSERT INTO messages (
            id, conversation_id, sender_id, receiver_id, content,
            sender_type, allow_reply, created_at
        ) VALUES (
            gen_random_uuid(),
            '6f52787a-7ac4-4b2f-b20a-bbcdda9e7b18',
            doctor_id_val,
            patient_id_val,
            'Bonjour ! Comment allez-vous depuis notre dernière consultation ?',
            'doctor',
            true,
            NOW() - INTERVAL '2 hours'
        );

        -- Message du patient au médecin
        INSERT INTO messages (
            id, conversation_id, sender_id, receiver_id, content,
            sender_type, allow_reply, created_at
        ) VALUES (
            gen_random_uuid(),
            '6f52787a-7ac4-4b2f-b20a-bbcdda9e7b18',
            patient_id_val,
            doctor_id_val,
            'Bonjour Docteur, je vais bien merci. Les médicaments prescrits fonctionnent bien.',
            'patient',
            true,
            NOW() - INTERVAL '1 hour'
        );

        RAISE NOTICE 'Messages de test insérés avec succès';
    ELSE
        RAISE NOTICE 'Aucun médecin trouvé dans la base de données';
    END IF;
END $$;

-- 5. Vérification
SELECT 'Messages dans la conversation:' as info;
SELECT sender_type, content, created_at
FROM messages
WHERE conversation_id = '6f52787a-7ac4-4b2f-b20a-bbcdda9e7b18'
ORDER BY created_at;

SELECT '✅ Messagerie configurée pour test' as status;