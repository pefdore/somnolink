# Guide de Restauration du Système Original

Ce guide explique comment restaurer le système d'assignation patient-médecin basé sur le questionnaire pré-consultation, qui fonctionnait parfaitement avant mes interventions.

## Problème Identifié

Mes modifications ont :
1. Ajouté une colonne `doctor_id` inutile dans la table `patients`
2. Modifié les politiques RLS pour utiliser `patients.doctor_id` au lieu de `appointments.doctor_id`
3. Cassé le système automatisé d'assignation via questionnaire

## Solution

Exécutez les commandes SQL suivantes dans l'éditeur SQL de Supabase (https://supabase.com/dashboard/project/_/sql) :

### Étape 1: Supprimer la colonne inutile
```sql
-- Supprimer la colonne doctor_id de la table patients
ALTER TABLE patients 
DROP COLUMN IF EXISTS doctor_id;
```

### Étape 2: Restaurer les politiques RLS originales pour les notes
```sql
-- Supprimer les politiques modifiées
DROP POLICY IF EXISTS "Doctors can view patient notes" ON notes;
DROP POLICY IF EXISTS "Doctors can view their patients" ON patients;

-- Restaurer la politique originale de visualisation des notes
CREATE POLICY "Doctors can view all patient notes" ON notes
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM doctors
    WHERE doctors.user_id = auth.uid()
  )
);

-- Restaurer la politique d'insertion originale
CREATE POLICY "Doctors can insert patient notes" ON notes
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM doctors 
    WHERE doctors.id = notes.doctor_id 
    AND doctors.user_id = auth.uid()
  )
);

-- Restaurer la politique de mise à jour originale
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

-- Restaurer la politique de suppression originale
CREATE POLICY "Doctors can delete their notes" ON notes
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM doctors 
    WHERE doctors.id = notes.doctor_id 
    AND doctors.user_id = auth.uid()
  )
);
```

### Étape 3: S'assurer que RLS est activé
```sql
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
```

### Étape 4: Politiques pour les patients
```sql
-- Les patients voient leurs propres données
CREATE POLICY "Patients can view own profile" ON patients
FOR SELECT USING (auth.uid() = user_id);

-- Les patients voient leurs propres notes
CREATE POLICY "Patients can view own notes" ON notes
FOR SELECT USING (auth.uid() IN (SELECT user_id FROM patients WHERE patients.id = notes.patient_id));
```

## Fichiers à Supprimer

Les fichiers suivants contiennent les modifications problématiques et doivent être supprimés :

- `supabase/migrations/20250101000002_add_doctor_id_to_patients.sql`
- `supabase/add_doctor_id_to_patients.sql`
- `supabase/execute_doctor_id_migration.sql`
- `supabase/simple_assign_patients.sql`
- `supabase/restore_original_system.sql`

## Vérification

Après exécution des commandes SQL :
1. Le système de questionnaire pré-consultation devrait fonctionner normalement
2. Les patients devraient être automatiquement assignés aux médecins via le questionnaire
3. Les médecins devraient voir uniquement leurs patients ayant des rendez-vous

## Test

Pour tester que le système est restauré :
1. Connectez-vous en tant que patient
2. Remplissez le questionnaire pré-consultation et choisissez un médecin
3. Vérifiez que le médecin sélectionné voit maintenant ce patient dans sa liste