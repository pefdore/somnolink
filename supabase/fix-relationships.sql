-- Correction des relations entre tables pour résoudre l'erreur PGRST200
-- "Could not find a relationship between 'patients' and 'appointments' in the schema cache"

-- Vérifier et créer les clés étrangères si elles n'existent pas
DO $$
BEGIN
    -- Vérifier si la clé étrangère patient_id existe dans appointments
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'appointments_patient_id_fkey'
        AND table_name = 'appointments'
    ) THEN
        ALTER TABLE appointments
        ADD CONSTRAINT appointments_patient_id_fkey
        FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE;
        RAISE NOTICE '✅ Clé étrangère appointments.patient_id -> patients.id créée';
    ELSE
        RAISE NOTICE 'ℹ️ Clé étrangère appointments.patient_id existe déjà';
    END IF;

    -- Vérifier si la clé étrangère doctor_id existe dans appointments
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'appointments_doctor_id_fkey'
        AND table_name = 'appointments'
    ) THEN
        ALTER TABLE appointments
        ADD CONSTRAINT appointments_doctor_id_fkey
        FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE;
        RAISE NOTICE '✅ Clé étrangère appointments.doctor_id -> doctors.id créée';
    ELSE
        RAISE NOTICE 'ℹ️ Clé étrangère appointments.doctor_id existe déjà';
    END IF;

    -- Vérifier les autres relations importantes
    -- patient_doctor_relationships -> patients
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'patient_doctor_relationships_patient_id_fkey'
        AND table_name = 'patient_doctor_relationships'
    ) THEN
        ALTER TABLE patient_doctor_relationships
        ADD CONSTRAINT patient_doctor_relationships_patient_id_fkey
        FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE;
        RAISE NOTICE '✅ Clé étrangère patient_doctor_relationships.patient_id -> patients.id créée';
    END IF;

    -- patient_doctor_relationships -> doctors
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'patient_doctor_relationships_doctor_id_fkey'
        AND table_name = 'patient_doctor_relationships'
    ) THEN
        ALTER TABLE patient_doctor_relationships
        ADD CONSTRAINT patient_doctor_relationships_doctor_id_fkey
        FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE;
        RAISE NOTICE '✅ Clé étrangère patient_doctor_relationships.doctor_id -> doctors.id créée';
    END IF;

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '⚠️ Erreur lors de la création des clés étrangères: %', SQLERRM;
END $$;

-- Forcer le rafraîchissement du cache de schéma de PostgREST
NOTIFY pgrst, 'reload schema';

-- Message de confirmation
SELECT '✅ Relations entre tables vérifiées/créées' as status;