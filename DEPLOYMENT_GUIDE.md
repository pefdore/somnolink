# Guide de Déploiement Somnolink sur Vercel

## 📋 Prérequis
- Un compte GitHub (gratuit)
- Un compte Vercel (gratuit)
- Un projet Supabase (gratuit)

## 🚀 Étape par Étape Détaillée

### Étape 1 : Préparation GitHub

#### 1.1. Initialiser Git (si pas déjà fait)
```bash
# Dans le terminal, à la racine de votre projet
git init
git add .
git commit -m "Initial commit"
```

#### 1.2. Créer un dépôt GitHub
1. Allez sur [github.com](https://github.com)
2. Cliquez sur "+" → "New repository"
3. Nommez-le "somnolink" (ou autre nom)
4. Choisissez "Public" ou "Private"
5. Ne cochez PAS "Initialize this repository with README"

#### 1.3. Lier votre projet local à GitHub
```bash
# Copiez les commandes affichées sur GitHub après la création du dépôt
git remote add origin https://github.com/votre-nom-utilisateur/somnolink.git
git branch -M main
git push -u origin main
```

### Étape 2 : Configuration Vercel

#### 2.1. Créer un compte Vercel
1. Allez sur [vercel.com](https://vercel.com)
2. Cliquez sur "Sign Up"
3. Choisissez "Continue with GitHub"
4. Autorisez l'accès à votre compte GitHub

#### 2.2. Importer votre projet
1. Dans Vercel, cliquez sur "Add New" → "Project"
2. Cliquez sur "Import" à côté de votre dépôt "somnolink"
3. Vercel détectera automatiquement que c'est un projet Next.js

#### 2.3. Configuration automatique
Vercel configurera automatiquement :
- **Framework**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Development Command**: `npm run dev`

### Étape 3 : Variables d'Environnement

#### 3.1. Récupérer les clés Supabase
1. Allez sur votre projet Supabase
2. Settings → API
3. Copiez :
   - `URL` → devient `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → devient `NEXT_PUBLIC_SUPABASE_ANON_KEY`

#### 3.2. Ajouter dans Vercel
1. Dans votre projet Vercel, allez dans "Settings" → "Environment Variables"
2. Ajoutez ces variables :

```
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Étape 4 : Configuration Supabase CORS

#### 4.1. Autoriser Vercel dans Supabase
1. Dans Supabase, allez dans Settings → API
2. Dans "Additional Redirect URLs", ajoutez :
   - `https://somnolink.vercel.app` (votre URL Vercel)
   - `https://somnolink.vercel.app/api/auth/callback` (pour l'authentification)

#### 4.2. Vérifier les politiques RLS
Assurez-vous que vos politiques RLS dans Supabase sont correctement configurées pour l'environnement de production.

### Étape 5 : Déploiement

#### 5.1. Déploiement automatique
Une fois configuré, Vercel déploiera automatiquement :
- À chaque `git push origin main`
- Après chaque modification de variables d'environnement

#### 5.2. Premier déploiement
1. Vercel détectera votre push GitHub
2. Construira automatiquement votre application
3. Vous donnera une URL comme : `https://somnolink.vercel.app`

### Étape 6 : Développement Continu

#### 6.1. Travailler en local
```bash
# Continuer le développement normalement
npm run dev
```

#### 6.2. Déployer des modifications
```bash
# Quand vous voulez déployer des changements
git add .
git commit -m "Description des modifications"
git push origin main
```

#### 6.3. Vérifier le déploiement
1. Vercel construira automatiquement la nouvelle version
2. Vous recevrez un email en cas d'erreur
3. Vérifiez l'URL de déploiement

## 🔧 Résolution de Problèmes Courants

### Build échoue
- Vérifiez que `npm run build` fonctionne en local
- Consultez les logs de build dans Vercel

### Erreurs Supabase
- Vérifiez les variables d'environnement dans Vercel
- Confirmez les configurations CORS dans Supabase

### Authentification ne marche pas
- Ajoutez l'URL Vercel dans les redirect URLs de Supabase

## 📊 URLs Importantes
- **Votre site** : `https://somnolink.vercel.app`
- **Dashboard Vercel** : `https://vercel.com/your-username/somnolink`
- **Supabase** : `https://app.supabase.io/project/votre-projet`

## ⚡ Après le Test
Vous pouvez :
1. Continuer à développer en local avec `npm run dev`
2. Ignorer Vercel et travailler offline
3. Supprimer le projet Vercel si besoin
4. Garder GitHub pour le versioning

Le déploiement sur Vercel n'affecte pas votre capacité à travailler en local !