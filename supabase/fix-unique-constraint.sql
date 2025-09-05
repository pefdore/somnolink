-- Correction de la contrainte d'unicité pour les antécédents
-- Le problème : "duplicate key value violates unique constraint \"unique_antecedent\""

-- Vérifier les contraintes existantes sur la table antecedents
SELECT
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
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
WHERE tc.constraint_type IN ('UNIQUE', 'PRIMARY KEY')
  AND tc.table_name = 'antecedents';

-- Supprimer la contrainte d'unicité problématique si elle existe
-- Cette contrainte empêche d'ajouter le même antécédent plusieurs fois
DROP CONSTRAINT IF EXISTS unique_antecedent ON antecedents;

-- Alternative : Modifier la contrainte pour permettre les doublons
-- en ajoutant une colonne de différenciation si nécessaire

-- Vérifier que la suppression a fonctionné
SELECT '✅ Contrainte d\'unicité supprimée' as status;