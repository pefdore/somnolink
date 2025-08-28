# Correction Complète - Restauration des Patients pour les Médecins

## Problème
La colonne `doctor_id` est manquante dans la table `patients`, empêchant les médecins de voir leurs patients assignés.

## Solution
Exécuter les commandes SQL suivantes dans l'ordre dans l'éditeur SQL de Supabase.

### Étape 1: Ajouter la colonne doctor_id à la table patients
```sql
-- Ajouter la colonne doctor_id à la table patients
ALTER TABLE patients 
ADD COLUMN doctor_id UUID REFERENCES doctors(id);

-- Commentaire pour documenter la modification
COMMENT ON COLUMN patients.doctor_id IS 'Médecin assigné au patient';
```

### Étape 2: Assigner les patients aux médecins basé sur les rendez-vous
```sql
-- Mettre à jour les patients avec leur médecin basé sur le dernier rendez-vous
UPDATE patients p
SET doctor_id = (
    SELECT a.doctor_id 
    FROM appointments a 
    WHERE a.patient_id = p.id 
    ORDER BY a.created_at DESC 
    LIMIT 1
)
WHERE EXISTS (
    SELECT 1 FROM appointments a WHERE a.patient_id = p.id
);

-- Vérifier le résultat
SELECT 
    COUNT(*) AS total_patients,
    COUNT(doctor_id) AS patients_with_doctor,
    COUNT(*) - COUNT(doctor_id) AS patients_without_doctor
FROM patients;
```

### Étape 3: Corriger les politiques RLS
```sql
-- Supprimer la politique temporaire
DROP POLICY IF EXISTS "Doctors can view all patients temporarily" ON patients;

-- Créer la politique correcte basée sur doctor_id
CREATE POLICY "Doctors can view their patients" ON patients
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM doctors 
        WHERE doctors.id = patients.doctor_id 
        AND doctors.user_id = auth.uid()
    )
);

-- Vérifier les politiques actuelles
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'patients'
ORDER BY policyname;
```

### Étape 4: Mettre à jour la politique pour les notes
```sql
-- Corriger la politique des notes pour utiliser doctor_id
DROP POLICY IF EXISTS "Doctors can view all patient notes" ON notes;

CREATE POLICY "Doctors can view their patients notes" ON notes
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM doctors 
        WHERE doctors.id = notes.doctor_id 
        AND doctors.user_id = auth.uid()
    )
);
```

### Étape 5: Vérification finale
```sql
-- Vérifier l'accès des médecins
SELECT 
    d.id AS doctor_id,
    d.first_name,
    d.last_name,
    COUNT(p.id) AS patient_count
FROM doctors d
LEFT JOIN patients p ON d.id = p.doctor_id
GROUP BY d.id, d.first_name, d.last_name;

-- Vérifier que les médecins peuvent voir leurs patients
SELECT * FROM patients WHERE doctor_id IS NOT NULL LIMIT 5;
```

## Résultat Attendu
- ✅ La colonne `doctor_id` est ajoutée à la table `patients`
- ✅ Les patients sont assignés à leurs médecins basé sur les rendez-vous
- ✅ Les politiques RLS sont corrigées pour un accès sécurisé
- ✅ Les médecins peuvent à nouveau voir leurs patients assignés

## Notes Importantes
1. Les patients sans rendez-vous resteront sans `doctor_id` assigné
2. Les politiques RLS assurent que les médecins ne voient que leurs propres patients
3. Cette correction préserve la sécurité des données tout en restaurant la fonctionnalité

## Fichiers Concernés
- `src/app/dashboard/doctor/patients/page.tsx` - Page de liste des patients
- Politiques RLS de la base de données Supabase