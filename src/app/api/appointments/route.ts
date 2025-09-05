import { createClient } from '../../../lib/supabase/server';
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
      console.error('Erreur récupération patient:', patientError);
      return NextResponse.json(
        { error: 'Profil patient introuvable' },
        { status: 404 }
      );
    }

    // Récupérer les rendez-vous du patient
    const { data: appointmentsData, error: appointmentsError } = await supabase
      .from('appointments')
      .select(`
        id,
        appointment_datetime,
        type,
        notes,
        doctors!appointments_doctor_id_fkey (
          first_name,
          last_name
        )
      `)
      .eq('patient_id', patientData.id)
      .gte('appointment_datetime', new Date().toISOString())
      .order('appointment_datetime', { ascending: true });

    if (appointmentsError) {
      console.error('Erreur récupération rendez-vous:', appointmentsError);
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des rendez-vous' },
        { status: 500 }
      );
    }

    // Formater les données
    const appointments = appointmentsData?.map(apt => ({
      id: apt.id,
      appointment_datetime: apt.appointment_datetime,
      type: apt.type,
      notes: apt.notes,
      doctor: {
        first_name: (apt.doctors as any)?.first_name || '',
        last_name: (apt.doctors as any)?.last_name || ''
      }
    })) || [];

    return NextResponse.json({
      appointments: appointments
    });

  } catch (error) {
    console.error('Erreur générale récupération rendez-vous:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { date, time, type, notes, doctorToken: encodedDoctorToken, doctorId } = await request.json();
    const doctorToken = encodedDoctorToken ? decodeURIComponent(encodedDoctorToken) : null;

    // Validation des données

    // Validation des données - soit doctorToken soit doctorId doit être présent
    if (!date || !time || !type || (!doctorToken && !doctorId)) {
      return NextResponse.json(
        { error: 'Données manquantes - token ou ID du médecin requis' },
        { status: 400 }
      );
    }

    // Trouver le médecin via le token ou l'ID
    let doctorData;
    let doctorError;

    if (doctorToken) {
      // Recherche par token (ancienne méthode)
      const result = await supabase
        .from('doctors')
        .select('id, first_name, last_name')
        .eq('public_invitation_token', doctorToken)
        .eq('public_invitation_enabled', true)
        .single();

      doctorData = result.data;
      doctorError = result.error;
    } else if (doctorId) {
      // Recherche par ID (nouvelle méthode depuis le dashboard)
      const result = await supabase
        .from('doctors')
        .select('id, first_name, last_name')
        .eq('id', doctorId)
        .single();

      doctorData = result.data;
      doctorError = result.error;
    }

    if (doctorError || !doctorData) {
      console.error('Erreur recherche médecin:', doctorError);
      return NextResponse.json(
        { error: 'Médecin non trouvé' },
        { status: 404 }
      );
    }

    // Créer la date et heure du rendez-vous
    const appointmentDateTime = new Date(`${date}T${time}`);

    // Validation de la date (doit être dans le futur)
    const now = new Date();
    if (appointmentDateTime <= now) {
      return NextResponse.json(
        { error: 'La date du rendez-vous doit être dans le futur' },
        { status: 400 }
      );
    }

    // Récupérer l'ID du patient depuis la table patients
    const { data: patientData, error: patientError } = await supabase
      .from('patients')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (patientError || !patientData) {
      console.error('Erreur récupération patient:', patientError);
      return NextResponse.json(
        { error: 'Profil patient introuvable' },
        { status: 404 }
      );
    }

    // Insérer le rendez-vous dans la base de données
    // Insérer le rendez-vous dans la base de données
    const { data: appointment, error: insertError } = await supabase
      .from('appointments')
      .insert({
        patient_id: patientData.id,
        doctor_id: doctorData.id,
        appointment_datetime: appointmentDateTime,
        type,
        notes
      })
      .select()
      .single();

    if (insertError) {
      console.error('Erreur lors de l\'insertion du rendez-vous:', insertError);
      return NextResponse.json(
        { error: 'Erreur lors de la programmation du rendez-vous' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Rendez-vous programmé avec succès',
      appointment: {
        date,
        time,
        type,
        doctor: `${doctorData.first_name} ${doctorData.last_name}`,
        datetime: appointmentDateTime.toISOString()
      }
    });

  } catch (error) {
    console.error('Erreur lors de la programmation du rendez-vous:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}