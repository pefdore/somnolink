// src/app/dashboard/doctor/page.tsx

import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { User, Clock, FileText, AlertTriangle, Calendar, Users, Activity } from 'lucide-react';

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
}

export default async function DoctorDashboardPage() {
  console.log('Debug: Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log('Debug: Supabase Anon Key exists:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  console.log('Debug: User object:', user);
  console.log('Debug: User ID:', user?.id);
  console.log('Debug: User role:', user?.user_metadata?.role);

  if (!user || user.user_metadata.role !== 'DOCTOR') redirect('/auth/login');

  console.log('Debug: Attempting to fetch doctor with user_id:', user.id);
  const { data: doctor, error: doctorError } = await supabase
    .from('doctors')
    .select('id, first_name, last_name')
    .eq('user_id', user.id)
    .single();

  console.log('Debug: Doctor fetch result:', { doctor, error: doctorError });
  
  if (!doctor) return <div>Profil médecin introuvable.</div>;
  
  // --- REQUÊTES POUR LE DASHBOARD ---

  // 1. Patients totaux
  const { data: totalPatients } = await supabase
    .from('patients')
    .select('id', { count: 'exact' })
    .eq('doctor_id', doctor.id);

  // 2. Rendez-vous aujourd&apos;hui
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
    <div className="space-y-8">
      {/* En-tête */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-3xl font-bold text-gray-900">Tableau de bord</h1>
        <p className="mt-2 text-lg text-gray-600">
          Bienvenue, Dr. {doctor.first_name} {doctor.last_name} !
        </p>
      </div>

      {/* Cartes de statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Patients totaux */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Patients totaux</p>
              <p className="text-2xl font-bold text-gray-900">{totalPatients?.length || 0}</p>
            </div>
          </div>
        </div>

        {/* Rendez-vous aujourd&apos;hui */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Calendar className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">RDV aujourd&apos;hui</p>
              <p className="text-2xl font-bold text-gray-900">{appointmentsToday?.length || 0}</p>
            </div>
          </div>
        </div>

        {/* Questionnaires en attente */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <FileText className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Questionnaires récents</p>
              <p className="text-2xl font-bold text-gray-900">{recentQuestionnaires?.length || 0}</p>
            </div>
          </div>
        </div>

        {/* Patients à relancer */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">À relancer</p>
              <p className="text-2xl font-bold text-gray-900">{patientsToFollowUp.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Grille principale */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rendez-vous du jour */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center mb-4">
            <Clock className="mr-2 h-5 w-5 text-blue-600" />
            Consultations du Jour
          </h2>
          
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
                    className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-blue-50 transition-colors"
                  >
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">
                          {appt.patients[0].first_name} {appt.patients[0].last_name}
                        </p>
                        <p className="text-xs text-gray-500">{appointmentTime}</p>
                      </div>
                    </div>
                    <div className="text-xs text-gray-400">
                      Voir le dossier
                    </div>
                  </Link>
                ) : null;
              })}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">Aucun rendez-vous aujourd&apos;hui</p>
          )}
        </div>

        {/* Prochains rendez-vous */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center mb-4">
            <Calendar className="mr-2 h-5 w-5 text-green-600" />
            Prochains Rendez-vous
          </h2>
          
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
                    className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-green-50 transition-colors"
                  >
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">
                          {appt.patients[0].first_name} {appt.patients[0].last_name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {dateStr} à {timeStr}
                        </p>
                      </div>
                    </div>
                    <div className="text-xs text-gray-400">
                      Voir
                    </div>
                  </Link>
                ) : null;
              })}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">Aucun prochain rendez-vous</p>
          )}
        </div>

        {/* Derniers questionnaires */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center mb-4">
            <FileText className="mr-2 h-5 w-5 text-orange-600" />
            Derniers Questionnaires
          </h2>
          
          {recentQuestionnaires && recentQuestionnaires.length > 0 ? (
            <div className="space-y-3">
              {recentQuestionnaires.map((q) => (
                q.patients && q.patients.length > 0 && (
                  <Link
                    key={q.patients[0].id + q.type + q.submitted_at}
                    href={`/dashboard/doctor/patients/${q.patients[0].id}?tab=questionnaires`}
                    className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-orange-50 transition-colors"
                  >
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                      <Activity className="h-4 w-4 text-orange-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">
                        {q.patients[0].first_name} {q.patients[0].last_name}
                      </p>
                      <p className="text-xs text-gray-500 capitalize">
                        {q.type} • {new Date(q.submitted_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400">
                    Consulter
                  </div>
                  </Link>
                )
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">Aucun questionnaire récent</p>
          )}
        </div>

        {/* Tâches importantes */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center mb-4">
            <AlertTriangle className="mr-2 h-5 w-5 text-red-600" />
            Tâches Importantes
          </h2>
          
          {patientsToFollowUp.length > 0 ? (
            <div className="space-y-3">
              {patientsToFollowUp.map((patient) => (
                <div
                  key={patient.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-red-100 bg-red-50"
                >
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-red-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">
                        {patient.first_name} {patient.last_name}
                      </p>
                      <p className="text-xs text-red-600">Nécessite une relance</p>
                    </div>
                  </div>
                  <Link
                    href={`/dashboard/doctor/patients/${patient.id}`}
                    className="text-xs text-red-600 hover:text-red-700"
                  >
                    Relancer
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">Aucune tâche urgente</p>
          )}
        </div>
      </div>

      {/* Actions rapides */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions Rapides</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/dashboard/doctor/patients"
            className="p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors text-center"
          >
            <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-900">Voir tous les patients</p>
            <p className="text-xs text-gray-500">Gérer vos patients</p>
          </Link>
          
          <Link
            href="/dashboard/doctor/patients?new=true"
            className="p-4 rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-colors text-center"
          >
            <User className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-900">Nouveau patient</p>
            <p className="text-xs text-gray-500">Ajouter un patient</p>
          </Link>
          
          <Link
            href="/dashboard/doctor/patients?tab=questionnaires"
            className="p-4 rounded-lg border border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-colors text-center"
          >
            <FileText className="h-8 w-8 text-orange-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-900">Questionnaires</p>
            <p className="text-xs text-gray-500">Voir tous les questionnaires</p>
          </Link>
        </div>
      </div>
    </div>
  );
}