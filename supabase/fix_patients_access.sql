-- Script pour corriger l'accès des médecins aux données patients
-- À exécuter directement dans Supabase SQL Editor

-- Supprimer les anciennes politiques problématiques
DROP POLICY IF EXISTS "Doctors can view their patients" ON patients;
DROP POLICY IF EXISTS "Doctors can update their patients" ON patients;

-- Créer une politique temporaire plus permissive pour les tests
-- ATTENTION: Cette politique permet aux médecins de voir TOUS les patients
-- À remplacer par une politique plus sécurisée une fois le système stabilisé
CREATE POLICY "Doctors can view all patients" ON patients
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM doctors
        WHERE doctors.user_id = auth.uid()
    )
);

CREATE POLICY "Doctors can update all patients" ON patients
FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM doctors
        WHERE doctors.user_id = auth.uid()
    )
);

-- Message de confirmation
SELECT '✅ Accès temporaire aux patients activé pour les médecins' as status;