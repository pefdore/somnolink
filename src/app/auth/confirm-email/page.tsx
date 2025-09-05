'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Mail, Loader2, CheckCircle } from 'lucide-react';

export default function ConfirmEmailPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    checkUserStatus();
  }, []);

  const checkUserStatus = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error || !user) {
        router.push('/auth/login');
        return;
      }

      setEmail(user.email || '');

      // Vérifier si l'email est maintenant confirmé
      if (user.email_confirmed_at) {
        console.log('✅ [DEBUG] Email confirmé, redirection vers dashboard');
        router.push('/dashboard/patient');
        return;
      }

      console.log('⚠️ [DEBUG] Email non confirmé pour:', user.email);
    } catch (err) {
      console.error('Erreur lors de la vérification du statut:', err);
      router.push('/auth/login');
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    if (!email) return;

    setResending(true);
    setMessage('');

    try {
      console.log('🔄 [DEBUG] Renvoi d\'email de confirmation pour:', email);

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email
      });

      if (error) {
        console.error('❌ Erreur lors du renvoi:', error);
        setMessage('Erreur lors de l\'envoi de l\'email. Veuillez réessayer.');
      } else {
        console.log('✅ Email de confirmation renvoyé');
        setMessage('📧 Un nouvel email de confirmation vous a été envoyé. Vérifiez votre boîte mail.');
      }
    } catch (err) {
      console.error('Erreur lors du renvoi:', err);
      setMessage('Erreur lors de l\'envoi de l\'email. Veuillez réessayer.');
    } finally {
      setResending(false);
    }
  };

  const handleCheckAgain = () => {
    setLoading(true);
    checkUserStatus();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Vérification en cours...</h2>
          <p className="text-gray-600">Vérification de votre statut de confirmation</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-md mx-auto">
        <div className="w-full bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 text-center">
            <Mail className="h-16 w-16 text-blue-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Confirmation d'email requise</h2>
            <p className="text-gray-600 mb-4">
              Pour accéder à votre compte, vous devez d'abord confirmer votre adresse email.
            </p>
          </div>

          <div className="p-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <Mail className="h-5 w-5 text-blue-600 mr-2" />
                <div>
                  <p className="text-blue-800 font-medium">Email envoyé à :</p>
                  <p className="text-blue-700">{email}</p>
                </div>
              </div>
            </div>

            {message && (
              <div className={`mb-4 p-4 rounded-md ${
                message.includes('Erreur') || message.includes('error')
                  ? 'bg-red-50 border border-red-200 text-red-700'
                  : 'bg-green-50 border border-green-200 text-green-700'
              }`}>
                {message}
              </div>
            )}

            <div className="space-y-3">
              <Button
                onClick={handleResendEmail}
                disabled={resending}
                className="w-full"
              >
                {resending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Renvoyer l'email de confirmation
                  </>
                )}
              </Button>

              <Button
                onClick={handleCheckAgain}
                variant="outline"
                className="w-full"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                J'ai confirmé mon email
              </Button>

              <Button
                onClick={() => router.push('/auth/login')}
                variant="ghost"
                className="w-full text-gray-600"
              >
                Retour à la connexion
              </Button>
            </div>

            <div className="mt-6 text-center text-sm text-gray-600">
              <p>
                N'oubliez pas de vérifier votre dossier spam/junk si vous ne recevez pas l'email.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}