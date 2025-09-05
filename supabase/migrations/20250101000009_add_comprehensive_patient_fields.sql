-- Migration to add comprehensive fields to patients table for enhanced profile
-- This adds medical, emergency contact, insurance, and sleep-related information

-- Add new columns to patients table
ALTER TABLE patients
ADD COLUMN IF NOT EXISTS gender VARCHAR(20) CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
ADD COLUMN IF NOT EXISTS emergency_contact_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS emergency_contact_phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS emergency_contact_relationship VARCHAR(100),
ADD COLUMN IF NOT EXISTS insurance_provider VARCHAR(255),
ADD COLUMN IF NOT EXISTS insurance_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS insurance_expiry_date DATE,
ADD COLUMN IF NOT EXISTS allergies TEXT,
ADD COLUMN IF NOT EXISTS current_medications TEXT,
ADD COLUMN IF NOT EXISTS medical_conditions TEXT,
ADD COLUMN IF NOT EXISTS sleep_schedule TEXT,
ADD COLUMN IF NOT EXISTS sleep_quality VARCHAR(50),
ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(10) DEFAULT 'fr';

-- Create indexes for better performance on commonly queried fields
CREATE INDEX IF NOT EXISTS idx_patients_gender ON patients(gender);
CREATE INDEX IF NOT EXISTS idx_patients_insurance_provider ON patients(insurance_provider);
CREATE INDEX IF NOT EXISTS idx_patients_preferred_language ON patients(preferred_language);

-- Update RLS policies to allow patients to update their own comprehensive profile
-- (The existing policy should already cover this, but ensuring it includes all new fields)

-- Add comments for documentation
COMMENT ON COLUMN patients.gender IS 'Patient gender: male, female, other, or prefer_not_to_say';
COMMENT ON COLUMN patients.emergency_contact_name IS 'Name of emergency contact person';
COMMENT ON COLUMN patients.emergency_contact_phone IS 'Phone number of emergency contact';
COMMENT ON COLUMN patients.emergency_contact_relationship IS 'Relationship to the emergency contact (e.g., spouse, parent, sibling)';
COMMENT ON COLUMN patients.insurance_provider IS 'Name of health insurance provider';
COMMENT ON COLUMN patients.insurance_number IS 'Insurance policy number';
COMMENT ON COLUMN patients.insurance_expiry_date IS 'Expiry date of insurance coverage';
COMMENT ON COLUMN patients.allergies IS 'List of known allergies (comma-separated)';
COMMENT ON COLUMN patients.current_medications IS 'List of current medications (comma-separated)';
COMMENT ON COLUMN patients.medical_conditions IS 'List of current medical conditions (comma-separated)';
COMMENT ON COLUMN patients.sleep_schedule IS 'Typical sleep schedule (e.g., bedtime, wake time)';
COMMENT ON COLUMN patients.sleep_quality IS 'Self-reported sleep quality (excellent, good, fair, poor)';
COMMENT ON COLUMN patients.preferred_language IS 'Preferred language for communication (ISO language code, default: fr)';