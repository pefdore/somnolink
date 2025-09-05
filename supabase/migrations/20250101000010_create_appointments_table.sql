-- Migration to create appointments table for patient-scheduled appointments
-- This allows patients to schedule their appointments directly in Somnolink

-- Create the appointments table
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

-- Create indexes for better performance
CREATE INDEX idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX idx_appointments_doctor_id ON appointments(doctor_id);
CREATE INDEX idx_appointments_datetime ON appointments(appointment_datetime);
CREATE INDEX idx_appointments_status ON appointments(status);

-- Enable RLS
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Doctors can view their patient appointments" ON appointments
FOR SELECT USING (
    doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
);

CREATE POLICY "Patients can view their own appointments" ON appointments
FOR SELECT USING (
    patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
);

CREATE POLICY "Patients can create appointments" ON appointments
FOR INSERT WITH CHECK (
    patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
);

CREATE POLICY "Doctors can update appointment status" ON appointments
FOR UPDATE USING (
    doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_appointments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
CREATE TRIGGER update_appointments_updated_at
    BEFORE UPDATE ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION update_appointments_updated_at();