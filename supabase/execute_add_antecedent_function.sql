-- Script à exécuter dans l'éditeur SQL de Supabase
-- Ce script crée la fonction add_antecedent pour contourner les restrictions RLS

-- Fonction pour ajouter un antécédent médical ou chirurgical
CREATE OR REPLACE FUNCTION add_antecedent(
    p_patient_id UUID,
    p_doctor_id UUID,
    p_code VARCHAR,
    p_system VARCHAR,
    p_label TEXT,
    p_type VARCHAR,
    p_note TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_antecedent_id UUID;
BEGIN
    -- Vérifier que le médecin a le droit d'ajouter un antécédent pour ce patient
    IF NOT EXISTS (
        SELECT 1 FROM patients 
        WHERE id = p_patient_id 
        AND doctor_id = p_doctor_id
        AND doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
    ) THEN
        RAISE EXCEPTION 'Le médecin n''a pas accès à ce patient';
    END IF;

    -- Insérer l'antécédent
    INSERT INTO antecedents (
        patient_id,
        doctor_id,
        code,
        system,
        label,
        type,
        note
    ) VALUES (
        p_patient_id,
        p_doctor_id,
        p_code,
        COALESCE(p_system, 'CIM-11'),
        p_label,
        p_type,
        p_note
    )
    RETURNING id INTO v_antecedent_id;

    RETURN v_antecedent_id;
END;
$$;

-- Vérification
SELECT 'Fonction add_antecedent créée avec succès!' as status;