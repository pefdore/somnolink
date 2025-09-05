-- CORRECTION SIMPLE DE LA TABLE APPOINTMENTS
-- À exécuter dans Supabase SQL Editor

-- 1. Supprimer la table défaillante
DROP TABLE IF EXISTS appointments CASCADE;

-- 2. Recréer la table correctement
CREATE TABLE appointments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    appointment_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
    type VARCHAR(100) NOT NULL,
    notes TEXT,
    status VARCHAR(20) DEFAULT 'scheduled',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT appointments_status_check CHECK (status IN ('scheduled', 'confirmed', 'cancelled', 'completed')),
    CONSTRAINT unique_doctor_appointment UNIQUE (doctor_id, appointment_datetime)
);

-- 3. Activer RLS
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- 4. Politique RLS temporaire (permissive pour tests)
CREATE POLICY "allow_all_authenticated_users_appointments" ON appointments
FOR ALL USING (auth.role() = 'authenticated');

-- 5. Index pour les performances
CREATE INDEX idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX idx_appointments_doctor_id ON appointments(doctor_id);
CREATE INDEX idx_appointments_datetime ON appointments(appointment_datetime);
CREATE INDEX idx_appointments_status ON appointments(status);

-- 6. Fonction et trigger pour updated_at
CREATE OR REPLACE FUNCTION update_appointments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_appointments_updated_at
    BEFORE UPDATE ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION update_appointments_updated_at();

-- 7. Vérification
SELECT '✅ Table appointments créée avec succès !' as status;