// src/app/dashboard/patient/todo/page.tsx

import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { PreConsultation } from './_components/pre-consultation';
import { MorningAfter } from './_components/morning-after'; // Importer le nouveau composant

// Mapping entre types de rendez-vous et questionnaires de pré-consultation
// Structure préparée pour les futurs formulaires spécifiques
const appointmentQuestionnaireMapping = {
  'first_consultation': 'PRE_CONSULTATION',
  'followup_4months_ppc': 'FOLLOWUP_4MONTHS_PPC',
  'followup_4months_oam': 'FOLLOWUP_4MONTHS_OAM',
  'annual_ppc': 'ANNUAL_PPC',
  'annual_oam': 'ANNUAL_OAM',
  'other': 'GENERAL_CONSULTATION'
};

// Fonction pour vérifier si un questionnaire est requis pour un type de RDV
const isQuestionnaireRequired = (appointmentType: string): boolean => {
  return appointmentType in appointmentQuestionnaireMapping;
};

// Fonction pour obtenir le type de questionnaire pour un RDV
const getQuestionnaireType = (appointmentType: string): string => {
  return appointmentQuestionnaireMapping[appointmentType as keyof typeof appointmentQuestionnaireMapping] || 'GENERAL_CONSULTATION';
};

// On ajoute `searchParams` pour savoir quel onglet est actif
export default async function TodoPage({ searchParams }: { searchParams: { tab: string, type?: string, direct?: string, appointmentId?: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: patient } = await supabase.from('patients').select('id').eq('user_id', user.id).single();
  if (!patient) return <div>Profil patient introuvable.</div>;

  // Debug: Vérifier tous les rendez-vous de l'utilisateur
  const { data: allAppointments, error: allAppointmentsError } = await supabase
    .from('appointments')
    .select('id, appointment_datetime, type')
    .eq('patient_id', patient.id)
    .order('appointment_datetime', { ascending: false });

  console.log('📅 [TODO DEBUG] Tous les RDV de l\'utilisateur:', {
    patientId: patient.id,
    userId: user.id,
    searchParams: searchParams,
    allAppointments: allAppointments?.map(apt => ({
      id: apt.id,
      type: apt.type,
      date: apt.appointment_datetime,
      isFuture: new Date(apt.appointment_datetime) > new Date(),
      questionnaireRequired: isQuestionnaireRequired(apt.type),
      questionnaireType: getQuestionnaireType(apt.type)
    })),
    allAppointmentsError: allAppointmentsError?.message,
    currentTime: new Date().toISOString()
  });

  // Chercher le premier rendez-vous futur qui nécessite un questionnaire
  // Tous les types de RDV utilisent maintenant le même questionnaire de pré-consultation
  const { data: appointment, error: appointmentError } = await supabase
    .from('appointments')
    .select('id, appointment_datetime, type')
    .eq('patient_id', patient.id)
    .gte('appointment_datetime', new Date().toISOString())
    .order('appointment_datetime', { ascending: true })
    .limit(1)
    .single();

  // Vérifier si le questionnaire doit être affiché
  const shouldShowPreConsultation = appointment && !appointmentError && isQuestionnaireRequired(appointment.type);

  // On vérifie si les questionnaires ont été soumis
  const { data: questionnaires } = appointment && !appointmentError
    ? await supabase.from('questionnaires').select('type').eq('appointment_id', appointment.id)
    : { data: [] };

  const submittedTypes = questionnaires?.map(q => q.type) || [];

  // Déterminer le type de questionnaire attendu selon le type de RDV
  const expectedQuestionnaireType = appointment ? getQuestionnaireType(appointment.type) : 'PRE_CONSULTATION';

  // TEMPORAIRE : Pour l'instant, on vérifie seulement PRE_CONSULTATION car c'est le seul formulaire existant
  // Plus tard, on vérifiera le questionnaire spécifique à chaque type
  const isPreConsultationDone = submittedTypes.includes('PRE_CONSULTATION');
  const isMorningAfterDone = submittedTypes.includes('MORNING_AFTER');

  const appointmentDate = appointment ? new Date(appointment.appointment_datetime) : null;
  const now = new Date();

  // Logique de déblocage - DÉPLACÉ ICI pour être disponible dans la logique d'onglet
  // MODIFICATION : "Au réveil" seulement pour les premières consultations
  const canDoMorningAfter = isPreConsultationDone && appointment && appointment.type === 'first_consultation' && appointmentDate && now.toDateString() >= new Date(appointmentDate.getTime() + 24*60*60*1000).toDateString(); // Le lendemain du RDV

  // Logique simplifiée pour déterminer l'onglet actif
  // Tous les types de RDV utilisent maintenant le même questionnaire de pré-consultation
  let activeTab = searchParams.tab;

  console.log('🔍 [TODO DEBUG] Détermination de l\'onglet actif:', {
    initialTab: searchParams.tab,
    shouldShowPreConsultation,
    isPreConsultationDone,
    appointmentFound: !!appointment,
    appointmentType: appointment?.type
  });

  if (!activeTab) {
    console.log('🔍 [TODO DEBUG] Aucun onglet spécifié, forçage vers pre-consultation');
    // SOLUTION SIMPLE : Forcer toujours pre-consultation par défaut
    activeTab = 'pre-consultation';
  }

  // Forcer l'affichage du questionnaire si demandé explicitement
  if (searchParams.tab === 'pre-consultation') {
    console.log('🔍 [TODO DEBUG] Onglet pre-consultation demandé explicitement');
    activeTab = 'pre-consultation';
  }

  console.log('🎯 [TODO DEBUG] Onglet final déterminé:', activeTab);

  // Debug logging détaillé (à supprimer en production)
  console.log('🔍 Debug TodoPage détaillé:', {
    userId: user.id,
    patientId: patient.id,
    appointmentFound: !!appointment,
    appointmentError: appointmentError?.message,
    appointmentId: appointment?.id,
    appointmentType: appointment?.type,
    appointmentDate: appointment?.appointment_datetime,
    shouldShowPreConsultation,
    isPreConsultationDone,
    submittedTypes,
    activeTab,
    searchParamsTab: searchParams.tab,
    currentTime: new Date().toISOString()
  });


  const TabLink = ({ name, label, enabled }: { name: string, label: string, enabled: boolean }) => {
    const isActive = activeTab === name;
    if (!enabled) {
      return <span className="px-3 py-2 font-medium text-sm rounded-md text-gray-400 bg-gray-100 cursor-not-allowed">{label}</span>;
    }
    return (
      <Link href={`/dashboard/patient/todo?tab=${name}`}
            className={`px-3 py-2 font-medium text-sm rounded-md ${isActive ? 'text-blue-600 bg-blue-100' : 'text-gray-700 hover:bg-gray-200'}`}>
        {label}
      </Link>
    );
  };
  
  // Déterminer le titre selon l'onglet actif
  const getPageTitle = () => {
    if (activeTab === 'pre-consultation') {
      return 'Questionnaire de pré-consultation';
    }
    return 'À faire';
  };

  // MODIFICATION : Affichage direct pour les premières consultations
  const isDirectFirstConsultation = searchParams.direct === 'true' && searchParams.appointmentId && appointment && appointment.type === 'first_consultation';

  if (isDirectFirstConsultation) {
    return (
      <div>
        <h1 className="text-3xl font-bold">Questionnaire de pré-consultation</h1>
        <div className="mt-8">
          <PreConsultation
            patientId={patient.id}
            appointment={appointment}
            isDone={isPreConsultationDone}
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold">{getPageTitle()}</h1>

      <div className="mt-8 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <TabLink name="pre-consultation" label="Pré-consultation" enabled={true} />
          <TabLink name="morning-after" label="Au réveil" enabled={canDoMorningAfter ?? false} />
          {/* ... autres onglets ... */}
        </nav>
      </div>

      <div className="mt-8">
        {activeTab === 'pre-consultation' && (
          <div>
            <PreConsultation
              patientId={patient.id}
              appointment={appointment}
              isDone={isPreConsultationDone}
            />
          </div>
        )}
        {activeTab === 'morning-after' && appointment && (
          <MorningAfter
            patientId={patient.id}
            appointmentId={appointment.id}
            isDone={isMorningAfterDone}
          />
        )}
      </div>
    </div>
  );
}