// src/app/dashboard/patient/layout-new.tsx

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Home, Calendar, FileText, History, MessageSquare, User, Bell, Menu, X } from 'lucide-react';
import { useState } from 'react';
import MobileNav from '@/components/patient/MobileNav';

export default async function PatientLayoutNew({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // VÉRIFICATION DE SÉCURITÉ CRITIQUE : Email doit être confirmé
  if (!user.email_confirmed_at) {
    redirect('/auth/confirm-email');
  }

  // Récupérer le profil patient
  const { data: patientProfile } = await supabase
    .from('patients')
    .select('id, first_name, last_name')
    .eq('user_id', user.id)
    .single();

  const initials = patientProfile
    ? `${patientProfile.first_name[0]}${patientProfile.last_name[0]}`.toUpperCase()
    : '??';

  // Compter les tâches à faire (simplifié pour l'instant)
  let todoCount = 0;

  if (patientProfile) {
    try {
      const { data: futureAppointments } = await supabase
        .from('appointments')
        .select('id, appointment_date, type')
        .eq('patient_id', patientProfile.id)
        .gte('appointment_date', new Date().toISOString());

      if (futureAppointments && futureAppointments.length > 0) {
        for (const appointment of futureAppointments) {
          if (appointment.type === 'first_consultation') {
            const { data: questionnaires } = await supabase
              .from('questionnaires')
              .select('type')
              .eq('appointment_id', appointment.id);

            const submittedTypes = questionnaires?.map((q: any) => q.type) || [];
            if (!submittedTypes.includes('PRE_CONSULTATION')) {
              todoCount += 1;
              break;
            }
          }
        }
      }
    } catch (error) {
      console.error('Erreur comptage tâches:', error);
    }
  }

  // Fonction de déconnexion
  const signOut = async () => {
    'use server';
    const supabase = createClient();
    await supabase.auth.signOut();
    redirect('/auth/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header mobile-first */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo et titre */}
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-xl font-semibold text-gray-900">Somnolink</h1>
              </div>
            </div>

            {/* Actions header */}
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                <Bell className="w-5 h-5" />
              </button>

              {/* Menu burger mobile */}
              <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors md:hidden">
                <Menu className="w-5 h-5" />
              </button>

              {/* Avatar desktop */}
              <div className="hidden md:flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                  {initials}
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {patientProfile?.first_name}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar desktop */}
        <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 md:pt-16">
          <div className="flex-1 flex flex-col min-h-0 bg-white border-r border-gray-200">
            <nav className="flex-1 px-4 py-6 space-y-2">
              <Link
                href="/dashboard/patient"
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-100 hover:text-gray-900 transition-colors"
              >
                <Home className="w-5 h-5 mr-3" />
                Accueil
              </Link>

              <Link
                href="/dashboard/patient/todo"
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-100 hover:text-gray-900 transition-colors relative"
              >
                <FileText className="w-5 h-5 mr-3" />
                À faire
                {todoCount > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs font-medium rounded-full h-5 min-w-5 px-1.5 flex items-center justify-center">
                    {todoCount > 9 ? '9+' : todoCount}
                  </span>
                )}
              </Link>

              <Link
                href="/dashboard/patient/history"
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-100 hover:text-gray-900 transition-colors"
              >
                <History className="w-5 h-5 mr-3" />
                Historique
              </Link>

              <Link
                href="/dashboard/patient/documents"
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-100 hover:text-gray-900 transition-colors"
              >
                <FileText className="w-5 h-5 mr-3" />
                Documents
              </Link>

              <Link
                href="/dashboard/patient/messagerie"
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-100 hover:text-gray-900 transition-colors"
              >
                <MessageSquare className="w-5 h-5 mr-3" />
                Messagerie
              </Link>

              <Link
                href="/dashboard/patient/profil"
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-100 hover:text-gray-900 transition-colors"
              >
                <User className="w-5 h-5 mr-3" />
                Profil
              </Link>
            </nav>

            {/* Déconnexion */}
            <div className="p-4 border-t border-gray-200">
              <form action={signOut}>
                <button
                  type="submit"
                  className="w-full flex items-center px-3 py-2 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 hover:text-red-700 transition-colors"
                >
                  Déconnexion
                </button>
              </form>
            </div>
          </div>
        </aside>

        {/* Contenu principal */}
        <main className="flex-1 md:ml-64">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}