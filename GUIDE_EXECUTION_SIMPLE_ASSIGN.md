# Guide d'exécution pour assigner les patients aux médecins

## Étape 1: Accéder à l'éditeur SQL de Supabase
1. Allez sur votre projet Supabase
2. Cliquez sur "SQL Editor" dans le menu de gauche
3. Créez une nouvelle requête ou ouvrez l'éditeur

## Étape 2: Exécuter le script simple
Copiez et exécutez le contenu de `supabase/simple_assign_patients.sql` dans l'éditeur SQL.

**Important**: Avant d'exécuter, remplacez l'UUID factice par un vrai ID de médecin :
```sql
-- Remplacer cette ligne
SET doctor_id = '00000000-0000-0000-0000-000000000000'

-- Par (exemple avec un vrai ID)
SET doctor_id = '123e4567-e89b-12d3-a456-426614174000'
```

## Étape 3: Trouver un ID de médecin valide
Exécutez d'abord cette requête pour voir les médecins disponibles :
```sql
SELECT id, first_name, last_name FROM doctors;
```

Copiez l'ID d'un médecin et utilisez-le dans la requête UPDATE.

## Étape 4: Exécution séquentielle
Exécutez les commandes une par une pour vérifier les résultats :
1. D'abord la requête COUNT pour voir combien de patients sans médecin
2. Ensuite la requête SELECT pour voir les médecins
3. Puis la requête UPDATE (après avoir remplacé l'UUID)
4. Enfin les requêtes de vérification

## Alternative: Script avec variable
Si Supabase supporte les variables, vous pouvez utiliser :
```sql
DO $$
DECLARE
  doctor_uuid UUID;
BEGIN
  -- Trouver un médecin
  SELECT id INTO doctor_uuid FROM doctors LIMIT 1;
  
  -- Assigner les patients
  UPDATE patients 
  SET doctor_id = doctor_uuid
  WHERE doctor_id IS NULL;
  
  RAISE NOTICE 'Patients assignés au médecin: %', doctor_uuid;
END $$;
```

## Vérification finale
Après exécution, vérifiez que les patients apparaissent bien dans l'espace médecin.

**Note**: Si vous avez plusieurs médecins, vous voudrez peut-être répartir les patients équitablement plutôt que tous les assigner au même médecin.