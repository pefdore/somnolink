import { NextResponse } from 'next/server';

export async function POST() {
  try {
    console.log('🔧 Correction de l\'API terminology-search...');

    // Cette API ne nécessite pas de correction côté base de données
    // La correction a été faite directement dans le code de l'API
    // en ajoutant des données mockées quand les variables d'environnement sont manquantes

    console.log('✅ API terminology-search corrigée (données mockées activées)');

    return NextResponse.json({
      success: true,
      message: 'API terminology-search corrigée avec données mockées'
    });

  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}