-- Test simple de la messagerie - approche minimaliste
-- À exécuter dans Supabase SQL Editor

-- 1. Vérifier la structure actuelle
SELECT '=== TABLES DISPONIBLES ===' as info;
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('messages', 'conversations', 'patients', 'doctors');

-- 2. Vérifier les contraintes de clés étrangères
SELECT '=== CONTRAINTES CLÉS ÉTRANGÈRES ===' as info;
SELECT
    tc.table_name,
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
  AND tc.table_name IN ('messages', 'conversations');

-- 3. Test simple : créer des données de test sans contraintes
DO $$
DECLARE
    test_conversation_id UUID := '6f52787a-7ac4-4b2f-b20a-bbcdda9e7b18';
    test_patient_id UUID := '9b71938b-97d3-4419-8141-c0379e3ab224';
    test_doctor_id UUID;
BEGIN
    -- Récupérer un médecin existant
    SELECT id INTO test_doctor_id FROM doctors LIMIT 1;

    IF test_doctor_id IS NULL THEN
        RAISE NOTICE 'Aucun médecin trouvé - création d''un médecin de test';
        test_doctor_id := gen_random_uuid();
        INSERT INTO doctors (id, user_id, first_name, last_name, email, created_at)
        VALUES (test_doctor_id, gen_random_uuid(), 'Dr', 'Test', 'test@docteur.com', NOW());
    END IF;

    -- Supprimer les anciennes données de test
    DELETE FROM messages WHERE conversation_id = test_conversation_id;
    DELETE FROM conversations WHERE id = test_conversation_id;

    -- Créer la conversation
    INSERT INTO conversations (id, patient_id, doctor_id, last_message, last_message_at, unread_count_patient, allow_patient_reply)
    VALUES (test_conversation_id, test_patient_id, test_doctor_id, 'Test conversation', NOW(), 0, true);

    -- Créer des messages de test (méthode simplifiée)
    INSERT INTO messages (id, conversation_id, sender_id, receiver_id, content, sender_type, allow_reply, created_at)
    VALUES
        (gen_random_uuid(), test_conversation_id, test_doctor_id, test_patient_id, 'Message de test du médecin', 'doctor', true, NOW() - INTERVAL '1 hour'),
        (gen_random_uuid(), test_conversation_id, test_patient_id, test_doctor_id, 'Message de test du patient', 'patient', true, NOW() - INTERVAL '30 minutes');

    RAISE NOTICE '✅ Test de messagerie configuré avec succès';
    RAISE NOTICE 'Conversation ID: %', test_conversation_id;
    RAISE NOTICE 'Patient ID: %', test_patient_id;
    RAISE NOTICE 'Doctor ID: %', test_doctor_id;
END $$;

-- 4. Vérification finale
SELECT '=== CONVERSATION CRÉÉE ===' as info;
SELECT id, patient_id, doctor_id, last_message FROM conversations
WHERE id = '6f52787a-7ac4-4b2f-b20a-bbcdda9e7b18';

SELECT '=== MESSAGES CRÉÉS ===' as info;
SELECT sender_type, content, created_at FROM messages
WHERE conversation_id = '6f52787a-7ac4-4b2f-b20a-bbcdda9e7b18'
ORDER BY created_at;

SELECT '✅ Test terminé - vérifiez maintenant l''interface patient' as status;