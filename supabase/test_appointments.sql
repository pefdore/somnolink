-- Test rapide pour vérifier et créer la table appointments

-- Vérifier si la table existe
SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'appointments'
) as table_exists;

-- Si elle n'existe pas, la créer
CREATE TABLE IF NOT EXISTS appointments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID NOT NULL,
    doctor_id UUID NOT NULL,
    appointment_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
    type VARCHAR(100) NOT NULL,
    notes TEXT,
    status VARCHAR(20) DEFAULT 'scheduled',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activer RLS
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Politique simple
DROP POLICY IF EXISTS "appointments_policy" ON appointments;
CREATE POLICY "appointments_policy" ON appointments
FOR ALL USING (auth.role() = 'authenticated');

-- Index
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_datetime ON appointments(appointment_datetime);

-- Test d'insertion
INSERT INTO appointments (patient_id, doctor_id, appointment_datetime, type, notes)
VALUES ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', NOW() + INTERVAL '1 day', 'test', 'Test appointment')
ON CONFLICT DO NOTHING;

-- Vérifier le contenu
SELECT COUNT(*) as total_appointments FROM appointments;

-- Nettoyer le test
DELETE FROM appointments WHERE type = 'test';

SELECT '✅ Test terminé - Table appointments opérationnelle' as result;