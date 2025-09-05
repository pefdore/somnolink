-- Migration: Création du système d'association patient-médecin
-- Date: 2025-01-01 00:00:08

-- 1. Ajouter les colonnes d'invitation publique à la table doctors
ALTER TABLE doctors 
ADD COLUMN IF NOT EXISTS public_invitation_token TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS public_invitation_enabled BOOLEAN DEFAULT false;

-- 2. Créer la table des relations patient-médecin
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

-- 3. Activer RLS sur la nouvelle table
ALTER TABLE patient_doctor_relationships ENABLE ROW LEVEL SECURITY;

-- 4. Politiques RLS pour la table patient_doctor_relationships

-- Les médecins peuvent voir leurs relations avec les patients
CREATE POLICY "Doctors can view their patient relationships" ON patient_doctor_relationships
FOR SELECT USING (
    doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
);

-- Les patients peuvent voir leurs relations avec les médecins
CREATE POLICY "Patients can view their doctor relationships" ON patient_doctor_relationships
FOR SELECT USING (
    patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
);

-- Les médecins peuvent mettre à jour les relations (accepter/refuser)
CREATE POLICY "Doctors can update their patient relationships" ON patient_doctor_relationships
FOR UPDATE USING (
    doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
)
WITH CHECK (
    doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
);

-- Les médecins peuvent insérer des relations (via invitations)
CREATE POLICY "Doctors can insert invitation relationships" ON patient_doctor_relationships
FOR INSERT WITH CHECK (
    doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
);

-- Les patients peuvent insérer des relations (demandes manuelles)
CREATE POLICY "Patients can insert manual relationships" ON patient_doctor_relationships
FOR INSERT WITH CHECK (
    patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
);

-- 5. Index pour les performances
CREATE INDEX IF NOT EXISTS idx_pdr_patient_id ON patient_doctor_relationships(patient_id);
CREATE INDEX IF NOT EXISTS idx_pdr_doctor_id ON patient_doctor_relationships(doctor_id);
CREATE INDEX IF NOT EXISTS idx_pdr_status ON patient_doctor_relationships(status);
CREATE INDEX IF NOT EXISTS idx_pdr_association_type ON patient_doctor_relationships(association_type);
CREATE INDEX IF NOT EXISTS idx_pdr_invitation_token ON patient_doctor_relationships(invitation_token);
CREATE INDEX IF NOT EXISTS idx_doctors_public_token ON doctors(public_invitation_token);

-- 6. Fonction pour générer un token d'invitation unique
CREATE OR REPLACE FUNCTION generate_public_invitation_token()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    token TEXT;
BEGIN
    -- Générer un token unique de 16 caractères alphanumériques
    token := encode(gen_random_bytes(8), 'base64');
    token := REPLACE(REPLACE(token, '/', '_'), '+', '-');
    token := SUBSTRING(token FROM 1 FOR 16);
    
    -- Vérifier l'unicité
    WHILE EXISTS (SELECT 1 FROM doctors WHERE public_invitation_token = token) LOOP
        token := encode(gen_random_bytes(8), 'base64');
        token := REPLACE(REPLACE(token, '/', '_'), '+', '-');
        token := SUBSTRING(token FROM 1 FOR 16);
    END LOOP;
    
    RETURN token;
END;
$$;

-- 7. Fonction pour traiter les invitations de médecin
DROP FUNCTION IF EXISTS process_doctor_invitation(TEXT, TEXT, JSONB);
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
BEGIN
    -- Vérifier le token médecin
    SELECT id INTO v_doctor_id
    FROM doctors
    WHERE public_invitation_token = p_doctor_token
    AND public_invitation_enabled = true;

    IF v_doctor_id IS NULL THEN
        RAISE EXCEPTION 'Lien d''invitation invalide ou désactivé';
    END IF;

    -- Trouver le patient par user_id (utilisateur authentifié)
    SELECT id INTO v_patient_id
    FROM patients
    WHERE user_id = auth.uid();

    IF v_patient_id IS NULL THEN
        RAISE EXCEPTION 'Aucun patient trouvé pour cet utilisateur';
    END IF;

    -- Vérifier si relation existe déjà
    SELECT EXISTS (
        SELECT 1 FROM patient_doctor_relationships
        WHERE patient_id = v_patient_id AND doctor_id = v_doctor_id
    ) INTO v_existing_relationship;

    IF v_existing_relationship THEN
        RETURN QUERY SELECT v_patient_id, 'already_linked', 'Patient déjà associé à ce médecin';
    ELSE
        -- Créer nouvelle relation active
        INSERT INTO patient_doctor_relationships
        (patient_id, doctor_id, status, association_type, invited_by, invited_at, accepted_at)
        VALUES (v_patient_id, v_doctor_id, 'active', 'invitation', v_doctor_id, NOW(), NOW());
        
        RETURN QUERY SELECT v_patient_id, 'linked', 'Patient associé avec succès';
    END IF;
END;
$$;

-- 8. Fonction pour vérifier l'invitation d'un médecin
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

-- 9. Fonction pour les demandes manuelles d'association
CREATE OR REPLACE FUNCTION request_doctor_association(
    p_doctor_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_patient_id UUID;
    v_relationship_id UUID;
    v_existing_relationship BOOLEAN;
BEGIN
    -- Récupérer l'ID du patient connecté
    SELECT id INTO v_patient_id
    FROM patients
    WHERE user_id = auth.uid();

    IF v_patient_id IS NULL THEN
        RAISE EXCEPTION 'Aucun patient trouvé pour cet utilisateur';
    END IF;

    -- Vérifier si relation existe déjà
    SELECT EXISTS (
        SELECT 1 FROM patient_doctor_relationships
        WHERE patient_id = v_patient_id AND doctor_id = p_doctor_id
    ) INTO v_existing_relationship;

    IF v_existing_relationship THEN
        RAISE EXCEPTION 'Relation déjà existante avec ce médecin';
    END IF;

    -- Créer la demande d'association
    INSERT INTO patient_doctor_relationships
    (patient_id, doctor_id, status, association_type, requested_by, requested_at)
    VALUES (v_patient_id, p_doctor_id, 'pending', 'manual', auth.uid(), NOW())
    RETURNING id INTO v_relationship_id;

    RETURN v_relationship_id;
END;
$$;

-- 10. Message de confirmation
DO $$
BEGIN
    RAISE NOTICE '✅ Système d''association patient-médecin créé avec succès';
    RAISE NOTICE '✅ Table patient_doctor_relationships créée';
    RAISE NOTICE '✅ Colonnes d''invitation ajoutées à doctors';
    RAISE NOTICE '✅ Fonctions RPC implémentées';
    RAISE NOTICE '✅ Politiques RLS configurées';
END;
$$;