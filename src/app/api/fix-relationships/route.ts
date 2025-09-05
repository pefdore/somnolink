import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    console.log('🔧 Correction des relations entre tables...');

    // Appliquer la correction des relations
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
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
      `
    });

    if (error) {
      console.error('❌ Erreur lors de la correction des relations:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la correction des relations', details: error.message },
        { status: 500 }
      );
    }

    console.log('✅ Relations entre tables corrigées !');

    return NextResponse.json({
      success: true,
      message: 'Relations entre tables corrigées avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur générale:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}