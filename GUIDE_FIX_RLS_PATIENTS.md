# Guide pour corriger l'accès RLS des patients

## Problème
Les patients ne peuvent pas accéder à leur propre profil dans l'application à cause des politiques RLS (Row Level Security) trop restrictives.

## Solution
Exécuter manuellement les commandes SQL suivantes dans l'interface SQL de Supabase.

### Étape 1: Se connecter à Supabase
1. Allez sur [app.supabase.com](https://app.supabase.com)
2. Sélectionnez votre projet Somnolink
3. Allez dans l'onglet "SQL Editor"

### Étape 2: Exécuter les commandes SQL

#### 1. Politique pour permettre aux patients de voir leur propre profil
```sql
DROP POLICY IF EXISTS "Patients can view their own profile" ON patients;
CREATE POLICY "Patients can view their own profile" ON patients
FOR SELECT USING (
  user_id = auth.uid()
);
```

#### 2. Politique pour permettre aux patients de mettre à jour leur propre profil
```sql
DROP POLICY IF EXISTS "Patients can update their own profile" ON patients;
CREATE POLICY "Patients can update their own profile" ON patients
FOR UPDATE USING (
  user_id = auth.uid()
);
```

#### 3. Politique pour permettre aux patients de voir leurs propres notes
```sql
DROP POLICY IF EXISTS "Patients can view their own notes" ON notes;
CREATE POLICY "Patients can view their own notes" ON notes
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM patients
    WHERE patients.id = notes.patient_id
    AND patients.user_id = auth.uid()
  )
);
```

#### 4. S'assurer que RLS est activé
```sql
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
```

### Étape 3: Vérification
Après avoir exécuté ces commandes, vous pouvez vérifier les politiques avec:
```sql
SELECT tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('patients', 'notes')
ORDER BY tablename, policyname;
```

## Résultat attendu
- Les patients peuvent maintenant voir et modifier leur propre profil
- Les patients peuvent voir leurs propres notes médicales
- Les médecins conservent leur accès aux données de leurs patients

## Fichiers concernés
- `src/app/dashboard/patient/profil/page.tsx` - Page de profil patient
- Les politiques RLS dans la base de données Supabase

## Notes importantes
- Ces changements n'affectent pas la sécurité car ils se basent sur `auth.uid()` pour restreindre l'accès aux données de l'utilisateur connecté
- Les médecins conservent leurs politiques d'accès existantes
- Les patients ne peuvent accéder qu'à leurs propres données