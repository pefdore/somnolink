-- Migration pour étendre les types d'antécédents autorisés
-- Ajout des types 'allergy' et 'treatment' à la contrainte de vérification

-- Supprimer l'ancienne contrainte
ALTER TABLE antecedents DROP CONSTRAINT IF EXISTS antecedents_type_check;

-- Ajouter la nouvelle contrainte avec tous les types
ALTER TABLE antecedents ADD CONSTRAINT antecedents_type_check
CHECK (type IN ('medical', 'surgical', 'allergy', 'treatment'));

-- Message de confirmation
DO $$
BEGIN
    RAISE NOTICE '✅ Types d''antécédents étendus avec succès';
    RAISE NOTICE '✅ Types autorisés: medical, surgical, allergy, treatment';
END $$;