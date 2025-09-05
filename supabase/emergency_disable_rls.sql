-- SOLUTION D'URGENCE : Désactiver complètement RLS
-- À utiliser seulement pour diagnostiquer le problème

-- Désactiver RLS sur la table patients
ALTER TABLE patients DISABLE ROW LEVEL SECURITY;

-- Vérifier que cela fonctionne
SELECT COUNT(*) as total_patients FROM patients;
SELECT id, first_name, last_name FROM patients LIMIT 3;

-- Message
SELECT '🚨 RLS DÉSACTIVÉ pour la table patients - À RÉACTIVER APRÈS DIAGNOSTIC' as warning;