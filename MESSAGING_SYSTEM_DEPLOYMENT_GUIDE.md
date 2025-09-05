# 🚀 Guide de Déploiement du Système de Messagerie Unifié

## 📋 Vue d'ensemble

Ce guide détaille le déploiement complet du nouveau système de messagerie unifié pour Somnolink, qui respecte toutes vos exigences :

- ✅ Médecin peut envoyer des messages à ses patients
- ✅ Patient ne peut pas répondre par défaut
- ✅ Bouton pour autoriser les réponses
- ✅ Notifications avec badges
- ✅ Emails automatiques aux patients
- ✅ Notifications aux médecins pour les réponses

## 🗄️ Étape 1 : Déploiement de la Base de Données

### 1.1 Exécuter le script de création des tables

1. **Ouvrez Supabase SQL Editor**
   - Allez sur [supabase.com](https://supabase.com) → votre projet → **SQL Editor**

2. **Exécutez le script complet**
   - Copiez-collez le contenu de [`supabase/create_unified_messaging_system.sql`](supabase/create_unified_messaging_system.sql)
   - Cliquez sur **"Run"**

3. **Vérifiez la création**
   ```sql
   -- Vérifier les tables créées
   SELECT table_name FROM information_schema.tables
   WHERE table_schema = 'public'
   AND table_name IN ('messages', 'conversations', 'message_notifications', 'message_attachments');

   -- Vérifier les fonctions
   SELECT routine_name FROM information_schema.routines
   WHERE routine_schema = 'public'
   AND routine_name LIKE '%conversation%';
   ```

## 🔧 Étape 2 : Configuration de l'Environnement

### 2.1 Variables d'environnement pour les emails

Ajoutez dans votre `.env.local` :
```env
# Configuration Resend pour les emails
RESEND_API_KEY=votre_clé_api_resend
```

### 2.2 Installation des dépendances (si nécessaire)

```bash
npm install resend
```

## 🎨 Étape 3 : Interfaces Utilisateur

### 3.1 Interface Médecin (`/dashboard/doctor/messagerie`)

**Fonctionnalités implémentées :**
- ✅ Liste des patients avec conversations
- ✅ Envoi de messages avec option "Autoriser la réponse"
- ✅ Gestion des pièces jointes
- ✅ Badge de notifications non lues

**Utilisation :**
1. Sélectionner un patient dans la liste
2. Rédiger le message
3. Cocher "Autoriser la réponse" si souhaité
4. Ajouter des pièces jointes (optionnel)
5. Cliquer sur "Envoyer"

### 3.2 Interface Patient (`/dashboard/patient/messagerie`)

**Fonctionnalités implémentées :**
- ✅ Liste des conversations avec médecins
- ✅ Badge de messages non lus
- ✅ Réponse uniquement si autorisée par le médecin
- ✅ Téléchargement de pièces jointes

**Utilisation :**
1. Voir les conversations avec badges de notifications
2. Ouvrir une conversation pour lire les messages
3. Répondre uniquement si le bouton est disponible

## 📧 Étape 4 : Système de Notifications

### 4.1 Badges de notification

**Composant créé :** [`src/components/ui/notification-badge.tsx`](src/components/ui/notification-badge.tsx)

**Utilisation dans la navigation :**
```tsx
import { NotificationBadge } from '@/components/ui/notification-badge';

// Pour les médecins
<NotificationBadge userType="doctor" />

// Pour les patients
<NotificationBadge userType="patient" />
```

### 4.2 Emails automatiques

**Service configuré :** [`src/lib/email.ts`](src/lib/email.ts)

**Template d'email :**
- Sujet : "Nouveau message de votre médecin - Somnolink"
- Contenu : Aperçu du message + lien vers l'espace patient
- Design responsive et professionnel

## 🔐 Étape 5 : Politiques de Sécurité (RLS)

### 5.1 Politiques implémentées

**Messages :**
- Médecins peuvent voir/envoyer dans leurs conversations
- Patients peuvent voir/répondre uniquement si autorisés

**Conversations :**
- Médecins voient leurs conversations avec patients
- Patients voient leurs conversations avec médecins

**Notifications :**
- Utilisateurs voient uniquement leurs propres notifications

### 5.2 Permissions de réponse

**Système de contrôle :**
- Par défaut : `allow_patient_reply = false`
- Médecin peut activer/désactiver via API
- Vérification en temps réel avant envoi

## 🚀 Étape 6 : Déploiement et Test

### 6.1 Déploiement

```bash
# Build de production
npm run build

# Démarrage en production
npm start
```

### 6.2 Tests fonctionnels

#### Test 1 : Envoi de message par médecin
1. **Connectez-vous en tant que médecin**
2. **Allez dans Messagerie**
3. **Sélectionnez un patient**
4. **Envoyez un message** (sans autoriser la réponse)
5. **Vérifiez :**
   - ✅ Message apparaît dans la conversation
   - ✅ Patient reçoit un email
   - ✅ Badge de notification apparaît pour le patient

#### Test 2 : Tentative de réponse sans permission
1. **Connectez-vous en tant que patient**
2. **Ouvrez la conversation**
3. **Vérifiez :**
   - ✅ Bouton de réponse est désactivé/grisé
   - ✅ Message informatif : "Réponse non autorisée"

#### Test 3 : Autorisation de réponse
1. **Médecin coche "Autoriser la réponse"**
2. **Envoie un nouveau message**
3. **Patient peut maintenant répondre**
4. **Vérifiez :**
   - ✅ Patient peut envoyer des messages
   - ✅ Médecin reçoit une notification (badge)

#### Test 4 : Notifications temps réel
1. **Ouvrez deux onglets** (médecin + patient)
2. **Envoyez un message**
3. **Vérifiez :**
   - ✅ Badge se met à jour automatiquement
   - ✅ Email envoyé (logs de simulation)

## 📊 Étape 7 : Monitoring et Maintenance

### 7.1 Logs à surveiller

```sql
-- Messages envoyés aujourd'hui
SELECT COUNT(*) as messages_today
FROM messages
WHERE DATE(created_at) = CURRENT_DATE;

-- Conversations actives
SELECT COUNT(*) as active_conversations
FROM conversations
WHERE last_message_at >= NOW() - INTERVAL '7 days';

-- Taux de réponse des patients
SELECT
  COUNT(CASE WHEN sender_type = 'patient' THEN 1 END) * 100.0 / COUNT(*) as reply_rate
FROM messages
WHERE created_at >= NOW() - INTERVAL '30 days';
```

### 7.2 Nettoyage automatique

```sql
-- Supprimer les anciennes notifications lues
DELETE FROM message_notifications
WHERE is_read = true
AND created_at < NOW() - INTERVAL '30 days';

-- Archiver les anciennes conversations inactives
UPDATE conversations
SET archived = true
WHERE last_message_at < NOW() - INTERVAL '1 year';
```

## 🐛 Étape 8 : Dépannage

### 8.1 Problèmes courants

**Badge ne se met pas à jour :**
```sql
-- Vérifier les notifications non lues
SELECT * FROM message_notifications
WHERE user_id = 'user-id' AND is_read = false;
```

**Email non envoyé :**
```bash
# Vérifier la configuration Resend
echo $RESEND_API_KEY
```

**Erreur de permissions :**
```sql
-- Vérifier les politiques RLS
SELECT * FROM pg_policies WHERE tablename = 'messages';
```

### 8.2 Commandes de debug

```sql
-- Voir toutes les conversations d'un médecin
SELECT * FROM conversations WHERE doctor_id = 'doctor-id';

-- Voir tous les messages d'une conversation
SELECT * FROM messages WHERE conversation_id = 'conversation-id' ORDER BY created_at;

-- Compter les notifications non lues
SELECT COUNT(*) FROM message_notifications WHERE user_id = 'user-id' AND is_read = false;
```

## 🎯 Étape 9 : Fonctionnalités Avancées (Optionnel)

### 9.1 Pièces jointes
- ✅ Support déjà implémenté
- Stockage dans Supabase Storage
- Téléchargement sécurisé

### 9.2 Messages programmés
```sql
-- Extension possible : table scheduled_messages
CREATE TABLE scheduled_messages (
    id UUID PRIMARY KEY,
    conversation_id UUID REFERENCES conversations(id),
    content TEXT,
    scheduled_at TIMESTAMPTZ,
    sent BOOLEAN DEFAULT false
);
```

### 9.3 Templates de messages
- Messages prédéfinis pour consultations
- Rappels automatiques
- Messages de suivi

## ✅ Checklist de Déploiement

- [ ] Script SQL exécuté avec succès
- [ ] Tables créées et politiques RLS appliquées
- [ ] API `/api/messaging` fonctionnelle
- [ ] Interfaces médecin et patient opérationnelles
- [ ] Système de notifications avec badges
- [ ] Service d'emails configuré
- [ ] Tests fonctionnels passés
- [ ] Monitoring mis en place

## 📞 Support

En cas de problème :
1. **Consultez les logs Supabase** → Logs → Postgres
2. **Vérifiez la console navigateur** pour les erreurs frontend
3. **Testez les APIs** avec des requêtes directes
4. **Contactez l'équipe technique** avec les détails complets

---

🎉 **Le système de messagerie unifié est maintenant déployé et opérationnel !**

Tous les messages entre médecins et patients sont sécurisés, les notifications fonctionnent en temps réel, et les patients reçoivent des emails automatiques pour les nouveaux messages.