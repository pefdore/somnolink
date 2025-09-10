// Email service for Somnolink messaging system
// Note: Install Resend package with: npm install resend

// Initialize Resend with the API key from environment variables
const resendApiKey = process.env.RESEND_API_KEY;
// Dynamic import to avoid TypeScript errors if Resend is not installed
if (resendApiKey) {
  try {
    // This will be replaced with actual Resend import after package installation
    console.log('Resend email service is configured (simulation mode)');
  } catch (error) {
    console.warn('Resend package not installed. Email notifications will be simulated.');
  }
} else {
  console.warn('RESEND_API_KEY is not set. Email notifications will be simulated.');
}

export interface EmailNotification {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmailNotification(notification: EmailNotification): Promise<boolean> {
  if (!resendApiKey) {
    // Simulation mode - log the email instead of sending
    console.log('📧 SIMULATED EMAIL NOTIFICATION:');
    console.log('To:', notification.to);
    console.log('Subject:', notification.subject);
    console.log('Content:', notification.html.substring(0, 200) + '...');
    return true;
  }

  try {
    // This will be replaced with actual Resend call after package installation
    console.log('📧 EMAIL READY TO SEND (Resend configured):');
    console.log('To:', notification.to);
    console.log('Subject:', notification.subject);
    
    // Simulate successful email sending
    return true;
  } catch {
    return false;
  }
}

export function createNewMessageEmailTemplate(patientName: string, doctorName: string, messagePreview: string): string {
  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Nouveau message de votre médecin</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 20px;
          background-color: #f9f9f9;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background: white;
          padding: 30px;
          border-radius: 10px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .logo {
          font-size: 24px;
          font-weight: bold;
          color: #2563eb;
          margin-bottom: 10px;
        }
        .content {
          margin-bottom: 30px;
        }
        .message-preview {
          background: #f8f9fa;
          padding: 15px;
          border-left: 4px solid #2563eb;
          margin: 20px 0;
          border-radius: 4px;
        }
        .button {
          display: inline-block;
          padding: 12px 24px;
          background-color: #2563eb;
          color: white;
          text-decoration: none;
          border-radius: 5px;
          font-weight: bold;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          color: #666;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">Somnolink</div>
          <h1>Nouveau message de votre médecin</h1>
        </div>
        
        <div class="content">
          <p>Bonjour ${patientName},</p>
          
          <p>Le Dr. ${doctorName} vous a envoyé un nouveau message sur votre espace patient Somnolink.</p>
          
          <div class="message-preview">
            <strong>Message :</strong>
            <p>${messagePreview}</p>
          </div>
          
          <p>Connectez-vous à votre espace patient pour lire le message complet et y répondre si nécessaire.</p>
          
          <p style="text-align: center;">
            <a href="https://somnolink.fr/dashboard/patient/messagerie" class="button">Voir le message</a>
          </p>
        </div>
        
        <div class="footer">
          <p>Cet email a été envoyé automatiquement. Merci de ne pas y répondre.</p>
          <p>© 2025 Somnolink. Tous droits réservés.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function createInvitationEmailTemplate(doctorName: string, invitationLink: string): string {
  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Invitation à rejoindre Somnolink</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 20px;
          background-color: #f9f9f9;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background: white;
          padding: 30px;
          border-radius: 10px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .logo {
          font-size: 24px;
          font-weight: bold;
          color: #2563eb;
          margin-bottom: 10px;
        }
        .content {
          margin-bottom: 30px;
        }
        .invitation-link {
          background: #f8f9fa;
          padding: 15px;
          border-left: 4px solid #2563eb;
          margin: 20px 0;
          border-radius: 4px;
          word-break: break-all;
        }
        .button {
          display: inline-block;
          padding: 12px 24px;
          background-color: #2563eb;
          color: white;
          text-decoration: none;
          border-radius: 5px;
          font-weight: bold;
          margin: 16px 0;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          color: #666;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">Somnolink</div>
          <h1>Invitation de ${doctorName}</h1>
        </div>

        <div class="content">
          <p>Bonjour,</p>

          <p>Vous avez été invité à rejoindre la plateforme Somnolink par votre médecin.</p>

          <p>Cliquez sur le lien ci-dessous pour créer votre compte et vous associer à votre médecin :</p>

          <p style="text-align: center;">
            <a href="${invitationLink}" class="button">Accepter l'invitation</a>
          </p>

          <p>Ou copiez-collez ce lien dans votre navigateur :</p>

          <div class="invitation-link">
            ${invitationLink}
          </div>

          <p>En créant votre compte, vous pourrez :</p>
          <ul>
            <li>Préparer vos consultations en ligne</li>
            <li>Communiquer directement avec votre médecin</li>
            <li>Accéder à vos documents médicaux</li>
            <li>Suivre vos rendez-vous et traitements</li>
          </ul>
        </div>

        <div class="footer">
          <p>Si vous n'avez pas demandé cette invitation, vous pouvez ignorer cet email.</p>
          <p>Cet email a été envoyé automatiquement. Merci de ne pas y répondre.</p>
          <p>© 2025 Somnolink. Tous droits réservés.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export async function sendInvitationEmail(
  patientEmail: string,
  doctorName: string,
  invitationLink: string
): Promise<boolean> {
  const subject = `Invitation à rejoindre ${doctorName} sur Somnolink`;

  const html = createInvitationEmailTemplate(doctorName, invitationLink);

  return await sendEmailNotification({
    to: patientEmail,
    subject,
    html,
  });
}

export async function sendNewMessageNotification(
  patientEmail: string,
  patientName: string,
  doctorName: string,
  messageContent: string
): Promise<boolean> {
  const subject = `Nouveau message de votre médecin - Somnolink`;

  // Limiter l'aperçu du message pour l'email
  const messagePreview = messageContent.length > 150
    ? messageContent.substring(0, 150) + '...'
    : messageContent;

  const html = createNewMessageEmailTemplate(patientName, doctorName, messagePreview);

  return await sendEmailNotification({
    to: patientEmail,
    subject,
    html,
  });
}