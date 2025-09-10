import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    // Vérifier l'authentification de l'utilisateur
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    console.log('🔄 [MIGRATION] Ajout du champ "médecin traitant" à la table patients...');

    try {
      // Vérifier si la colonne existe déjà
      const { data: columnExists } = await supabase
        .rpc('execute_sql', {
          sql: `
            SELECT EXISTS (
              SELECT 1 FROM information_schema.columns
              WHERE table_name = 'patients'
              AND column_name = 'treating_physician_id'
            );
          `
        });

      if (columnExists) {
        console.log('✅ [MIGRATION] Le champ treating_physician_id existe déjà');
        return NextResponse.json({
          success: true,
          message: 'Le champ treating_physician_id existe déjà dans la table patients',
          status: 'already_exists'
        });
      }

      // Ajouter la colonne treating_physician_id
      const { error: addColumnError } = await supabase
        .rpc('execute_sql', {
          sql: `
            ALTER TABLE patients
            ADD COLUMN IF NOT EXISTS treating_physician_id UUID REFERENCES doctors(id);
          `
        });

      if (addColumnError) {
        console.error('❌ [MIGRATION] Erreur lors de l\'ajout de la colonne:', addColumnError);
        return NextResponse.json({
          error: 'Erreur lors de l\'ajout de la colonne treating_physician_id',
          details: addColumnError
        }, { status: 500 });
      }

      // Ajouter l'index pour de meilleures performances
      const { error: indexError } = await supabase
        .rpc('execute_sql', {
          sql: `
            CREATE INDEX IF NOT EXISTS idx_patients_treating_physician ON patients(treating_physician_id);
          `
        });

      if (indexError) {
        console.warn('⚠️ [MIGRATION] Impossible de créer l\'index (peut-être déjà existant):', indexError);
      }

      // Ajouter un commentaire pour la documentation
      const { error: commentError } = await supabase
        .rpc('execute_sql', {
          sql: `
            COMMENT ON COLUMN patients.treating_physician_id IS 'ID of the primary treating physician for this patient';
          `
        });

      if (commentError) {
        console.warn('⚠️ [MIGRATION] Impossible d\'ajouter le commentaire:', commentError);
      }

      console.log('✅ [MIGRATION] Migration du champ "médecin traitant" terminée avec succès');

      return NextResponse.json({
        success: true,
        message: 'Champ "médecin traitant" ajouté avec succès à la table patients',
        details: {
          column_added: 'treating_physician_id',
          index_created: 'idx_patients_treating_physician',
          foreign_key: 'REFERENCES doctors(id)'
        }
      });

    } catch (dbError) {
      console.error('❌ [MIGRATION] Erreur base de données:', dbError);
      return NextResponse.json({
        error: 'Erreur lors de l\'accès à la base de données',
        details: dbError,
        solution: 'Veuillez exécuter le script SQL manuellement dans Supabase Dashboard > SQL Editor',
        sql_script: `
          -- Script à exécuter manuellement dans Supabase SQL Editor
          ALTER TABLE patients
          ADD COLUMN IF NOT EXISTS treating_physician_id UUID REFERENCES doctors(id);

          CREATE INDEX IF NOT EXISTS idx_patients_treating_physician ON patients(treating_physician_id);

          COMMENT ON COLUMN patients.treating_physician_id IS 'ID of the primary treating physician for this patient';
        `
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ [MIGRATION] Erreur inattendue:', error);
    return NextResponse.json({
      error: 'Erreur interne du serveur',
      details: error
    }, { status: 500 });
  }
}