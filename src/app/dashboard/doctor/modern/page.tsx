// src/app/dashboard/doctor/modern/page.tsx

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import {
  Users, Calendar, FileText, AlertTriangle, Clock, Activity,
  TrendingUp, Heart, Stethoscope, Pill, MessageSquare, Settings,
  Plus, ArrowRight, BarChart3, Zap
} from 'lucide-react';
import Link from 'next/link';

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
}

export default async function ModernDoctorDashboardPage() {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.user_metadata.role !== 'DOCTOR') redirect('/auth/login');

  const { data: doctor, error: doctorError } = await supabase
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
      {/* Header Gmail-style */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-normal text-gray-900">
                Tableau de bord
              </h1>
              <p className="text-gray-600 mt-1 text-sm">
                Bienvenue, Dr. {doctor.first_name} {doctor.last_name}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-medium text-sm">
                  {doctor.first_name[0]}{doctor.last_name[0]}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* KPIs Gmail-style */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Patients totaux</p>
                <p className="text-3xl font-medium text-gray-900 mt-2">{totalPatients?.length || 0}</p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                  <span className="text-green-600 text-sm font-medium">+12%</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">RDV aujourd'hui</p>
                <p className="text-3xl font-medium text-gray-900 mt-2">{appointmentsToday?.length || 0}</p>
                <div className="flex items-center mt-2">
                  <Clock className="w-4 h-4 text-blue-600 mr-1" />
                  <span className="text-blue-600 text-sm font-medium">À venir</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Questionnaires</p>
                <p className="text-3xl font-medium text-gray-900 mt-2">{recentQuestionnaires?.length || 0}</p>
                <div className="flex items-center mt-2">
                  <Activity className="w-4 h-4 text-orange-600 mr-1" />
                  <span className="text-orange-600 text-sm font-medium">Récents</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">À relancer</p>
                <p className="text-3xl font-medium text-gray-900 mt-2">{patientsToFollowUp.length}</p>
                <div className="flex items-center mt-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 mr-1" />
                  <span className="text-red-600 text-sm font-medium">Urgent</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Grille principale Gmail-style */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Section gauche - Rendez-vous */}
          <div className="lg:col-span-2 space-y-6">
            {/* Rendez-vous du jour */}
            <div className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-blue-600" />
                  </div>
                  <h2 className="text-lg font-medium text-gray-900">Consultations du Jour</h2>
                </div>
                <Link href="/dashboard/doctor/agenda" className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center">
                  Voir tout <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </div>

              {appointmentsToday && appointmentsToday.length > 0 ? (
                <div className="space-y-3">
                  {appointmentsToday.map((appt) => {
                    const appointmentTime = new Date(appt.appointment_date).toLocaleTimeString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    });

                    return appt.patients && appt.patients.length > 0 ? (
                      <Link
                        key={appt.id}
                        href={`/dashboard/doctor/patients/${appt.patients[0].id}`}
                        className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-gray-50 transition-all duration-200 hover:shadow-sm"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <span className="text-blue-600 font-medium text-sm">
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
                        <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                      </Link>
                    ) : null;
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">Aucun rendez-vous aujourd'hui</p>
                  <p className="text-gray-400 text-sm mt-1">Profitez de votre journée !</p>
                </div>
              )}
            </div>

            {/* Prochains rendez-vous */}
            <div className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-green-600" />
                  </div>
                  <h2 className="text-lg font-medium text-gray-900">Prochains Rendez-vous</h2>
                </div>
                <Link href="/dashboard/doctor/appointments" className="text-green-600 hover:text-green-700 text-sm font-medium flex items-center">
                  Voir tout <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </div>

              {upcomingAppointments && upcomingAppointments.length > 0 ? (
                <div className="space-y-3">
                  {upcomingAppointments.map((appt) => {
                    const appointmentDate = new Date(appt.appointment_date);
                    const dateStr = appointmentDate.toLocaleDateString('fr-FR', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short'
                    });
                    const timeStr = appointmentDate.toLocaleTimeString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    });

                    return appt.patients && appt.patients.length > 0 ? (
                      <Link
                        key={appt.id}
                        href={`/dashboard/doctor/patients/${appt.patients[0].id}`}
                        className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-green-300 hover:bg-gray-50 transition-all duration-200 hover:shadow-sm"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <span className="text-green-600 font-medium text-sm">
                              {appt.patients[0].first_name[0]}{appt.patients[0].last_name[0]}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 hover:text-green-700 transition-colors">
                              {appt.patients[0].first_name} {appt.patients[0].last_name}
                            </p>
                            <p className="text-gray-600 text-sm">
                              {dateStr} à {timeStr}
                            </p>
                          </div>
                        </div>
                        <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-green-500 transition-colors" />
                      </Link>
                    ) : null;
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">Aucun prochain rendez-vous</p>
                  <p className="text-gray-400 text-sm mt-1">Planifiez vos consultations</p>
                </div>
              )}
            </div>
          </div>

          {/* Section droite - Actions et statistiques */}
          <div className="space-y-6">
            {/* Actions rapides */}
            <div className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-purple-600" />
                </div>
                <h2 className="text-lg font-medium text-gray-900">Actions Rapides</h2>
              </div>

              <div className="space-y-3">
                <Link
                  href="/dashboard/doctor/patients"
                  className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-gray-50 transition-all duration-200 hover:shadow-sm"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Users className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 hover:text-blue-700">Voir patients</p>
                      <p className="text-gray-600 text-sm">Gérer vos patients</p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                </Link>

                <Link
                  href="/dashboard/doctor/patients?new=true"
                  className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-green-300 hover:bg-gray-50 transition-all duration-200 hover:shadow-sm"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <Plus className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 hover:text-green-700">Nouveau patient</p>
                      <p className="text-gray-600 text-sm">Ajouter un patient</p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-green-500 transition-colors" />
                </Link>

                <Link
                  href="/dashboard/doctor/messagerie"
                  className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-orange-300 hover:bg-gray-50 transition-all duration-200 hover:shadow-sm"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <MessageSquare className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 hover:text-orange-700">Messagerie</p>
                      <p className="text-gray-600 text-sm">Contacter patients</p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-orange-500 transition-colors" />
                </Link>
              </div>
            </div>

            {/* Statistiques rapides */}
            <div className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-indigo-600" />
                </div>
                <h2 className="text-lg font-medium text-gray-900">Statistiques</h2>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 text-sm">Taux de réponse</span>
                  <span className="font-medium text-gray-900">94%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 text-sm">Satisfaction</span>
                  <span className="font-medium text-gray-900">4.8/5</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 text-sm">RDV ce mois</span>
                  <span className="font-medium text-gray-900">127</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}