// src/app/dashboard/patient/layout.tsx

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Home, Calendar, FileText, History, MessageSquare, User, Bell, Menu, X } from 'lucide-react';
import { useState } from 'react';

// Ce composant est la "coquille" qui entourera toutes les pages du dossier /patient
export default async function PatientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login'); // Sécurité : si pas connecté, on dégage
  }

  // VÉRIFICATION DE SÉCURITÉ CRITIQUE : Email doit être confirmé
  if (!user.email_confirmed_at) {
    console.log('🚫 [SECURITY] ACCÈS BLOQUÉ - Email NON confirmé pour utilisateur:', user.id);
    console.log('🚫 [SECURITY] email_confirmed_at:', user.email_confirmed_at);
    console.log('🚫 [SECURITY] Redirection vers /auth/confirm-email');
    redirect('/auth/confirm-email'); // Rediriger vers page d'attente de confirmation
  }

  console.log('✅ [SECURITY] ACCÈS AUTORISÉ - Email confirmé pour utilisateur:', user.id);
  console.log('✅ [SECURITY] email_confirmed_at:', user.email_confirmed_at);

  // On récupère le profil pour afficher les initiales
  const { data: patientProfile } = await supabase
    .from('patients')
    .select('id, first_name, last_name')
    .eq('user_id', user.id)
    .single();
    
  const initials = patientProfile
    ? `${patientProfile.first_name[0]}${patientProfile.last_name[0]}`.toUpperCase()
    : '??';

  // Mapping des questionnaires par type de rendez-vous
  // Structure préparée pour les futurs formulaires spécifiques
  const appointmentQuestionnaireMapping = {
    'first_consultation': 'PRE_CONSULTATION',
    'followup_4months_ppc': 'FOLLOWUP_4MONTHS_PPC',
    'followup_4months_oam': 'FOLLOWUP_4MONTHS_OAM',
    'annual_ppc': 'ANNUAL_PPC',
    'annual_oam': 'ANNUAL_OAM',
    'other': 'GENERAL_CONSULTATION'
  };

  // Fonction pour vérifier si un questionnaire est requis
  const isQuestionnaireRequired = (appointmentType: string): boolean => {
    return appointmentType in appointmentQuestionnaireMapping;
  };

  // Compter les tâches à faire et déterminer la redirection
  let todoCount = 0;
  let todoRedirectUrl = '/dashboard/patient/todo?tab=morning-after';

  if (patientProfile) {
    try {
      console.log('🔍 [LAYOUT DEBUG] Comptage des tâches pour patient:', patientProfile.id);

      // Récupérer tous les rendez-vous futurs
      const { data: futureAppointments, error } = await supabase
        .from('appointments')
        .select('id, appointment_datetime, type')
        .eq('patient_id', patientProfile.id)
        .gte('appointment_datetime', new Date().toISOString())
        .order('appointment_datetime', { ascending: true });

      console.log('🔍 [LAYOUT DEBUG] Rendez-vous futurs:', {
        error: error?.message,
        count: futureAppointments?.length,
        appointments: futureAppointments?.map(apt => ({
          id: apt.id,
          type: apt.type,
          date: apt.appointment_datetime,
          questionnaireRequired: isQuestionnaireRequired(apt.type),
          questionnaireType: appointmentQuestionnaireMapping[apt.type as keyof typeof appointmentQuestionnaireMapping]
        }))
      });

      if (!error && futureAppointments && futureAppointments.length > 0) {
        // Pour chaque rendez-vous futur, vérifier s'il y a un questionnaire requis
        for (const appointment of futureAppointments) {
          console.log('🔍 [LAYOUT DEBUG] Vérification RDV:', {
            id: appointment.id,
            type: appointment.type,
            questionnaireRequired: isQuestionnaireRequired(appointment.type)
          });

          if (isQuestionnaireRequired(appointment.type)) {
            const questionnaireType = appointmentQuestionnaireMapping[appointment.type as keyof typeof appointmentQuestionnaireMapping];
            console.log('🔍 [LAYOUT DEBUG] Questionnaire attendu:', questionnaireType);

            // Vérifier si le questionnaire est déjà rempli
            const { data: questionnaires, error: questionnaireError } = await supabase
              .from('questionnaires')
              .select('type')
              .eq('appointment_id', appointment.id);

            console.log('🔍 [LAYOUT DEBUG] Questionnaires existants:', {
              appointmentId: appointment.id,
              questionnaires: questionnaires,
              error: questionnaireError?.message
            });

            const submittedTypes = questionnaires?.map(q => q.type) || [];
            // TEMPORAIRE : Pour l'instant, on vérifie seulement PRE_CONSULTATION car c'est le seul formulaire existant
            // Plus tard, on vérifiera le questionnaire spécifique à chaque type
            const isQuestionnaireDone = submittedTypes.includes('PRE_CONSULTATION');

            console.log('🔍 [LAYOUT DEBUG] Statut questionnaire:', {
              expected: questionnaireType,
              submitted: submittedTypes,
              isDone: isQuestionnaireDone
            });

            if (!isQuestionnaireDone) {
              console.log('✅ [LAYOUT DEBUG] Questionnaire non rempli trouvé - FORÇAGE PRE-CONSULTATION');
              todoCount += 1;

              // SOLUTION SIMPLE : Forcer toujours la redirection vers pre-consultation
              todoRedirectUrl = '/dashboard/patient/todo?tab=pre-consultation';
              break; // On s'arrête au premier questionnaire trouvé
            } else {
              console.log('✅ [LAYOUT DEBUG] Questionnaire déjà rempli');
            }
          } else {
            console.log('⚠️ [LAYOUT DEBUG] Aucun questionnaire requis pour ce type');
          }
        }

        // Si aucun questionnaire spécifique n'est requis, vérifier "Au réveil"
        if (todoCount === 0) {
          console.log('🔍 [LAYOUT DEBUG] Vérification morning-after');
          const firstAppointment = futureAppointments[0];
          const { data: questionnaires } = await supabase
            .from('questionnaires')
            .select('type')
            .eq('appointment_id', firstAppointment.id);

          const submittedTypes = questionnaires?.map(q => q.type) || [];
          const isMorningAfterDone = submittedTypes.includes('MORNING_AFTER');

          console.log('🔍 [LAYOUT DEBUG] Morning-after status:', {
            appointmentId: firstAppointment.id,
            submitted: submittedTypes,
            isDone: isMorningAfterDone
          });

          if (!isMorningAfterDone) {
            console.log('✅ [LAYOUT DEBUG] Morning-after requis');
            todoCount += 1;
            todoRedirectUrl = '/dashboard/patient/todo?tab=morning-after';
          }
        }
      } else {
        console.log('⚠️ [LAYOUT DEBUG] Aucun RDV futur trouvé');
      }

      console.log('🎯 [LAYOUT DEBUG] Résultat final:', {
        todoCount,
        todoRedirectUrl
      });

    } catch (error) {
      console.error('❌ [LAYOUT DEBUG] Erreur lors du comptage des tâches:', error);
    }
  }

  // La fonction de déconnexion. C'est une "Server Action".
  // Elle s'exécute sur le serveur pour détruire la session de manière sécurisée.
  const signOut = async () => {
    'use server'; // Magie de Next.js pour une fonction serveur
    const supabase = createClient();
    await supabase.auth.signOut();
    redirect('/auth/login');
  };

  return (
    <div className="flex min-h-screen">
      {/* Conteneur principal avec barre latérale et contenu */}
      <div className="flex w-full">
        {/* Navigation sobre - Sidebar */}
        <nav className="w-80 bg-white text-gray-900 flex flex-col fixed h-screen z-30 border-r border-gray-200 overflow-hidden">
          {/* Header avec avatar et info utilisateur */}
          <div className="bg-gray-50 border-b border-gray-200 p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center text-lg font-medium text-gray-700">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-base text-gray-900 truncate">{patientProfile?.first_name} {patientProfile?.last_name}</h3>
                <p className="text-gray-600 text-sm">Patient Somnolink</p>
              </div>
            </div>
          </div>

          {/* Navigation items sobre */}
          <div className="flex-1 px-4 py-6">
            <ul className="space-y-1">
              <li>
                <Link href="/dashboard/patient" className="flex items-center px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors">
                  <Home className="w-5 h-5 text-gray-600 mr-3" />
                  <span className="text-sm font-medium text-gray-900">Dashboard</span>
                </Link>
              </li>

              <li className="relative">
                <Link href={todoRedirectUrl} className="flex items-center px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors">
                  <span className="text-lg mr-3">📋</span>
                  <span className="text-sm font-medium text-gray-900">À faire</span>
                  {todoCount > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-xs font-medium rounded-full h-5 min-w-5 px-1.5 flex items-center justify-center">
                      {todoCount > 9 ? '9+' : todoCount}
                    </span>
                  )}
                </Link>
              </li>

              <li>
                <Link href="/dashboard/patient/history" className="flex items-center px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors">
                  <span className="text-lg mr-3">📚</span>
                  <span className="text-sm font-medium text-gray-900">Mes antécédents</span>
                </Link>
              </li>

              <li>
                <Link href="/dashboard/patient/documents" className="flex items-center px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors">
                  <span className="text-lg mr-3">📄</span>
                  <span className="text-sm font-medium text-gray-900">Mes documents</span>
                </Link>
              </li>

              <li>
                <Link href="/dashboard/patient/messagerie" className="flex items-center px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors">
                  <span className="text-lg mr-3">💬</span>
                  <span className="text-sm font-medium text-gray-900">Messagerie</span>
                </Link>
              </li>

              <li>
                <Link href="/dashboard/patient/profil" className="flex items-center px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors">
                  <span className="text-lg mr-3">👤</span>
                  <span className="text-sm font-medium text-gray-900">Mon profil</span>
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Bouton de déconnexion sobre */}
          <div className="p-4 border-t border-gray-200">
            <form action={signOut}>
              <button type="submit" className="w-full flex items-center px-3 py-2 text-red-600 rounded-lg hover:bg-red-50 transition-colors">
                <span className="text-lg mr-3">🚪</span>
                <span className="text-sm font-medium">Déconnexion</span>
              </button>
            </form>
          </div>
        </nav>

        {/* Contenu principal avec barre horizontale */}
        <div className="flex-1 flex flex-col ml-80">
          {/* Barre horizontale supérieure fixe */}
          <div className="relative sticky top-0 z-20">
            {/* Barre horizontale supérieure simple */}
            <header className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
              <div className="max-w-7xl mx-auto flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <h1 className="text-xl font-semibold text-gray-900">Somnolink</h1>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">
                    {patientProfile?.first_name} {patientProfile?.last_name}
                  </span>
                </div>
              </div>
            </header>
          </div>
          
          {/* Contenu principal de la page */}
          <main className="flex-1 bg-gray-100 overflow-auto">
            <div className="p-8">
              {children} {/* C'est ici que le contenu de nos pages (page.tsx) sera injecté */}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}