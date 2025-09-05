import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    console.log('🔧 Correction de l\'accès des médecins aux dossiers patients...');

    // Supprimer l'ancienne politique trop restrictive
    const { error: dropError1 } = await supabase.rpc('exec_sql', {
      sql: `DROP POLICY IF EXISTS "Doctors can view their patients" ON patients;`
    });

    if (dropError1) {
      console.error('Erreur suppression politique view:', dropError1);
    }

    // Créer la nouvelle politique basée sur les relations
    const { error: createError1 } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE POLICY "Doctors can view their patients" ON patients
        FOR SELECT USING (
          EXISTS (
            SELECT 1 FROM patient_doctor_relationships pdr
            WHERE pdr.patient_id = patients.id
            AND pdr.doctor_id IN (
              SELECT id FROM doctors WHERE user_id = auth.uid()
            )
            AND pdr.status = 'active'
          )
        );
      `
    });

    if (createError1) {
      console.error('Erreur création politique view:', createError1);
    }

    // Supprimer et recréer la politique de mise à jour
    const { error: dropError2 } = await supabase.rpc('exec_sql', {
      sql: `DROP POLICY IF EXISTS "Doctors can update their patients" ON patients;`
    });

    if (dropError2) {
      console.error('Erreur suppression politique update:', dropError2);
    }

    const { error: createError2 } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE POLICY "Doctors can update their patients" ON patients
        FOR UPDATE USING (
          EXISTS (
            SELECT 1 FROM patient_doctor_relationships pdr
            WHERE pdr.patient_id = patients.id
            AND pdr.doctor_id IN (
              SELECT id FROM doctors WHERE user_id = auth.uid()
            )
            AND pdr.status = 'active'
          )
        )
        WITH CHECK (
          EXISTS (
            SELECT 1 FROM patient_doctor_relationships pdr
            WHERE pdr.patient_id = patients.id
            AND pdr.doctor_id IN (
              SELECT id FROM doctors WHERE user_id = auth.uid()
            )
            AND pdr.status = 'active'
          )
        );
      `
    });

    if (createError2) {
      console.error('Erreur création politique update:', createError2);
    }

    console.log('✅ Accès des médecins aux dossiers patients corrigé !');

    return NextResponse.json({
      success: true,
      message: 'Accès des médecins aux dossiers patients corrigé'
    });

  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}