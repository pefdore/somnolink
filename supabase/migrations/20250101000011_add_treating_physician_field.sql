-- Migration to add treating physician field to patients table
-- This allows tracking which doctor is the primary treating physician for each patient

-- Add treating physician field
ALTER TABLE patients
ADD COLUMN IF NOT EXISTS treating_physician_id UUID REFERENCES doctors(id);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_patients_treating_physician ON patients(treating_physician_id);

-- Add comment for documentation
COMMENT ON COLUMN patients.treating_physician_id IS 'ID of the primary treating physician for this patient';

-- Update RLS policies to allow patients to see their treating physician info
-- (This should be handled by existing policies, but ensuring it's covered)

-- Message de confirmation
SELECT '✅ Champ "médecin traitant" ajouté à la table patients' as status;