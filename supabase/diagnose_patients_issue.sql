-- Script de diagnostic pour identifier le problème d'accès aux patients
-- À exécuter dans Supabase SQL Editor

-- 1. Vérifier si les patients existent
SELECT 'Vérification des patients existants' as test;
SELECT COUNT(*) as total_patients FROM patients;
SELECT id, first_name, last_name, user_id FROM patients LIMIT 5;

-- 2. Vérifier les rendez-vous
SELECT 'Vérification des rendez-vous' as test;
SELECT COUNT(*) as total_appointments FROM appointments;
SELECT id, patient_id, doctor_id, appointment_datetime FROM appointments LIMIT 5;

-- 3. Vérifier les politiques RLS actuelles
SELECT 'Politiques RLS actuelles sur patients' as test;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'patients';

-- 4. Tester l'accès direct (en tant qu'utilisateur authentifié)
-- Cette requête devrait retourner des données si les politiques fonctionnent
SELECT 'Test d''accès aux patients' as test;
SELECT p.id, p.first_name, p.last_name
FROM patients p
WHERE p.id IN ('94311921-8a61-4cb2-a71d-ef8d1c77b43e')
LIMIT 5;

-- 5. Vérifier la structure des tables
SELECT 'Structure de la table patients' as test;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'patients'
ORDER BY ordinal_position;

SELECT 'Structure de la table appointments' as test;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'appointments'
ORDER BY ordinal_position;