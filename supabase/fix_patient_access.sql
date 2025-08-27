-- Correction des politiques RLS pour restaurer l'accès des patients
-- Cette correction permet aux patients d'accéder à leurs propres données

-- 1. Supprimer les politiques RLS restrictives que j'ai ajoutées par erreur
DROP POLICY IF EXISTS "Doctors can view their patients" ON patients;

-- 2. Créer une politique qui permet aux patients de voir leur propre profil
CREATE POLICY "Patients can view their own profile" ON patients
FOR SELECT USING (
  user_id = auth.uid()
);

-- 3. Créer une politique qui permet aux médecins de voir leurs patients
CREATE POLICY "Doctors can view their patients" ON patients
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM doctors
    WHERE doctors.id = patients.doctor_id
    AND doctors.user_id = auth.uid()
  )
);

-- 3.1. Ajouter une politique pour permettre aux patients de mettre à jour leur propre profil
CREATE POLICY "Patients can update their own profile" ON patients
FOR UPDATE USING (
  user_id = auth.uid()
);

-- 4. Corriger les politiques RLS pour les notes pour permettre aux patients de voir leurs propres notes
DROP POLICY IF EXISTS "Doctors can view all patient notes" ON notes;

CREATE POLICY "Patients can view their own notes" ON notes
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM patients
    WHERE patients.id = notes.patient_id
    AND patients.user_id = auth.uid()
  )
);

CREATE POLICY "Doctors can view their patients notes" ON notes
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM doctors 
    WHERE doctors.id = notes.doctor_id 
    AND doctors.user_id = auth.uid()
  )
);

-- 5. S'assurer que RLS est activé sur la table patients
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

-- 6. Vérifier que la table patients a les bonnes politiques
SELECT tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'patients';

-- 7. Vérifier que la table notes a les bonnes politiques
SELECT tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'notes';