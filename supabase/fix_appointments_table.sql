-- Script pour corriger la table appointments existante

-- Vérifier si la colonne appointment_datetime existe
DO $$
DECLARE
    column_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'appointments'
        AND column_name = 'appointment_datetime'
    ) INTO column_exists;

    IF NOT column_exists THEN
        -- La colonne n'existe pas, supprimer et recréer la table
        RAISE NOTICE 'La colonne appointment_datetime n''existe pas. Recréation de la table...';

        -- Supprimer la table défaillante
        DROP TABLE IF EXISTS appointments CASCADE;

        -- Recréer la table correctement
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

        -- Activer RLS
        ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

        -- Supprimer l'ancienne politique trop permissive
        DROP POLICY IF EXISTS "allow_all_authenticated_users_appointments" ON appointments;

        -- Politiques pour les médecins : peuvent voir et modifier leurs propres rendez-vous
        CREATE POLICY "Doctors can view their appointments" ON appointments
        FOR SELECT USING (
            doctor_id IN (
                SELECT id FROM doctors WHERE user_id = auth.uid()
            )
        );

        CREATE POLICY "Doctors can update their appointments" ON appointments
        FOR UPDATE USING (
            doctor_id IN (
                SELECT id FROM doctors WHERE user_id = auth.uid()
            )
        );

        -- Politiques pour les patients : peuvent voir et créer leurs propres rendez-vous
        CREATE POLICY "Patients can view their appointments" ON appointments
        FOR SELECT USING (
            patient_id = auth.uid()
        );

        CREATE POLICY "Patients can create appointments" ON appointments
        FOR INSERT WITH CHECK (
            patient_id = auth.uid()
        );

        -- Index
        CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON appointments(patient_id);
        CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id ON appointments(doctor_id);
        CREATE INDEX IF NOT EXISTS idx_appointments_datetime ON appointments(appointment_datetime);
        CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);

        -- Trigger pour updated_at
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

        RAISE NOTICE '✅ Table appointments recréée avec succès !';
    ELSE
        RAISE NOTICE '✅ La table appointments existe déjà avec la colonne appointment_datetime.';
    END IF;
END $$;

-- Vérifier que tout est en ordre
SELECT
    'Table appointments vérifiée' as status,
    COUNT(*) as total_appointments
FROM appointments;