-- Test fonctionnel de la messagerie patient
-- Version simplifiée sans blocs complexes
--
-- INSTRUCTIONS IMPORTANTES :
-- 1. D'abord, trouvez l'ID d'un médecin existant :
--    SELECT id, first_name, last_name FROM doctors LIMIT 5;
--
-- 2. Remplacez TOUTES les occurrences de 'DOCTOR_ID_HERE' par l'ID réel trouvé
--
-- 3. Exécutez ce script dans Supabase SQL Editor
--
-- 4. Testez l'interface patient : /dashboard/patient/messagerie

-- 1. Nettoyer les anciennes données de test
DELETE FROM messages WHERE conversation_id = '6f52787a-7ac4-4b2f-b20a-bbcdda9e7b18';
DELETE FROM conversations WHERE id = '6f52787a-7ac4-4b2f-b20a-bbcdda9e7b18';

-- 2. Vérifier s'il y a des médecins existants, sinon utiliser un ID existant
-- Cette approche évite les insertions problématiques

-- 3. Créer la conversation de test
-- REMPLACER 'DOCTOR_ID_HERE' par l'ID d'un médecin existant dans votre base
INSERT INTO conversations (id, patient_id, doctor_id, last_message, last_message_at, unread_count_patient, allow_patient_reply)
VALUES (
    '6f52787a-7ac4-4b2f-b20a-bbcdda9e7b18',
    '9b71938b-97d3-4419-8141-c0379e3ab224',
    'DOCTOR_ID_HERE', -- 🔴 REMPLACER PAR UN ID DE MÉDECIN EXISTANT
    'Conversation de test',
    '2025-09-03 08:00:00+00',
    0,
    true
);

-- 4. Créer les messages de test
INSERT INTO messages (id, conversation_id, sender_id, receiver_id, content, sender_type, allow_reply, created_at)
VALUES (
    '660e8400-e29b-41d4-a716-446655440010',
    '6f52787a-7ac4-4b2f-b20a-bbcdda9e7b18',
    'DOCTOR_ID_HERE', -- 🔴 MÊME ID QUE DANS LA CONVERSATION
    '9b71938b-97d3-4419-8141-c0379e3ab224',
    'Bonjour ! Voici un message de test du médecin.',
    'doctor',
    true,
    '2025-09-03 06:00:00+00'
);

INSERT INTO messages (id, conversation_id, sender_id, receiver_id, content, sender_type, allow_reply, created_at)
VALUES (
    '660e8400-e29b-41d4-a716-446655440011',
    '6f52787a-7ac4-4b2f-b20a-bbcdda9e7b18',
    '9b71938b-97d3-4419-8141-c0379e3ab224',
    'DOCTOR_ID_HERE', -- 🔴 MÊME ID QUE DANS LA CONVERSATION
    'Bonjour Docteur, merci pour votre message.',
    'patient',
    true,
    '2025-09-03 07:00:00+00'
);

-- 5. Vérifications
SELECT '=== CONVERSATION CRÉÉE ===' as verification;
SELECT id, patient_id, doctor_id, last_message FROM conversations
WHERE id = '6f52787a-7ac4-4b2f-b20a-bbcdda9e7b18';

SELECT '=== MESSAGES CRÉÉS ===' as verification;
SELECT sender_type, content, created_at FROM messages
WHERE conversation_id = '6f52787a-7ac4-4b2f-b20a-bbcdda9e7b18'
ORDER BY created_at;

SELECT '✅ Test de messagerie prêt - vous pouvez maintenant tester l''interface' as status;