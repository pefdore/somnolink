'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle, XCircle, Loader2, UserPlus, Mail, Lock } from 'lucide-react';
import AppointmentSchedulerPopup from '@/components/patient/AppointmentSchedulerPopup';

interface RegistrationData {
  firstName: string;
  lastName: string;
  phone: string;
  dateOfBirth: string;
}

export default function JoinDoctorPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [doctorInfo, setDoctorInfo] = useState<{ name: string; specialty: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Email and flow states
  const [email, setEmail] = useState('');
  const [showPasswordField, setShowPasswordField] = useState(false);
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);

  // Login form
  const [password, setPassword] = useState('');

  // Registration form
  const [registrationData, setRegistrationData] = useState<RegistrationData>({
    firstName: '',
    lastName: '',
    phone: '',
    dateOfBirth: ''
  });

  // Appointment scheduler popup
  const [showAppointmentPopup, setShowAppointmentPopup] = useState(false);

  useEffect(() => {
    verifyDoctorToken();
  }, [params.token]);

  const verifyDoctorToken = async () => {
    try {
      const decodedToken = decodeURIComponent(params.token as string);

      const { data, error } = await supabase
        .rpc('verify_doctor_invitation', {
          p_doctor_token: decodedToken
        });

      if (error) {
        console.error('Erreur vérification token:', error);
        setError('Lien d\'invitation invalide ou expiré');
        return;
      }

      if (data && data.length > 0) {
        setDoctorInfo({
          name: `${data[0].first_name} ${data[0].last_name}`,
          specialty: 'Médecin du sommeil'
        });
      } else {
        setError('Lien d\'invitation invalide ou expiré');
      }
    } catch (err) {
      console.error('Erreur lors de la vérification:', err);
      setError('Erreur lors de la vérification du lien');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const emailValue = e.target.value;
    setEmail(emailValue);

    // Reset states when email changes
    setShowPasswordField(false);
    setShowRegistrationForm(false);
    setError(null);
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;

    setShowPasswordField(true);
  };

  const handleLoginAndAssociate = async () => {
    if (!email || !password) return;

    setProcessing(true);
    setError(null);

    try {
      // Connexion avec l'email et mot de passe
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (loginError) {
        // Gestion spécifique des erreurs de connexion
        if (loginError.message.includes('Email not confirmed')) {
          setError('Votre email n\'est pas confirmé. Vérifiez votre boîte mail et cliquez sur le lien de confirmation.');
          setProcessing(false);
          return;
        } else if (loginError.message.includes('Invalid login credentials')) {
          setError('Mot de passe incorrect ou compte inexistant. Souhaitez-vous créer un compte ?');
          setShowPasswordField(false);
          setShowRegistrationForm(true);
          setProcessing(false);
          return;
        }
        // Pour les autres erreurs, afficher l'erreur
        setError(loginError.message);
        setProcessing(false);
        return;
      }

      // Association automatique après connexion réussie
      await processDoctorInvitation();

    } catch (err: any) {
      setError(err.message || 'Erreur lors de la connexion');
      setProcessing(false);
    }
  };

  const handleRegisterAndAssociate = async () => {
    if (!email || !registrationData.firstName || !registrationData.lastName || !password) return;

    setProcessing(true);
    setError(null);

    try {
      const { data: signUpData, error: registerError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: registrationData.firstName,
            last_name: registrationData.lastName,
            phone: registrationData.phone,
            date_of_birth: registrationData.dateOfBirth
          },
          emailRedirectTo: `${window.location.origin}/join/${params.token}/confirm`
        }
      });

      if (registerError) {
        throw registerError;
      }

      // Créer immédiatement le profil patient (même si email pas confirmé)
      if (signUpData.user) {
        // Vérifier d'abord si le profil patient existe déjà
        const { data: existingPatient } = await supabase
          .from('patients')
          .select('id')
          .eq('user_id', signUpData.user.id)
          .single();

        if (!existingPatient) {
          // Créer le profil patient seulement s'il n'existe pas
          const { error: patientError } = await supabase
            .from('patients')
            .insert({
              id: signUpData.user.id,
              user_id: signUpData.user.id,
              first_name: registrationData.firstName,
              last_name: registrationData.lastName,
              date_of_birth: registrationData.dateOfBirth
            });

          if (patientError) {
            console.error('Erreur création profil patient:', patientError);
          }
        }
      }

      if (signUpData.user && !signUpData.session) {
        // L'utilisateur a été créé mais doit confirmer son email
        setSuccess('📧 Un email de confirmation vous a été envoyé. Cliquez sur le lien dans l\'email pour finaliser votre inscription.');

        // Rediriger vers la page de confirmation d'email
        setTimeout(() => {
          router.push('/auth/confirm-email');
        }, 2000);
        return;
      }

      if (signUpData.session) {
        // L'utilisateur est déjà confirmé (cas rare)
        setSuccess('✅ Inscription réussie ! Redirection en cours...');
        setTimeout(() => {
          router.push('/dashboard/patient');
        }, 2000);
      }

    } catch (err: any) {
      console.error('❌ Erreur lors de l\'inscription:', err);
      setError(err.message || 'Erreur lors de l\'inscription');
    } finally {
      setProcessing(false);
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
        console.error('Erreur association médecin:', error);
        throw new Error('Association médecin-patient différée - vous pourrez le faire plus tard');
      }

      if (data) {
        // Association réussie - afficher le popup de rendez-vous
        setSuccess('✅ Association réussie ! Veuillez programmer votre premier rendez-vous.');
        setShowAppointmentPopup(true);
      }
    } catch (err: any) {
      console.error('Erreur dans processDoctorInvitation:', err);
      throw err;
    }
  };

  const handleScheduleAppointment = async (appointmentData: any) => {
    console.log('Rendez-vous programmé:', appointmentData);
    // Fermer le popup et rediriger vers le dashboard
    setShowAppointmentPopup(false);
    setSuccess('🎉 Rendez-vous programmé avec succès ! Redirection vers votre espace patient...');
    setTimeout(() => {
      router.push('/dashboard/patient');
    }, 1500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (showPasswordField && !showRegistrationForm) {
      await handleLoginAndAssociate();
    } else if (showRegistrationForm) {
      await handleRegisterAndAssociate();
    } else {
      await handleEmailSubmit(e);
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Vérification du lien d'invitation...</p>
        </div>
      </div>
    );
  }

  if (error && !doctorInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-2">Lien invalide</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => router.push('/')} className="w-full">
            Retour à l'accueil
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-md mx-auto">
        <div className="w-full bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 text-center">
            <h2 className="text-2xl font-bold mb-2">Rejoindre le Dr {doctorInfo?.name}</h2>
            <p className="text-gray-600">{doctorInfo?.specialty}</p>
          </div>

          <div className="p-6">
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                <div className="flex items-center">
                  <XCircle className="h-4 w-4 text-red-600 mr-2" />
                  <h3 className="font-medium text-red-800">Erreur</h3>
                </div>
                <p className="text-red-700 mt-1">{error}</p>
              </div>
            )}

            {success && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                  <h3 className="font-medium text-green-800">Succès</h3>
                </div>
                <p className="text-green-700 mt-1">{success}</p>
              </div>
            )}

            {!success && (
              <form onSubmit={showPasswordField && !showRegistrationForm ? handleSubmit : showRegistrationForm ? handleSubmit : handleEmailSubmit} className="space-y-4">
                {/* Champ email principal */}
                <div className="space-y-2">
                  <Label htmlFor="email">Votre adresse email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={handleEmailChange}
                    required
                    placeholder="Entrez votre adresse email"
                  />
                </div>

                {/* Bouton pour passer à l'étape suivante */}
                {!showPasswordField && !showRegistrationForm && (
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={!email || !email.includes('@')}
                  >
                    Continuer
                  </Button>
                )}

                {/* Formulaire de connexion */}
                {showPasswordField && !showRegistrationForm && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-md space-y-3">
                    <div className="flex items-center">
                      <Lock className="h-4 w-4 text-blue-600 mr-2" />
                      <span className="text-blue-800 font-medium">Connexion</span>
                    </div>
                    <p className="text-blue-700 text-sm">
                      Entrez votre mot de passe pour vous connecter et vous associer au Dr {doctorInfo?.name}
                    </p>

                    <div className="space-y-2">
                      <Label htmlFor="password">Mot de passe</Label>
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Votre mot de passe"
                        required
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        type="submit"
                        className="flex-1"
                        disabled={processing}
                      >
                        {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Se connecter
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowPasswordField(false);
                          setShowRegistrationForm(true);
                          setError(null);
                        }}
                        className="flex-1"
                      >
                        Créer un compte
                      </Button>
                    </div>
                  </div>
                )}

                {/* Formulaire d'inscription */}
                {showRegistrationForm && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-md space-y-3">
                    <div className="flex items-center">
                      <UserPlus className="h-4 w-4 text-green-600 mr-2" />
                      <span className="text-green-800 font-medium">Créer un compte</span>
                    </div>
                    <p className="text-green-700 text-sm">
                      Créez votre compte Somnolink pour vous associer au Dr {doctorInfo?.name}
                    </p>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="firstName" className="text-xs">Prénom</Label>
                        <Input
                          id="firstName"
                          value={registrationData.firstName}
                          onChange={(e) => setRegistrationData({ ...registrationData, firstName: e.target.value })}
                          placeholder="Prénom"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="lastName" className="text-xs">Nom</Label>
                        <Input
                          id="lastName"
                          value={registrationData.lastName}
                          onChange={(e) => setRegistrationData({ ...registrationData, lastName: e.target.value })}
                          placeholder="Nom"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="registrationPassword" className="text-xs">Mot de passe</Label>
                      <Input
                        id="registrationPassword"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Votre mot de passe"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="phone" className="text-xs">Téléphone (optionnel)</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={registrationData.phone}
                        onChange={(e) => setRegistrationData({ ...registrationData, phone: e.target.value })}
                        placeholder="06 12 34 56 78"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="dateOfBirth" className="text-xs">Date de naissance (optionnel)</Label>
                      <Input
                        id="dateOfBirth"
                        type="date"
                        value={registrationData.dateOfBirth}
                        onChange={(e) => setRegistrationData({ ...registrationData, dateOfBirth: e.target.value })}
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        type="submit"
                        className="flex-1"
                        disabled={processing || !password || !registrationData.firstName || !registrationData.lastName}
                      >
                        {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Créer un compte
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowRegistrationForm(false);
                          setShowPasswordField(true);
                          setError(null);
                        }}
                        className="flex-1"
                      >
                        Retour
                      </Button>
                    </div>
                  </div>
                )}
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Popup de programmation de rendez-vous */}
      {showAppointmentPopup && (
        <AppointmentSchedulerPopup
          isOpen={showAppointmentPopup}
          onClose={() => {
            setShowAppointmentPopup(false);
            router.push('/dashboard/patient');
          }}
          doctorName={doctorInfo?.name || 'votre médecin'}
          doctorToken={params.token as string}
          onSchedule={handleScheduleAppointment}
        />
      )}
    </div>
  );
}