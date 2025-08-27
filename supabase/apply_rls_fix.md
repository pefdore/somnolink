# Instructions pour corriger les politiques RLS des notes

## Problème
Les notes sont insérées avec succès dans la base de données mais n'apparaissent pas dans l'interface patient car les politiques RLS (Row Level Security) empêchent leur lecture.

## Solution
Exécutez le script SQL suivant dans l'éditeur SQL de votre projet Supabase pour corriger les politiques RLS :

1. Allez sur [Supabase Dashboard](https://app.supabase.com/)
2. Sélectionnez votre projet
3. Allez dans l'éditeur SQL (SQL Editor dans le menu de gauche)
4. Copiez-collez le script ci-dessous
5. Exécutez le script

## Script SQL à exécuter

```sql
-- Politiques RLS pour la table notes

-- Activer RLS sur la table notes
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Supprimer les politiques existantes (si elles existent)
DROP POLICY IF EXISTS "Doctors can view all patient notes" ON notes;
DROP POLICY IF EXISTS "Doctors can insert patient notes" ON notes;
DROP POLICY IF EXISTS "Doctors can update their notes" ON notes;
DROP POLICY IF EXISTS "Doctors can delete their notes" ON notes;

-- Politique: Les médecins peuvent voir toutes les notes
CREATE POLICY "Doctors can view all patient notes" ON notes
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM doctors 
    WHERE doctors.user_id = auth.uid()
  )
);

-- Politique: Les médecins peuvent insérer des notes pour leurs patients
CREATE POLICY "Doctors can insert patient notes" ON notes
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM doctors 
    WHERE doctors.id = notes.doctor_id 
    AND doctors.user_id = auth.uid()
  )
);

-- Politique: Les médecins peuvent mettre à jour leurs propres notes
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

-- Politique: Les médecins peuvent supprimer leurs propres notes
CREATE POLICY "Doctors can delete their notes" ON notes
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM doctors 
    WHERE doctors.id = notes.doctor_id 
    AND doctors.user_id = auth.uid()
  )
);
```

## Vérification
Après avoir exécuté le script, testez l'application :
1. Connectez-vous en tant que médecin
2. Allez sur la page d'un patient
3. Ajoutez une note - elle devrait maintenant apparaître dans la timeline

## Alternative
Si vous préférez utiliser la clé de service role, vous devrez :
1. Récupérer la `SUPABASE_SERVICE_ROLE_KEY` dans les paramètres de votre projet Supabase (Settings > API)
2. L'ajouter à votre fichier `.env.local` comme suit :
```
SUPABASE_SERVICE_ROLE_KEY=votre_clé_service_role_ici
```
3. Le code utilisera alors automatiquement le client administrateur pour contourner les politiques RLS