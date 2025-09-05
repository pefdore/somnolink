import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const supabase = createClient();

    console.log('🔧 Correction de la contrainte d\'unicité...');

    // Vérifier les contraintes existantes
    const { data: constraints, error: checkError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT
            tc.table_name,
            tc.constraint_name,
            tc.constraint_type,
            kcu.column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        WHERE tc.constraint_type IN ('UNIQUE', 'PRIMARY KEY')
          AND tc.table_name = 'antecedents';
      `
    });

    console.log('📊 Contraintes trouvées:', constraints);

    // Supprimer la contrainte d'unicité problématique
    const { error: dropError } = await supabase.rpc('exec_sql', {
      sql: `ALTER TABLE antecedents DROP CONSTRAINT IF EXISTS unique_antecedent;`
    });

    if (dropError) {
      console.error('❌ Erreur suppression contrainte:', dropError);
      return NextResponse.json(
        { error: 'Erreur lors de la suppression de la contrainte', details: dropError.message },
        { status: 500 }
      );
    }

    console.log('✅ Contrainte d\'unicité supprimée');

    return NextResponse.json({
      success: true,
      message: 'Contrainte d\'unicité supprimée avec succès',
      constraints: constraints
    });

  } catch (error) {
    console.error('❌ Erreur générale:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}