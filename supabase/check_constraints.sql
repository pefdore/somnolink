-- Vérification des contraintes de clés étrangères
-- À exécuter pour diagnostiquer le problème

-- 1. Voir toutes les contraintes FK sur la table messages
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS referenced_table,
    ccu.column_name AS referenced_column
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'messages';

-- 2. Voir la structure des tables impliquées
SELECT '=== STRUCTURE MESSAGES ===' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'messages'
ORDER BY ordinal_position;

SELECT '=== STRUCTURE PATIENTS ===' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'patients'
ORDER BY ordinal_position;

SELECT '=== STRUCTURE DOCTORS ===' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'doctors'
ORDER BY ordinal_position;

-- 3. Voir quelques données existantes
SELECT '=== MÉDECINS EXISTANTS ===' as info;
SELECT id, first_name, last_name FROM doctors;

SELECT '=== PATIENTS EXISTANTS ===' as info;
SELECT id, first_name, last_name FROM patients;