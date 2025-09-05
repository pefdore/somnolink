-- Fix for missing process_doctor_invitation function
-- Execute this script in Supabase SQL Editor

-- 1. Ensure the table structure exists
ALTER TABLE doctors
ADD COLUMN IF NOT EXISTS public_invitation_token TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS public_invitation_enabled BOOLEAN DEFAULT false;

CREATE TABLE IF NOT EXISTS patient_doctor_relationships (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'active', 'inactive', 'rejected')),
    association_type VARCHAR(20) NOT NULL DEFAULT 'manual'
        CHECK (association_type IN ('invitation', 'manual', 'auto')),
    invitation_token TEXT,
    requested_by UUID REFERENCES auth.users(id),
    invited_by UUID REFERENCES doctors(id),
    invited_at TIMESTAMPTZ,
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(patient_id, doctor_id)
);

-- 2. Enable RLS
ALTER TABLE patient_doctor_relationships ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS policies
DROP POLICY IF EXISTS "Doctors can view their patient relationships" ON patient_doctor_relationships;
DROP POLICY IF EXISTS "Patients can view their doctor relationships" ON patient_doctor_relationships;
DROP POLICY IF EXISTS "Doctors can update their patient relationships" ON patient_doctor_relationships;
DROP POLICY IF EXISTS "Doctors can insert invitation relationships" ON patient_doctor_relationships;
DROP POLICY IF EXISTS "Patients can insert manual relationships" ON patient_doctor_relationships;

CREATE POLICY "Doctors can view their patient relationships" ON patient_doctor_relationships
FOR SELECT USING (
    doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
);

CREATE POLICY "Patients can view their doctor relationships" ON patient_doctor_relationships
FOR SELECT USING (
    patient_doctor_relationships.patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
);

CREATE POLICY "Doctors can update their patient relationships" ON patient_doctor_relationships
FOR UPDATE USING (
    doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
)
WITH CHECK (
    doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
);

CREATE POLICY "Doctors can insert invitation relationships" ON patient_doctor_relationships
FOR INSERT WITH CHECK (
    doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
);

CREATE POLICY "Patients can insert manual relationships" ON patient_doctor_relationships
FOR INSERT WITH CHECK (
    patient_doctor_relationships.patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
);

-- 4. Create indexes
CREATE INDEX IF NOT EXISTS idx_pdr_patient_id ON patient_doctor_relationships(patient_id);
CREATE INDEX IF NOT EXISTS idx_pdr_doctor_id ON patient_doctor_relationships(doctor_id);
CREATE INDEX IF NOT EXISTS idx_pdr_status ON patient_doctor_relationships(status);
CREATE INDEX IF NOT EXISTS idx_pdr_association_type ON patient_doctor_relationships(association_type);
CREATE INDEX IF NOT EXISTS idx_pdr_invitation_token ON patient_doctor_relationships(invitation_token);
CREATE INDEX IF NOT EXISTS idx_doctors_public_token ON doctors(public_invitation_token);

-- 5. Drop and recreate the missing function (to handle signature changes)
DROP FUNCTION IF EXISTS process_doctor_invitation(TEXT);

CREATE OR REPLACE FUNCTION process_doctor_invitation(
    p_doctor_token TEXT
)
RETURNS TABLE (patient_id UUID, status TEXT, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_doctor_id UUID;
    v_patient_id UUID;
    v_existing_relationship BOOLEAN;
    v_user_email TEXT;
    v_user_metadata JSONB;
BEGIN
    -- Vérifier le token médecin
    SELECT id INTO v_doctor_id
    FROM doctors
    WHERE public_invitation_token = p_doctor_token
    AND public_invitation_enabled = true;

    IF v_doctor_id IS NULL THEN
        RAISE EXCEPTION 'Lien d''invitation invalide ou désactivé';
    END IF;

    -- Récupérer les informations de l'utilisateur authentifié
    SELECT email, raw_user_meta_data INTO v_user_email, v_user_metadata
    FROM auth.users
    WHERE id = auth.uid();

    IF v_user_email IS NULL THEN
        RAISE EXCEPTION 'Utilisateur non trouvé dans le système d''authentification';
    END IF;

    -- Chercher un patient existant
    SELECT id INTO v_patient_id
    FROM patients
    WHERE user_id = auth.uid();

    -- Si le patient n'existe pas, le créer
    IF v_patient_id IS NULL THEN
        INSERT INTO patients (
            user_id,
            first_name,
            last_name,
            created_at,
            updated_at
        ) VALUES (
            auth.uid(),
            COALESCE(v_user_metadata->>'first_name', ''),
            COALESCE(v_user_metadata->>'last_name', ''),
            NOW(),
            NOW()
        )
        RETURNING id INTO v_patient_id;
    END IF;

    -- Vérifier si relation existe déjà (utilisation explicite des noms de table)
    SELECT EXISTS (
        SELECT 1 FROM patient_doctor_relationships pdr
        WHERE pdr.patient_id = v_patient_id AND pdr.doctor_id = v_doctor_id
    ) INTO v_existing_relationship;

    IF v_existing_relationship THEN
        RETURN QUERY SELECT v_patient_id, 'already_linked'::TEXT, 'Patient déjà associé à ce médecin'::TEXT;
    ELSE
        -- Créer nouvelle relation active (utilisation explicite des noms de colonne)
        INSERT INTO patient_doctor_relationships
        (patient_id, doctor_id, status, association_type, invited_by, invited_at, accepted_at)
        VALUES (v_patient_id, v_doctor_id, 'active', 'invitation', v_doctor_id, NOW(), NOW());

        RETURN QUERY SELECT v_patient_id, 'linked'::TEXT, 'Patient associé avec succès'::TEXT;
    END IF;
END;
$$;

-- 6. Drop and recreate verify_doctor_invitation function (to handle return type changes)
DROP FUNCTION IF EXISTS verify_doctor_invitation(TEXT);

CREATE OR REPLACE FUNCTION verify_doctor_invitation(p_doctor_token TEXT)
RETURNS TABLE (
    id UUID,
    first_name TEXT,
    last_name TEXT,
    specialty TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        d.id,
        d.first_name,
        d.last_name,
        ''::TEXT as specialty  -- Colonne spécialité non disponible, valeur par défaut
    FROM doctors d
    WHERE d.public_invitation_token = p_doctor_token
    AND d.public_invitation_enabled = true;
END;
$$;

-- 7. Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Fonctions supprimées et recréées avec succès';
    RAISE NOTICE '✅ Fonction process_doctor_invitation opérationnelle (gère patients existants et nouveaux)';
    RAISE NOTICE '✅ Fonction verify_doctor_invitation opérationnelle';
    RAISE NOTICE '✅ Correction colonne email - utilise uniquement les colonnes existantes';
    RAISE NOTICE '✅ Correction références de colonnes ambiguës dans les politiques RLS';
    RAISE NOTICE '✅ Correction références ambiguës dans la fonction PL/pgSQL';
    RAISE NOTICE '✅ Système d''association patient-médecin prêt';
    RAISE NOTICE '✅ Création automatique de patients depuis auth.users';
    RAISE NOTICE '✅ Table patient_doctor_relationships configurée';
    RAISE NOTICE '✅ Politiques RLS appliquées';
END;
$$;