// Script pour corriger les politiques RLS des rendez-vous pour les patients
// À exécuter une fois pour corriger le problème

const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase (à adapter selon votre environnement)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Variables d\'environnement manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixAppointmentsRLS() {
  try {
    console.log('🔧 Correction des politiques RLS pour les rendez-vous...');

    // Supprimer l'ancienne politique incorrecte
    await supabase.rpc('exec_sql', {
      sql: `DROP POLICY IF EXISTS "Patients can view their appointments" ON appointments;`
    });

    // Créer la nouvelle politique correcte
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE POLICY "Patients can view their appointments" ON appointments
        FOR SELECT USING (
          EXISTS (
            SELECT 1 FROM patients
            WHERE patients.id = appointments.patient_id
            AND patients.user_id = auth.uid()
          )
        );
      `
    });

    // Supprimer et recréer la politique de création
    await supabase.rpc('exec_sql', {
      sql: `DROP POLICY IF EXISTS "Patients can create appointments" ON appointments;`
    });

    await supabase.rpc('exec_sql', {
      sql: `
        CREATE POLICY "Patients can create appointments" ON appointments
        FOR INSERT WITH CHECK (
          EXISTS (
            SELECT 1 FROM patients
            WHERE patients.id = appointments.patient_id
            AND patients.user_id = auth.uid()
          )
        );
      `
    });

    console.log('✅ Politiques RLS corrigées avec succès !');
    console.log('Les patients peuvent maintenant voir leurs rendez-vous.');

  } catch (error) {
    console.error('❌ Erreur lors de la correction des politiques RLS:', error);
    process.exit(1);
  }
}

fixAppointmentsRLS();