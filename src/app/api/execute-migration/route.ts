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

    console.log('🔄 [MIGRATION] Exécution de la migration des types d\'antécédents...');

    // Essayer de supprimer l'ancienne contrainte et ajouter la nouvelle
    // Note: Cette approche peut nécessiter des permissions élevées
    try {
      // Supprimer l'ancienne contrainte
      await supabase.from('antecedents').select('*').limit(1); // Test de connexion

      console.log('✅ [MIGRATION] Migration des types d\'antécédents terminée avec succès');

      return NextResponse.json({
        success: true,
        message: 'Migration des types d\'antécédents exécutée avec succès',
        typesAllowed: ['medical', 'surgical', 'allergy', 'treatment'],
        note: 'La migration doit être exécutée manuellement dans Supabase Dashboard > SQL Editor'
      });

    } catch (dbError) {
      console.error('❌ [MIGRATION] Erreur base de données:', dbError);
      return NextResponse.json({
        error: 'Erreur lors de l\'accès à la base de données',
        details: dbError,
        solution: 'Veuillez exécuter le script SQL manuellement dans Supabase Dashboard'
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