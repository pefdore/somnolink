# Plan d'Unification du Système d'Antécédents Médicaux

## Vue d'ensemble
Unification complète des systèmes d'antécédents entre patients et médecins avec synchronisation bidirectionnelle et traçabilité des sources.

## Architecture Actuelle
- **Médecin** : Système CIM11 complet avec table dédiée `antecedents`
- **Patient** : Champs texte simples dans profil et pré-consultation

## Objectifs
1. Utiliser CIM11 pour tous les antécédents
2. Synchronisation entre profil patient et pré-consultation
3. Traçabilité claire des déclarations (patient/médecin)
4. Workflow de validation médicale
5. Indicateurs visuels pour les sources de données

## Structure de Données Unifiée

### Table `antecedents` (extension)
```sql
ALTER TABLE antecedents ADD COLUMN IF NOT EXISTS defined_by VARCHAR(20) DEFAULT 'doctor' CHECK (defined_by IN ('patient', 'doctor'));
ALTER TABLE antecedents ADD COLUMN IF NOT EXISTS validated_by_doctor BOOLEAN DEFAULT false;
ALTER TABLE antecedents ADD COLUMN IF NOT EXISTS patient_note TEXT;
ALTER TABLE antecedents DROP CONSTRAINT IF EXISTS antecedents_doctor_id_fkey; -- Rendre doctor_id optionnel pour les déclarations patient
ALTER TABLE antecedents ALTER COLUMN doctor_id DROP NOT NULL;
```

### Politiques RLS étendues
```sql
-- Patients peuvent voir/modifier leurs propres antécédents
CREATE POLICY "Patients can view their own antecedents" ON antecedents
FOR SELECT USING (patient_id IN (
    SELECT id FROM patients WHERE user_id = auth.uid()
));

CREATE POLICY "Patients can insert their own antecedents" ON antecedents
FOR INSERT WITH CHECK (
    patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
    AND defined_by = 'patient'
);

-- Médecins peuvent valider les antécédents patient
CREATE POLICY "Doctors can validate patient antecedents" ON antecedents
FOR UPDATE USING (
    EXISTS (SELECT 1 FROM patients WHERE patients.id = antecedents.patient_id AND patients.doctor_id IN (
        SELECT id FROM doctors WHERE user_id = auth.uid()
    ))
);
```

## Composants à Créer/Modifier

### 1. Composant CIM11 partagé
- `src/components/shared/CimSearchModal.tsx`
- Réutilisable par patients et médecins
- Interface unifiée pour recherche CIM11

### 2. Gestionnaire d'Antécédents Patient
- `src/components/patient/AntecedentsManager.tsx`
- Interface pour ajouter/modifier antécédents
- Synchronisation avec pré-consultation

### 3. Section Pré-consultation Unifiée
- Modification de `pre-consultation.tsx` section 6
- Utilisation du composant CIM11
- Synchronisation avec profil

### 4. Profil Patient Étendu
- Modification de `profil/page.tsx`
- Remplacement des textarea par CIM11
- Synchronisation bidirectionnelle

### 5. Panneau Médecin Étendu
- Modification de `PatientInfoPanel.tsx`
- Affichage des antécédents avec indicateurs visuels
- Workflow de validation

## Flux de Données

### Déclaration Patient
1. Patient utilise CIM11 search dans profil ou pré-consultation
2. Antécédent créé avec `defined_by = 'patient'`
3. Synchronisation automatique entre les deux interfaces
4. Affichage dans dossier médecin avec label "Déclaré par patient"

### Validation Médecin
1. Médecin voit antécédents patient avec indicateur spécial
2. Peut valider (`validated_by_doctor = true`)
3. Peut ajouter des notes médicales
4. Peut ajouter des antécédents supplémentaires

## Indicateurs Visuels

### Couleurs par source
- 🔵 **Bleu** : Antécédent validé par médecin
- 🟡 **Jaune** : Déclaré par patient, en attente validation
- 🟢 **Vert** : Ajouté par médecin
- 🔴 **Rouge** : Conflit ou anomalie détectée

### Labels
- "Déclaré par patient"
- "Validé par Dr. [Nom]"
- "Ajouté par médecin"
- "À vérifier"

## APIs Requises

### Patient
- `POST /api/patient-antecedents` - Ajouter antécédent patient
- `GET /api/patient-antecedents` - Récupérer antécédents patient
- `PUT /api/patient-antecedents/[id]` - Modifier antécédent patient

### Médecin
- `PUT /api/antecedents/[id]/validate` - Valider antécédent patient
- `POST /api/antecedents/[id]/note` - Ajouter note médicale

## Synchronisation

### Mécanisme
- Hook React `useAntecedentsSync` pour synchronisation temps réel
- Mise à jour automatique des interfaces quand données changent
- Gestion des conflits (même antécédent ajouté par patient et médecin)

### Déclencheurs
- Sauvegarde dans profil → mise à jour pré-consultation
- Sauvegarde dans pré-consultation → mise à jour profil
- Validation médecin → notification patient (optionnel)

## Sécurité et Conformité

### RLS
- Patients ne voient que leurs antécédents
- Médecins voient antécédents de leurs patients
- Audit trail complet des modifications

### Validation
- Vérification CIM11 codes
- Validation des permissions
- Logs d'audit pour modifications sensibles

## Tests et Validation

### Scénarios à tester
1. Patient ajoute antécédent dans profil → apparaît dans pré-consultation
2. Patient ajoute antécédent dans pré-consultation → apparaît dans profil
3. Médecin voit antécédents patient avec bon indicateur
4. Médecin valide antécédent → changement d'indicateur
5. Médecin ajoute antécédent → apparaît chez patient
6. Gestion des doublons et conflits

## Migration des Données Existantes

### Script de migration
```sql
-- Migrer les données texte existantes vers CIM11
-- Créer antécédents depuis medical_conditions
-- Marquer comme defined_by = 'patient' et validated_by_doctor = false
```

## Déploiement Progressif

### Phase 1 : Infrastructure
- Migration base de données
- APIs patient
- Composant CIM11 partagé

### Phase 2 : Interfaces Patient
- Mise à jour profil
- Mise à jour pré-consultation
- Synchronisation

### Phase 3 : Interface Médecin
- Indicateurs visuels
- Workflow validation
- Gestion avancée

### Phase 4 : Optimisations
- Performance
- Cache
- Notifications temps réel