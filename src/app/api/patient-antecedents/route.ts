import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Récupérer l'ID du patient
    const { data: patientData, error: patientError } = await supabase
      .from('patients')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (patientError || !patientData) {
      console.error('Profil patient introuvable:', patientError);
      return NextResponse.json(
        { error: 'Profil patient introuvable' },
        { status: 404 }
      );
    }

    // Récupérer les antécédents médicaux du patient
    const { data: antecedentsData, error: antecedentsError } = await supabase
      .from('antecedents')
      .select(`
        id,
        code,
        system,
        label,
        type,
        note,
        created_at,
        doctors!antecedents_doctor_id_fkey (
          first_name,
          last_name
        )
      `)
      .eq('patient_id', patientData.id)
      .order('created_at', { ascending: false });

    if (antecedentsError) {
      console.error('Erreur récupération antécédents:', antecedentsError);
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des antécédents' },
        { status: 500 }
      );
    }

    // Formater les données
    const antecedents = antecedentsData?.map(antecedent => ({
      id: antecedent.id,
      code: antecedent.code,
      system: antecedent.system,
      label: antecedent.label,
      type: antecedent.type,
      note: antecedent.note,
      created_at: antecedent.created_at,
      doctor: {
        first_name: (antecedent.doctors as any)?.first_name || 'Dr.',
        last_name: (antecedent.doctors as any)?.last_name || 'Inconnu'
      }
    })) || [];

    return NextResponse.json({
      antecedents: antecedents
    });

  } catch (error) {
    console.error('Erreur générale récupération antécédents:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}