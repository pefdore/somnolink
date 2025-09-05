-- Diagnostic complet du problème patients
-- À exécuter dans Supabase SQL Editor

-- 1. Vérifier si RLS est activé/désactivé
SELECT 'État RLS sur patients' as test;
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'patients';

-- 2. Compter les patients
SELECT 'Nombre total de patients' as test;
SELECT COUNT(*) as total_patients FROM patients;

-- 3. Voir quelques patients
SELECT 'Échantillon de patients' as test;
SELECT id, first_name, last_name, user_id FROM patients LIMIT 5;

-- 4. Vérifier les rendez-vous
SELECT 'Rendez-vous avec patient_id' as test;
SELECT id, patient_id, doctor_id, appointment_datetime
FROM appointments
WHERE patient_id = '94311921-8a61-4cb2-a71d-ef8d1c77b43e'
LIMIT 5;

-- 5. Tester la correspondance directe
SELECT 'Test de correspondance patient' as test;
SELECT p.id, p.first_name, p.last_name, p.user_id
FROM patients p
WHERE p.id::text = '94311921-8a61-4cb2-a71d-ef8d1c77b43e';

-- 6. Vérifier les types de données
SELECT 'Types de données - patients' as test;
SELECT column_name, data_type, udt_name
FROM information_schema.columns
WHERE table_name = 'patients' AND column_name = 'id';

SELECT 'Types de données - appointments' as test;
SELECT column_name, data_type, udt_name
FROM information_schema.columns
WHERE table_name = 'appointments' AND column_name = 'patient_id';

-- 7. Vérifier auth.users
SELECT 'Utilisateurs dans auth.users' as test;
SELECT id, email, raw_user_meta_data
FROM auth.users
WHERE id::text = '94311921-8a61-4cb2-a71d-ef8d1c77b43e';