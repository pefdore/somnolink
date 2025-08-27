# Correction des Politiques RLS pour la Table Antecedents

## Problème
Les politiques RLS de la table `antecedents` référencent `patients.doctor_id` qui n'existe plus depuis la restauration du système basé sur les rendez-vous.

## Solution
Exécutez ces commandes SQL dans l'éditeur Supabase pour corriger les politiques RLS :

```sql
-- Correction des politiques RLS pour la table antecedents

-- 1. Supprimer les anciennes politiques problématiques
DROP POLICY IF EXISTS "Doctors can view patient antecedents" ON antecedents;
DROP POLICY IF EXISTS "Doctors can insert patient antecedents" ON antecedents;
DROP POLICY IF EXISTS "Doctors can update patient antecedents" ON antecedents;
DROP POLICY IF EXISTS "Doctors can delete patient antecedents" ON antecedents;

-- 2. Nouvelle politique pour la visualisation basée sur appointments
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

-- 3. Nouvelle politique pour l'insertion basée sur appointments
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

-- 4. Nouvelle politique pour la mise à jour basée sur appointments
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

-- 5. Nouvelle politique pour la suppression basée sur appointments
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

-- 6. Mettre à jour également la fonction add_antecedent
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
    -- Vérifier que le médecin a le droit d'ajouter un antécédent pour ce patient via appointments
    IF NOT EXISTS (
        SELECT 1 FROM appointments 
        WHERE patient_id = p_patient_id 
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