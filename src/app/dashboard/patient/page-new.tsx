// src/app/dashboard/patient/page-new.tsx

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Calendar, Stethoscope, FileText, MessageSquare, Heart, Clock, CheckCircle } from 'lucide-react';

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

export default function PatientDashboardNew() {
  const [user, setUser] = useState<any>(null);
  const [patientData, setPatientData] = useState<any>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const supabase = createClient();

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setUser(user);

      const { data: patientData } = await supabase
        .from('patients')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!patientData) return;
      setPatientData(patientData);

      // Récupérer les médecins associés
      const { data: relationships } = await supabase
        .from('patient_doctor_relationships')
        .select(`
          id,
          status,
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

      const doctorsList: Doctor[] = relationships?.map(rel => ({
        id: (rel.doctors as any)?.id || '',
        first_name: (rel.doctors as any)?.first_name || '',
        last_name: (rel.doctors as any)?.last_name || '',
        specialty: 'Médecin du sommeil',
        association_date: rel.accepted_at || rel.invited_at || '',
        status: rel.status
      })).filter(doctor => doctor.id) || [];

      setDoctors(doctorsList);

      // Récupérer les rendez-vous
      const { data: simpleAppointments } = await supabase
        .from('appointments')
        .select('id, appointment_datetime, type, notes, patient_id, doctor_id')
        .eq('patient_id', patientData.id)
        .gte('appointment_datetime', new Date().toISOString())
        .order('appointment_datetime', { ascending: true })
        .limit(3); // Limiter aux 3 prochains

      if (simpleAppointments && simpleAppointments.length > 0) {
        const doctorIds = Array.from(new Set(simpleAppointments.map(apt => apt.doctor_id)));
        const { data: doctorsData } = await supabase
          .from('doctors')
          .select('id, first_name, last_name')
          .in('id', doctorIds);

        const doctorsMap = new Map();
        if (doctorsData) {
          doctorsData.forEach(doctor => {
            doctorsMap.set(doctor.id, doctor);
          });
        }

        const finalAppointments = simpleAppointments.map(apt => {
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

        setAppointments(finalAppointments);
      }

    } catch (error) {
      console.error('Erreur chargement dashboard:', error);
    } finally {
      setLoading(false);
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
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Bonjour {user?.user_metadata?.first_name || 'Patient'}
            </h1>
            <p className="text-gray-600">
              Bienvenue dans votre espace de suivi médical Somnolink
            </p>
          </div>
          <div className="hidden md:block">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
              {user?.user_metadata?.first_name?.[0] || 'P'}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link
          href="/dashboard/patient/todo"
          className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow group"
        >
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-blue-200 transition-colors">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-sm font-medium text-gray-900">À faire</span>
          </div>
        </Link>

        <Link
          href="/dashboard/patient/history"
          className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow group"
        >
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-green-200 transition-colors">
              <Calendar className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-sm font-medium text-gray-900">Historique</span>
          </div>
        </Link>

        <Link
          href="/dashboard/patient/documents"
          className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow group"
        >
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-purple-200 transition-colors">
              <FileText className="w-6 h-6 text-purple-600" />
            </div>
            <span className="text-sm font-medium text-gray-900">Documents</span>
          </div>
        </Link>

        <Link
          href="/dashboard/patient/messagerie"
          className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow group"
        >
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-orange-200 transition-colors">
              <MessageSquare className="w-6 h-6 text-orange-600" />
            </div>
            <span className="text-sm font-medium text-gray-900">Messages</span>
          </div>
        </Link>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Prochains rendez-vous */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-blue-600" />
                Prochains rendez-vous
              </CardTitle>
            </CardHeader>
            <CardContent>
              {appointments.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Aucun rendez-vous programmé
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Vous n'avez pas encore de rendez-vous programmé.
                  </p>
                  {doctors.length > 0 && (
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      Programmer un rendez-vous
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {appointments.map((appointment) => (
                    <div key={appointment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {consultationTypeLabels[appointment.type as keyof typeof consultationTypeLabels] || appointment.type}
                          </h4>
                          <p className="text-sm text-gray-600">
                            Dr. {appointment.doctor.first_name} {appointment.doctor.last_name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(appointment.appointment_datetime).toLocaleDateString('fr-FR', {
                              weekday: 'long',
                              day: 'numeric',
                              month: 'long',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Confirmé
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Médecins */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Stethoscope className="w-5 h-5 mr-2 text-green-600" />
                Mes médecins
              </CardTitle>
            </CardHeader>
            <CardContent>
              {doctors.length === 0 ? (
                <div className="text-center py-8">
                  <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">
                    Aucun médecin associé
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {doctors.map((doctor) => (
                    <div key={doctor.id} className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <span className="text-green-600 font-medium text-sm">
                          {doctor.first_name[0]}{doctor.last_name[0]}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">
                          Dr. {doctor.first_name} {doctor.last_name}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {doctor.specialty}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Informations utiles */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations utiles</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Heart className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Suivi personnalisé</h4>
              <p className="text-sm text-gray-600 mt-1">
                Votre suivi médical est adapté à vos besoins spécifiques.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Clock className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Rendez-vous faciles</h4>
              <p className="text-sm text-gray-600 mt-1">
                Programmez vos consultations en quelques clics.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}