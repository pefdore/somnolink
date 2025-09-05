-- Script pour ajouter la colonne created_at manquante à la table patients
-- À exécuter dans Supabase SQL Editor

-- Ajouter la colonne created_at si elle n'existe pas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'patients'
        AND column_name = 'created_at'
    ) THEN
        ALTER TABLE patients ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Colonne created_at ajoutée à la table patients';
    ELSE
        RAISE NOTICE 'Colonne created_at existe déjà dans la table patients';
    END IF;
END $$;

-- Ajouter la colonne updated_at si elle n'existe pas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'patients'
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE patients ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Colonne updated_at ajoutée à la table patients';
    ELSE
        RAISE NOTICE 'Colonne updated_at existe déjà dans la table patients';
    END IF;
END $$;

-- Créer le trigger pour updated_at
CREATE OR REPLACE FUNCTION update_patients_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Supprimer le trigger s'il existe
DROP TRIGGER IF EXISTS update_patients_updated_at ON patients;

-- Créer le trigger
CREATE TRIGGER update_patients_updated_at
    BEFORE UPDATE ON patients
    FOR EACH ROW
    EXECUTE FUNCTION update_patients_updated_at();

-- Vérifier que tout est en ordre
SELECT
    'Structure de la table patients vérifiée' as status,
    COUNT(*) as total_patients
FROM patients;