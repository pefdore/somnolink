import { createClient } from '../../../lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      phone_number,
      date_of_birth,
      address,
      city,
      postal_code,
      gender,
      emergency_contact_name,
      emergency_contact_phone,
      emergency_contact_relationship,
      insurance_provider,
      insurance_number,
      insurance_expiry_date,
      allergies,
      current_medications,
      medical_conditions,
      sleep_schedule,
      sleep_quality,
      preferred_language
    } = body;

    // Validation basique
    if (phone_number && !/^[\+]?[0-9\s\-\(\)]+$/.test(phone_number)) {
      return NextResponse.json(
        { error: 'Format de numéro de téléphone invalide' },
        { status: 400 }
      );
    }

    if (emergency_contact_phone && !/^[\+]?[0-9\s\-\(\)]+$/.test(emergency_contact_phone)) {
      return NextResponse.json(
        { error: 'Format de numéro d\'urgence invalide' },
        { status: 400 }
      );
    }

    // Mise à jour du profil - commencer par les champs de base qui existent toujours
    const baseUpdateData: any = {
      phone_number: phone_number || null,
      date_of_birth: date_of_birth || null,
      address: address || null,
      city: city || null,
      postal_code: postal_code || null,
    };

    // Ajouter les nouveaux champs seulement s'ils sont fournis
    const extendedUpdateData: any = {};
    if (gender !== undefined) extendedUpdateData.gender = gender || null;
    if (emergency_contact_name !== undefined) extendedUpdateData.emergency_contact_name = emergency_contact_name || null;
    if (emergency_contact_phone !== undefined) extendedUpdateData.emergency_contact_phone = emergency_contact_phone || null;
    if (emergency_contact_relationship !== undefined) extendedUpdateData.emergency_contact_relationship = emergency_contact_relationship || null;
    if (insurance_provider !== undefined) extendedUpdateData.insurance_provider = insurance_provider || null;
    if (insurance_number !== undefined) extendedUpdateData.insurance_number = insurance_number || null;
    if (insurance_expiry_date !== undefined) extendedUpdateData.insurance_expiry_date = insurance_expiry_date || null;
    if (allergies !== undefined) extendedUpdateData.allergies = allergies || null;
    if (current_medications !== undefined) extendedUpdateData.current_medications = current_medications || null;
    if (medical_conditions !== undefined) extendedUpdateData.medical_conditions = medical_conditions || null;
    if (sleep_schedule !== undefined) extendedUpdateData.sleep_schedule = sleep_schedule || null;
    if (sleep_quality !== undefined) extendedUpdateData.sleep_quality = sleep_quality || null;
    if (preferred_language !== undefined) extendedUpdateData.preferred_language = preferred_language || 'fr';

    // Combiner les données de mise à jour
    const updateData = { ...baseUpdateData, ...extendedUpdateData };

    const { data, error } = await supabase
      .from('patients')
      .update(updateData)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Erreur lors de la mise à jour du profil:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour du profil' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Profil mis à jour avec succès',
      data
    });

  } catch (error) {
    console.error('Erreur serveur:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    // First, try to get the basic profile data that should always exist
    const { data: basicData, error: basicError } = await supabase
      .from('patients')
      .select('first_name, last_name, phone_number, email, date_of_birth, address, city, postal_code')
      .eq('user_id', user.id)
      .single();

    if (basicError) {
      console.error('Erreur lors de la récupération du profil de base:', basicError);
      return NextResponse.json(
        { error: 'Erreur lors de la récupération du profil' },
        { status: 500 }
      );
    }

    // Try to get the extended profile data (new columns)
    let extendedData = {};
    try {
      const { data: extendedResult, error: extendedError } = await supabase
        .from('patients')
        .select('gender, emergency_contact_name, emergency_contact_phone, emergency_contact_relationship, insurance_provider, insurance_number, insurance_expiry_date, allergies, current_medications, medical_conditions, sleep_schedule, sleep_quality, preferred_language')
        .eq('user_id', user.id)
        .single();

      if (!extendedError && extendedResult) {
        extendedData = extendedResult;
      }
    } catch (error) {
      console.log('Nouvelles colonnes non disponibles, utilisation des valeurs par défaut');
    }

    // Combine basic and extended data
    const data = { ...basicData, ...extendedData };

    return NextResponse.json({ data });

  } catch (error) {
    console.error('Erreur serveur:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}