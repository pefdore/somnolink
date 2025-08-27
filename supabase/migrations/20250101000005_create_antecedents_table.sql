-- Création de la table des antécédents médicaux et chirurgicaux
CREATE TABLE IF NOT EXISTS antecedents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    code VARCHAR(20) NOT NULL,
    system VARCHAR(50) NOT NULL DEFAULT 'CIM-11',
    label TEXT NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('medical', 'surgical')),
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Création d'un index pour les recherches par patient
CREATE INDEX IF NOT EXISTS antecedents_patient_id_idx ON antecedents(patient_id);
CREATE INDEX IF NOT EXISTS antecedents_doctor_id_idx ON antecedents(doctor_id);
CREATE INDEX IF NOT EXISTS antecedents_type_idx ON antecedents(type);

-- Activation de RLS
ALTER TABLE antecedents ENABLE ROW LEVEL SECURITY;

-- Politique RLS : Les médecins peuvent voir les antécédents de leurs patients
DROP POLICY IF EXISTS "Doctors can view patient antecedents" ON antecedents;
CREATE POLICY "Doctors can view patient antecedents" ON antecedents
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM patients
        WHERE patients.id = antecedents.patient_id
        AND patients.doctor_id = antecedents.doctor_id
        AND patients.doctor_id IN (
            SELECT id FROM doctors WHERE user_id = auth.uid()
        )
    )
);

-- Politique RLS : Les médecins peuvent insérer des antécédents pour leurs patients
DROP POLICY IF EXISTS "Doctors can insert patient antecedents" ON antecedents;
CREATE POLICY "Doctors can insert patient antecedents" ON antecedents
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM patients
        WHERE patients.id = antecedents.patient_id
        AND patients.doctor_id = antecedents.doctor_id
        AND patients.doctor_id IN (
            SELECT id FROM doctors WHERE user_id = auth.uid()
        )
    )
);

-- Politique RLS : Les médecins peuvent mettre à jour les antécédents de leurs patients
DROP POLICY IF EXISTS "Doctors can update patient antecedents" ON antecedents;
CREATE POLICY "Doctors can update patient antecedents" ON antecedents
FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM patients
        WHERE patients.id = antecedents.patient_id
        AND patients.doctor_id = antecedents.doctor_id
        AND patients.doctor_id IN (
            SELECT id FROM doctors WHERE user_id = auth.uid()
        )
    )
);

-- Politique RLS : Les médecins peuvent supprimer les antécédents de leurs patients
DROP POLICY IF EXISTS "Doctors can delete patient antecedents" ON antecedents;
CREATE POLICY "Doctors can delete patient antecedents" ON antecedents
FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM patients
        WHERE patients.id = antecedents.patient_id
        AND patients.doctor_id = antecedents.doctor_id
        AND patients.doctor_id IN (
            SELECT id FROM doctors WHERE user_id = auth.uid()
        )
    )
);

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Déclencheur pour updated_at
DROP TRIGGER IF EXISTS update_antecedents_updated_at ON antecedents;
CREATE TRIGGER update_antecedents_updated_at
    BEFORE UPDATE ON antecedents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();