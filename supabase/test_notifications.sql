-- Script de test pour vérifier la création des notifications

-- 1. Vérifier les utilisateurs de test
SELECT 'Users' as type, id, email
FROM auth.users
WHERE email IN ('somnolink14@yopmail.com', 'pfdore.pro@gmail.com');

-- 2. Simuler l'envoi d'un message de patient vers médecin
DO $$
DECLARE
    v_patient_id UUID;
    v_doctor_id UUID;
    v_conversation_id UUID;
    v_message_id UUID;
BEGIN
    -- Trouver les IDs
    SELECT p.id INTO v_patient_id
    FROM patients p
    JOIN auth.users u ON p.user_id = u.id
    WHERE u.email = 'somnolink14@yopmail.com';

    SELECT d.id INTO v_doctor_id
    FROM doctors d
    JOIN auth.users u ON d.user_id = u.id
    WHERE u.email = 'pfdore.pro@gmail.com';

    RAISE NOTICE 'Patient ID: %, Doctor ID: %', v_patient_id, v_doctor_id;

    -- Créer une conversation si elle n'existe pas
    SELECT id INTO v_conversation_id
    FROM conversations
    WHERE doctor_id = v_doctor_id AND patient_id = v_patient_id;

    IF v_conversation_id IS NULL THEN
        INSERT INTO conversations (doctor_id, patient_id, last_message, allow_patient_reply)
        VALUES (v_doctor_id, v_patient_id, 'Test message', true)
        RETURNING id INTO v_conversation_id;

        RAISE NOTICE 'Conversation créée: %', v_conversation_id;
    ELSE
        RAISE NOTICE 'Conversation existante: %', v_conversation_id;
    END IF;

    -- Insérer un message
    INSERT INTO messages (conversation_id, sender_id, sender_type, content)
    VALUES (v_conversation_id, v_patient_id, 'patient', 'Ceci est un message de test')
    RETURNING id INTO v_message_id;

    RAISE NOTICE 'Message créé: %', v_message_id;

    -- Créer une notification pour le médecin
    INSERT INTO message_notifications (message_id, user_id, doctor_id, patient_id, type, is_read)
    SELECT
        v_message_id,
        d.user_id,
        v_doctor_id,
        v_patient_id,
        'message',
        false
    FROM doctors d
    WHERE d.id = v_doctor_id;

    RAISE NOTICE 'Notification créée pour le médecin';

    -- Mettre à jour le compteur de la conversation
    UPDATE conversations
    SET
        last_message = 'Ceci est un message de test',
        last_message_at = NOW(),
        unread_count_doctor = unread_count_doctor + 1
    WHERE id = v_conversation_id;

    RAISE NOTICE 'Conversation mise à jour';
END;
$$;

-- 3. Vérifier les résultats
SELECT
    'Notifications après test' as status,
    mn.id,
    mn.user_id,
    mn.is_read,
    mn.created_at,
    u.email as user_email
FROM message_notifications mn
JOIN auth.users u ON mn.user_id = u.id
WHERE u.email IN ('somnolink14@yopmail.com', 'pfdore.pro@gmail.com')
ORDER BY mn.created_at DESC
LIMIT 5;

-- 4. Vérifier les conversations
SELECT
    c.id,
    c.last_message,
    c.unread_count_doctor,
    c.unread_count_patient,
    d.first_name || ' ' || d.last_name as doctor_name,
    p.first_name || ' ' || p.last_name as patient_name
FROM conversations c
JOIN doctors d ON c.doctor_id = d.id
JOIN patients p ON c.patient_id = p.id
WHERE (d.user_id IN (SELECT id FROM auth.users WHERE email IN ('somnolink14@yopmail.com', 'pfdore.pro@gmail.com'))
       OR p.user_id IN (SELECT id FROM auth.users WHERE email IN ('somnolink14@yopmail.com', 'pfdore.pro@gmail.com')));