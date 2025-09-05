-- Script pour restaurer la conversation entre somnolink14@yopmail.com et pfdore.pro@gmail.com

-- 1. Identifier les utilisateurs
SELECT 'Users' as type, id, email, raw_user_meta_data
FROM auth.users
WHERE email IN ('somnolink14@yopmail.com', 'pfdore.pro@gmail.com');

-- 2. Identifier les patients et médecins
SELECT 'Patients' as type, p.id, p.first_name, p.last_name, p.user_id, u.email
FROM patients p
JOIN auth.users u ON p.user_id = u.id
WHERE u.email IN ('somnolink14@yopmail.com', 'pfdore.pro@gmail.com')
UNION ALL
SELECT 'Doctors' as type, d.id, d.first_name, d.last_name, d.user_id, u.email
FROM doctors d
JOIN auth.users u ON d.user_id = u.id
WHERE u.email IN ('somnolink14@yopmail.com', 'pfdore.pro@gmail.com');

-- 3. Vérifier les relations patient-médecin existantes
SELECT
    pdr.id,
    p.first_name || ' ' || p.last_name as patient_name,
    d.first_name || ' ' || d.last_name as doctor_name,
    pdr.status,
    pdr.created_at
FROM patient_doctor_relationships pdr
JOIN patients p ON pdr.patient_id = p.id
JOIN doctors d ON pdr.doctor_id = d.id
WHERE (p.user_id IN (SELECT id FROM auth.users WHERE email IN ('somnolink14@yopmail.com', 'pfdore.pro@gmail.com'))
       OR d.user_id IN (SELECT id FROM auth.users WHERE email IN ('somnolink14@yopmail.com', 'pfdore.pro@gmail.com')));

-- 4. Vérifier les messages existants
SELECT
    m.id,
    m.conversation_id,
    m.sender_type,
    CASE
        WHEN m.sender_type = 'doctor' THEN d.first_name || ' ' || d.last_name
        ELSE p.first_name || ' ' || p.last_name
    END as sender_name,
    m.content,
    m.created_at
FROM messages m
LEFT JOIN doctors d ON m.sender_id = d.id AND m.sender_type = 'doctor'
LEFT JOIN patients p ON m.sender_id = p.id AND m.sender_type = 'patient'
WHERE (d.user_id IN (SELECT id FROM auth.users WHERE email IN ('somnolink14@yopmail.com', 'pfdore.pro@gmail.com'))
       OR p.user_id IN (SELECT id FROM auth.users WHERE email IN ('somnolink14@yopmail.com', 'pfdore.pro@gmail.com')))
ORDER BY m.created_at DESC;

-- 5. Créer la relation patient-médecin si elle n'existe pas
DO $$
DECLARE
    v_patient_id UUID;
    v_doctor_id UUID;
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

    -- Créer la relation si elle n'existe pas
    IF v_patient_id IS NOT NULL AND v_doctor_id IS NOT NULL THEN
        INSERT INTO patient_doctor_relationships (patient_id, doctor_id, status)
        VALUES (v_patient_id, v_doctor_id, 'active')
        ON CONFLICT (patient_id, doctor_id) DO NOTHING;

        RAISE NOTICE 'Relation patient-médecin créée/restaurée';
    ELSE
        RAISE NOTICE 'Impossible de trouver patient ou médecin';
    END IF;
END;
$$;

-- 6. Créer une conversation si elle n'existe pas
DO $$
DECLARE
    v_patient_id UUID;
    v_doctor_id UUID;
    v_conversation_id UUID;
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

    -- Créer la conversation si elle n'existe pas
    IF v_patient_id IS NOT NULL AND v_doctor_id IS NOT NULL THEN
        SELECT id INTO v_conversation_id
        FROM conversations
        WHERE doctor_id = v_doctor_id AND patient_id = v_patient_id;

        IF v_conversation_id IS NULL THEN
            INSERT INTO conversations (doctor_id, patient_id, last_message, allow_patient_reply)
            VALUES (v_doctor_id, v_patient_id, 'Conversation restaurée', true)
            RETURNING id INTO v_conversation_id;

            RAISE NOTICE 'Conversation créée: %', v_conversation_id;
        ELSE
            RAISE NOTICE 'Conversation existait déjà: %', v_conversation_id;
        END IF;
    END IF;
END;
$$;

-- 7. Vérification finale
SELECT
    'Conversations après restauration' as status,
    c.id,
    c.doctor_id,
    c.patient_id,
    c.last_message,
    c.last_message_at,
    d.first_name || ' ' || d.last_name as doctor_name,
    p.first_name || ' ' || p.last_name as patient_name
FROM conversations c
JOIN doctors d ON c.doctor_id = d.id
JOIN patients p ON c.patient_id = p.id
WHERE (d.user_id IN (SELECT id FROM auth.users WHERE email IN ('somnolink14@yopmail.com', 'pfdore.pro@gmail.com'))
       OR p.user_id IN (SELECT id FROM auth.users WHERE email IN ('somnolink14@yopmail.com', 'pfdore.pro@gmail.com')));