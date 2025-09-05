'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, User, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface Appointment {
  id: string;
  appointment_datetime: string;
  type: string;
  notes: string;
  status: string;
  patient: {
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

const statusColors = {
  'scheduled': 'bg-blue-100 text-blue-800',
  'confirmed': 'bg-green-100 text-green-800',
  'cancelled': 'bg-red-100 text-red-800',
  'completed': 'bg-gray-100 text-gray-800'
};

const statusIcons = {
  'scheduled': <AlertCircle className="h-4 w-4" />,
  'confirmed': <CheckCircle className="h-4 w-4" />,
  'cancelled': <XCircle className="h-4 w-4" />,
  'completed': <CheckCircle className="h-4 w-4" />
};

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          // D'abord récupérer l'ID du médecin dans la table doctors
          const { data: doctorData, error: doctorError } = await supabase
            .from('doctors')
            .select('id')
            .eq('user_id', user.id)
            .single();

          if (doctorError) {
            console.error('Erreur lors de la récupération du profil médecin:', doctorError);
            setAppointments([]);
            setLoading(false);
            return;
          }

          if (!doctorData) {
            console.error('Profil médecin non trouvé');
            setAppointments([]);
            setLoading(false);
            return;
          }

          // Ensuite récupérer les rendez-vous en utilisant l'ID du médecin
          const { data: appointmentsData, error: appointmentsError } = await supabase
            .from('appointments')
            .select('id, appointment_datetime, type, notes, status, patient_id')
            .eq('doctor_id', doctorData.id)
            .order('appointment_datetime', { ascending: true });

          if (appointmentsError) {
            console.error('Erreur lors de la récupération des rendez-vous:', appointmentsError);
            setAppointments([]);
            setLoading(false);
            return;
          }

          if (!appointmentsData || appointmentsData.length === 0) {
            setAppointments([]);
            setLoading(false);
            return;
          }

          // Ensuite récupérer les informations des patients
          const patientIds = appointmentsData.map(apt => apt.patient_id);
          console.log('🔍 [DEBUG] IDs des patients à récupérer:', patientIds);

          const { data: patientsData, error: patientsError } = await supabase
            .from('patients')
            .select('id, first_name, last_name')
            .in('id', patientIds);

          console.log('🔍 [DEBUG] Données patients récupérées:', patientsData);
          console.log('🔍 [DEBUG] Erreur patients:', patientsError);

          if (patientsError) {
            console.error('Erreur lors de la récupération des patients:', patientsError);
            setAppointments([]);
            setLoading(false);
            return;
          }

          // Combiner les données
          const combinedData = appointmentsData.map(appointment => {
            const patient = patientsData?.find(p => p.id === appointment.patient_id);
            console.log('🔍 [DEBUG] Appointment:', appointment.id, 'Patient ID:', appointment.patient_id, 'Patient trouvé:', patient);
            return {
              ...appointment,
              patient: patient || { first_name: 'Patient', last_name: 'Inconnu' }
            };
          });

          console.log('🔍 [DEBUG] Données combinées:', combinedData);

          setAppointments(combinedData);
        } else {
          setAppointments([]);
        }
      } catch (error) {
        console.error('Erreur inattendue lors du chargement des rendez-vous:', error);
        setAppointments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, []);

  const updateAppointmentStatus = async (appointmentId: string, newStatus: string) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return;

    // D'abord récupérer l'ID du médecin
    const { data: doctorData } = await supabase
      .from('doctors')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!doctorData) return;

    const { error } = await supabase
      .from('appointments')
      .update({ status: newStatus })
      .eq('id', appointmentId)
      .eq('doctor_id', doctorData.id); // Sécurité: s'assurer que le RDV appartient au médecin

    if (!error) {
      setAppointments(appointments.map(apt =>
        apt.id === appointmentId ? { ...apt, status: newStatus } : apt
      ));
    }
  };

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime);
    return {
      date: date.toLocaleDateString('fr-FR'),
      time: date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    };
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Chargement des rendez-vous...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <Link href="/dashboard/doctor">
          <Button variant="outline" className="mb-4">
            ← Retour au dashboard
          </Button>
        </Link>

        <h1 className="text-3xl font-bold mb-2">Rendez-vous programmés</h1>
        <p className="text-gray-600">
          Liste des rendez-vous programmés par vos patients via Somnolink
        </p>
      </div>

      {appointments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucun rendez-vous programmé
            </h3>
            <p className="text-gray-600 text-center">
              Les patients peuvent programmer leurs rendez-vous directement via Somnolink.
              Ils apparaîtront automatiquement ici.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {appointments.map((appointment) => {
            const { date, time } = formatDateTime(appointment.appointment_datetime);
            return (
              <Card key={appointment.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <User className="h-5 w-5 text-blue-600" />
                        <span className="font-medium">
                          {appointment.patient.first_name} {appointment.patient.last_name}
                        </span>
                      </div>
                      <Badge className={statusColors[appointment.status as keyof typeof statusColors]}>
                        <span className="flex items-center gap-1">
                          {statusIcons[appointment.status as keyof typeof statusIcons]}
                          {appointment.status === 'scheduled' ? 'Programmé' :
                           appointment.status === 'confirmed' ? 'Confirmé' :
                           appointment.status === 'cancelled' ? 'Annulé' : 'Terminé'}
                        </span>
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {date}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {time}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <span className="font-medium text-gray-700">Motif : </span>
                      <span className="text-gray-900">
                        {consultationTypeLabels[appointment.type as keyof typeof consultationTypeLabels] || appointment.type}
                      </span>
                    </div>

                    {appointment.notes && (
                      <div>
                        <span className="font-medium text-gray-700">Notes du patient : </span>
                        <span className="text-gray-900">{appointment.notes}</span>
                      </div>
                    )}

                    {appointment.status === 'scheduled' && (
                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          onClick={() => updateAppointmentStatus(appointment.id, 'confirmed')}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Confirmer
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateAppointmentStatus(appointment.id, 'cancelled')}
                          className="border-red-300 text-red-600 hover:bg-red-50"
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Annuler
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}