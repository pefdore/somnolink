# Correction de l'Erreur de Build TypeScript

## Problème
Erreur de compilation dans `questionnaire-viewer.tsx` à la ligne 171 :
```
Type error: Type 'unknown' is not assignable to type 'ReactNode'.
```

## Solution
Modifier le fichier `src/app/dashboard/doctor/patients/[patientId]/_components/questionnaire-viewer.tsx` :

### Étape 1: Définir une interface pour les réponses
Ajoutez en haut du fichier :
```typescript
interface QuestionnaireAnswers {
  epworth_total?: number;
  // Ajoutez ici les autres champs nécessaires
}
```

### Étape 2: Corriger la ligne problématique
Remplacez la ligne 171 :
```typescript
{answers.epworth_total && (
```

Par :
```typescript
{answers.epworth_total !== undefined && answers.epworth_total > 0 && (
```

### Étape 3: Optionnel - Améliorer la sécurité des types
Si `answers` est actuellement de type `any` ou `unknown`, définissez-le correctement :
```typescript
const answers: QuestionnaireAnswers = {}; // Remplacez par votre logique actuelle
```

## Vérification
Après ces modifications, exécutez :
```bash
npm run build
```

Pour vérifier que l'erreur est résolue.

## Déploiement
Une fois le build local réussi, déployez sur Vercel :
```bash
git add .
git commit -m "fix: type error in questionnaire viewer"
git push origin main
```

## Notes
- Cette correction assure que `epworth_total` est bien un nombre avant de le utiliser dans le JSX
- L'interface `QuestionnaireAnswers` améliore la sécurité type dans tout le composant
- La vérification `!== undefined && > 0` évite les rendus inutiles quand la valeur est 0 ou undefined