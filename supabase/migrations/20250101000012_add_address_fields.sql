-- Migration to add address fields to patients table
-- This adds the missing address, city, and postal_code columns

-- Add address fields to patients table (will be ignored if columns already exist)
ALTER TABLE patients ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS city VARCHAR(255);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20);

-- Add comments for documentation
COMMENT ON COLUMN patients.address IS 'Patient street address';
COMMENT ON COLUMN patients.city IS 'Patient city';
COMMENT ON COLUMN patients.postal_code IS 'Patient postal code';

-- Message de confirmation
SELECT '✅ Champs d''adresse ajoutés à la table patients' as status;