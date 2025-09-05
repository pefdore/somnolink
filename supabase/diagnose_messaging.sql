-- Script de diagnostic pour le système de messagerie
-- Vérifier l'état actuel des tables et données

-- 1. Vérifier si les tables existent
DO $$
DECLARE
    table_exists BOOLEAN;
BEGIN
    -- Vérifier la table conversations
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'conversations'
    ) INTO table_exists;

    IF table_exists THEN
        RAISE NOTICE '✅ Table conversations existe';
    ELSE
        RAISE NOTICE '❌ Table conversations n''existe pas';
    END IF;

    -- Vérifier la table messages
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'messages'
    ) INTO table_exists;

    IF table_exists THEN
        RAISE NOTICE '✅ Table messages existe';
    ELSE
        RAISE NOTICE '❌ Table messages n''existe pas';
    END IF;

    -- Vérifier la table message_notifications
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'message_notifications'
    ) INTO table_exists;

    IF table_exists THEN
        RAISE NOTICE '✅ Table message_notifications existe';
    ELSE
        RAISE NOTICE '❌ Table message_notifications n''existe pas';
    END IF;
END;
$$;

-- 2. Compter les enregistrements dans chaque table
SELECT 'conversations' as table_name, COUNT(*) as count FROM conversations
UNION ALL
SELECT 'messages' as table_name, COUNT(*) as count FROM messages
UNION ALL
SELECT 'message_notifications' as table_name, COUNT(*) as count FROM message_notifications;

-- 3. Vérifier les utilisateurs mentionnés
SELECT 'Patients' as type, id, first_name, last_name, email
FROM patients
WHERE email IN ('somnolink14@yopmail.com', 'pfdore.pro@gmail.com')
UNION ALL
SELECT 'Doctors' as type, id, first_name, last_name, email
FROM doctors
WHERE email IN ('somnolink14@yopmail.com', 'pfdore.pro@gmail.com');

-- 4. Chercher des conversations existantes entre ces utilisateurs
SELECT
    c.id as conversation_id,
    c.doctor_id,
    c.patient_id,
    c.last_message,
    c.last_message_at,
    c.unread_count_doctor,
    c.unread_count_patient,
    d.first_name as doctor_first_name,
    d.last_name as doctor_last_name,
    d.email as doctor_email,
    p.first_name as patient_first_name,
    p.last_name as patient_last_name,
    p.email as patient_email
FROM conversations c
JOIN doctors d ON c.doctor_id = d.id
JOIN patients p ON c.patient_id = p.id
WHERE (d.email IN ('somnolink14@yopmail.com', 'pfdore.pro@gmail.com')
       OR p.email IN ('somnolink14@yopmail.com', 'pfdore.pro@gmail.com'));

-- 5. Chercher des messages existants
SELECT
    m.id as message_id,
    m.conversation_id,
    m.sender_id,
    m.sender_type,
    m.content,
    m.created_at,
    CASE
        WHEN m.sender_type = 'doctor' THEN d.first_name || ' ' || d.last_name
        ELSE p.first_name || ' ' || p.last_name
    END as sender_name,
    CASE
        WHEN m.sender_type = 'doctor' THEN d.email
        ELSE p.email
    END as sender_email
FROM messages m
LEFT JOIN doctors d ON m.sender_id = d.id AND m.sender_type = 'doctor'
LEFT JOIN patients p ON m.sender_id = p.id AND m.sender_type = 'patient'
WHERE (d.email IN ('somnolink14@yopmail.com', 'pfdore.pro@gmail.com')
       OR p.email IN ('somnolink14@yopmail.com', 'pfdore.pro@gmail.com'))
ORDER BY m.created_at DESC;

-- 6. Chercher des notifications
SELECT
    mn.id as notification_id,
    mn.user_id,
    mn.message_id,
    mn.is_read,
    mn.created_at,
    CASE
        WHEN d.email IS NOT NULL THEN d.first_name || ' ' || d.last_name
        WHEN p.email IS NOT NULL THEN p.first_name || ' ' || p.last_name
        ELSE 'Utilisateur inconnu'
    END as user_name,
    CASE
        WHEN d.email IS NOT NULL THEN d.email
        WHEN p.email IS NOT NULL THEN p.email
        ELSE 'Email inconnu'
    END as user_email
FROM message_notifications mn
LEFT JOIN doctors d ON mn.user_id = d.user_id
LEFT JOIN patients p ON mn.user_id = p.user_id
WHERE (d.email IN ('somnolink14@yopmail.com', 'pfdore.pro@gmail.com')
       OR p.email IN ('somnolink14@yopmail.com', 'pfdore.pro@gmail.com'))
ORDER BY mn.created_at DESC;