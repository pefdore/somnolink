// src/app/dashboard/doctormodern/page.tsx

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import {
  Users,
  Calendar,
  FileText,
  AlertTriangle,
  Clock,
  Activity,
  TrendingUp,
  Heart,
  Stethoscope,
  Pill,
  MessageSquare,
  Settings,
  Plus,
  Search,
  Moon,
  Sun,
  Brain,
  Zap,
  BarChart3,
  User,
  Bell,
  Menu,
  Home,
  FolderOpen,
  ClipboardList,
  Microscope,
  Target,
  ChevronRight,
  MoreVertical,
  Star,
  Filter
} from 'lucide-react';
import Link from 'next/link';

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
}

export default async function DoctorModernDashboardPage() {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.user_metadata.role !== 'DOCTOR') redirect('/auth/login');

  const { data: doctor } = await supabase
    .from('doctors')
    .select('id, first_name, last_name')
    .eq('user_id', user.id)
    .single();

  if (!doctor) return <div>Profil médecin introuvable.</div>;

  // --- REQUÊTES POUR LE DASHBOARD ---

  // 1. Patients totaux
  const { data: totalPatients } = await supabase
    .from('patients')
    .select('id', { count: 'exact' })
    .eq('doctor_id', doctor.id);

  // 2. Rendez-vous aujourd'hui
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const { data: appointmentsToday } = await supabase
    .from('appointments')
    .select(`
      id,
      appointment_date,
      patients(id, first_name, last_name)
    `)
    .eq('doctor_id', doctor.id)
    .gte('appointment_date', todayStart.toISOString())
    .lte('appointment_date', todayEnd.toISOString())
    .order('appointment_date', { ascending: true });

  // 3. Prochains rendez-vous (7 jours)
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);

  const { data: upcomingAppointments } = await supabase
    .from('appointments')
    .select(`
      id,
      appointment_date,
      patients(id, first_name, last_name)
    `)
    .eq('doctor_id', doctor.id)
    .gte('appointment_date', todayEnd.toISOString())
    .lte('appointment_date', nextWeek.toISOString())
    .order('appointment_date', { ascending: true })
    .limit(5);

  // 4. Derniers questionnaires soumis
  const { data: recentQuestionnaires } = await supabase
    .from('questionnaires')
    .select(`
      submitted_at,
      type,
      patients(id, first_name, last_name)
    `)
    .in('patient_id',
      (await supabase
        .from('appointments')
        .select('patient_id')
        .eq('doctor_id', doctor.id)
      ).data?.map(a => a.patient_id) || []
    )
    .order('submitted_at', { ascending: false })
    .limit(5);

  // 5. Patients nécessitant une relance (placeholder)
  const patientsToFollowUp: Patient[] = [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Material 3 - Google Workspace style */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="flex items-center justify-between px-6 py-3">
          {/* Logo et titre */}
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <Moon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-medium text-gray-900">Somnolink Workspace</h1>
              <p className="text-sm text-gray-600">Médecine du sommeil</p>
            </div>
          </div>

          {/* Barre de recherche Material 3 */}
          <div className="flex-1 max-w-md mx-8">
            <div className="relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher patients, dossiers..."
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all duration-200"
              />
            </div>
          </div>

          {/* Actions header */}
          <div className="flex items-center space-x-2">
            <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
              <Bell className="w-5 h-5 text-gray-600" />
            </button>
            <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
              <Settings className="w-5 h-5 text-gray-600" />
            </button>
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center ml-2">
              <span className="text-white font-medium text-sm">
                {doctor.first_name[0]}{doctor.last_name[0]}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar Material 3 - Navigation principale */}
        <nav className="w-64 bg-white border-r border-gray-200 min-h-screen">
          <div className="p-4">
            {/* Navigation principale */}
            <div className="space-y-1">
              <Link href="/dashboard/doctormodern" className="flex items-center space-x-3 px-3 py-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors">
                <Home className="w-5 h-5" />
                <span className="font-medium">Accueil</span>
              </Link>

              <Link href="/dashboard/doctormodern/patients" className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors">
                <Users className="w-5 h-5" />
                <span className="font-medium">Patients</span>
              </Link>

              <Link href="/dashboard/doctormodern/agenda" className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors">
                <Calendar className="w-5 h-5" />
                <span className="font-medium">Agenda</span>
              </Link>

              <Link href="/dashboard/doctormodern/etudes" className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors">
                <Microscope className="w-5 h-5" />
                <span className="font-medium">Études du sommeil</span>
              </Link>

              <Link href="/dashboard/doctormodern/rapports" className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors">
                <BarChart3 className="w-5 h-5" />
                <span className="font-medium">Rapports</span>
              </Link>
            </div>

            {/* Section Outils médicaux */}
            <div className="mt-8">
              <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Outils médicaux
              </h3>
              <div className="space-y-1">
                <Link href="/dashboard/doctormodern/diagnostics" className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors">
                  <Target className="w-5 h-5" />
                  <span className="font-medium">Diagnostics</span>
                </Link>

                <Link href="/dashboard/doctormodern/traitements" className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors">
                  <Pill className="w-5 h-5" />
                  <span className="font-medium">Traitements</span>
                </Link>

                <Link href="/dashboard/doctormodern/messagerie" className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors">
                  <MessageSquare className="w-5 h-5" />
                  <span className="font-medium">Messagerie</span>
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Contenu principal */}
        <main className="flex-1 p-6">
          {/* Welcome Section Material 3 */}
          <div className="mb-8">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-medium mb-2">
                    Bonjour, Dr. {doctor.first_name} {doctor.last_name}
                  </h2>
                  <p className="text-blue-100 mb-4">
                    Voici un aperçu de votre activité médicale du jour
                  </p>
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="flex items-center space-x-1">
                      <Sun className="w-4 h-4" />
                      <span>{new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                  </div>
                </div>
                <div className="hidden md:block">
                  <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center">
                    <Brain className="w-10 h-10 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* KPIs Material 3 Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-all duration-200 hover:border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium mb-1">Patients actifs</p>
                  <p className="text-3xl font-semibold text-gray-900">{totalPatients?.length || 0}</p>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                    <span className="text-green-600 text-sm font-medium">+12%</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-all duration-200 hover:border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium mb-1">Consultations aujourd'hui</p>
                  <p className="text-3xl font-semibold text-gray-900">{appointmentsToday?.length || 0}</p>
                  <div className="flex items-center mt-2">
                    <Clock className="w-4 h-4 text-blue-600 mr-1" />
                    <span className="text-blue-600 text-sm font-medium">À venir</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-all duration-200 hover:border-orange-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium mb-1">Études en cours</p>
                  <p className="text-3xl font-semibold text-gray-900">{recentQuestionnaires?.length || 0}</p>
                  <div className="flex items-center mt-2">
                    <Activity className="w-4 h-4 text-orange-600 mr-1" />
                    <span className="text-orange-600 text-sm font-medium">Actives</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center">
                  <Microscope className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-all duration-200 hover:border-red-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium mb-1">Suivis urgents</p>
                  <p className="text-3xl font-semibold text-gray-900">{patientsToFollowUp.length}</p>
                  <div className="flex items-center mt-2">
                    <AlertTriangle className="w-4 h-4 text-red-600 mr-1" />
                    <span className="text-red-600 text-sm font-medium">Priorité</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Grille principale Material 3 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Section gauche - Activités récentes */}
            <div className="lg:col-span-2 space-y-6">
              {/* Rendez-vous du jour */}
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                      <Clock className="w-5 h-5 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">Consultations du jour</h3>
                  </div>
                  <Link href="/dashboard/doctormodern/agenda" className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center">
                    Voir tout <ChevronRight className="w-4 h-4 ml-1" />
                  </Link>
                </div>

                {appointmentsToday && appointmentsToday.length > 0 ? (
                  <div className="space-y-4">
                    {appointmentsToday.map((appt) => {
                      const appointmentTime = new Date(appt.appointment_date).toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      });

                      return appt.patients && appt.patients.length > 0 ? (
                        <Link
                          key={appt.id}
                          href={`/dashboard/doctormodern/patients/${appt.patients[0].id}`}
                          className="flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all duration-200 hover:shadow-sm"
                        >
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                              <span className="text-white font-semibold">
                                {appt.patients[0].first_name[0]}{appt.patients[0].last_name[0]}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 hover:text-blue-700 transition-colors">
                                {appt.patients[0].first_name} {appt.patients[0].last_name}
                              </p>
                              <p className="text-gray-600 text-sm">{appointmentTime}</p>
                            </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                        </Link>
                      ) : null;
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 font-medium">Aucune consultation aujourd'hui</p>
                    <p className="text-gray-400 text-sm mt-1">Profitez de votre journée !</p>
                  </div>
                )}
              </div>

              {/* Études récentes */}
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                      <Microscope className="w-5 h-5 text-purple-600" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">Études du sommeil récentes</h3>
                  </div>
                  <Link href="/dashboard/doctormodern/etudes" className="text-purple-600 hover:text-purple-700 text-sm font-medium flex items-center">
                    Voir tout <ChevronRight className="w-4 h-4 ml-1" />
                  </Link>
                </div>

                {recentQuestionnaires && recentQuestionnaires.length > 0 ? (
                  <div className="space-y-4">
                    {recentQuestionnaires.map((q) => (
                      q.patients && q.patients.length > 0 ? (
                        <Link
                          key={q.patients[0].id + q.type + q.submitted_at}
                          href={`/dashboard/doctormodern/patients/${q.patients[0].id}?tab=etudes`}
                          className="flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-purple-300 hover:bg-purple-50/50 transition-all duration-200 hover:shadow-sm"
                        >
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                              <span className="text-white font-semibold">
                                {q.patients[0].first_name[0]}{q.patients[0].last_name[0]}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 hover:text-purple-700 transition-colors">
                                {q.patients[0].first_name} {q.patients[0].last_name}
                              </p>
                              <p className="text-gray-600 text-sm capitalize">
                                {q.type} • {new Date(q.submitted_at).toLocaleDateString('fr-FR')}
                              </p>
                            </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-purple-500 transition-colors" />
                        </Link>
                      ) : null
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Microscope className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 font-medium">Aucune étude récente</p>
                    <p className="text-gray-400 text-sm mt-1">Les études apparaîtront ici</p>
                  </div>
                )}
              </div>
            </div>

            {/* Section droite - Actions et outils */}
            <div className="space-y-6">
              {/* Actions rapides */}
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                    <Zap className="w-5 h-5 text-indigo-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">Actions rapides</h3>
                </div>

                <div className="space-y-3">
                  <Link
                    href="/dashboard/doctormodern/patients/new"
                    className="flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all duration-200 hover:shadow-sm"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                        <Plus className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 hover:text-blue-700">Nouveau patient</p>
                        <p className="text-gray-600 text-sm">Ajouter un patient</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                  </Link>

                  <Link
                    href="/dashboard/doctormodern/etudes/new"
                    className="flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-green-300 hover:bg-green-50/50 transition-all duration-200 hover:shadow-sm"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                        <Microscope className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 hover:text-green-700">Nouvelle étude</p>
                        <p className="text-gray-600 text-sm">Créer une étude</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-green-500 transition-colors" />
                  </Link>

                  <Link
                    href="/dashboard/doctormodern/rapports"
                    className="flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-orange-300 hover:bg-orange-50/50 transition-all duration-200 hover:shadow-sm"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
                        <BarChart3 className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 hover:text-orange-700">Rapports</p>
                        <p className="text-gray-600 text-sm">Voir les analyses</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-orange-500 transition-colors" />
                  </Link>
                </div>
              </div>

              {/* Outils médicaux */}
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center">
                    <Stethoscope className="w-5 h-5 text-teal-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">Outils médicaux</h3>
                </div>

                <div className="space-y-3">
                  <button className="w-full flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-teal-300 hover:bg-teal-50/50 transition-all duration-200 hover:shadow-sm">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-teal-50 rounded-lg flex items-center justify-center">
                        <Target className="w-5 h-5 text-teal-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Calculateur AHI</p>
                        <p className="text-gray-600 text-sm">Indice d'apnée</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </button>

                  <button className="w-full flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-teal-300 hover:bg-teal-50/50 transition-all duration-200 hover:shadow-sm">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-teal-50 rounded-lg flex items-center justify-center">
                        <Brain className="w-5 h-5 text-teal-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Analyseur PSG</p>
                        <p className="text-gray-600 text-sm">Polysomnographie</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}