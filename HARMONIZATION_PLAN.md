# Plan d'Harmonisation des Profils Administratifs Patient

## Contexte
L'utilisateur souhaite harmoniser les profils administratifs d'un patient entre les espaces médecin et patient, ajouter le champ "Médecin traitant", et assurer que les mises à jour depuis l'un ou l'autre espace se synchronisent automatiquement.

## Analyse Actuelle

### Espace Médecin (PatientInfoPanel.tsx)
Modal "Informations administratives du patient" contient :
- Matricule INS (social_security_number)
- Sexe (sex)
- Civilité (civility)
- Nom de naissance (birth_name)
- Nom d'usage (last_name)
- Prénom (first_name)
- Date de naissance (date_of_birth)
- Téléphone (phone_number)
- Email (email)
- Adresse (address)

### Espace Patient (profil/page.tsx)
Page de profil contient :
- Informations personnelles (nom, prénom, email, téléphone, date naissance, genre, adresse)
- Informations médicales (allergies, médicaments, conditions médicales)
- Informations de sommeil
- Contacts d'urgence
- Informations d'assurance

## Plan d'Action

### 1. Ajout du champ "Médecin traitant"
- Ajouter colonne `treating_physician_id` à la table `patients`
- Créer migration SQL appropriée
- Mettre à jour les politiques RLS

### 2. Harmonisation des champs
- Uniformiser les champs entre les deux espaces
- S'assurer que tous les champs administratifs sont présents dans les deux interfaces
- Maintenir la cohérence des libellés et validations

### 3. Synchronisation bidirectionnelle
- Mettre à jour les API pour gérer le champ médecin traitant
- Implémenter la logique de synchronisation automatique
- Gérer les conflits de mise à jour

### 4. Interface Utilisateur
- Ajouter le sélecteur de médecin traitant dans les deux espaces
- Améliorer l'UX pour la gestion des informations administratives
- Ajouter des indicateurs visuels pour les champs synchronisés

## Champs à Harmoniser

| Champ | Type | Validation | Obligatoire |
|-------|------|------------|-------------|
| social_security_number | string | Format français | Non |
| sex | enum | M/F | Non |
| civility | enum | M./Mme/Mlle | Non |
| birth_name | string | - | Non |
| last_name | string | - | Oui |
| first_name | string | - | Oui |
| date_of_birth | date | Passé | Non |
| phone_number | string | Format téléphone | Non |
| email | string | Format email | Oui |
| address | object | {street, postal_code, city} | Non |
| treating_physician_id | UUID | Référence doctors.id | Non |

## Étapes de Développement

1. **Migration Base de Données**
   - Créer migration pour ajouter `treating_physician_id`
   - Mettre à jour les index et contraintes

2. **API Routes**
   - Mettre à jour `/api/patient-profile` pour gérer le médecin traitant
   - Mettre à jour `/api/doctor/patient/[patientId]` pour inclure le médecin traitant
   - Ajouter logique de synchronisation

3. **Composants Frontend**
   - Modifier PatientInfoPanel.tsx pour inclure le médecin traitant
   - Modifier profil/page.tsx pour harmoniser avec l'espace médecin
   - Ajouter composant de sélection de médecin traitant

4. **Politiques RLS**
   - S'assurer que les patients peuvent voir leurs médecins traitants
   - S'assurer que les médecins peuvent mettre à jour le médecin traitant de leurs patients

5. **Tests et Validation**
   - Tester la synchronisation bidirectionnelle
   - Valider les permissions d'accès
   - Vérifier l'intégrité des données

## Risques et Considérations

- **Performance** : Requêtes supplémentaires pour récupérer les informations des médecins
- **Sécurité** : S'assurer que seules les bonnes personnes peuvent modifier le médecin traitant
- **Cohérence** : Gérer les cas où un patient change de médecin traitant
- **UX** : Maintenir une interface intuitive dans les deux espaces

## Métriques de Succès

- ✅ Synchronisation automatique entre espaces médecin et patient
- ✅ Champ "Médecin traitant" fonctionnel dans les deux espaces
- ✅ Interface harmonisée et cohérente
- ✅ Données sécurisées et accessibles selon les permissions
- ✅ Performance maintenue malgré les changements