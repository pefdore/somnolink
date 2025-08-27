import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

export async function POST(request: NextRequest) {
  try {
    const { patientId, doctorId, content } = await request.json();

    if (!patientId || !doctorId || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = createClient();
    
    // Vérifier que l'utilisateur est authentifié et a le rôle de docteur
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Vérifier que le docteur existe et correspond à l'utilisateur
    const { data: doctor } = await supabase
      .from('doctors')
      .select('id')
      .eq('id', doctorId)
      .eq('user_id', user.id)
      .single();

    if (!doctor) {
      return NextResponse.json(
        { error: 'Doctor not found or unauthorized' },
        { status: 403 }
      );
    }

    // Utiliser la fonction RPC pour insérer la note (contourne RLS)
    const { error } = await supabase
      .rpc('add_note', {
        p_patient_id: patientId,
        p_doctor_id: doctorId,
        p_content: content,
      });

    if (error) {
      console.error('Error calling add_note function:', error);
      return NextResponse.json(
        { error: 'Failed to insert note' },
        { status: 500 }
      );
    }

    console.log('Note inserted successfully via RPC function for patient:', patientId);
    
    // Vérifier que la note a bien été insérée en la récupérant
    const { data: insertedNote, error: fetchError } = await supabase
      .from('notes')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (fetchError) {
      console.error('Error fetching inserted note:', fetchError);
    } else {
      console.log('Inserted note verification:', insertedNote);
    }

    // Invalider le cache pour la page du patient
    revalidatePath(`/dashboard/doctor/patients/${patientId}`);
    
    // Retourner les données simulées de la note pour l'affichage immédiat
    // L'ID sera généré par Supabase mais nous simulons ici pour l'UI
    const noteData = {
      id: `temp-${Date.now()}`,
      patient_id: patientId,
      doctor_id: doctorId,
      content: content,
      created_at: new Date().toISOString(),
      doctors: {
        first_name: user.user_metadata?.first_name || 'Doctor',
        last_name: user.user_metadata?.last_name || 'User'
      }
    };

    console.log('Returning simulated note data for UI:', noteData);
    return NextResponse.json(noteData, { status: 201 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}