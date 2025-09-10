-- Migration pour ajouter les colonnes nécessaires aux antécédents patients
-- Ces colonnes permettent de distinguer les antécédents définis par le patient de ceux définis par le médecin

-- Ajouter la colonne defined_by si elle n'existe pas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'antecedents'
        AND column_name = 'defined_by'
    ) THEN
        ALTER TABLE antecedents ADD COLUMN defined_by VARCHAR(20) DEFAULT 'doctor' CHECK (defined_by IN ('patient', 'doctor'));
        RAISE NOTICE '✅ Colonne defined_by ajoutée à antecedents';
    ELSE
        RAISE NOTICE 'ℹ️ Colonne defined_by existe déjà dans antecedents';
    END IF;
END $$;

-- Ajouter la colonne validated_by_doctor si elle n'existe pas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'antecedents'
        AND column_name = 'validated_by_doctor'
    ) THEN
        ALTER TABLE antecedents ADD COLUMN validated_by_doctor BOOLEAN DEFAULT false;
        RAISE NOTICE '✅ Colonne validated_by_doctor ajoutée à antecedents';
    ELSE
        RAISE NOTICE 'ℹ️ Colonne validated_by_doctor existe déjà dans antecedents';
    END IF;
END $$;

-- Ajouter la colonne patient_note si elle n'existe pas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'antecedents'
        AND column_name = 'patient_note'
    ) THEN
        ALTER TABLE antecedents ADD COLUMN patient_note TEXT;
        RAISE NOTICE '✅ Colonne patient_note ajoutée à antecedents';
    ELSE
        RAISE NOTICE 'ℹ️ Colonne patient_note existe déjà dans antecedents';
    END IF;
END $$;

-- Mettre à jour les antécédents existants pour définir defined_by
UPDATE antecedents
SET defined_by = 'doctor'
WHERE defined_by IS NULL;

-- Mettre à jour les antécédents existants pour validated_by_doctor
UPDATE antecedents
SET validated_by_doctor = true
WHERE validated_by_doctor IS NULL AND defined_by = 'doctor';

UPDATE antecedents
SET validated_by_doctor = false
WHERE validated_by_doctor IS NULL AND defined_by = 'patient';

-- Créer un index pour les recherches par defined_by
CREATE INDEX IF NOT EXISTS idx_antecedents_defined_by ON antecedents(defined_by);
CREATE INDEX IF NOT EXISTS idx_antecedents_validated_by_doctor ON antecedents(validated_by_doctor);

-- Message de confirmation
DO $$
BEGIN
    RAISE NOTICE '✅ Migration des colonnes patient pour antecedents terminée';
    RAISE NOTICE '✅ Colonnes: defined_by, validated_by_doctor, patient_note';
    RAISE NOTICE '✅ Index créés pour les performances';
END $$;