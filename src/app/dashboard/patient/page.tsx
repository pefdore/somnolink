// src/app/dashboard/patient/page.tsx

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Calendar, Stethoscope, ChevronDown, ChevronUp, History, FolderOpen, FileText, Heart } from 'lucide-react';
import AppointmentSchedulerPopup from '@/components/patient/AppointmentSchedulerPopup';

interface Doctor {
  id: string;
  first_name: string;
  last_name: string;
  specialty: string;
  association_date: string;
  status: string;
}

interface Appointment {
  id: string;
  appointment_datetime: string;
  type: string;
  notes: string;
  doctor: {
    first_name: string;
    last_name: string;
  };
}

const consultationTypeLabels = {
  'first_consultation': '1ère consultation',
  'followup_4months_ppc': 'Suivi 4 mois PPC',
  'followup_4months_oam': 'Suivi 4 mois OAM',
  'annual_ppc': 'Consultation annuelle PPC',
  'annual_oam': 'Consultation annuelle OAM',
  'other': 'Autre consultation'
};

// Mapping entre types de rendez-vous et questionnaires de pré-consultation
// Structure préparée pour les futurs formulaires spécifiques
//
// ACTUELLEMENT : Tous les types utilisent le formulaire existant de pré-consultation
// À VENIR : Chaque type aura son propre formulaire spécifique
const appointmentQuestionnaireMapping = {
  'first_consultation': 'PRE_CONSULTATION',        // ✅ Formulaire existant
  'followup_4months_ppc': 'FOLLOWUP_4MONTHS_PPC',  // 🔄 À créer
  'followup_4months_oam': 'FOLLOWUP_4MONTHS_OAM',  // 🔄 À créer
  'annual_ppc': 'ANNUAL_PPC',                      // 🔄 À créer
  'annual_oam': 'ANNUAL_OAM',                      // 🔄 À créer
  'other': 'GENERAL_CONSULTATION'                  // 🔄 À créer
};

// Fonction pour vérifier si un questionnaire est requis pour un type de RDV
const isQuestionnaireRequired = (appointmentType: string): boolean => {
  return appointmentType in appointmentQuestionnaireMapping;
};

// Fonction pour obtenir le type de questionnaire pour un RDV
const getQuestionnaireType = (appointmentType: string): string => {
  return appointmentQuestionnaireMapping[appointmentType as keyof typeof appointmentQuestionnaireMapping] || 'GENERAL_CONSULTATION';
};

export default function PatientDashboardHomePage() {
  const [user, setUser] = useState<any>(null);
  const [patientData, setPatientData] = useState<any>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [pastAppointments, setPastAppointments] = useState<Appointment[]>([]);
  const [showPastAppointments, setShowPastAppointments] = useState(false);
  const [medicalNotes, setMedicalNotes] = useState<any[]>([]);
  const [antecedents, setAntecedents] = useState<any[]>([]);
  const [showMedicalFolder, setShowMedicalFolder] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showAppointmentPopup, setShowAppointmentPopup] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const supabase = createClient();

      // Récupérer l'utilisateur connecté
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('Utilisateur non connecté');
        return;
      }
      setUser(user);

      // Récupérer l'ID du patient
      const { data: patientData } = await supabase
        .from('patients')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!patientData) {
        console.error('Profil patient introuvable');
        return;
      }
      setPatientData(patientData);

      // Récupérer les médecins associés
      const { data: relationships, error } = await supabase
        .from('patient_doctor_relationships')
        .select(`
          id,
          status,
          association_type,
          invited_at,
          accepted_at,
          doctors!patient_doctor_relationships_doctor_id_fkey (
            id,
            first_name,
            last_name
          )
        `)
        .eq('patient_id', patientData.id)
        .eq('status', 'active')
        .order('accepted_at', { ascending: false });

      if (error) {
        console.error('Erreur récupération médecins:', error);
      }

      const doctorsList: Doctor[] = relationships?.map(rel => ({
        id: (rel.doctors as any)?.id || '',
        first_name: (rel.doctors as any)?.first_name || '',
        last_name: (rel.doctors as any)?.last_name || '',
        specialty: 'Médecin du sommeil',
        association_date: rel.accepted_at || rel.invited_at || '',
        status: rel.status
      })).filter(doctor => doctor.id) || [];

      setDoctors(doctorsList);

      // Récupérer les rendez-vous du patient directement via Supabase
      try {
        // Récupérer d'abord l'ID du patient
        const { data: patientDataQuery, error: patientError } = await supabase
          .from('patients')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (patientError || !patientDataQuery) {
          console.error('Erreur récupération patient:', patientError);
          setAppointments([]);
          return;
        }

        // Récupération des rendez-vous
        const { data: simpleAppointments, error: simpleError } = await supabase
          .from('appointments')
          .select('id, appointment_datetime, type, notes, patient_id, doctor_id')
          .eq('patient_id', patientDataQuery.id)
          .gte('appointment_datetime', new Date().toISOString())
          .order('appointment_datetime', { ascending: true });

        // Utiliser les données simples et récupérer les médecins séparément
        let finalAppointments: Appointment[] = [];

        if (!simpleError && simpleAppointments && simpleAppointments.length > 0) {
          // Récupérer les IDs des médecins uniques
          const doctorIds = Array.from(new Set(simpleAppointments.map(apt => apt.doctor_id)));

          // Récupérer les informations des médecins
          const { data: doctorsData, error: doctorsError } = await supabase
            .from('doctors')
            .select('id, first_name, last_name')
            .in('id', doctorIds);

          // Créer un mapping des médecins
          const doctorsMap = new Map();
          if (doctorsData) {
            doctorsData.forEach(doctor => {
              doctorsMap.set(doctor.id, doctor);
            });
          }

          // Combiner les données
          if (!doctorsError && doctorsData) {
            finalAppointments = simpleAppointments.map(apt => {
              const doctor = doctorsMap.get(apt.doctor_id);
              return {
                id: apt.id,
                appointment_datetime: apt.appointment_datetime,
                type: apt.type,
                notes: apt.notes,
                doctor: {
                  first_name: doctor?.first_name || 'Dr.',
                  last_name: doctor?.last_name || 'Inconnu'
                }
              };
            });
          } else {
            // Erreur récupération médecins
            finalAppointments = simpleAppointments.map(apt => ({
              id: apt.id,
              appointment_datetime: apt.appointment_datetime,
              type: apt.type,
              notes: apt.notes,
              doctor: {
                first_name: 'Dr.',
                last_name: 'Inconnu'
              }
            }));
          }
        } else {
          // Aucune donnée disponible
          finalAppointments = [];
        }

        setAppointments(finalAppointments);

        // Récupérer les rendez-vous passés
        const { data: pastAppointmentsData, error: pastAppointmentsError } = await supabase
          .from('appointments')
          .select('id, appointment_datetime, type, notes, patient_id, doctor_id')
          .eq('patient_id', patientDataQuery.id)
          .lt('appointment_datetime', new Date().toISOString())
          .order('appointment_datetime', { ascending: false })
          .limit(10); // Limiter aux 10 derniers rendez-vous passés

        if (!pastAppointmentsError && pastAppointmentsData && pastAppointmentsData.length > 0) {
          // Récupérer les médecins pour les rendez-vous passés
          const pastDoctorIds = Array.from(new Set(pastAppointmentsData.map(apt => apt.doctor_id)));
          const { data: pastDoctorsData, error: pastDoctorsError } = await supabase
            .from('doctors')
            .select('id, first_name, last_name')
            .in('id', pastDoctorIds);

          let finalPastAppointments: Appointment[] = [];

          if (!pastDoctorsError && pastDoctorsData) {
            const pastDoctorsMap = new Map();
            pastDoctorsData.forEach(doctor => {
              pastDoctorsMap.set(doctor.id, doctor);
            });

            finalPastAppointments = pastAppointmentsData.map(apt => {
              const doctor = pastDoctorsMap.get(apt.doctor_id);
              return {
                id: apt.id,
                appointment_datetime: apt.appointment_datetime,
                type: apt.type,
                notes: apt.notes,
                doctor: {
                  first_name: doctor?.first_name || 'Dr.',
                  last_name: doctor?.last_name || 'Inconnu'
                }
              };
            });
          } else {
            finalPastAppointments = pastAppointmentsData.map(apt => ({
              id: apt.id,
              appointment_datetime: apt.appointment_datetime,
              type: apt.type,
              notes: apt.notes,
              doctor: {
                first_name: 'Dr.',
                last_name: 'Inconnu'
              }
            }));
          }

          setPastAppointments(finalPastAppointments);
        } else {
          setPastAppointments([]);
        }

        // Récupérer les notes médicales du patient
        try {
          const notesResponse = await fetch('/api/patient-notes');
          if (notesResponse.ok) {
            const notesData = await notesResponse.json();
            setMedicalNotes(notesData.notes || []);
          }
        } catch (error) {
          console.error('Erreur récupération notes médicales:', error);
          setMedicalNotes([]);
        }

        // Récupérer les antécédents médicaux du patient
        try {
          const antecedentsResponse = await fetch('/api/patient-antecedents');
          if (antecedentsResponse.ok) {
            const antecedentsData = await antecedentsResponse.json();
            setAntecedents(antecedentsData.antecedents || []);
          }
        } catch (error) {
          console.error('Erreur récupération antécédents:', error);
          setAntecedents([]);
        }
      } catch (error) {
        console.error('Erreur générale récupération rendez-vous:', error);
        setAppointments([]);
        setPastAppointments([]);
        setMedicalNotes([]);
        setAntecedents([]);
      }

      // Vérifier si on doit afficher le popup de rendez-vous
      const isFirstLoginAfterConfirmation = localStorage.getItem('firstLoginAfterConfirmation');
      const hasShownPopup = localStorage.getItem('appointmentPopupShown');
      const hasScheduledAppointment = localStorage.getItem('hasScheduledAppointment');

      // Afficher le popup si :
      // 1. C'est une première connexion après confirmation OU
      // 2. L'utilisateur n'a pas encore programmé de rendez-vous
      // 3. Il a au moins un médecin associé
      // 4. Le popup n'a pas encore été affiché
      const shouldShowPopup = (isFirstLoginAfterConfirmation === 'true' || !hasScheduledAppointment) &&
                            doctorsList.length > 0 &&
                            !hasShownPopup;

      if (shouldShowPopup) {
        console.log('🎯 Affichage du popup de rendez-vous');
        setSelectedDoctor(doctorsList[0]); // Premier médecin
        setShowAppointmentPopup(true);
        localStorage.removeItem('firstLoginAfterConfirmation'); // Supprimer le flag
        localStorage.setItem('appointmentPopupShown', 'true'); // Marquer comme affiché
      }

    } catch (error) {
      console.error('Erreur chargement dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleAppointment = async (appointmentData: any) => {
    console.log('Rendez-vous programmé:', appointmentData);
    setShowAppointmentPopup(false);

    // Marquer que l'utilisateur a programmé un rendez-vous
    localStorage.setItem('hasScheduledAppointment', 'true');

    // Recharger les données pour mettre à jour l'interface
    await loadDashboardData();
  };

  // Fonction pour déterminer vers quel onglet rediriger l'utilisateur
  const getTodoRedirectUrl = async () => {
    try {
      const supabase = createClient();

      console.log('🔍 [DEBUG] getTodoRedirectUrl - Patient ID:', patientData.id);

      // Récupérer tous les rendez-vous futurs
      const { data: futureAppointments, error } = await supabase
        .from('appointments')
        .select('id, appointment_datetime, type')
        .eq('patient_id', patientData.id)
        .gte('appointment_datetime', new Date().toISOString())
        .order('appointment_datetime', { ascending: true });

      console.log('🔍 [DEBUG] Future appointments query result:', {
        error: error?.message,
        count: futureAppointments?.length,
        appointments: futureAppointments?.map(apt => ({
          id: apt.id,
          type: apt.type,
          date: apt.appointment_datetime,
          isFuture: new Date(apt.appointment_datetime) > new Date(),
          questionnaireRequired: isQuestionnaireRequired(apt.type),
          questionnaireType: getQuestionnaireType(apt.type)
        }))
      });

      if (error || !futureAppointments || futureAppointments.length === 0) {
        console.log('⚠️ [DEBUG] No future appointments found');
        return '/dashboard/patient/todo?tab=morning-after';
      }

      // Pour chaque rendez-vous futur, vérifier s'il y a un questionnaire requis
      for (const appointment of futureAppointments) {
        console.log('🔍 [DEBUG] Checking appointment:', {
          id: appointment.id,
          type: appointment.type,
          questionnaireRequired: isQuestionnaireRequired(appointment.type)
        });

        if (isQuestionnaireRequired(appointment.type)) {
          const questionnaireType = getQuestionnaireType(appointment.type);
          console.log('🔍 [DEBUG] Questionnaire required:', questionnaireType);

          // Vérifier si le questionnaire est déjà rempli
          const { data: questionnaires, error: questionnaireError } = await supabase
            .from('questionnaires')
            .select('type, created_at')
            .eq('appointment_id', appointment.id);

          console.log('🔍 [DEBUG] Questionnaires for appointment:', {
            appointmentId: appointment.id,
            questionnaires: questionnaires,
            error: questionnaireError?.message
          });

          const submittedTypes = questionnaires?.map(q => q.type) || [];
          // TEMPORAIRE : Pour l'instant, on vérifie seulement PRE_CONSULTATION car c'est le seul formulaire existant
          // Plus tard, on vérifiera le questionnaire spécifique à chaque type
          const isQuestionnaireDone = submittedTypes.includes('PRE_CONSULTATION');

          console.log('🔍 [DEBUG] Questionnaire status:', {
            expectedType: questionnaireType,
            submittedTypes,
            isDone: isQuestionnaireDone
          });

          if (!isQuestionnaireDone) {
            console.log('✅ [DEBUG] Found questionnaire to fill - FORÇAGE PRE-CONSULTATION');
            // MODIFICATION : Pour les premières consultations, rediriger directement vers le formulaire
            if (appointment.type === 'first_consultation') {
              return `/dashboard/patient/todo?tab=pre-consultation&direct=true&appointmentId=${appointment.id}`;
            } else {
              return '/dashboard/patient/todo?tab=pre-consultation';
            }
          } else {
            console.log('✅ [DEBUG] Questionnaire already completed:', questionnaireType);
          }
        } else {
          console.log('⚠️ [DEBUG] No questionnaire required for type:', appointment.type);
        }
      }

      console.log('⚠️ [DEBUG] No questionnaires to fill, going to morning-after');
      // Si aucun questionnaire n'est requis ou tous sont remplis, aller vers morning-after
      return '/dashboard/patient/todo?tab=morning-after';

    } catch (error) {
      console.error('❌ [DEBUG] Error in getTodoRedirectUrl:', error);
      return '/dashboard/patient/todo?tab=morning-after';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600 mx-auto mb-4"></div>
          <h2 className="text-lg font-medium text-gray-900 mb-2">Chargement de votre espace</h2>
          <p className="text-gray-600 text-sm">Préparation de votre tableau de bord personnalisé...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* En-tête simple et sobre */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-3xl font-normal text-gray-900 mb-2">
              Mon Espace Patient
            </h1>
            <p className="text-gray-600 text-lg">
              Bienvenue dans votre tableau de bord Somnolink
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Section Médecins Associés */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Stethoscope className="h-5 w-5 text-gray-600" />
                <h2 className="text-xl font-medium text-gray-900">Mes Médecins</h2>
              </div>
              {doctors.length > 0 && (
                <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                  {doctors.length} professionnel{doctors.length > 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>

          <div className="p-6">
            {doctors.length === 0 ? (
              <div className="text-center py-12">
                <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Aucun médecin associé
                </h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Vous n'êtes pas encore associé à un médecin. Utilisez un lien d'invitation pour commencer votre suivi médical personnalisé.
                </p>
                <div className="inline-flex items-center px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-full">
                  En attente d'association médicale
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {doctors.map((doctor) => (
                  <div
                    key={doctor.id}
                    className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 font-medium text-sm">
                        {doctor.first_name[0]}{doctor.last_name[0]}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-900">
                          Dr. {doctor.first_name} {doctor.last_name}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Médecin du sommeil
                        </p>
                        <div className="mt-4 space-y-2">
                          <div className="flex items-center text-sm text-gray-600">
                            <Calendar className="h-4 w-4 mr-2" />
                            Association depuis le {new Date(doctor.association_date).toLocaleDateString('fr-FR')}
                          </div>
                          <div className="flex items-center text-sm text-green-600">
                            <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                            Actif
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Section Prochains Rendez-vous */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <Calendar className="h-5 w-5 text-gray-600 mr-3" />
              <h2 className="text-xl font-medium text-gray-900">Mes Prochains Rendez-vous</h2>
            </div>
          </div>

          <div className="p-6">
            {appointments.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Aucun rendez-vous programmé
                </h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Vous n'avez pas encore de rendez-vous programmé. Prenez rendez-vous avec votre médecin pour commencer votre suivi.
                </p>
                {doctors.length > 0 && (
                  <Button
                    onClick={() => {
                      setSelectedDoctor(doctors[0]);
                      setShowAppointmentPopup(true);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium"
                  >
                    Programmer un rendez-vous
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {appointments.map((appointment) => (
                  <div key={appointment.id} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          Rendez-vous avec Dr. {appointment.doctor.first_name} {appointment.doctor.last_name}
                        </h3>
                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2" />
                            {new Date(appointment.appointment_datetime).toLocaleDateString('fr-FR', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                          <div className="flex items-center">
                            <span className="font-medium mr-2">Motif:</span>
                            {consultationTypeLabels[appointment.type as keyof typeof consultationTypeLabels] || appointment.type}
                          </div>
                          {appointment.notes && (
                            <div className="flex items-start">
                              <span className="font-medium mr-2">Note:</span>
                              <span className="italic">{appointment.notes}</span>
                            </div>
                          )}
                        </div>

                        {isQuestionnaireRequired(appointment.type) && (
                          <div className="mt-4">
                            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                  <span className="text-orange-600 mr-2">📋</span>
                                  <span className="text-sm font-medium text-orange-800">
                                    Questionnaire à remplir
                                  </span>
                                </div>
                                <span className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded-full">
                                  Requis
                                </span>
                              </div>
                            </div>
                            <Link
                              href="#"
                              onClick={async (e) => {
                                e.preventDefault();
                                const redirectUrl = await getTodoRedirectUrl();
                                window.location.href = redirectUrl;
                              }}
                              className="inline-flex items-center px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-md hover:bg-orange-700"
                            >
                              Remplir le questionnaire
                            </Link>
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <span className="inline-flex items-center px-3 py-1 text-sm text-green-700 bg-green-100 rounded-full">
                          Confirmé
                        </span>
                      </div>
                    </div>
                  </div>
                ))}

                {doctors.length > 0 && (
                  <div className="text-center pt-4 border-t border-gray-200">
                    <Button
                      onClick={() => {
                        setSelectedDoctor(doctors[0]);
                        setShowAppointmentPopup(true);
                      }}
                      variant="outline"
                      className="border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-2 rounded-md font-medium"
                    >
                      Programmer un nouveau rendez-vous
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Section Historique des Rendez-vous (pliable) */}
        {pastAppointments.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <History className="h-5 w-5 text-gray-600 mr-3" />
                  <h2 className="text-xl font-medium text-gray-900">Historique des Rendez-vous</h2>
                </div>
                <Button
                  onClick={() => setShowPastAppointments(!showPastAppointments)}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  {showPastAppointments ? (
                    <>
                      <ChevronUp className="h-4 w-4" />
                      Masquer l'historique
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4" />
                      Afficher l'historique ({pastAppointments.length})
                    </>
                  )}
                </Button>
              </div>
            </div>

            {showPastAppointments && (
              <div className="p-6">
                <div className="space-y-4">
                  {pastAppointments.map((appointment) => (
                    <Card key={appointment.id} className="border-gray-200">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <History className="h-5 w-5 text-gray-400" />
                            <div>
                              <h3 className="text-base font-medium text-gray-900">
                                Rendez-vous avec Dr. {appointment.doctor.first_name} {appointment.doctor.last_name}
                              </h3>
                              <p className="text-sm text-gray-600">
                                {new Date(appointment.appointment_datetime).toLocaleDateString('fr-FR', {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                              <p className="text-sm text-gray-500 mt-1">
                                Motif: {consultationTypeLabels[appointment.type as keyof typeof consultationTypeLabels] || appointment.type}
                              </p>
                              {appointment.notes && (
                                <p className="text-sm text-gray-600 mt-2 italic">
                                  "{appointment.notes}"
                                </p>
                              )}
                            </div>
                          </div>
                          <span className="inline-flex items-center px-2.5 py-0.5 text-xs text-gray-600 bg-gray-100 rounded-full">
                            Terminé
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Section Mon Dossier Médical */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FolderOpen className="h-5 w-5 text-gray-600 mr-3" />
                <h2 className="text-xl font-medium text-gray-900">Mon Dossier Médical</h2>
              </div>
              <Button
                onClick={() => setShowMedicalFolder(!showMedicalFolder)}
                variant="outline"
                size="sm"
                className="flex items-center gap-2 border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                {showMedicalFolder ? (
                  <>
                    <ChevronUp className="h-4 w-4" />
                    Masquer le dossier
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    Consulter mon dossier ({(medicalNotes.length + antecedents.length)})
                  </>
                )}
              </Button>
            </div>
          </div>

          {showMedicalFolder && (
            <div className="p-6 space-y-6">
              {/* Notes médicales */}
              <div>
                <div className="flex items-center mb-4">
                  <FileText className="h-5 w-5 text-gray-600 mr-2" />
                  <h3 className="text-lg font-medium text-gray-900">Notes médicales</h3>
                  <span className="ml-2 text-sm text-gray-600">({medicalNotes.length})</span>
                </div>

                {medicalNotes.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600 text-sm">Aucune note médicale disponible</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {medicalNotes.map((note: any) => (
                      <Card key={note.id} className="border-gray-200">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-sm font-medium text-gray-900">
                                  Dr. {note.doctor.first_name} {note.doctor.last_name}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {new Date(note.created_at).toLocaleDateString('fr-FR')}
                                </span>
                              </div>
                              <p className="text-gray-700 text-sm leading-relaxed">
                                {note.content}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              {/* Antécédents médicaux */}
              <div>
                <div className="flex items-center mb-4">
                  <Heart className="h-5 w-5 text-gray-600 mr-2" />
                  <h3 className="text-lg font-medium text-gray-900">Antécédents médicaux</h3>
                  <span className="ml-2 text-sm text-gray-600">({antecedents.length})</span>
                </div>

                {antecedents.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <Heart className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600 text-sm">Aucun antécédent médical enregistré</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {antecedents.map((antecedent: any) => (
                      <Card key={antecedent.id} className="border-gray-200">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <span className="text-sm font-medium text-gray-900">
                                  {antecedent.type === 'medical' ? 'Antécédent médical' : 'Antécédent chirurgical'}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {antecedent.code} ({antecedent.system})
                                </span>
                                <span className="text-xs text-gray-500">
                                  Dr. {antecedent.doctor.first_name} {antecedent.doctor.last_name}
                                </span>
                              </div>
                              <h4 className="font-medium text-gray-900 mb-1">
                                {antecedent.label}
                              </h4>
                              {antecedent.note && (
                                <p className="text-gray-600 text-sm">
                                  {antecedent.note}
                                </p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Section Informations contextuelles */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <Heart className="h-5 w-5 text-gray-600 mr-3" />
              <h2 className="text-xl font-medium text-gray-900">Informations de suivi</h2>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="font-medium text-blue-900 mb-2">Après votre rendez-vous</h3>
              <p className="text-blue-800 text-sm leading-relaxed">
                Si vous avez programmé une première consultation, un questionnaire de pré-consultation
                vous sera automatiquement proposé dans la section "À faire". Ce questionnaire permet
                à votre médecin de mieux vous connaître avant votre rendez-vous.
              </p>
            </div>

            {appointments.some(apt => isQuestionnaireRequired(apt.type)) && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
                <h3 className="font-medium text-orange-900 mb-2">Action requise</h3>
                <p className="text-orange-800 text-sm mb-4 leading-relaxed">
                  Vous avez un ou plusieurs rendez-vous nécessitant un questionnaire de pré-consultation.
                  Remplissez-le pour optimiser votre consultation médicale.
                </p>
                <Link
                  href="#"
                  onClick={async (e) => {
                    e.preventDefault();
                    const redirectUrl = await getTodoRedirectUrl();
                    window.location.href = redirectUrl;
                  }}
                  className="inline-flex items-center px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-md hover:bg-orange-700"
                >
                  Remplir le questionnaire maintenant
                </Link>
              </div>
            )}

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <h3 className="font-medium text-gray-900 mb-2">À propos de votre suivi</h3>
              <p className="text-gray-700 text-sm leading-relaxed">
                Ici s'affichent les informations contextuelles de votre prise en charge médicale,
                vos prochains rendez-vous, et vos tâches à accomplir. Votre suivi médical est
                personnalisé selon vos besoins.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Popup de prise de rendez-vous */}
      {showAppointmentPopup && selectedDoctor && (
        <AppointmentSchedulerPopup
          isOpen={showAppointmentPopup}
          onClose={() => setShowAppointmentPopup(false)}
          doctorName={`${selectedDoctor.first_name} ${selectedDoctor.last_name}`}
          doctorId={selectedDoctor.id}
          onSchedule={handleScheduleAppointment}
        />
      )}
    </div>
  );
}