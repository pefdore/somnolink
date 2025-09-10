-- Script pour ajouter les colonnes manquantes dans la table patients
-- À exécuter dans Supabase SQL Editor

-- 1. Vérifier les colonnes actuelles de la table patients
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'patients'
ORDER BY ordinal_position;

-- 2. Ajouter la colonne treating_physician_id si elle n'existe pas
-- ALTER TABLE patients ADD COLUMN treating_physician_id UUID REFERENCES doctors(id);

-- 3. Créer un index pour améliorer les performances
-- CREATE INDEX idx_patients_treating_physician ON patients(treating_physician_id);

-- 4. Ajouter un commentaire descriptif
-- COMMENT ON COLUMN patients.treating_physician_id IS 'ID of the primary treating physician for this patient';

-- 5. Vérifier que les colonnes importantes existent
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'patients'
AND column_name IN (
    'social_security_number',
    'civility',
    'gender',
    'treating_physician_id',
    'birth_name'
)
ORDER BY column_name;

-- 6. Tester une mise à jour simple
UPDATE patients
SET updated_at = NOW()
WHERE email = 'somnolink4@yopmail.com';

-- 7. Vérifier les données après mise à jour
SELECT
    id,
    first_name,
    last_name,
    email,
    social_security_number,
    civility,
    gender,
    treating_physician_id,
    updated_at
FROM patients
WHERE email = 'somnolink4@yopmail.com';