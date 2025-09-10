import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Récupérer l'ID du patient
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (patientError || !patient) {
      return NextResponse.json({ error: 'Patient non trouvé' }, { status: 404 });
    }

    // Récupérer les antécédents du patient avec les informations du médecin
    const { data: antecedents, error: antecedentsError } = await supabase
      .from('antecedents')
      .select(`
        *,
        doctors!antecedents_doctor_id_fkey (
          id,
          first_name,
          last_name
        )
      `)
      .eq('patient_id', patient.id)
      .order('created_at', { ascending: false });

    if (antecedentsError) {
      console.error('Erreur récupération antécédents:', antecedentsError);
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des antécédents' },
        { status: 500 }
      );
    }

    return NextResponse.json({ antecedents: antecedents || [] });

  } catch (error) {
    console.error('Erreur inattendue:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { code, system, label, type, note } = await request.json();

    // Validation des champs obligatoires
    if (!code || !label || !type) {
      return NextResponse.json(
        { error: 'Champs obligatoires manquants: code, label, type' },
        { status: 400 }
      );
    }

    // Validation du type
    if (!['medical', 'surgical', 'allergy', 'treatment', 'medication'].includes(type)) {
      return NextResponse.json(
        { error: 'Le type doit être "medical", "surgical", "allergy", "treatment" ou "medication"' },
        { status: 400 }
      );
    }

    // Récupérer l'ID du patient
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (patientError || !patient) {
      return NextResponse.json({ error: 'Patient non trouvé' }, { status: 404 });
    }

    // Vérifier si l'antécédent existe déjà
    const { data: existingAntecedent, error: checkError } = await supabase
      .from('antecedents')
      .select('id')
      .eq('patient_id', patient.id)
      .eq('code', code)
      .eq('type', type)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = not found
      console.error('Erreur lors de la vérification:', checkError);
      return NextResponse.json(
        { error: 'Erreur lors de la vérification de l\'antécédent existant' },
        { status: 500 }
      );
    }

    if (existingAntecedent) {
      return NextResponse.json(
        { error: 'Cet antécédent existe déjà pour ce patient', antecedentId: existingAntecedent.id },
        { status: 409 }
      );
    }

    // Récupérer le médecin assigné au patient
    const { data: relationship, error: relationshipError } = await supabase
      .from('patient_doctor_relationships')
      .select('doctor_id')
      .eq('patient_id', patient.id)
      .eq('status', 'active')
      .single();

    if (relationshipError || !relationship) {
      console.error('Erreur récupération relation patient-médecin:', relationshipError);
      return NextResponse.json(
        { error: 'Aucun médecin assigné trouvé pour ce patient' },
        { status: 400 }
      );
    }

    // Insertion dans la table antecedents
    const { data, error } = await supabase
      .from('antecedents')
      .insert({
        patient_id: patient.id,
        doctor_id: relationship.doctor_id,
        code: code,
        system: system || 'CIM-11',
        label: label,
        type: type,
        note: note || null,
        defined_by: 'patient',
        validated_by_doctor: false
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

    // Mettre à jour le champ JSON correspondant dans la table patients
    const fieldMapping = {
      'medical': 'medical_history',
      'surgical': 'surgical_history',
      'allergy': 'allergy_history',
      'treatment': 'treatment_history',
      'medication': 'medication_history'
    };
    const fieldToSelect = fieldMapping[type as keyof typeof fieldMapping] || 'medical_history';
    const { data: patientData, error: patientError2 } = await supabase
      .from('patients')
      .select(fieldToSelect)
      .eq('id', patient.id)
      .single();

    if (!patientError2) {
      const jsonAntecedent = {
        code: code,
        system: system,
        label: label,
        type: type,
        note: note || null
      };

      const currentHistory = (patientData as any)[fieldToSelect] || { description: '', entries: [] };
      const updatedEntries = [...(currentHistory.entries || []), jsonAntecedent];

      const updateData: any = {};
      updateData[fieldToSelect] = {
        description: currentHistory.description || '',
        entries: updatedEntries
      };

      await supabase
        .from('patients')
        .update(updateData)
        .eq('id', patient.id);
    }

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