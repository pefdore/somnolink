-- Mise à jour de la contrainte CHECK pour la table antecedents
-- Migration de 'treatment' vers 'medication'

-- Étape 1: Mettre à jour toutes les données existantes de 'treatment' vers 'medication'
UPDATE antecedents SET type = 'medication' WHERE type = 'treatment';

-- Étape 2: Supprimer l'ancienne contrainte
ALTER TABLE antecedents DROP CONSTRAINT IF EXISTS antecedents_type_check;

-- Étape 3: Ajouter la nouvelle contrainte avec 'medication' au lieu de 'treatment'
ALTER TABLE antecedents ADD CONSTRAINT antecedents_type_check
CHECK (type IN ('medical', 'surgical', 'allergy', 'medication'));

-- Message de confirmation
DO $$
BEGIN
    RAISE NOTICE '✅ Migration des données treatment → medication terminée';
    RAISE NOTICE '✅ Contrainte antecedents_type_check mise à jour avec succès';
    RAISE NOTICE '✅ Types autorisés: medical, surgical, allergy, medication';
END $$;