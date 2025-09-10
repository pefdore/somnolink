-- Script pour vérifier la structure de la base de données
-- À exécuter dans Supabase SQL Editor

-- 1. Vérifier si le champ treating_physician_id existe
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'patients'
AND column_name = 'treating_physician_id';

-- 2. Ajouter le champ s'il n'existe pas (exécuter seulement si nécessaire)
-- ALTER TABLE patients ADD COLUMN IF NOT EXISTS treating_physician_id UUID REFERENCES doctors(id);
-- CREATE INDEX IF NOT EXISTS idx_patients_treating_physician ON patients(treating_physician_id);
-- COMMENT ON COLUMN patients.treating_physician_id IS 'ID of the primary treating physician for this patient';

-- 3. Vérifier les données des patients de test
SELECT
    p.id,
    p.first_name,
    p.last_name,
    p.email,
    p.social_security_number,
    p.civility,
    p.birth_name,
    p.treating_physician_id,
    d.first_name as doctor_first_name,
    d.last_name as doctor_last_name
FROM patients p
LEFT JOIN doctors d ON p.treating_physician_id = d.id
WHERE p.email IN ('somnolink4@yopmail.com', 'pfdore.pro@gmail.com');

-- 4. Lister tous les médecins disponibles
SELECT
    id,
    first_name,
    last_name,
    email
FROM doctors
ORDER BY last_name, first_name;

-- 5. Compter le nombre total de patients
SELECT
    COUNT(*) as total_patients,
    COUNT(CASE WHEN treating_physician_id IS NOT NULL THEN 1 END) as patients_with_doctor,
    COUNT(CASE WHEN social_security_number IS NOT NULL THEN 1 END) as patients_with_ssn
FROM patients;