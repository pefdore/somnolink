import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Copy, Mail, CheckCircle } from 'lucide-react';

interface EmailTemplateExampleProps {
  doctorName: string;
  doctorToken: string;
}

export default function EmailTemplateExample({ doctorName, doctorToken }: EmailTemplateExampleProps) {
  const [copied, setCopied] = useState(false);

  // Générer le lien d'invitation basé sur le token
  const invitationLink = `${window.location.origin}/join/${encodeURIComponent(doctorToken)}`;

  const emailTemplate = `Cher/Chère [Prénom du patient],

Votre rendez-vous avec le Dr. ${doctorName} est confirmé pour le [Date] à [Heure].

⚠️ IMPORTANT : Pour optimiser votre consultation et permettre au médecin de préparer au mieux votre rendez-vous, vous devez ABSOLUMENT vous connecter à Somnolink AVANT votre rendez-vous.

🔗 **Connexion obligatoire :** ${invitationLink}
   - Créez votre compte patient si vous n'en avez pas encore
   - Remplissez votre profil médical complet
   - Indiquez la date et le motif de votre consultation

Cette préparation permet au Dr. ${doctorName} d'avoir accès à vos antécédents médicaux, vos symptômes actuels et vos informations importantes avant votre arrivée.

📋 **Ce que vous devez faire avant le rendez-vous :**
1. Cliquez sur le lien ci-dessus
2. Créez votre compte ou connectez-vous
3. Remplissez votre profil médical
4. Confirmez la date de votre rendez-vous

Sans cette préparation, le médecin ne pourra pas accéder à vos informations médicales et la consultation risque d'être moins efficace.

Nous vous remercions de votre compréhension et vous souhaitons une excellente consultation.

Cordialement,
L'équipe Somnolink
[Coordonnées du cabinet médical]`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(emailTemplate);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Erreur lors de la copie:', err);
    }
  };

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Modèle d'email de confirmation
        </CardTitle>
        <CardDescription>
          Copiez ce modèle dans votre logiciel d'agenda en ligne. Le lien d'invitation sera automatiquement personnalisé pour chaque patient.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Sujet de l'email :</label>
          <div className="p-2 bg-gray-50 rounded border font-medium">
            Confirmation de votre rendez-vous - Préparation indispensable sur Somnolink
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Corps de l'email :</label>
          <Textarea
            value={emailTemplate}
            readOnly
            className="min-h-[400px] font-mono text-sm"
          />
        </div>

        <div className="flex gap-2">
          <Button onClick={copyToClipboard} className="flex items-center gap-2">
            {copied ? (
              <>
                <CheckCircle className="h-4 w-4" />
                Copié !
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copier le modèle
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={() => window.open(`mailto:?subject=${encodeURIComponent('Confirmation de votre rendez-vous - Préparation indispensable sur Somnolink')}&body=${encodeURIComponent(emailTemplate)}`)}
            className="flex items-center gap-2"
          >
            <Mail className="h-4 w-4" />
            Ouvrir dans Outlook
          </Button>
        </div>

        <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-800">
            <strong>💡 Conseil :</strong> Remplacez [Prénom du patient], [Date] et [Heure] par les informations réelles du rendez-vous avant d'envoyer l'email.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}