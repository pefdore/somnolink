import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function POST(request: NextRequest) {
  try {
    const { to, invitationLink, doctorName } = await request.json();

    if (!to || !invitationLink) {
      return NextResponse.json(
        { error: 'Email et lien d\'invitation requis' },
        { status: 400 }
      );
    }

    // Vérification que la clé API Resend est configurée
    const resendApiKey = process.env.RESEND_API_KEY;
    
    // Mode simulation si Resend n'est pas configuré ou si la clé est invalide
    if (!resendApiKey || resendApiKey.includes('your_resend_api_key') || !resendApiKey.startsWith('re_')) {
      console.log('📧 Mode simulation activé - Email enregistré dans les logs');
      console.log('✅ Email simulé:');
      console.log('Destinataire:', to);
      console.log('Médecin:', doctorName);
      console.log('Lien d\'invitation:', invitationLink);
      console.log('Date:', new Date().toISOString());
      
      return NextResponse.json({
        success: true,
        message: 'Email d\'invitation simulé avec succès (voir les logs du serveur)',
        to: to,
        invitationLink: invitationLink,
        mode: 'simulation'
      });
    }

    // Mode production avec Resend
    const resend = new Resend(resendApiKey);
    
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Somnolink <notifications@somnolink.fr>',
      to: to,
      subject: `Invitation à rejoindre ${doctorName} sur Somnolink`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Invitation de ${doctorName}</h2>
          <p>Vous avez été invité à rejoindre la plateforme Somnolink par votre médecin.</p>
          <p>Cliquez sur le lien ci-dessous pour créer votre compte et vous associer à votre médecin :</p>
          <a href="${invitationLink}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin: 16px 0;">
            Accepter l'invitation
          </a>
          <p>Ou copiez-collez ce lien dans votre navigateur :</p>
          <p style="word-break: break-all; color: #666; font-size: 14px;">${invitationLink}</p>
          <p style="color: #666; font-size: 14px; margin-top: 24px;">
            Si vous n'avez pas demandé cette invitation, vous pouvez ignorer cet email.
          </p>
        </div>
      `,
    });

    if (error) {
      console.error('Erreur Resend:', error);
      return NextResponse.json(
        { error: 'Erreur lors de l\'envoi de l\'email' },
        { status: 500 }
      );
    }

    console.log('✅ Email envoyé avec succès via Resend:', data);
    return NextResponse.json({
      success: true,
      message: 'Email d\'invitation envoyé avec succès',
      to: to,
      invitationLink: invitationLink,
      mode: 'production'
    });

  } catch (error) {
    console.error('Erreur dans send-invitation:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}