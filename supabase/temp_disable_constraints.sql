-- Solution temporaire : désactiver les contraintes problématiques
-- ATTENTION : À utiliser seulement pour les tests !

-- 1. Sauvegarder les contraintes actuelles (pour les recréer plus tard)
SELECT '=== CONTRAINTES AVANT MODIFICATION ===' as info;
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS referenced_table
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'messages';

-- 2. Supprimer les contraintes problématiques
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_sender_id_fkey;
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_receiver_id_fkey;

SELECT '✅ Contraintes supprimées temporairement' as status;

-- 3. Maintenant vous pouvez exécuter working_messaging_test.sql
-- Il fonctionnera sans erreurs de contraintes

-- 4. Pour remettre les contraintes plus tard :
/*
-- Recréer les contraintes (à adapter selon votre schéma réel)
ALTER TABLE messages ADD CONSTRAINT messages_sender_id_fkey
    FOREIGN KEY (sender_id) REFERENCES patients(id);

ALTER TABLE messages ADD CONSTRAINT messages_receiver_id_fkey
    FOREIGN KEY (receiver_id) REFERENCES patients(id);
*/

SELECT '🔄 Exécutez maintenant working_messaging_test.sql' as next_step;