# Correction des Variables d'Environnement Supabase sur Vercel

## Problème
L'erreur "Your project's URL and Key are required to create a Supabase client" indique que les variables d'environnement Supabase ne sont pas accessibles côté serveur sur Vercel.

## Solution
Vous devez ajouter les variables d'environnement **sans le préfixe `NEXT_PUBLIC_`** dans les paramètres Vercel.

## Étapes à suivre :

### 1. Allez sur le dashboard Vercel
- Connectez-vous à [vercel.com](https://vercel.com)
- Sélectionnez votre projet "somnolink"
- Allez dans "Settings" → "Environment Variables"

### 2. Ajoutez ces variables SUPPLÉMENTAIRES :
**⚠️ IMPORTANT : Utilisez les MÊMES VALEURS que vos variables `NEXT_PUBLIC_` existantes**

| Nom de la variable | Valeur |
|-------------------|--------|
| `SUPABASE_URL` | `https://lowggzrubaudrtktfccu.supabase.co` |
| `SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxvd2dnenJ1YmF1ZHJ0a3RmY2N1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MTcyNDQsImV4cCI6MjA3MDA5MzI0NH0.bOgwnT906eQ0NUxzSqdo64X4cCj51a9t83G9yC6UO3I` |

### 3. Configuration des environnements
- **Environment** : Sélectionnez "Production" (et "Preview" si vous voulez tester)
- **Apply to** : Tous les environnements

### 4. Redéploiement automatique
- Vercel redéploiera automatiquement après l'ajout des variables
- Surveillez les logs pour confirmer que l'erreur a disparu

## Pourquoi cette erreur se produit ?
- Le code serveur ([`src/lib/supabase/server.ts`](src/lib/supabase/server.ts:1)) utilise `process.env.SUPABASE_URL` et `process.env.SUPABASE_ANON_KEY`
- Seules les variables sans `NEXT_PUBLIC_` sont disponibles côté serveur
- Les variables `NEXT_PUBLIC_` sont injectées dans le code client seulement

## Vérification
Après avoir ajouté les variables, vérifiez que :
1. ✅ La build réussit sans erreurs
2. ✅ L'application charge sans "Application error"
3. ✅ Les médecins peuvent accéder à leurs listes de patients

## Commandes Git pour pousser les modifications (si nécessaire) :
```bash
git add src/lib/supabase/server.ts
git commit -m "fix: support variables without NEXT_PUBLIC_ prefix for server-side"
git push origin main
```

**Note**: J'ai déjà modifié le fichier [`src/lib/supabase/server.ts`](src/lib/supabase/server.ts:10) pour supporter à la fois les variables avec et sans le préfixe `NEXT_PUBLIC_`.