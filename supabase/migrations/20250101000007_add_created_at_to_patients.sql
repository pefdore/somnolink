-- Migration pour ajouter la colonne created_at manquante à la table patients
-- Date: 2025-01-01
-- Description: Ajout de la colonne created_at pour corriger l'erreur dans process_doctor_invitation

-- Ajouter la colonne created_at si elle n'existe pas
ALTER TABLE patients ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Ajouter la colonne updated_at si elle n'existe pas
ALTER TABLE patients ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Créer un trigger pour updated_at si nécessaire
CREATE OR REPLACE FUNCTION update_patients_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Supprimer le trigger s'il existe déjà
DROP TRIGGER IF EXISTS update_patients_updated_at ON patients;

-- Créer le trigger
CREATE TRIGGER update_patients_updated_at
    BEFORE UPDATE ON patients
    FOR EACH ROW
    EXECUTE FUNCTION update_patients_updated_at();

-- Message de confirmation
SELECT '✅ Colonnes created_at et updated_at ajoutées à la table patients' as status;