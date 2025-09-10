-- SOLUTION RAPIDE : Ajouter la colonne manquante treating_physician_id
-- À exécuter dans Supabase SQL Editor

-- Étape 1: Vérifier si la colonne existe
SELECT column_name FROM information_schema.columns
WHERE table_name = 'patients' AND column_name = 'treating_physician_id';

-- Étape 2: Si elle n'existe pas, l'ajouter
-- ALTER TABLE patients ADD COLUMN treating_physician_id UUID REFERENCES doctors(id);

-- Étape 3: Vérifier toutes les colonnes importantes
SELECT column_name FROM information_schema.columns
WHERE table_name = 'patients'
AND column_name IN ('social_security_number', 'civility', 'gender', 'treating_physician_id', 'birth_name');

-- Étape 4: Tester une mise à jour simple
UPDATE patients SET updated_at = NOW() WHERE email = 'somnolink4@yopmail.com';

-- Étape 5: Vérifier que ça fonctionne
SELECT id, email, social_security_number, civility, gender, updated_at
FROM patients WHERE email = 'somnolink4@yopmail.com';

-- COMMANDES À EXÉCUTER DANS SUPABASE SQL EDITOR :
-- 1. ALTER TABLE patients ADD COLUMN treating_physician_id UUID REFERENCES doctors(id);
-- 2. Puis testez à nouveau le formulaire