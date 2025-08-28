# Script de Diagnostic pour la Base de Données Somnolink

## Objectif
Diagnostiquer le problème où les médecins ne voient plus leurs patients assignés après une panne lors des mises à jour.

## Instructions
Exécutez les requêtes SQL suivantes dans l'éditeur SQL de Supabase pour analyser l'état actuel de la base de données.

## Requêtes de Diagnostic

### 1. Vérifier la structure de la table patients
```sql
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'patients'
ORDER BY ordinal_position;
```

### 2. Vérifier l'existence de la colonne doctor_id
```sql
-- Vérifier si la colonne doctor_id existe dans patients
SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'patients' 
    AND column_name = 'doctor_id'
) AS has_doctor_id_column;
```

### 3. Vérifier les données dans la table patients
```sql
-- Compter les patients avec et sans doctor_id
SELECT 
    COUNT(*) AS total_patients,
    COUNT(doctor_id) AS patients_with_doctor,
    COUNT(*) - COUNT(doctor_id) AS patients_without_doctor
FROM patients;
```

### 4. Vérifier les politiques RLS sur la table patients
```sql
-- Lister toutes les politiques RLS pour la table patients
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'patients'
ORDER BY policyname;
```

### 5. Vérifier les données dans la table appointments
```sql
-- Vérifier les rendez-vous existants et leur relation avec les médecins
SELECT 
    COUNT(*) AS total_appointments,
    COUNT(DISTINCT patient_id) AS unique_patients_with_appointments,
    COUNT(DISTINCT doctor_id) AS unique_doctors_with_appointments
FROM appointments;
```

### 6. Vérifier la correspondance entre doctors et users
```sql
-- Vérifier que tous les médecins ont un user_id valide
SELECT 
    COUNT(*) AS total_doctors,
    COUNT(d.user_id) AS doctors_with_user_id,
    COUNT(*) - COUNT(d.user_id) AS doctors_without_user_id,
    COUNT(u.id) AS doctors_with_valid_user
FROM doctors d
LEFT JOIN auth.users u ON d.user_id = u.id;
```

### 7. Vérifier l'accès d'un médecin spécifique
```sql
-- Remplacer 'votre_user_id_ici' par l'ID d'un médecin connecté
SELECT 
    d.id AS doctor_id,
    d.first_name,
    d.last_name,
    d.user_id,
    COUNT(p.id) AS patient_count
FROM doctors d
LEFT JOIN patients p ON d.id = p.doctor_id
WHERE d.user_id = 'votre_user_id_ici'
GROUP BY d.id, d.first_name, d.last_name, d.user_id;
```

## Interprétation des Résultats

1. **Colonne doctor_id**: Si `has_doctor_id_column` est `false`, la colonne n'existe pas et doit être ajoutée.

2. **Patients sans médecin**: Si `patients_without_doctor` est supérieur à 0, les patients ne sont pas assignés.

3. **Politiques RLS**: Vérifiez qu'il existe une politique permettant aux médecins de voir leurs patients basée sur `doctor_id`.

4. **Rendez-vous**: Assurez-vous qu'il y a des rendez-vous liant patients et médecins.

5. **Correspondance users**: Tous les médecins doivent avoir un `user_id` valide lié à un utilisateur auth.

## Prochaines Étapes

Après avoir exécuté ces requêtes, partagez les résultats pour que je puisse vous aider à appliquer les corrections appropriées.