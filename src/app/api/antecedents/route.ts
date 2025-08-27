import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Vérifier l'authentification de l'utilisateur
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { patientId, code, system, label, type, note } = await request.json();

    // Validation des champs obligatoires
    if (!patientId || !code || !label || !type) {
      return NextResponse.json(
        { error: 'Champs obligatoires manquants: patientId, code, label, type' },
        { status: 400 }
      );
    }

    // Validation du type
    if (type !== 'medical' && type !== 'surgical') {
      return NextResponse.json(
        { error: 'Le type doit être "medical" ou "surgical"' },
        { status: 400 }
      );
    }

    // Récupérer l'ID du médecin à partir de l'utilisateur authentifié
    const { data: doctor } = await supabase
      .from('doctors')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!doctor) {
      return NextResponse.json(
        { error: 'Doctor not found or unauthorized' },
        { status: 403 }
      );
    }

    // Insertion directe dans la table antecedents (solution temporaire)
    const { data, error } = await supabase
      .from('antecedents')
      .insert({
        patient_id: patientId,
        doctor_id: doctor.id,
        code: code,
        system: system || 'CIM-11',
        label: label,
        type: type,
        note: note || null
      })
      .select('id')
      .single();

    if (error) {
      console.error('Erreur lors de l\'ajout de l\'antécédent:', error);
      return NextResponse.json(
        { error: 'Erreur lors de l\'ajout de l\'antécédent: ' + error.message },
        { status: 500 }
      );
    }

    console.log('Antécédent ajouté avec succès, ID:', data);

    // Invalider le cache pour la page du patient
    revalidatePath(`/dashboard/doctor/patients/${patientId}`);

    return NextResponse.json({ 
      success: true, 
      antecedentId: data 
    }, { status: 201 });

  } catch (error) {
    console.error('Erreur inattendue:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}