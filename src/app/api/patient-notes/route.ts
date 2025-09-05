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

    // Récupérer les notes médicales du patient
    const { data: notesData, error: notesError } = await supabase
      .from('notes')
      .select(`
        id,
        content,
        created_at,
        doctors!notes_doctor_id_fkey (
          first_name,
          last_name
        )
      `)
      .eq('patient_id', patientData.id)
      .order('created_at', { ascending: false });

    if (notesError) {
      console.error('Erreur récupération notes:', notesError);
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des notes' },
        { status: 500 }
      );
    }

    // Formater les données
    const notes = notesData?.map(note => ({
      id: note.id,
      content: note.content,
      created_at: note.created_at,
      doctor: {
        first_name: (note.doctors as any)?.first_name || 'Dr.',
        last_name: (note.doctors as any)?.last_name || 'Inconnu'
      }
    })) || [];

    return NextResponse.json({
      notes: notes
    });

  } catch (error) {
    console.error('Erreur générale récupération notes:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}