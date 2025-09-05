// Script de diagnostic pour l'accès aux dossiers patients
// À exécuter dans le navigateur (console) ou Node.js

// Fonction pour tester l'accès aux patients
async function testPatientAccess() {
  try {
    console.log('🔍 Début du diagnostic...');

    // Test 1: Vérifier l'utilisateur connecté
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    console.log('👤 Utilisateur:', user?.id, user?.user_metadata?.role);
    if (userError) console.error('❌ Erreur utilisateur:', userError);

    // Test 2: Récupérer l'ID du médecin
    const { data: doctor, error: doctorError } = await supabase
      .from('doctors')
      .select('id')
      .eq('user_id', user.id)
      .single();

    console.log('👨‍⚕️ Médecin ID:', doctor?.id);
    if (doctorError) console.error('❌ Erreur médecin:', doctorError);

    // Test 3: Lister tous les patients (sans RLS)
    const { data: allPatients, error: allError } = await supabase
      .from('patients')
      .select('id, first_name, last_name, user_id');

    console.log('📋 Tous les patients:', allPatients);
    if (allError) console.error('❌ Erreur tous patients:', allError);

    // Test 4: Vérifier les relations patient-médecin
    const { data: relations, error: relError } = await supabase
      .from('patient_doctor_relationships')
      .select(`
        id,
        patient_id,
        doctor_id,
        status,
        patients!patient_doctor_relationships_patient_id_fkey (
          first_name,
          last_name
        )
      `)
      .eq('doctor_id', doctor.id);

    console.log('🔗 Relations patient-médecin:', relations);
    if (relError) console.error('❌ Erreur relations:', relError);

    // Test 5: Essayer d'accéder à un patient spécifique
    if (relations && relations.length > 0) {
      const patientId = relations[0].patient_id;
      console.log('🎯 Test accès patient ID:', patientId);

      const { data: patient, error: patientError } = await supabase
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .single();

      console.log('✅ Patient accessible:', patient);
      if (patientError) console.error('❌ Erreur accès patient:', patientError);
    }

    console.log('🔍 Diagnostic terminé');

  } catch (error) {
    console.error('💥 Erreur générale:', error);
  }
}

// Exécuter le diagnostic
testPatientAccess();