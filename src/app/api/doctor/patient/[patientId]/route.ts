import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { patientId: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Vérifier que l'utilisateur est un médecin
    const { data: doctor } = await supabase
      .from('doctors')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!doctor) {
      return NextResponse.json({ error: 'Accès réservé aux médecins' }, { status: 403 });
    }

    // Vérifier la relation patient-médecin
    const { data: relationship } = await supabase
      .from('patient_doctor_relationships')
      .select('*')
      .eq('patient_id', params.patientId)
      .eq('doctor_id', doctor.id)
      .eq('status', 'active')
      .single();

    if (!relationship) {
      return NextResponse.json({ error: 'Relation patient-médecin non trouvée' }, { status: 404 });
    }

    // Récupérer les données du patient
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('*')
      .eq('id', params.patientId)
      .single();

    if (patientError) {
      console.error('❌ [DOCTOR API] Patient not found:', patientError);
      return NextResponse.json({ error: 'Patient non trouvé' }, { status: 404 });
    }

    // Récupérer l'email depuis la table patients (méthode sécurisée)
    console.log('🔍 [DOCTOR API] Getting email from patients table for user_id:', patient.user_id);

    // Essayer d'abord l'email de la table patients
    let patientEmail = patient.email || '';

    // Si pas d'email dans patients, essayer une approche alternative sécurisée
    if (!patientEmail) {
      try {
        // Utiliser une requête SQL sécurisée pour récupérer l'email
        const { data: emailData, error: emailError } = await supabase
          .from('patients')
          .select('email')
          .eq('user_id', patient.user_id)
          .single();

        if (!emailError && emailData?.email) {
          patientEmail = emailData.email;
        }
      } catch (fallbackError) {
        console.log('⚠️ [DOCTOR API] Could not retrieve email via fallback method');
      }
    }

    console.log('📧 [DOCTOR API] Email sources:', {
      fromPatientTable: patient.email,
      finalEmail: patientEmail
    });

    console.log('✅ [DOCTOR API] Patient data retrieved:', {
      id: patient.id,
      email: patient.email,
      social_security_number: patient.social_security_number,
      civility: patient.civility,
      address: patient.address,
      city: patient.city,
      postal_code: patient.postal_code,
      user_id: patient.user_id
    });

    // Récupérer les notes
    let notes = [];
    try {
      const { data: notesData } = await supabase
        .rpc('get_patient_notes', { p_patient_id: params.patientId });

      if (notesData) {
        notes = notesData;
      }
    } catch {
      const { data: fallbackNotes } = await supabase
        .from('notes')
        .select('*, doctors(first_name, last_name)')
        .eq('patient_id', params.patientId)
        .order('created_at', { ascending: false });

      if (fallbackNotes) {
        notes = fallbackNotes;
      }
    }

    // Récupérer les antécédents médicaux de la table antecedents (seulement ceux du médecin connecté)
    const { data: tableAntecedents } = await supabase
      .from('antecedents')
      .select('*')
      .eq('patient_id', params.patientId)
      .eq('doctor_id', doctor.id)
      .order('created_at', { ascending: false });

    // Récupérer les antécédents des champs JSON de la table patients
    const { data: patientData } = await supabase
      .from('patients')
      .select('medical_history, surgical_history, allergies, treatments')
      .eq('id', params.patientId)
      .single();

    // Convertir les antécédents JSON en format compatible
    const jsonAntecedents: any[] = [];

    // Traiter les antécédents médicaux du JSON
    if (patientData?.medical_history?.entries) {
      patientData.medical_history.entries.forEach((entry: any, index: number) => {
        if (entry.label) {
          jsonAntecedents.push({
            id: `json-medical-${index}`,
            code: entry.code || `MED-${index}`,
            label: entry.label,
            system: entry.system || 'CIM-11',
            type: 'medical',
            defined_by: 'patient',
            validated_by_doctor: false,
            note: entry.note || '',
            created_at: entry.createdAt || new Date().toISOString(),
            patient_id: params.patientId
          });
        }
      });
    }

    // Traiter les antécédents chirurgicaux du JSON
    if (patientData?.surgical_history?.entries) {
      patientData.surgical_history.entries.forEach((entry: any, index: number) => {
        if (entry.label) {
          jsonAntecedents.push({
            id: `json-surgical-${index}`,
            code: entry.code || `SUR-${index}`,
            label: entry.label,
            system: entry.system || 'CISP2',
            type: 'surgical',
            defined_by: 'patient',
            validated_by_doctor: false,
            note: entry.note || '',
            created_at: entry.createdAt || new Date().toISOString(),
            patient_id: params.patientId
          });
        }
      });
    }

    // Traiter les allergies du JSON
    if (patientData?.allergies?.entries) {
      patientData.allergies.entries.forEach((entry: any, index: number) => {
        if (entry.label) {
          jsonAntecedents.push({
            id: `json-allergy-${index}`,
            code: entry.code || `ALL-${index}`,
            label: entry.label,
            system: entry.system || 'CIM-11',
            type: 'allergy',
            defined_by: 'patient',
            validated_by_doctor: false,
            note: entry.note || '',
            created_at: entry.createdAt || new Date().toISOString(),
            patient_id: params.patientId
          });
        }
      });
    }

    // Traiter les traitements du JSON
    if (patientData?.treatments?.entries) {
      patientData.treatments.entries.forEach((entry: any, index: number) => {
        if (entry.label) {
          jsonAntecedents.push({
            id: `json-treatment-${index}`,
            code: entry.code || `TRT-${index}`,
            label: entry.label,
            system: entry.system || 'OpenFDA',
            type: 'treatment',
            defined_by: 'patient',
            validated_by_doctor: false,
            note: entry.note || '',
            created_at: entry.createdAt || new Date().toISOString(),
            patient_id: params.patientId
          });
        }
      });
    }

    // Créer un ensemble des codes d'antécédents présents dans la table pour éviter les doublons
    const tableCodes = new Set((tableAntecedents || []).map(a => `${a.code}-${a.type}`));

    // Filtrer les antécédents JSON pour exclure ceux qui existent déjà dans la table
    const filteredJsonAntecedents = jsonAntecedents.filter(jsonAntecedent => {
      const codeKey = `${jsonAntecedent.code}-${jsonAntecedent.type}`;
      return !tableCodes.has(codeKey);
    });

    // Fusionner les deux sources : table d'abord, puis JSON filtrés
    const antecedents = [...(tableAntecedents || []), ...filteredJsonAntecedents];

    // Formater les antécédents pour le composant
    const medicalHistory = {
      description: 'Antécédents médicaux',
      entries: (antecedents || [])
        .filter(ant => ant.type === 'medical')
        .map(ant => ({
          code: ant.code,
          system: ant.system,
          label: ant.label,
          type: ant.type,
          note: ant.note,
          definedBy: ant.defined_by,
          validated_by_doctor: ant.validated_by_doctor,
          createdAt: ant.created_at
        }))
    };

    const surgicalHistory = {
      description: 'Antécédents chirurgicaux',
      entries: (antecedents || [])
        .filter(ant => ant.type === 'surgical')
        .map(ant => ({
          code: ant.code,
          system: ant.system,
          label: ant.label,
          type: ant.type,
          note: ant.note,
          definedBy: ant.defined_by,
          validated_by_doctor: ant.validated_by_doctor,
          createdAt: ant.created_at
        }))
    };

    const treatments = {
      description: 'Traitements en cours',
      entries: (antecedents || [])
        .filter(ant => ant.type === 'treatment' || ant.type === 'medication')
        .map(ant => ({
          code: ant.code,
          system: ant.system,
          label: ant.label,
          type: ant.type,
          note: ant.note,
          definedBy: ant.defined_by,
          validated_by_doctor: ant.validated_by_doctor,
          createdAt: ant.created_at
        }))
    };

    // Formater les données comme attendu par le composant
    const formattedPatient = {
      ...patient,
      civility: patient.civility || 'M.',
      birth_name: patient.birth_name || patient.last_name,
      social_security_number: patient.social_security_number || '',
      gender: patient.gender || '',
      allergies: patient.allergies || { description: '', entries: [] },
      medical_history: medicalHistory,
      surgical_history: surgicalHistory,
      treatments: treatments,
      phone: patient.phone_number || '',
      address: patient.address || '', // Use 'address' column name
      city: patient.city || '',
      postal_code: patient.postal_code || '',
      emergency_contact: '',
      attending_doctor_first_name: 'Dr.',
      attending_doctor_last_name: 'Inconnu',
      email: patientEmail, // Use email from auth.users
      appointments: [],
      questionnaires: [],
      notes: notes || [],
      documents: [],
      prescriptions: []
    };

    console.log('📧 [DOCTOR API] Email from auth.users:', patientEmail);
    console.log('📤 [DOCTOR API] Final formatted patient data:', {
      email: formattedPatient.email,
      social_security_number: formattedPatient.social_security_number,
      civility: formattedPatient.civility,
      address: formattedPatient.address,
      city: formattedPatient.city,
      postal_code: formattedPatient.postal_code
    });

    return NextResponse.json({
      success: true,
      patient: formattedPatient
    });

  } catch (error) {
    console.error('Erreur lors de la récupération du patient:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { patientId: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Vérifier que l'utilisateur est un médecin
    const { data: doctor } = await supabase
      .from('doctors')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!doctor) {
      return NextResponse.json({ error: 'Accès réservé aux médecins' }, { status: 403 });
    }

    // Vérifier la relation patient-médecin
    const { data: relationship } = await supabase
      .from('patient_doctor_relationships')
      .select('*')
      .eq('patient_id', params.patientId)
      .eq('doctor_id', doctor.id)
      .eq('status', 'active')
      .single();

    if (!relationship) {
      return NextResponse.json({ error: 'Accès non autorisé à ce patient' }, { status: 403 });
    }

    // Récupérer les données du patient
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('*')
      .eq('id', params.patientId)
      .single();

    // Récupérer l'email depuis la table patients (méthode sécurisée)
    console.log('🔍 [DOCTOR API PUT] Getting email from patients table for user_id:', patient?.user_id);

    // Essayer d'abord l'email de la table patients
    let patientEmail = patient?.email || '';

    // Si pas d'email dans patients, essayer une approche alternative sécurisée
    if (!patientEmail && patient?.user_id) {
      try {
        // Utiliser une requête SQL sécurisée pour récupérer l'email
        const { data: emailData, error: emailError } = await supabase
          .from('patients')
          .select('email')
          .eq('user_id', patient.user_id)
          .single();

        if (!emailError && emailData?.email) {
          patientEmail = emailData.email;
        }
      } catch (fallbackError) {
        console.log('⚠️ [DOCTOR API PUT] Could not retrieve email via fallback method');
      }
    }

    console.log('📧 [DOCTOR API PUT] Email sources:', {
      fromPatientTable: patient?.email,
      finalEmail: patientEmail
    });

    if (patientError || !patient) {
      return NextResponse.json({ error: 'Patient non trouvé' }, { status: 404 });
    }

    // Récupérer les rendez-vous
    const { data: appointments } = await supabase
      .from('appointments')
      .select('*')
      .eq('patient_id', params.patientId);

    // Récupérer les questionnaires
    const { data: questionnaires } = await supabase
      .from('questionnaires')
      .select('*')
      .eq('patient_id', params.patientId)
      .order('submitted_at', { ascending: false });

    // Récupérer les notes
    let notes = [];
    try {
      const { data: notesData } = await supabase
        .rpc('get_patient_notes', { p_patient_id: params.patientId });

      if (notesData) {
        notes = notesData;
      }
    } catch {
      const { data: fallbackNotes } = await supabase
        .from('notes')
        .select('*, doctors(first_name, last_name)')
        .eq('patient_id', params.patientId)
        .order('created_at', { ascending: false });

      if (fallbackNotes) {
        notes = fallbackNotes;
      }
    }

    // Récupérer les antécédents médicaux de la table antecedents (seulement ceux du médecin connecté)
    const { data: tableAntecedents } = await supabase
      .from('antecedents')
      .select('*')
      .eq('patient_id', params.patientId)
      .eq('doctor_id', doctor.id)
      .order('created_at', { ascending: false });

    // Récupérer les antécédents des champs JSON de la table patients
    const { data: patientData } = await supabase
      .from('patients')
      .select('medical_history, surgical_history, allergies, treatments')
      .eq('id', params.patientId)
      .single();

    // Convertir les antécédents JSON en format compatible
    const jsonAntecedents: any[] = [];

    // Traiter les antécédents médicaux du JSON
    if (patientData?.medical_history?.entries) {
      patientData.medical_history.entries.forEach((entry: any, index: number) => {
        if (entry.label) {
          jsonAntecedents.push({
            id: `json-medical-${index}`,
            code: entry.code || `MED-${index}`,
            label: entry.label,
            system: entry.system || 'CIM-11',
            type: 'medical',
            defined_by: 'patient',
            validated_by_doctor: false,
            note: entry.note || '',
            created_at: entry.createdAt || new Date().toISOString(),
            patient_id: params.patientId
          });
        }
      });
    }

    // Traiter les antécédents chirurgicaux du JSON
    if (patientData?.surgical_history?.entries) {
      patientData.surgical_history.entries.forEach((entry: any, index: number) => {
        if (entry.label) {
          jsonAntecedents.push({
            id: `json-surgical-${index}`,
            code: entry.code || `SUR-${index}`,
            label: entry.label,
            system: entry.system || 'CISP2',
            type: 'surgical',
            defined_by: 'patient',
            validated_by_doctor: false,
            note: entry.note || '',
            created_at: entry.createdAt || new Date().toISOString(),
            patient_id: params.patientId
          });
        }
      });
    }

    // Traiter les allergies du JSON
    if (patientData?.allergies?.entries) {
      patientData.allergies.entries.forEach((entry: any, index: number) => {
        if (entry.label) {
          jsonAntecedents.push({
            id: `json-allergy-${index}`,
            code: entry.code || `ALL-${index}`,
            label: entry.label,
            system: entry.system || 'CIM-11',
            type: 'allergy',
            defined_by: 'patient',
            validated_by_doctor: false,
            note: entry.note || '',
            created_at: entry.createdAt || new Date().toISOString(),
            patient_id: params.patientId
          });
        }
      });
    }

    // Traiter les traitements du JSON
    if (patientData?.treatments?.entries) {
      patientData.treatments.entries.forEach((entry: any, index: number) => {
        if (entry.label) {
          jsonAntecedents.push({
            id: `json-treatment-${index}`,
            code: entry.code || `TRT-${index}`,
            label: entry.label,
            system: entry.system || 'OpenFDA',
            type: 'treatment',
            defined_by: 'patient',
            validated_by_doctor: false,
            note: entry.note || '',
            created_at: entry.createdAt || new Date().toISOString(),
            patient_id: params.patientId
          });
        }
      });
    }

    // Créer un ensemble des codes d'antécédents présents dans la table pour éviter les doublons
    const tableCodes = new Set((tableAntecedents || []).map(a => `${a.code}-${a.type}`));

    // Filtrer les antécédents JSON pour exclure ceux qui existent déjà dans la table
    const filteredJsonAntecedents = jsonAntecedents.filter(jsonAntecedent => {
      const codeKey = `${jsonAntecedent.code}-${jsonAntecedent.type}`;
      return !tableCodes.has(codeKey);
    });

    // Fusionner les deux sources : table d'abord, puis JSON filtrés
    const antecedents = [...(tableAntecedents || []), ...filteredJsonAntecedents];

    // Formater les antécédents pour le composant
    const medicalHistory = {
      description: 'Antécédents médicaux',
      entries: (antecedents || [])
        .filter(ant => ant.type === 'medical')
        .map(ant => ({
          code: ant.code,
          system: ant.system,
          label: ant.label,
          type: ant.type,
          note: ant.note,
          definedBy: ant.defined_by,
          validated_by_doctor: ant.validated_by_doctor,
          createdAt: ant.created_at
        }))
    };

    const surgicalHistory = {
      description: 'Antécédents chirurgicaux',
      entries: (antecedents || [])
        .filter(ant => ant.type === 'surgical')
        .map(ant => ({
          code: ant.code,
          system: ant.system,
          label: ant.label,
          type: ant.type,
          note: ant.note,
          definedBy: ant.defined_by,
          validated_by_doctor: ant.validated_by_doctor,
          createdAt: ant.created_at
        }))
    };

    const treatments = {
      description: 'Traitements en cours',
      entries: (antecedents || [])
        .filter(ant => ant.type === 'treatment' || ant.type === 'medication')
        .map(ant => ({
          code: ant.code,
          system: ant.system,
          label: ant.label,
          type: ant.type,
          note: ant.note,
          definedBy: ant.defined_by,
          validated_by_doctor: ant.validated_by_doctor,
          createdAt: ant.created_at
        }))
    };

    // Formater les données comme attendu par le composant
    const formattedPatient = {
      ...patient,
      civility: patient.civility || 'M.',
      birth_name: patient.birth_name || patient.last_name,
      social_security_number: patient.social_security_number || '',
      gender: patient.gender || '',
      allergies: patient.allergies || { description: '', entries: [] },
      medical_history: medicalHistory,
      surgical_history: surgicalHistory,
      treatments: treatments,
      phone: patient.phone_number || '',
      address: patient.address || '', // Use 'address' column name
      city: patient.city || '',
      postal_code: patient.postal_code || '',
      emergency_contact: '',
      attending_doctor_first_name: 'Dr.',
      attending_doctor_last_name: 'Inconnu',
      email: patientEmail, // Use email from patients table
      appointments: appointments?.map(apt => ({
        id: apt.id,
        date: apt.appointment_datetime,
        type: apt.type,
        notes: apt.notes,
        status: apt.status
      })) || [],
      questionnaires: questionnaires || [],
      notes: notes || [],
      documents: [],
      prescriptions: []
    };

    console.log('📧 [DOCTOR API] Patient email from patients table:', patientEmail);
    console.log('🔢 [DOCTOR API] Social security number:', patient.social_security_number);
    console.log('🏠 [DOCTOR API] Address fields:', {
      address: patient.address,
      city: patient.city,
      postal_code: patient.postal_code
    });

    return NextResponse.json({ patient: formattedPatient });

  } catch (error) {
    console.error('Erreur serveur:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { patientId: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Vérifier que l'utilisateur est un médecin
    const { data: doctor } = await supabase
      .from('doctors')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!doctor) {
      return NextResponse.json({ error: 'Accès réservé aux médecins' }, { status: 403 });
    }

    // Vérifier la relation patient-médecin
    const { data: relationship } = await supabase
      .from('patient_doctor_relationships')
      .select('*')
      .eq('patient_id', params.patientId)
      .eq('doctor_id', doctor.id)
      .eq('status', 'active')
      .single();

    if (!relationship) {
      return NextResponse.json({ error: 'Accès non autorisé à ce patient' }, { status: 403 });
    }

    // Récupérer les données à mettre à jour
    const updateData = await request.json();

    // Préparer les données pour Supabase
    const supabaseUpdateData: any = {};

    if (updateData.social_security_number !== undefined) {
      supabaseUpdateData.social_security_number = updateData.social_security_number;
    }
    if (updateData.gender !== undefined) {
      supabaseUpdateData.gender = updateData.gender;
    }
    if (updateData.civility !== undefined) {
      supabaseUpdateData.civility = updateData.civility;
    }
    if (updateData.birth_name !== undefined) {
      supabaseUpdateData.birth_name = updateData.birth_name;
    }
    if (updateData.last_name !== undefined) {
      supabaseUpdateData.last_name = updateData.last_name;
    }
    if (updateData.first_name !== undefined) {
      supabaseUpdateData.first_name = updateData.first_name;
    }
    if (updateData.date_of_birth !== undefined) {
      supabaseUpdateData.date_of_birth = updateData.date_of_birth;
    }
    if (updateData.phone_number !== undefined) {
      supabaseUpdateData.phone_number = updateData.phone_number;
    }
    // Note: Email should not be updated by doctor - it comes from authenticated patient user
    // if (updateData.email !== undefined) {
    //   supabaseUpdateData.email = updateData.email;
    // }
    if (updateData.treating_physician_id !== undefined) {
      supabaseUpdateData.treating_physician_id = updateData.treating_physician_id;
    }
    if (updateData.address !== undefined) {
      supabaseUpdateData.address = updateData.address; // Use 'address' column name
    }
    if (updateData.city !== undefined) {
      supabaseUpdateData.city = updateData.city;
    }
    if (updateData.postal_code !== undefined) {
      supabaseUpdateData.postal_code = updateData.postal_code;
    }

    // Mettre à jour le patient dans Supabase
    const { data: updatedPatient, error: updateError } = await supabase
      .from('patients')
      .update(supabaseUpdateData)
      .eq('id', params.patientId)
      .select()
      .single();

    if (updateError) {
      console.error('Erreur lors de la mise à jour:', updateError);
      return NextResponse.json({ error: 'Erreur lors de la mise à jour du patient' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      patient: updatedPatient,
      message: 'Informations du patient mises à jour avec succès'
    });

  } catch (error) {
    console.error('Erreur serveur:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}