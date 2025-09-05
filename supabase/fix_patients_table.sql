-- Script simple pour ajouter les colonnes manquantes à la table patients
-- À exécuter dans Supabase SQL Editor

-- Ajouter created_at
ALTER TABLE patients ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Ajouter updated_at
ALTER TABLE patients ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Vérifier
SELECT column_name FROM information_schema.columns WHERE table_name = 'patients';