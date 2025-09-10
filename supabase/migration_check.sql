-- Vérification de l'état actuel de la table antecedents
SELECT '=== ÉTAT ACTUEL ===' as info;

-- Vérifier les types présents
SELECT type, COUNT(*) as count
FROM antecedents
GROUP BY type
ORDER BY type;

-- Vérifier la contrainte actuelle
SELECT '=== CONTRAINTE ACTUELLE ===' as info;
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conname = 'antecedents_type_check';