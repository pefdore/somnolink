# Guide de Restauration Manuelle pour Supabase

Ce guide explique comment exécuter manuellement les commandes SQL dans l'interface Supabase pour restaurer le système original.

## Accès à l'éditeur SQL Supabase

1. Allez sur https://supabase.com/dashboard/
2. Connectez-vous et sélectionnez votre projet
3. Cliquez sur "SQL Editor" dans le menu de gauche

## Commandes à exécuter (une par une)

### Étape 1: Supprimer les politiques problématiques

```sql
-- Supprimer la politique qui dépend de doctor_id
DROP POLICY IF EXISTS "Doctors can view patients" ON patients;
```

### Étape 2: Supprimer la colonne doctor_id

```sql
-- Supprimer la colonne avec CASCADE pour gérer les dépendances
ALTER TABLE patients DROP COLUMN IF EXISTS doctor_id CASCADE;
```

### Étape 3: Restaurer les politiques originales

#### Politique pour voir toutes les notes
```sql
CREATE POLICY "Doctors can view all patient notes" ON notes
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM doctors
    WHERE doctors.user_id = auth.uid()
  )
);
```

#### Politique pour insérer des notes
```sql
CREATE POLICY "Doctors can insert patient notes" ON notes
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM doctors 
    WHERE doctors.id = notes.doctor_id 
    AND doctors.user_id = auth.uid()
  )
);
```

#### Politique pour mettre à jour des notes
```sql
CREATE POLICY "Doctors can update their notes" ON notes
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM doctors 
    WHERE doctors.id = notes.doctor_id 
    AND doctors.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM doctors 
    WHERE doctors.id = notes.doctor_id 
    AND doctors.user_id = auth.uid()
  )
);
```

#### Politique pour supprimer des notes
```sql
CREATE POLICY "Doctors can delete their notes" ON notes
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM doctors 
    WHERE doctors.id = notes.doctor_id 
    AND doctors.user_id = auth.uid()
  )
);
```

#### Politique pour les patients - voir leur profil
```sql
CREATE POLICY "Patients can view own profile" ON patients
FOR SELECT USING (auth.uid() = user_id);
```

#### Politique pour les patients - voir leurs notes
```sql
CREATE POLICY "Patients can view own notes" ON notes
FOR SELECT USING (auth.uid() IN (SELECT user_id FROM patients WHERE patients.id = notes.patient_id));
```

### Étape 4: Vérifier que RLS est activé

```sql
-- Vérifier que RLS est activé sur les tables
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
```

## Vérification

Après avoir exécuté toutes ces commandes, le système devrait être restauré à son état original. Le questionnaire pré-consultation devrait fonctionner normalement et assigner automatiquement les patients aux médecins via la table `appointments`.

## Notes importantes

- Exécutez les commandes une par une dans l'ordre indiqué
- Les erreurs de syntaxe dans l'éditeur local sont normales car il utilise T-SQL au lieu de PostgreSQL
- Ces commandes sont spécifiques à PostgreSQL/Supabase et fonctionneront correctement dans l'éditeur SQL de Supabase