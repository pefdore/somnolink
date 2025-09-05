'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import EmailTemplateExample from '@/components/doctor/EmailTemplateExample';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Mail, Copy } from 'lucide-react';
import Link from 'next/link';

export default function EmailTemplatesPage() {
  const [doctorInfo, setDoctorInfo] = useState<{ name: string; token: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDoctorInfo = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: doctor } = await supabase
          .from('doctors')
          .select('first_name, last_name, public_invitation_token')
          .eq('user_id', user.id)
          .single();

        if (doctor) {
          setDoctorInfo({
            name: `${doctor.first_name} ${doctor.last_name}`,
            token: doctor.public_invitation_token
          });
        }
      }
      setLoading(false);
    };

    fetchDoctorInfo();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Chargement...</p>
        </div>
      </div>
    );
  }

  if (!doctorInfo) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Accès non autorisé</h2>
          <p className="text-gray-600 mb-4">Vous devez être connecté en tant que médecin pour accéder à cette page.</p>
          <Link href="/dashboard/doctor">
            <Button>Retour au dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <Link href="/dashboard/doctor">
          <Button variant="outline" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour au dashboard
          </Button>
        </Link>

        <h1 className="text-3xl font-bold mb-2">Modèles d'emails</h1>
        <p className="text-gray-600">
          Utilisez ces modèles pour informer vos patients de l'importance de se connecter à Somnolink avant leur rendez-vous.
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email de confirmation de rendez-vous
            </CardTitle>
            <CardDescription>
              Modèle d'email à copier dans votre logiciel d'agenda pour rappeler à vos patients de se connecter à Somnolink.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EmailTemplateExample
              doctorName={doctorInfo.name}
              doctorToken={doctorInfo.token}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Comment utiliser ce modèle</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="font-semibold mb-2">1. Copiez le modèle</h4>
                <p className="text-sm text-gray-600">
                  Cliquez sur "Copier le modèle" pour copier le texte complet de l'email dans votre presse-papiers.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">2. Collez dans votre agenda</h4>
                <p className="text-sm text-gray-600">
                  Ouvrez votre logiciel d'agenda en ligne et collez le modèle dans le corps de l'email de confirmation.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">3. Personnalisez</h4>
                <p className="text-sm text-gray-600">
                  Remplacez [Prénom du patient], [Date] et [Heure] par les informations réelles du rendez-vous.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">4. Envoyez</h4>
                <p className="text-sm text-gray-600">
                  Envoyez l'email de confirmation. Le patient recevra automatiquement son lien d'invitation personnalisé.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}