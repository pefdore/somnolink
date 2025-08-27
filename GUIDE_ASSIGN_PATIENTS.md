# Guide pour assigner les patients aux médecins

## Problème
Les médecins ne voient plus leurs patients assignés car la colonne `doctor_id` dans la table `patients` est vide ou non remplie.

## Solution
Exécuter manuellement les commandes SQL suivantes dans l'interface SQL de Supabase pour assigner les patients existants à un médecin.

### Étape 1: Se connecter à Supabase
1. Allez sur [app.supabase.com](https://app.supabase.com)
2. Sélectionnez votre projet Somnolink
3. Allez dans l'onglet "SQL Editor"

### Étape 2: Vérifier l'état actuel
```sql
-- Vérifier combien de patients n'ont pas de médecin assigné
SELECT COUNT(*) AS patients_sans_medecin 
FROM patients 
WHERE doctor_id IS NULL;
```

### Étape 3: Trouver un médecin par défaut
```sql
-- Lister tous les médecins disponibles
SELECT id, first_name, last_name, user_id 
FROM doctors;
```

### Étape 4: Assigner les patients à un médecin
Remplacez `'votre_medecin_id_ici'` par l'ID d'un médecin réel de votre table doctors.

```sql
-- Assigner tous les patients sans médecin à un médecin spécifique
UPDATE patients 
SET doctor_id = 'votre_medecin_id_ici'
WHERE doctor_id IS NULL;
```

### Étape 5: Vérifier le résultat
```sql
-- Vérifier que tous les patients ont maintenant un médecin
SELECT 
  (SELECT COUNT(*) FROM patients WHERE doctor_id IS NOT NULL) AS patients_avec_medecin,
  (SELECT COUNT(*) FROM patients WHERE doctor_id IS NULL) AS patients_sans_medecin;

-- Voir la répartition des patients par médecin
SELECT 
  d.first_name || ' ' || d.last_name AS medecin,
  COUNT(p.id) AS nombre_patients
FROM doctors d
LEFT JOIN patients p ON d.id = p.doctor_id
GROUP BY d.id, d.first_name, d.last_name
ORDER BY nombre_patients DESC;
```

## Solution alternative : Recréer la politique RLS temporairement

Si vous voulez que les médecins voient tous les patients temporairement (pour tester), vous pouvez désactiver RLS ou créer une politique moins restrictive :

```sql
-- Politique temporaire pour que les médecins voient tous les patients
DROP POLICY IF EXISTS "Doctors can view their patients" ON patients;
CREATE POLICY "Doctors can view all patients" ON patients
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM doctors 
    WHERE doctors.user_id = auth.uid()
  )
);
```

## Notes importantes
- La colonne `doctor_id` a été ajoutée via la migration `20250101000002_add_doctor_id_to_patients.sql`
- Les politiques RLS existantes exigent que `patients.doctor_id = doctors.id` pour que les médecins voient leurs patients
- Après avoir assigné les patients, les médecins devraient les voir reapparaître dans leur tableau de bord

## Fichiers concernés
- `supabase/migrations/20250101000002_add_doctor_id_to_patients.sql` - Ajout de la colonne doctor_id
- `src/app/dashboard/doctor/page.tsx` - Tableau de bord médecin
- `src/app/dashboard/doctor/patients/page.tsx` - Liste des patients