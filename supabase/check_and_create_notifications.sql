-- Script pour vérifier et créer manuellement des notifications de test

-- 1. Vérifier les utilisateurs
SELECT 'Users' as type, id, email
FROM auth.users
WHERE email IN ('somnolink14@yopmail.com', 'pfdore.pro@gmail.com');

-- 2. Vérifier les patients et médecins
SELECT 'Patients' as type, p.id, p.user_id, u.email
FROM patients p
JOIN auth.users u ON p.user_id = u.id
WHERE u.email IN ('somnolink14@yopmail.com', 'pfdore.pro@gmail.com')
UNION ALL
SELECT 'Doctors' as type, d.id, d.user_id, u.email
FROM doctors d
JOIN auth.users u ON d.user_id = u.id
WHERE u.email IN ('somnolink14@yopmail.com', 'pfdore.pro@gmail.com');

-- 3. Vérifier les conversations existantes
SELECT
    c.id,
    c.doctor_id,
    c.patient_id,
    c.last_message,
    c.unread_count_doctor,
    c.unread_count_patient,
    d.first_name || ' ' || d.last_name as doctor_name,
    p.first_name || ' ' || p.last_name as patient_name
FROM conversations c
JOIN doctors d ON c.doctor_id = d.id
JOIN patients p ON c.patient_id = p.id;

-- 4. Vérifier les messages existants
SELECT
    m.id,
    m.conversation_id,
    m.sender_type,
    m.content,
    m.created_at,
    CASE
        WHEN m.sender_type = 'doctor' THEN d.first_name || ' ' || d.last_name
        ELSE p.first_name || ' ' || p.last_name
    END as sender_name
FROM messages m
LEFT JOIN doctors d ON m.sender_id = d.id AND m.sender_type = 'doctor'
LEFT JOIN patients p ON m.sender_id = p.id AND m.sender_type = 'patient'
ORDER BY m.created_at DESC;

-- 5. Vérifier les notifications existantes
SELECT
    mn.id,
    mn.message_id,
    mn.user_id,
    mn.is_read,
    mn.created_at,
    u.email as user_email
FROM message_notifications mn
JOIN auth.users u ON mn.user_id = u.id
ORDER BY mn.created_at DESC;

-- 6. Créer une notification de test manuellement
DO $$
DECLARE
    v_doctor_user_id UUID;
    v_message_id UUID;
BEGIN
    -- Trouver l'ID utilisateur du médecin
    SELECT user_id INTO v_doctor_user_id
    FROM doctors d
    JOIN auth.users u ON d.user_id = u.id
    WHERE u.email = 'pfdore.pro@gmail.com';

    -- Trouver un message récent
    SELECT id INTO v_message_id
    FROM messages
    ORDER BY created_at DESC
    LIMIT 1;

    IF v_doctor_user_id IS NOT NULL AND v_message_id IS NOT NULL THEN
        -- Supprimer les anciennes notifications pour ce message
        DELETE FROM message_notifications
        WHERE message_id = v_message_id AND user_id = v_doctor_user_id;

        -- Créer une nouvelle notification
        INSERT INTO message_notifications (message_id, user_id, type, is_read)
        VALUES (v_message_id, v_doctor_user_id, 'message', false);

        RAISE NOTICE 'Notification de test créée pour le médecin';
    ELSE
        RAISE NOTICE 'Impossible de créer la notification - IDs manquants';
    END IF;
END;
$$;

-- 7. Vérification finale des notifications
SELECT
    'Notifications après création' as status,
    COUNT(*) as total_notifications,
    COUNT(CASE WHEN is_read = false THEN 1 END) as unread_notifications
FROM message_notifications;

-- 8. Vérifier les notifications par utilisateur
SELECT
    u.email,
    COUNT(mn.id) as total_notifications,
    COUNT(CASE WHEN mn.is_read = false THEN 1 END) as unread_notifications
FROM auth.users u
LEFT JOIN message_notifications mn ON u.id = mn.user_id
WHERE u.email IN ('somnolink14@yopmail.com', 'pfdore.pro@gmail.com')
GROUP BY u.id, u.email;