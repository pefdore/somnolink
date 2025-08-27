-- Script de correction complète du système Somnolink
-- Ce script résout tous les problèmes identifiés : table antecedents, politiques RLS, fonctions RPC

-- 1. SUPPRESSION DES POLITIQUES ET FONCTIONS PROBLEMATIQUES
DROP POLICY IF EXISTS "Doctors can view patient antecedents" ON antecedents;
DROP POLICY IF EXISTS "Doctors can insert patient antecedents" ON antecedents;
DROP POLICY IF EXISTS "Doctors can update patient antecedents" ON antecedents;
DROP POLICY IF EXISTS "Doctors can delete patient antecedents" ON antecedents;

DROP FUNCTION IF EXISTS add_antecedent CASCADE;
DROP FUNCTION IF EXISTS get_patient_antecedents CASCADE;

-- 2. SUPPRESSION ET RECREATION DE LA TABLE ANTECEDENTS POUR UN SCHEMA CORRECT
DROP TABLE IF EXISTS antecedents CASCADE;

CREATE TABLE antecedents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    system TEXT DEFAULT 'CIM-11',
    label TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('medical', 'surgical')),
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_antecedent UNIQUE (patient_id, doctor_id, code, type)
);

-- 3. ACTIVATION RLS POUR LA TABLE ANTECEDENTS
ALTER TABLE antecedents ENABLE ROW LEVEL SECURITY;

-- 4. NOUVELLES POLITIQUES RLS BASÉES SUR APPOINTMENTS
CREATE POLICY "Doctors can view patient antecedents" ON antecedents
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM appointments
        WHERE appointments.patient_id = antecedents.patient_id
        AND appointments.doctor_id = antecedents.doctor_id
        AND appointments.doctor_id IN (
            SELECT id FROM doctors WHERE user_id = auth.uid()
        )
    )
);

CREATE POLICY "Doctors can insert patient antecedents" ON antecedents
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM appointments
        WHERE appointments.patient_id = antecedents.patient_id
        AND appointments.doctor_id = antecedents.doctor_id
        AND appointments.doctor_id IN (
            SELECT id FROM doctors WHERE user_id = auth.uid()
        )
    )
);

CREATE POLICY "Doctors can update patient antecedents" ON antecedents
FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM appointments
        WHERE appointments.patient_id = antecedents.patient_id
        AND appointments.doctor_id = antecedents.doctor_id
        AND appointments.doctor_id IN (
            SELECT id FROM doctors WHERE user_id = auth.uid()
        )
    )
);

CREATE POLICY "Doctors can delete patient antecedents" ON antecedents
FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM appointments
        WHERE appointments.patient_id = antecedents.patient_id
        AND appointments.doctor_id = antecedents.doctor_id
        AND appointments.doctor_id IN (
            SELECT id FROM doctors WHERE user_id = auth.uid()
        )
    )
);

-- 5. CORRECTION DE LA FONCTION add_antecedent
CREATE OR REPLACE FUNCTION add_antecedent(
    p_patient_id UUID,
    p_doctor_id UUID,
    p_code TEXT,
    p_system TEXT,
    p_label TEXT,
    p_type TEXT,
    p_note TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_antecedent_id UUID;
    v_doctor_user_id UUID;
BEGIN
    -- Vérifier que le médecin existe et correspond à l'utilisateur authentifié
    SELECT user_id INTO v_doctor_user_id 
    FROM doctors 
    WHERE id = p_doctor_id;
    
    IF v_doctor_user_id IS NULL THEN
        RAISE EXCEPTION 'Médecin non trouvé';
    END IF;
    
    IF v_doctor_user_id != auth.uid() THEN
        RAISE EXCEPTION 'Non autorisé à ajouter des antécédents pour ce médecin';
    END IF;
    
    -- Vérifier l'accès via appointments (nouveau système)
    IF NOT EXISTS (
        SELECT 1 FROM appointments
        WHERE patient_id = p_patient_id
        AND doctor_id = p_doctor_id
        AND doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
    ) THEN
        RAISE EXCEPTION 'Le médecin n''a pas accès à ce patient';
    END IF;
    
    -- Insérer l'antécédent
    INSERT INTO antecedents (patient_id, doctor_id, code, system, label, type, note)
    VALUES (p_patient_id, p_doctor_id, p_code, p_system, p_label, p_type, p_note)
    RETURNING id INTO v_antecedent_id;
    
    RETURN v_antecedent_id;
END;
$$;

-- 6. FONCTION POUR RECUPERER LES ANTECEDENTS
CREATE OR REPLACE FUNCTION get_patient_antecedents(p_patient_id UUID)
RETURNS TABLE (
    id UUID,
    patient_id UUID,
    doctor_id UUID,
    code TEXT,
    system TEXT,
    label TEXT,
    type TEXT,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    doctor_first_name TEXT,
    doctor_last_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.patient_id,
        a.doctor_id,
        a.code,
        a.system,
        a.label,
        a.type,
        a.note,
        a.created_at,
        a.updated_at,
        d.first_name as doctor_first_name,
        d.last_name as doctor_last_name
    FROM antecedents a
    JOIN doctors d ON a.doctor_id = d.id
    WHERE a.patient_id = p_patient_id
    AND EXISTS (
        SELECT 1 FROM appointments
        WHERE appointments.patient_id = a.patient_id
        AND appointments.doctor_id = a.doctor_id
        AND appointments.doctor_id IN (
            SELECT id FROM doctors WHERE user_id = auth.uid()
        )
    )
    ORDER BY a.created_at DESC;
END;
$$;

-- 7. NETTOYAGE DES FONCTIONS DOUBLONS
DROP FUNCTION IF EXISTS get_patient_notes(UUID);
DROP FUNCTION IF EXISTS get_patient_notes(UUID, UUID);

-- 8. VERIFICATION DE LA COHERENCE DOCTORS/USER_ID
DO $$
DECLARE
    v_mismatch_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_mismatch_count
    FROM doctors d
    LEFT JOIN auth.users u ON d.user_id = u.id
    WHERE u.id IS NULL;
    
    IF v_mismatch_count > 0 THEN
        RAISE NOTICE 'Attention: % médecins ont un user_id qui ne correspond à aucun utilisateur auth', v_mismatch_count;
    END IF;
END;
$$;

-- 9. INDEX POUR LES PERFORMANCES
CREATE INDEX IF NOT EXISTS idx_antecedents_patient_id ON antecedents(patient_id);
CREATE INDEX IF NOT EXISTS idx_antecedents_doctor_id ON antecedents(doctor_id);
CREATE INDEX IF NOT EXISTS idx_antecedents_patient_doctor ON antecedents(patient_id, doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_patient_doctor ON appointments(patient_id, doctor_id);

-- 10. MESSAGE DE CONFIRMATION
DO $$
BEGIN
    RAISE NOTICE '✅ Correction du système complétée avec succès';
    RAISE NOTICE '✅ Table antecedents créée/corrigée';
    RAISE NOTICE '✅ Politiques RLS basées sur appointments établies';
    RAISE NOTICE '✅ Fonctions RPC corrigées';
    RAISE NOTICE '✅ Index de performance créés';
END;
$$;