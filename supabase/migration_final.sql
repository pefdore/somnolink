-- MIGRATION FINALE : treatment → medication
-- À exécuter dans Supabase SQL Editor

-- Étape 1: Migrer les données
UPDATE antecedents SET type = 'medication' WHERE type = 'treatment';

-- Étape 2: Supprimer l'ancienne contrainte
ALTER TABLE antecedents DROP CONSTRAINT IF EXISTS antecedents_type_check;

-- Étape 3: Créer la nouvelle contrainte
ALTER TABLE antecedents ADD CONSTRAINT antecedents_type_check
CHECK (type IN ('medical', 'surgical', 'allergy', 'medication'));

-- Confirmation
SELECT '✅ MIGRATION RÉUSSIE' as status, COUNT(*) as total_records FROM antecedents;