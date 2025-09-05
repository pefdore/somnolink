'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, User, CheckCircle, XCircle, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface Appointment {
  id: string;
  appointment_datetime: string;
  type: string;
  notes: string;
  status: string;
  patient: {
    id?: string;
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

export default function AgendaPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date()); // Par défaut le jour actuel
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Récupérer l'ID du médecin
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

        // Récupérer tous les rendez-vous du médecin
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

        // Récupérer les informations des patients de manière sécurisée
        const patientIds = appointmentsData.map(apt => apt.patient_id).filter(id => id);

        if (patientIds.length === 0) {
          setAppointments([]);
          setLoading(false);
          return;
        }

        const { data: patientsData, error: patientsError } = await supabase
          .from('patients')
          .select('id, first_name, last_name')
          .in('id', patientIds);

        if (patientsError) {
          console.error('Erreur lors de la récupération des patients:', patientsError);
          // En cas d'erreur, créer des rendez-vous avec des patients par défaut
          const fallbackData = appointmentsData.map(appointment => ({
            ...appointment,
            patient: { first_name: 'Patient', last_name: 'Inconnu', id: appointment.patient_id }
          }));
          setAppointments(fallbackData);
          setLoading(false);
          return;
        }

        // Combiner les données de manière sécurisée
        const combinedData = appointmentsData.map(appointment => {
          const patient = patientsData?.find(p => p.id === appointment.patient_id);
          return {
            ...appointment,
            patient: patient || { first_name: 'Patient', last_name: 'Inconnu', id: appointment.patient_id }
          };
        });

        // Nettoyer automatiquement les rendez-vous orphelins
        const orphanAppointments = appointmentsData.filter(apt =>
          !patientsData?.some(p => p.id === apt.patient_id)
        );

        if (orphanAppointments.length > 0) {
          console.log('🔧 Nettoyage automatique des rendez-vous orphelins:', orphanAppointments.length);

          // Supprimer les rendez-vous dont les patients n'existent plus
          for (const apt of orphanAppointments) {
            try {
              await supabase.from('appointments').delete().eq('id', apt.id);
              console.log('✅ Rendez-vous orphelin supprimé:', apt.id);
            } catch (deleteError) {
              console.error('❌ Erreur suppression rendez-vous orphelin:', apt.id, deleteError);
            }
          }

          // Recharger les rendez-vous après nettoyage
          console.log('🔄 Rechargement des rendez-vous après nettoyage...');
          await fetchAppointments();
          return; // Sortir pour éviter le double setAppointments
        }

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

  const updateAppointmentStatus = async (appointmentId: string, newStatus: string) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return;

    // Récupérer l'ID du médecin
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
      .eq('doctor_id', doctorData.id);

    if (!error) {
      setAppointments(appointments.map(apt =>
        apt.id === appointmentId ? { ...apt, status: newStatus } : apt
      ));
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Ajouter les jours du mois précédent pour compléter la première semaine
    for (let i = 0; i < startingDayOfWeek; i++) {
      const prevDate = new Date(year, month, -startingDayOfWeek + i + 1);
      days.push({ date: prevDate, isCurrentMonth: false, appointments: [] });
    }

    // Ajouter les jours du mois actuel
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dayAppointments = appointments.filter(apt => {
        const aptDate = new Date(apt.appointment_datetime);
        return aptDate.toDateString() === date.toDateString();
      });
      days.push({ date, isCurrentMonth: true, appointments: dayAppointments });
    }

    // Ajouter les jours du mois suivant pour compléter la dernière semaine
    const remainingDays = 7 - (days.length % 7);
    if (remainingDays < 7) {
      for (let i = 1; i <= remainingDays; i++) {
        const nextDate = new Date(year, month + 1, i);
        days.push({ date: nextDate, isCurrentMonth: false, appointments: [] });
      }
    }

    return days;
  };

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime);
    return {
      date: date.toLocaleDateString('fr-FR'),
      time: date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    };
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    setSelectedDate(prev => {
      const newDate = new Date(prev!);
      if (viewMode === 'day') {
        if (direction === 'prev') {
          newDate.setDate(prev!.getDate() - 1);
        } else {
          newDate.setDate(prev!.getDate() + 1);
        }
      } else {
        // Vue semaine
        if (direction === 'prev') {
          newDate.setDate(prev!.getDate() - 7);
        } else {
          newDate.setDate(prev!.getDate() + 7);
        }
      }
      return newDate;
    });
  };

  const getWeekDays = (date: Date) => {
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Ajuster pour lundi
    startOfWeek.setDate(diff);

    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const weekDate = new Date(startOfWeek);
      weekDate.setDate(startOfWeek.getDate() + i);
      const dayAppointments = appointments.filter(apt => {
        const aptDate = new Date(apt.appointment_datetime);
        return aptDate.toDateString() === weekDate.toDateString();
      });
      weekDays.push({ date: weekDate, appointments: dayAppointments });
    }
    return weekDays;
  };

  const selectedDateAppointments = selectedDate
    ? appointments.filter(apt => {
        const aptDate = new Date(apt.appointment_datetime);
        return aptDate.toDateString() === selectedDate.toDateString();
      })
    : [];

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Chargement de l'agenda...</p>
        </div>
      </div>
    );
  }

  const weekDays = getWeekDays(selectedDate!);
  const dayNames = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <Link href="/dashboard/doctor">
          <Button variant="outline" className="mb-4">
            ← Retour au dashboard
          </Button>
        </Link>

        <h1 className="text-3xl font-bold mb-2">Agenda des rendez-vous</h1>
        <p className="text-gray-600">
          Consultez et gérez vos rendez-vous programmés par vos patients
        </p>
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'day' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('day')}
            >
              Vue Jour
            </Button>
            <Button
              variant={viewMode === 'week' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('week')}
            >
              Vue Semaine
            </Button>
          </div>

          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => navigateDate('prev')}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              {viewMode === 'day' ? 'Jour précédent' : 'Semaine précédente'}
            </Button>
            <span className="font-medium">
              {viewMode === 'day'
                ? selectedDate!.toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })
                : `Semaine du ${weekDays[0].date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} au ${weekDays[6].date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`
              }
            </span>
            <Button variant="outline" size="sm" onClick={() => navigateDate('next')}>
              {viewMode === 'day' ? 'Jour suivant' : 'Semaine suivante'}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>

      {viewMode === 'day' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Rendez-vous du {selectedDate!.toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long'
                })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedDateAppointments.length > 0 ? (
                <div className="space-y-4">
                  {selectedDateAppointments
                    .sort((a, b) => new Date(a.appointment_datetime).getTime() - new Date(b.appointment_datetime).getTime())
                    .map((appointment) => {
                      const { time } = formatDateTime(appointment.appointment_datetime);
                      return (
                        <div key={appointment.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2">
                                <User className="h-5 w-5 text-blue-600" />
                                <div>
                                  {appointment.patient.id ? (
                                    <Link
                                      href={`/dashboard/doctor/patients/${appointment.patient.id}`}
                                      className="font-medium text-lg text-blue-600 hover:text-blue-800 hover:underline"
                                    >
                                      {appointment.patient.first_name} {appointment.patient.last_name}
                                    </Link>
                                  ) : (
                                    <span className="font-medium text-lg">
                                      {appointment.patient.first_name} {appointment.patient.last_name}
                                    </span>
                                  )}
                                  <div className="text-sm text-gray-600">
                                    {consultationTypeLabels[appointment.type as keyof typeof consultationTypeLabels] || appointment.type}
                                  </div>
                                </div>
                              </div>
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

                          <div className="flex items-center gap-2 mb-3">
                            <Clock className="h-4 w-4 text-gray-500" />
                            <span className="text-lg font-medium">{time}</span>
                          </div>

                          {appointment.notes && (
                            <div className="bg-gray-50 rounded-lg p-3 mb-3">
                              <strong className="text-gray-700">Notes du patient :</strong>
                              <p className="text-gray-600 mt-1">{appointment.notes}</p>
                            </div>
                          )}

                          {appointment.status === 'scheduled' && (
                            <div className="flex gap-2">
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
                      );
                    })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Aucun rendez-vous prévu
                  </h3>
                  <p className="text-gray-600">
                    Vous n'avez pas de rendez-vous programmé pour cette journée.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
      )}

      {viewMode === 'week' && (
          <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
            {weekDays.map((day, index) => (
              <Card key={index} className={`min-h-[300px] ${day.date.toDateString() === new Date().toDateString() ? 'ring-2 ring-blue-500' : ''}`}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-center">
                    {dayNames[index]}
                    <div className="text-lg font-bold">
                      {day.date.getDate()}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {day.appointments.length > 0 ? (
                    <div className="space-y-2">
                      {day.appointments
                        .sort((a, b) => new Date(a.appointment_datetime).getTime() - new Date(b.appointment_datetime).getTime())
                        .map((appointment) => {
                          const { time } = formatDateTime(appointment.appointment_datetime);
                          return (
                            <div
                              key={appointment.id}
                              className={`text-xs p-2 rounded cursor-pointer hover:opacity-80 ${
                                appointment.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                appointment.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                                appointment.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (appointment.patient.id) {
                                  window.location.href = `/dashboard/doctor/patients/${appointment.patient.id}`;
                                } else {
                                  setSelectedDate(day.date);
                                  setViewMode('day');
                                }
                              }}
                            >
                              <div className="font-medium">{time}</div>
                              <div className="truncate">
                                {appointment.patient.first_name} {appointment.patient.last_name}
                              </div>
                              <div className="truncate text-xs opacity-75">
                                {consultationTypeLabels[appointment.type as keyof typeof consultationTypeLabels] || appointment.type}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  ) : (
                    <div className="text-center text-gray-400 text-sm py-8">
                      Aucun RDV
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
      )}
    </div>
  );
}