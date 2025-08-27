# Instructions pour restaurer l'accès des patients

## Problèmes identifiés
1. Les politiques RLS que j'ai ajoutées sont trop restrictives et bloquent l'accès des patients
2. La colonne `doctor_id` a été ajoutée sans valeurs par défaut, causant des erreurs
3. Les patients ne peuvent plus accéder à leurs données

## Étapes de correction

### Étape 1 : Exécuter ces commandes dans l'éditeur SQL de Supabase

```sql
-- Supprimer les politiques RLS restrictives
DROP POLICY IF EXISTS "Doctors can view their patients" ON patients;
DROP POLICY IF EXISTS "Doctors can view patient notes" ON notes;

-- Rétablir les politiques d'origine pour les patients
CREATE POLICY "Patients can view their own profile" ON patients
FOR SELECT USING (user_id = auth.uid());

-- Politique pour les médecins (moins restrictive)
CREATE POLICY "Doctors can view patients" ON patients
FOR SELECT USING (
  doctor_id IS NULL OR 
  EXISTS (
    SELECT 1 FROM doctors 
    WHERE doctors.id = patients.doctor_id 
    AND doctors.user_id = auth.uid()
  )
);

-- Politiques pour les notes
CREATE POLICY "Patients can view their own notes" ON notes
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM patients
    WHERE patients.id = notes.patient_id
    AND patients.user_id = auth.uid()
  )
);

CREATE POLICY "Doctors can view notes" ON notes
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM doctors 
    WHERE doctors.id = notes.doctor_id 
    AND doctors.user_id = auth.uid()
  )
);
```

### Étape 2 : Vérifier la colonne doctor_id
```sql
-- Vérifier si la colonne doctor_id existe et ses valeurs
SELECT COUNT(*) as total_patients, 
       COUNT(doctor_id) as patients_with_doctor,
       COUNT(*) - COUNT(doctor_id) as patients_without_doctor
FROM patients;
```

### Étape 3 : Corriger les données si nécessaire
```sql
-- Pour les patients sans doctor_id, mettre une valeur NULL explicite
UPDATE patients SET doctor_id = NULL WHERE doctor_id IS NULL;
```

### Étape 4 : Vérifier que RLS est correctement configuré
```sql
-- Vérifier les politiques actuelles
SELECT tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('patients', 'notes')
ORDER BY tablename, policyname;
```

## Test de la correction
1. Connectez-vous en tant que patient
2. Vérifiez que le tableau de bord patient s'affiche correctement
3. Vérifiez que les initiales du patient s'affichent
4. Testez l'accès à la section "À faire"
5. Testez l'accès aux antécédents et documents

## Notes importantes
- Les politiques RLS doivent permettre aux patients de voir leurs propres données
- La colonne `doctor_id` doit être nullable pour les patients qui n'ont pas encore de médecin assigné
- Les fonctions SECURITY DEFINER existantes devraient continuer à fonctionner