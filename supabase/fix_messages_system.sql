-- CORRECTION FINALE DU SYSTÈME DE MESSAGERIE
-- Exécutez ce script dans Supabase SQL Editor

-- 1. Vérifier et corriger la structure de la table messages
DO $$
BEGIN
    -- Ajouter receiver_id si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'messages'
        AND column_name = 'receiver_id'
    ) THEN
        ALTER TABLE messages ADD COLUMN receiver_id UUID REFERENCES patients(id);
        RAISE NOTICE '✅ Colonne receiver_id ajoutée à messages';
    ELSE
        RAISE NOTICE 'ℹ️ Colonne receiver_id existe déjà dans messages';
    END IF;

    -- Ajouter sender_id si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'messages'
        AND column_name = 'sender_id'
    ) THEN
        ALTER TABLE messages ADD COLUMN sender_id UUID REFERENCES doctors(id);
        RAISE NOTICE '✅ Colonne sender_id ajoutée à messages';
    ELSE
        RAISE NOTICE 'ℹ️ Colonne sender_id existe déjà dans messages';
    END IF;
END $$;

-- 2. Vérifier et corriger la structure de la table conversations
DO $$
BEGIN
    -- Ajouter les colonnes manquantes à conversations
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'conversations'
        AND column_name = 'doctor_id'
    ) THEN
        ALTER TABLE conversations ADD COLUMN doctor_id UUID REFERENCES doctors(id);
        RAISE NOTICE '✅ Colonne doctor_id ajoutée à conversations';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'conversations'
        AND column_name = 'patient_id'
    ) THEN
        ALTER TABLE conversations ADD COLUMN patient_id UUID REFERENCES patients(id);
        RAISE NOTICE '✅ Colonne patient_id ajoutée à conversations';
    END IF;
END $$;

-- 3. Désactiver temporairement RLS sur patients pour diagnostiquer
ALTER TABLE patients DISABLE ROW LEVEL SECURITY;

-- 4. Tester une requête simple
SELECT COUNT(*) as total_patients FROM patients;

-- 5. Réactiver RLS avec politique simple
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

-- Supprimer les politiques problématiques
DROP POLICY IF EXISTS "allow_all_authenticated" ON patients;
DROP POLICY IF EXISTS "patients_select_policy" ON patients;
DROP POLICY IF EXISTS "patients_update_policy" ON patients;

-- Créer une politique simple et fonctionnelle
CREATE POLICY "simple_patients_policy" ON patients
FOR ALL USING (auth.role() = 'authenticated');

-- 6. Créer des index pour les performances
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_conversations_doctor_id ON conversations(doctor_id);
CREATE INDEX IF NOT EXISTS idx_conversations_patient_id ON conversations(patient_id);

-- 7. Message de confirmation
SELECT '✅ Système de messagerie corrigé - Prêt pour les tests' as status;