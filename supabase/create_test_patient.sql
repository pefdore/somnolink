-- Créer un patient de test avec les bonnes colonnes
-- D'abord vérifier la structure de la table patients

SELECT 'Structure de la table patients' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'patients'
ORDER BY ordinal_position;

-- Créer le patient de test avec les colonnes qui existent
INSERT INTO patients (id, user_id, first_name, last_name, date_of_birth)
VALUES (
  '94311921-8a61-4cb2-a71d-ef8d1c77b43e'::uuid,
  '94311921-8a61-4cb2-a71d-ef8d1c77b43e'::uuid,
  'Patient',
  'Test',
  '1990-01-01'::date
);

-- Vérifier que le patient a été créé
SELECT 'Patient créé' as confirmation;
SELECT id, first_name, last_name, user_id FROM patients WHERE id = '94311921-8a61-4cb2-a71d-ef8d1c77b43e';