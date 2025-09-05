import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { exists: false, error: 'Email invalide' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Vérifier directement dans la table auth.users si l'email existe
    // Cette approche est plus fiable que signInWithOtp
    try {
      const { data, error } = await supabase
        .from('auth.users')
        .select('id')
        .eq('email', email.toLowerCase())
        .single();

      if (error) {
        // Si erreur "not found", l'email n'existe pas
        if (error.code === 'PGRST116') {
          return NextResponse.json({ exists: false });
        }
        // Autres erreurs
        console.error('Erreur vérification email:', error);
        return NextResponse.json({ exists: false });
      }

      // Si on trouve des données, l'email existe
      return NextResponse.json({ exists: !!data });

    } catch (dbError) {
      console.error('Erreur base de données check-email:', dbError);
      // En cas d'erreur, considérer que l'email n'existe pas pour être prudent
      return NextResponse.json({ exists: false });
    }

  } catch (error) {
    console.error('Erreur API check-email:', error);
    return NextResponse.json(
      { exists: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}