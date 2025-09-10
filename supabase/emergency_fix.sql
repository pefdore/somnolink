-- SOLUTION D'URGENCE : Contournement temporaire
-- À exécuter si la migration normale ne fonctionne pas

-- Étape 1: Modifier temporairement la contrainte pour inclure les deux types
ALTER TABLE antecedents DROP CONSTRAINT IF EXISTS antecedents_type_check;
ALTER TABLE antecedents ADD CONSTRAINT antecedents_type_check
CHECK (type IN ('medical', 'surgical', 'allergy', 'treatment', 'medication'));

-- Étape 2: Migrer progressivement les données
UPDATE antecedents SET type = 'medication' WHERE type = 'treatment';

-- Étape 3: Supprimer l'ancien type de la contrainte
ALTER TABLE antecedents DROP CONSTRAINT IF EXISTS antecedents_type_check;
ALTER TABLE antecedents ADD CONSTRAINT antecedents_type_check
CHECK (type IN ('medical', 'surgical', 'allergy', 'medication'));

-- Vérification finale
SELECT type, COUNT(*) FROM antecedents GROUP BY type;