-- Vérifier et créer manuellement un patient pour les tests

-- 1. Vérifier si les patients existent
SELECT 'Patients existants' as check;
SELECT COUNT(*) as total_patients FROM patients;
SELECT id, first_name, last_name, user_id FROM patients LIMIT 5;

-- 2. Vérifier les rendez-vous
SELECT 'Rendez-vous du patient' as check;
SELECT id, patient_id, doctor_id, appointment_datetime
FROM appointments
WHERE patient_id = '94311921-8a61-4cb2-a71d-ef8d1c77b43e';

-- 3. Créer le patient manuellement si nécessaire
INSERT INTO patients (id, user_id, first_name, last_name, date_of_birth)
VALUES (
  '94311921-8a61-4cb2-a71d-ef8d1c77b43e',
  '94311921-8a61-4cb2-a71d-ef8d1c77b43e',
  'Patient',
  'Test',
  '1990-01-01'::date
)
ON CONFLICT (id) DO NOTHING;

-- 4. Vérifier que le patient a été créé
SELECT 'Patient après création' as result;
SELECT id, first_name, last_name, user_id FROM patients WHERE id = '94311921-8a61-4cb2-a71d-ef8d1c77b43e';

-- Message
SELECT '✅ Vérification et création du patient terminée' as status;