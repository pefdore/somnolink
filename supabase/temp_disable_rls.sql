-- Solution temporaire : Désactiver RLS pour diagnostiquer
-- ATTENTION : À utiliser seulement pour les tests !

-- Désactiver RLS sur la table patients temporairement
ALTER TABLE patients DISABLE ROW LEVEL SECURITY;

-- Vérifier que les données sont accessibles
SELECT COUNT(*) as total_patients FROM patients;
SELECT id, first_name, last_name FROM patients LIMIT 3;

-- Message
SELECT '✅ RLS temporairement désactivé pour les patients' as status;