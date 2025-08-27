# Guide de Vérification Complète du Système Somnolink

## 📋 Objectif
Ce guide vous aide à exécuter le script de correction complet et à vérifier l'intégrité de votre système Somnolink.

## 🚨 Problèmes Identifiés
1. **Table antecedents** : Inexistante ou avec des politiques RLS incorrectes
2. **Politiques RLS obsolètes** : Références à `patients.doctor_id` au lieu du système `appointments`
3. **Fonctions RPC incohérentes** : Doublons et signatures incorrectes
4. **API Directe** : Tentatives d'insertion sans contournement RLS

## 🛠️ Script de Correction
Le fichier [`supabase/complete_system_fix.sql`](supabase/complete_system_fix.sql:1) contient toutes les corrections nécessaires.

## 📝 Instructions d'Exécution

### Étape 1: Exécution du Script dans Supabase
1. **Ouvrez l'éditeur SQL de Supabase**
   - Allez sur supabase.com → votre projet → SQL Editor

2. **Copiez-collez le contenu complet** de [`supabase/complete_system_fix.sql`](supabase/complete_system_fix.sql:1)

3. **Exécutez le script complet**
   - Cliquez sur "Run" ou appuyez sur Ctrl+Enter

4. **Vérifiez les résultats**
   - Le script affichera des messages de confirmation
   - Aucune erreur ne devrait apparaître

### Étape 2: Vérifications Immédiates
```sql
-- Vérifier l'existence de la table antecedents
SELECT * FROM antecedents LIMIT 1;

-- Tester la fonction get_patient_antecedents
SELECT * FROM get_patient_antecedents('d4da7554-d863-4a90-a718-adfe9ba85ad8');

-- Vérifier les politiques RLS
SELECT * FROM pg_policies WHERE tablename = 'antecedents';
```

### Étape 3: Tests Fonctionnels
1. **Testez l'API Antécédents**
   ```bash
   # Utilisez curl ou votre client HTTP préféré
   curl -X POST http://localhost:3000/api/antecedents \
     -H "Content-Type: application/json" \
     -d '{
       "patientId": "d4da7554-d863-4a90-a718-adfe9ba85ad8",
       "code": "TEST001",
       "label": "Test d'antécédent",
       "type": "medical",
       "note": "Note de test"
     }'
   ```

2. **Testez le Questionnaire Pré-consultation**
   - Connectez-vous en tant que patient
   - Remplissez le questionnaire
   - Vérifiez qu'un rendez-vous est créé avec le médecin assigné

3. **Testez les Notes Patients**
   - Connectez-vous en tant que médecin
   - Accédez à un patient
   - Ajoutez une note et vérifiez qu'elle s'affiche

### Étape 4: Nettoyage des Fichiers Obsolètes
Supprimez ces fichiers problématiques :
```bash
# Fichiers à supprimer
rm supabase/migrations/20250101000005_create_antecedents_table.sql
rm supabase/migrations/20250101000002_add_doctor_id_to_patients.sql
```

## 🔍 Vérifications Complémentaires

### Vérification de la Base de Données
```sql
-- Vérifier la cohérence doctors/users
SELECT d.id, d.user_id, u.email 
FROM doctors d 
LEFT JOIN auth.users u ON d.user_id = u.id 
WHERE u.id IS NULL;

-- Vérifier les index
SELECT * FROM pg_indexes WHERE tablename = 'antecedents';

-- Vérifier les contraintes
SELECT * FROM information_schema.table_constraints 
WHERE table_name = 'antecedents';
```

### Vérification des API
Testez ces endpoints API :
- `GET /api/terminology-search?q=diabète` → Doit retourner des résultats
- `POST /api/notes` → Doit créer des notes sans erreur
- `POST /api/antecedents` → Doit créer des antécédents sans erreur

## 🚨 Signaux d'Alerte
Contactez le support si vous rencontrez :

1. **Erreurs 500** sur les endpoints API
2. **Messages "permission denied"** dans les logs
3. **Données incohérentes** entre patients et médecins
4. **Problèmes d'authentification** persistants

## 📞 Support
En cas de problème :
1. Consultez les logs Supabase → Logs → Postgres
2. Vérifiez la console navigateur pour les erreurs frontend
3. Contactez l'équipe technique avec les messages d'erreur complets

## ✅ Checklist de Vérification Finale
- [ ] Script SQL exécuté sans erreur
- [ ] Table antecedents accessible
- [ ] API /api/antecedents fonctionnelle
- [ ] Questionnaire pré-consultation opérationnel
- [ ] Notes patients fonctionnelles
- [ ] Fichiers obsolètes supprimés
- [ ] Aucune erreur dans la console navigateur
- [ ] Aucune erreur dans les logs Supabase

Le système devrait maintenant être complètement fonctionnel avec une architecture cohérente basée sur le système appointments.