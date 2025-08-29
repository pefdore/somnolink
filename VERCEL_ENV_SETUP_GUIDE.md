# Guide de Configuration des Variables d'Environnement Vercel

## Problème Identifié
L'application déployée sur Vercel ne peut pas initialiser le client Supabase car les variables d'environnement `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY` ne sont pas disponibles côté client.

## Solution
Ajouter les variables d'environnement suivantes dans le tableau de bord Vercel :

### Variables Requises pour Vercel
1. **NEXT_PUBLIC_SUPABASE_URL** = `https://lowggzrubaudrtktfccu.supabase.co`
2. **NEXT_PUBLIC_SUPABASE_ANON_KEY** = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxvd2dnenJ1YmF1ZHJ0a3RmY2N1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MTcyNDQsImV4cCI6MjA3MDA5MzI0NH0.bOgwnT906eQ0NUxzSqdo64X4cCj51a9t83G9yC6UO3I`

### Variables Optionnelles (pour le serveur)
3. **SUPABASE_URL** = `https://lowggzrubaudrtktfccu.supabase.co`
4. **SUPABASE_ANON_KEY** = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxvd2dnenJ1YmF1ZHJ0a3RmY2N1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MTcyNDQsImV4cCI6MjA3MDA5MzI0NH0.bOgwnT906eQ0NUxzSqdo64X4cCj51a9t83G9yC6UO3I`

## Étapes pour Configurer Vercel

1. **Aller sur le tableau de bord Vercel**
   - Ouvrez https://vercel.com
   - Sélectionnez votre projet Somnolink

2. **Accéder aux paramètres d'environnement**
   - Cliquez sur "Settings" → "Environment Variables"

3. **Ajouter les variables**
   - Cliquez sur "Add New"
   - Pour chaque variable :
     - **Name**: `NEXT_PUBLIC_SUPABASE_URL`
     - **Value**: `https://lowggzrubaudrtktfccu.supabase.co`
     - **Environment**: Production, Preview, Development (tous)
   
   - Répétez pour `NEXT_PUBLIC_SUPABASE_ANON_KEY`

4. **Redéployer l'application**
   - Après avoir ajouté les variables, redéployez manuellement ou attendez le prochain commit

## Vérification

Pour vérifier que les variables sont correctement configurées :

1. **Visitez la page de debug**: `/debug/env`
2. **Ouvrez la console navigateur** (F12) et vérifiez :
   - Aucune erreur "Supabase client: URL and API key required"
   - Les variables NEXT_PUBLIC_* doivent apparaître avec leurs valeurs

## Notes Importantes

- Les variables préfixées par `NEXT_PUBLIC_` sont incluses dans le bundle client
- Les variables sans préfixe sont uniquement disponibles côté serveur
- Le fichier `.env.local` n'est utilisé qu'en développement local
- Vercel nécessite une configuration explicite des variables d'environnement

## Debug Additionnel

J'ai créé une page de debug à `/debug/env` pour afficher les variables d'environnement disponibles côté client.

Si le problème persiste après configuration :
1. Vérifiez l'orthographe des noms de variables
2. Assurez-vous que les valeurs sont exactes (copiez-collées depuis ce guide)
3. Redéployez complètement l'application
4. Videz le cache du navigateur