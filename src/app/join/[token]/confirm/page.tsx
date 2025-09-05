'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2, Mail } from 'lucide-react';

export default function ConfirmEmailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [doctorInfo, setDoctorInfo] = useState<{ name: string; specialty: string } | null>(null);


  useEffect(() => {
    handleEmailConfirmation();
  }, []);

  const handleEmailConfirmation = async () => {
    try {
      // Récupérer les paramètres d'URL pour la confirmation
      const token_hash = searchParams.get('token_hash');
      const code = searchParams.get('code');
      const type = searchParams.get('type');

      // Vérifier s'il y a une erreur dans l'URL (comme un lien expiré)
      const error = searchParams.get('error');
      const errorCode = searchParams.get('error_code');
      const errorDescription = searchParams.get('error_description');

      if (error) {
        if (errorCode === 'otp_expired') {
          throw new Error('Le lien de confirmation a expiré. Cliquez sur "Demander un nouveau lien" pour recevoir un nouvel email de confirmation.');
        } else {
          throw new Error(`Erreur de confirmation: ${errorDescription || error}`);
        }
      }

      // Vérifier les paramètres selon le format utilisé
      if (!code && !(token_hash && type === 'signup')) {
        throw new Error('Lien de confirmation invalide');
      }

      // Vérifier si l'utilisateur est maintenant connecté et confirmé
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        throw new Error('Erreur lors de la vérification de la session');
      }

      if (!session) {
        throw new Error('Confirmation échouée - reconnectez-vous et cliquez à nouveau sur le lien de confirmation');
      }

      if (!session.user.email_confirmed_at) {
        throw new Error('Email non confirmé - vérifiez votre boîte mail et cliquez sur le lien de confirmation');
      }

      // Marquer que c'est une première connexion après confirmation
      localStorage.setItem('firstLoginAfterConfirmation', 'true');

      // Vérifier le token du médecin
      await verifyDoctorToken();

      // Créer automatiquement le profil patient
      await createPatientProfile();

      // Association automatique après confirmation
      await processDoctorInvitation();

    } catch (err: any) {
      console.error('Erreur lors de la confirmation:', err);
      setError(err.message || 'Erreur lors de la confirmation de l\'email');
    } finally {
      setLoading(false);
    }
  };

  const verifyDoctorToken = async () => {
    try {
      const decodedToken = decodeURIComponent(params.token as string);

      const { data, error } = await supabase
        .rpc('verify_doctor_invitation', {
          p_doctor_token: decodedToken
        });

      if (error) {
        throw error;
      }

      if (data && data.length > 0) {
        setDoctorInfo({
          name: `${data[0].first_name} ${data[0].last_name}`,
          specialty: 'Médecin du sommeil'
        });
      } else {
        throw new Error('Lien d\'invitation invalide');
      }
    } catch (err: any) {
      throw new Error(err.message || 'Erreur lors de la vérification du médecin');
    }
  };

  const createPatientProfile = async () => {
    try {
      // Récupérer l'utilisateur actuel
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error('Utilisateur non trouvé');
      }

      // Vérifier si le profil patient existe déjà
      const { data: existingPatient, error: checkError } = await supabase
        .from('patients')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = not found
        throw checkError;
      }

      // Si le patient n'existe pas, le créer
      if (!existingPatient) {
        // Récupérer les informations de l'utilisateur depuis les métadonnées
        const firstName = user.user_metadata?.first_name || user.user_metadata?.['first_name'] || 'Patient';
        const lastName = user.user_metadata?.last_name || user.user_metadata?.['last_name'] || 'Inconnu';
        const dateOfBirth = user.user_metadata?.date_of_birth || user.user_metadata?.['date_of_birth'] || null;

        const { error: insertError } = await supabase
          .from('patients')
          .insert({
            id: user.id,
            user_id: user.id,
            first_name: firstName,
            last_name: lastName,
            date_of_birth: dateOfBirth
          });

        if (insertError) {
          console.error('Erreur lors de la création du profil patient:', insertError);
          throw insertError;
        }
      }
    } catch (err: any) {
      console.error('Erreur lors de la création du profil patient:', err);
      throw new Error(err.message || 'Erreur lors de la création du profil patient');
    }
  };

  const processDoctorInvitation = async () => {
    try {
      const decodedToken = decodeURIComponent(params.token as string);

      const { data, error } = await supabase
        .rpc('process_doctor_invitation', {
          p_doctor_token: decodedToken
        });

      if (error) {
        throw error;
      }

      if (data) {
        const result = data[0];
        setSuccess(`✅ ${result.message}`);

        // Rediriger vers le dashboard patient après un court délai
        setTimeout(() => {
          router.push('/dashboard/patient');
        }, 2000);
      }
    } catch (err: any) {
      throw new Error(err.message || 'Erreur lors de l\'association');
    }
  };


  const handleRetry = () => {
    window.location.reload();
  };

  const handleRequestNewLink = async () => {
    setProcessing(true);
    setError(null);

    try {
      // Pour les liens expirés, la meilleure approche est de rediriger
      // vers la page d'inscription pour refaire le processus complet
      router.push(`/join/${params.token}`);

    } catch (err: any) {
      console.error('Erreur dans handleRequestNewLink:', err);
      setError('Erreur lors de la redirection');
      // Fallback forcé
      setTimeout(() => {
        window.location.href = `/join/${params.token}`;
      }, 1000);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Confirmation en cours...</h2>
          <p className="text-gray-600">Vérification de votre email et association avec le médecin</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-md mx-auto">
        <div className="w-full bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 text-center">
            <Mail className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Confirmation d'email</h2>
            {doctorInfo && (
              <p className="text-gray-600">Association avec le Dr {doctorInfo.name}</p>
            )}
          </div>

          <div className="p-6">
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                <div className="flex items-center">
                  <XCircle className="h-4 w-4 text-red-600 mr-2" />
                  <h3 className="font-medium text-red-800">Erreur de confirmation</h3>
                </div>
                <p className="text-red-700 mt-1">{error}</p>
                {error.includes('expiré') ? (
                  <Button onClick={handleRequestNewLink} className="mt-3 w-full" disabled={processing}>
                    {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Refaire l'inscription pour recevoir un nouveau lien
                  </Button>
                ) : (
                  <Button onClick={handleRetry} className="mt-3 w-full" variant="outline">
                    Réessayer
                  </Button>
                )}
              </div>
            )}

            {success && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                  <h3 className="font-medium text-green-800">Confirmation réussie !</h3>
                </div>
                <p className="text-green-700 mt-1">{success}</p>
                <p className="text-green-700 text-sm mt-2">
                  Redirection automatique vers la page du Dr {doctorInfo?.name} pour continuer...
                </p>
              </div>
            )}

            {!error && !success && (
              <div className="text-center">
                <p className="text-gray-600 mb-4">
                  Traitement de votre confirmation en cours...
                </p>
                <Loader2 className="h-6 w-6 animate-spin mx-auto" />
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}