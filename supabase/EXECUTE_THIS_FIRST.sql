-- 🚨 SCRIPT D'URGENCE - À EXÉCUTER EN PREMIER 🚨
-- Ce script corrige les politiques RLS et crée la table appointments

-- 1. SUPPRIMER LES POLITIQUES RLS PROBLÉMATIQUES
DROP POLICY IF EXISTS "Doctors can view patient antecedents" ON antecedents;
DROP POLICY IF EXISTS "Doctors can insert patient antecedents" ON antecedents;
DROP POLICY IF EXISTS "Doctors can update patient antecedents" ON antecedents;
DROP POLICY IF EXISTS "Doctors can delete patient antecedents" ON antecedents;

-- 2. POLITIQUES TEMPORAIRES PLUS PERMISSIVES
DROP POLICY IF EXISTS "Patients can view their own profile" ON patients;
DROP POLICY IF EXISTS "Doctors can view their patients" ON patients;
DROP POLICY IF EXISTS "Patients can update their own profile" ON patients;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON patients;

CREATE POLICY "allow_all_authenticated_users_patients" ON patients
FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Doctors can view their own profile" ON doctors;
DROP POLICY IF EXISTS "Doctors can update their own profile" ON doctors;

CREATE POLICY "allow_all_authenticated_users_doctors" ON doctors
FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Doctors can view all patient notes" ON notes;
DROP POLICY IF EXISTS "Doctors can view their patients notes" ON notes;
DROP POLICY IF EXISTS "Patients can view own notes" ON notes;

CREATE POLICY "allow_all_authenticated_users_notes" ON notes
FOR ALL USING (auth.role() = 'authenticated');

-- 3. CRÉER LA TABLE APPOINTMENTS
DROP TABLE IF EXISTS appointments CASCADE;

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

-- 4. INDEX ET POLITIQUES RLS
CREATE INDEX idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX idx_appointments_doctor_id ON appointments(doctor_id);
CREATE INDEX idx_appointments_datetime ON appointments(appointment_datetime);
CREATE INDEX idx_appointments_status ON appointments(status);

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all_authenticated_users_appointments" ON appointments
FOR ALL USING (auth.role() = 'authenticated');

-- 5. FONCTION POUR METTRE À JOUR UPDATED_AT
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

-- 6. ACTIVER RLS SUR TOUTES LES TABLES
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE antecedents ENABLE ROW LEVEL SECURITY;

-- MESSAGE DE CONFIRMATION
SELECT '✅ Script d''urgence exécuté avec succès !' as status;