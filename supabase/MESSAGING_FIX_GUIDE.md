# 🔧 Guide de Correction de la Messagerie Patient

## 🚨 Problèmes Identifiés

1. **Erreurs 406 (Not Acceptable)** : Politiques RLS trop restrictives
2. **Discussion ne s'ouvre pas** : Problème de sélection de conversation
3. **Messages non envoyés** : Erreurs 400 sur l'insertion

## 🛠️ Solution - Scripts de Correction

### Option 1: Correction Complète (Recommandée)

Dans l'éditeur SQL de Supabase, exécutez d'abord :
```sql
-- supabase/quick_messaging_fix.sql
```
Puis :
```sql
-- supabase/fix_patient_messaging_rls.sql
```

### Option 2: Test Rapide (Temporaire)

Pour tester immédiatement, exécutez dans l'ordre :
```sql
-- 1. D'abord désactiver les contraintes problématiques
-- supabase/temp_disable_constraints.sql

-- 2. Puis exécuter le test de messagerie
-- supabase/working_messaging_test.sql (avec ID médecin remplacé)
```

**⚠️ Cette option désactive temporairement RLS et les contraintes FK pour permettre les tests**

## 🔍 **Diagnostic du Problème**

### **Erreur 23502/23503 - Contraintes de Clés Étrangères**

Le problème principal vient des contraintes FK mal configurées :
- `messages_receiver_id_fkey` exige que `receiver_id` existe dans `patients`
- Mais quand un patient envoie un message à un médecin, `receiver_id` devrait être l'ID du médecin
- **Solution** : Désactiver temporairement les contraintes pour les tests

### **Vérification des Contraintes**
```sql
-- Exécutez d'abord pour diagnostiquer :
-- supabase/check_constraints.sql
```

## 🔧 Corrections Apportées

### 1. Structure Base de Données
- ✅ Ajout de la colonne `conversation_id` dans `messages`
- ✅ Création de données de test (conversation + messages)
- ✅ Correction des références entre tables

### 2. Code Frontend
- ✅ Correction de `handleSendMessage()` pour utiliser `conversation_id`
- ✅ Correction de `fetchMessages()` pour filtrer par conversation
- ✅ Ajout de logs détaillés pour le débogage
- ✅ Gestion d'erreurs améliorée

### 3. Politiques RLS
- ✅ Suppression des politiques restrictives
- ✅ Création de politiques basées sur `auth.uid()`
- ✅ Permissions pour lecture/écriture des messages
- ✅ Accès aux conversations pour patients et médecins

### 2. Vérifications après exécution

Le script affiche :
```
=== POLITIQUES RLS APRÈS CORRECTION ===
✅ Politiques RLS pour la messagerie patient corrigées
✅ Patients peuvent maintenant accéder à leur profil
✅ Médecins peuvent accéder à leur profil
✅ Messagerie bidirectionnelle fonctionnelle
```

## 🔍 Améliorations Apportées au Code

### 1. Logs de débogage ajoutés

```javascript
// Dans fetchPatientData()
console.log('[PATIENT_MESSAGING] Utilisateur trouvé:', user.id);
console.log('[PATIENT_MESSAGING] Patient trouvé:', patient.id);

// Dans handleSendMessage()
console.log('[SEND_MESSAGE] Tentative d\'envoi:', {
  patientId, conversationId, messageLength
});
console.log('[SEND_MESSAGE] Conversation trouvée:', conversation);
console.log('[SEND_MESSAGE] Message envoyé avec succès:', message);

// Dans fetchMessages()
console.log('[FETCH_MESSAGES] Récupération messages pour conversation:', conversationId);
console.log('[FETCH_MESSAGES] Messages récupérés:', data?.length, data);

// Dans handleConversationSelect()
console.log('[CONVERSATION_SELECT] Sélection conversation:', conversationId);
console.log('[CONVERSATION_SELECT] Conversations disponibles:', conversations.map(c => ({ id: c.id, doctor: c.doctor_name })));
```

### 2. Corrections Structurelles

```javascript
// Avant (Erreur 23502)
INSERT INTO messages (sender_id, receiver_id, content, ...)
// null value in column "conversation_id"

// Après (Corrigé)
INSERT INTO messages (conversation_id, sender_id, receiver_id, content, ...)
// conversation_id fourni correctement
```

### 3. Gestion d'erreurs améliorée

```javascript
// Gestion spécifique des erreurs de base de données
if (error?.code === '23502') {
  errorMessage = 'Conversation introuvable - conversation_id manquant';
} else if (error?.code === '42501') {
  errorMessage = 'Permissions insuffisantes - Vérifier RLS';
}
```

### 2. Gestion d'erreurs améliorée

```javascript
// Gestion spécifique des erreurs RLS
if (error?.code === '42501') {
  errorMessage = 'Permissions insuffisantes. Vérifiez les politiques RLS.';
} else if (error?.code === '23503') {
  errorMessage = 'Conversation introuvable.';
}
```

### 3. Fonction de sélection de conversation

```javascript
const handleConversationSelect = (conversationId: string) => {
  console.log('[CONVERSATION_SELECT] Sélection conversation:', conversationId);
  const conversation = conversations.find(c => c.id === conversationId);
  if (conversation) {
    setSelectedConversation(conversationId);
  } else {
    console.error('[CONVERSATION_SELECT] Conversation non trouvée');
  }
};
```

## 🧪 Tests à Effectuer

### 1. Test d'accès patient
- Se connecter avec un compte patient (`somnolink14@yopmail.com`)
- Vérifier que la page `/dashboard/patient/messagerie` se charge
- Vérifier l'absence d'erreurs 406 dans la console

### 2. Test de sélection de conversation
- Cliquer sur la conversation "Médecin" dans la liste de gauche
- Vérifier que les logs suivants apparaissent :
```
[CONVERSATION_SELECT] Sélection conversation: 6f52787a-7ac4-4b2f-b20a-bbcdda9e7b18
[CONVERSATION_SELECT] Conversations disponibles: Array(1)
[CONVERSATION_SELECT] Conversation trouvée: Object
[FETCH_MESSAGES] Récupération messages pour conversation: 6f52787a-7ac4-4b2f-b20a-bbcdda9e7b18
[FETCH_MESSAGES] Messages récupérés: 2, [...]
```

### 3. Test d'envoi de message
- Sélectionner la conversation
- Taper "Bonjour Docteur" et envoyer
- Vérifier que les logs suivants apparaissent :
```
[SEND_MESSAGE] Tentative d'envoi: Object { patientId: "9b71938b-97d3-4419-8141-c0379e3ab224", conversationId: "6f52787a-7ac4-4b2f-b20a-bbcdda9e7b18", messageLength: 15 }
[SEND_MESSAGE] Conversation trouvée: Object { doctor_id: "...", patient_id: "..." }
[SEND_MESSAGE] Message envoyé avec succès: [message_id]
```

## 📊 Résultats Attendus

### Après exécution de `working_messaging_test.sql` :

#### ✅ Interface Utilisateur
- **Conversations visibles** : 1 conversation avec "Médecin"
- **Messages affichés** : 2 messages de test (1 du médecin, 1 du patient)
- **Discussion ouverte** : Clic sur conversation ouvre le panneau droit
- **Aucun message "aucune conversation"**

#### ✅ Fonctionnalités
- **Envoi de messages** : Fonctionne sans erreur 400
- **Réception temps réel** : Messages apparaissent immédiatement
- **Historique préservé** : Messages précédents restent visibles

#### ✅ Logs de Console
```
[PATIENT_MESSAGING] Utilisateur trouvé: 97238492-d405-44bb-beef-51c4f35328c3
[PATIENT_MESSAGING] Patient trouvé: 9b71938b-97d3-4419-8141-c0379e3ab224
[CONVERSATION_SELECT] Sélection conversation: 6f52787a-7ac4-4b2f-b20a-bbcdda9e7b18
[FETCH_MESSAGES] Messages récupérés: 2
[SEND_MESSAGE] Message envoyé avec succès: [uuid]
```

### Après exécution de `fix_patient_messaging_rls.sql` :
- ✅ Sécurité RLS réactivée
- ✅ Accès contrôlé selon les rôles
- ✅ Messagerie sécurisée et fonctionnelle

## 🔄 États des Corrections

- [x] **Politiques RLS corrigées** - Script `fix_patient_messaging_rls.sql`
- [x] **Logs de débogage ajoutés** - Composant messagerie patient
- [x] **Gestion d'erreurs améliorée** - Messages d'erreur spécifiques
- [x] **Sélection de conversation** - Fonction `handleConversationSelect`

## 🚀 Prochaines Étapes

1. **Exécuter le script RLS** dans Supabase
2. **Tester la messagerie** avec un compte patient
3. **Vérifier les logs** pour confirmer le fonctionnement
4. **Signaler tout problème** restant pour correction

---

**📝 Note** : Les logs de débogage resteront actifs pour faciliter le diagnostic futur.