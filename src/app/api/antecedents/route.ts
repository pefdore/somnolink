import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 [ANTECEDENTS API] Nouvelle requête reçue');

    const supabase = createClient();

    // Vérifier l'authentification de l'utilisateur
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    console.log('🔍 [ANTECEDENTS API] Utilisateur:', user?.id, 'Erreur auth:', authError?.message);

    if (authError || !user) {
      console.log('❌ [ANTECEDENTS API] Utilisateur non autorisé');
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { patientId, code, system, label, type, note } = await request.json();

    console.log('🔍 [ANTECEDENTS API] Données reçues:', { patientId, code, system, label, type, note });

    // Validation des champs obligatoires
    if (!patientId || !code || !label || !type) {
      return NextResponse.json(
        { error: 'Champs obligatoires manquants: patientId, code, label, type' },
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

    // Récupérer l'ID du médecin à partir de l'utilisateur authentifié
    console.log('🔍 [ANTECEDENTS API] Recherche du médecin pour user_id:', user.id);

    const { data: doctor, error: doctorError } = await supabase
      .from('doctors')
      .select('id')
      .eq('user_id', user.id)
      .single();

    console.log('🔍 [ANTECEDENTS API] Médecin trouvé:', doctor?.id, 'Erreur:', doctorError?.message);

    if (doctorError || !doctor) {
      console.log('❌ [ANTECEDENTS API] Médecin non trouvé ou erreur:', doctorError);
      return NextResponse.json(
        { error: 'Doctor not found or unauthorized' },
        { status: 403 }
      );
    }

    // Vérifier si l'antécédent existe déjà
    console.log('🔍 [ANTECEDENTS API] Vérification si antécédent existe déjà...');

    const { data: existingAntecedent, error: checkError } = await supabase
      .from('antecedents')
      .select('id')
      .eq('patient_id', patientId)
      .eq('code', code)
      .eq('type', type)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = not found
      console.error('❌ [ANTECEDENTS API] Erreur lors de la vérification:', checkError);
      return NextResponse.json(
        { error: 'Erreur lors de la vérification de l\'antécédent existant' },
        { status: 500 }
      );
    }

    if (existingAntecedent) {
      console.log('⚠️ [ANTECEDENTS API] Antécédent déjà existant, ID:', existingAntecedent.id);
      return NextResponse.json(
        { error: 'Cet antécédent existe déjà pour ce patient', antecedentId: existingAntecedent.id },
        { status: 409 } // Conflict
      );
    }

    // Insertion dans la table antecedents
    console.log('🔍 [ANTECEDENTS API] Tentative d\'insertion:', {
      patient_id: patientId,
      doctor_id: doctor.id,
      code: code,
      system: system || 'CIM-11',
      label: label,
      type: type,
      note: note || null
    });

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

    console.log('🔍 [ANTECEDENTS API] Résultat insertion:', { data, error: error?.message, code: error?.code, details: error?.details, hint: error?.hint });

    if (error) {
      console.error('❌ [ANTECEDENTS API] Erreur lors de l\'ajout de l\'antécédent:', error);
      console.error('❌ [ANTECEDENTS API] Détails complets:', JSON.stringify(error, null, 2));
      return NextResponse.json(
        { error: 'Erreur lors de l\'ajout de l\'antécédent: ' + error.message, code: error.code, details: error.details },
        { status: 500 }
      );
    }

    console.log('✅ [ANTECEDENTS API] Antécédent ajouté avec succès, ID:', data);

    // Mettre à jour le champ JSON correspondant dans la table patients
    console.log('🔍 [ANTECEDENTS API] Mise à jour du champ JSON dans patients...');

    // Récupérer les données actuelles du patient
    const fieldMapping = {
      'medical': 'medical_history',
      'surgical': 'surgical_history',
      'allergy': 'allergy_history',
      'treatment': 'treatment_history',
      'medication': 'medication_history'
    };
    const fieldToSelect = fieldMapping[type as keyof typeof fieldMapping] || 'medical_history';
    const { data: patientData, error: patientError } = await supabase
      .from('patients')
      .select(fieldToSelect)
      .eq('id', patientId)
      .single();

    console.log('🔍 [ANTECEDENTS API] Données actuelles du patient:', patientData);
    console.log('🔍 [ANTECEDENTS API] Erreur récupération:', patientError);

    if (patientError) {
      console.error('❌ [ANTECEDENTS API] Erreur récupération patient:', patientError);
      // Ne pas échouer pour autant, l'antécédent est déjà ajouté
    } else {
      // Préparer la structure de l'antécédent pour le champ JSON
      const jsonAntecedent = {
        code: code,
        system: system,
        label: label,
        type: type,
        note: note || null
      };

      // Récupérer la liste actuelle ou créer une nouvelle
      const currentHistory = (patientData as any)[fieldToSelect] || { description: '', entries: [] };
      console.log('🔍 [ANTECEDENTS API] Historique actuel:', currentHistory);
      const updatedEntries = [...(currentHistory.entries || []), jsonAntecedent];
      console.log('🔍 [ANTECEDENTS API] Nouvelles entrées:', updatedEntries);

      // Mettre à jour le champ JSON
      const updateData: any = {};
      updateData[fieldToSelect] = {
        description: currentHistory.description || '',
        entries: updatedEntries
      };

      console.log('🔍 [ANTECEDENTS API] Données de mise à jour:', updateData);

      const { error: updateError } = await supabase
        .from('patients')
        .update(updateData)
        .eq('id', patientId);

      console.log('🔍 [ANTECEDENTS API] Résultat mise à jour:', { error: updateError });

      if (updateError) {
        console.error('❌ [ANTECEDENTS API] Erreur mise à jour champ JSON:', updateError);
      } else {
        console.log('✅ [ANTECEDENTS API] Champ JSON mis à jour avec succès');
      }
    }

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