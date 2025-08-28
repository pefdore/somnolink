'use client';

import { FileText, ClipboardList, MessageSquare, Calendar, Upload, Pill, User } from 'lucide-react';

interface TimelineEvent {
  id: string;
  type: 'note' | 'appointment' | 'questionnaire' | 'document' | 'prescription' | 'consultation';
  title: string;
  description?: string;
  date: Date;
  creator: {
    type: 'patient' | 'doctor';
    name: string;
  };
}

interface PatientTimelineProps {
  patient: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    notes?: Array<{
      id: string;
      content: string;
      created_at: string;
      doctors?: {
        first_name?: string;
        last_name?: string;
      };
    }>;
    appointments?: Array<{
      id: string;
      date: string;
      questionnaires?: Array<{
        id: string;
        title?: string;
        completed_at?: string;
      }>;
    }>;
    documents?: Array<{
      id: string;
      type?: string;
      name?: string;
      created_at: string;
      uploaded_by: string;
    }>;
    prescriptions?: Array<{
      id: string;
      medication?: string;
      created_at: string;
    }>;
  };
}

const getEventIcon = (type: TimelineEvent['type']) => {
  switch (type) {
    case 'note':
      return <FileText className="w-4 h-4" />;
    case 'appointment':
      return <Calendar className="w-4 h-4" />;
    case 'questionnaire':
      return <ClipboardList className="w-4 h-4" />;
    case 'document':
      return <Upload className="w-4 h-4" />;
    case 'prescription':
      return <Pill className="w-4 h-4" />;
    case 'consultation':
      return <MessageSquare className="w-4 h-4" />;
    default:
      return <FileText className="w-4 h-4" />;
  }
};

const getEventColor = (type: TimelineEvent['type']) => {
  switch (type) {
    case 'note':
      return 'bg-blue-100 text-blue-700';
    case 'appointment':
      return 'bg-purple-100 text-purple-700';
    case 'questionnaire':
      return 'bg-orange-100 text-orange-700';
    case 'document':
      return 'bg-green-100 text-green-700';
    case 'prescription':
      return 'bg-red-100 text-red-700';
    case 'consultation':
      return 'bg-indigo-100 text-indigo-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
};

export default function PatientTimeline({ patient }: PatientTimelineProps) {
  const generateTimelineEvents = (): TimelineEvent[] => {
    const events: TimelineEvent[] = [];

    // Notes
    if (patient.notes && patient.notes.length > 0) {
      patient.notes?.forEach((note) => {
        events.push({
          id: `note-${note.id}`,
          type: 'note',
          title: 'Note médicale',
          description: note.content,
          date: new Date(note.created_at),
          creator: {
            type: 'doctor',
            name: `Dr. ${note.doctors?.first_name || 'Unknown'} ${note.doctors?.last_name || 'Doctor'}`
          }
        });
      });
    }

    // Appointments with questionnaires
    if (patient.appointments && patient.appointments.length > 0) {
      patient.appointments?.forEach((appointment) => {
        events.push({
          id: `appointment-${appointment.id}`,
          type: 'appointment',
          title: 'Consultation',
          description: `Rendez-vous du ${new Date(appointment.date).toLocaleDateString('fr-FR')}`,
          date: new Date(appointment.date),
          creator: {
            type: 'doctor',
            name: 'Médecin'
          }
        });

        // Questionnaires from appointments
        if (appointment.questionnaires && appointment.questionnaires.length > 0) {
          appointment.questionnaires?.forEach((questionnaire) => {
            events.push({
              id: `questionnaire-${questionnaire.id}`,
              type: 'questionnaire',
              title: 'Questionnaire patient',
              description: questionnaire.title || 'Questionnaire rempli',
              date: new Date(questionnaire.completed_at || appointment.date),
              creator: {
                type: 'patient',
                name: `${patient.first_name} ${patient.last_name}`
              }
            });
          });
        }
      });
    }

    // Documents (PGV, etc.)
    if (patient.documents && patient.documents.length > 0) {
      patient.documents?.forEach((document) => {
        events.push({
          id: `document-${document.id}`,
          type: 'document',
          title: document.type === 'pgv' ? 'PGV téléchargé' : 'Document',
          description: document.name || document.type,
          date: new Date(document.created_at),
          creator: {
            type: document.uploaded_by === 'patient' ? 'patient' : 'doctor',
            name: document.uploaded_by === 'patient' 
              ? `${patient.first_name} ${patient.last_name}`
              : 'Médecin'
          }
        });
      });
    }

    // Prescriptions
    if (patient.prescriptions && patient.prescriptions.length > 0) {
      patient.prescriptions?.forEach((prescription) => {
        events.push({
          id: `prescription-${prescription.id}`,
          type: 'prescription',
          title: 'Prescription',
          description: prescription.medication || 'Médicament prescrit',
          date: new Date(prescription.created_at),
          creator: {
            type: 'doctor',
            name: 'Médecin'
          }
        });
      });
    }

    // Sort events by date (newest first)
    return events.sort((a, b) => b.date.getTime() - a.date.getTime());
  };

  const timelineEvents = generateTimelineEvents();

  if (timelineEvents.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold text-gray-800 border-b pb-4 mb-4">Timeline du Dossier</h3>
        <p className="text-gray-500 text-center py-8">Aucun événement dans le dossier pour le moment.</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-semibold text-gray-800 border-b pb-4 mb-6">Timeline du Dossier</h3>
      
      <div className="space-y-4">
        {timelineEvents.map((event) => (
          <div key={event.id} className="flex items-start space-x-3 p-4 border rounded-lg bg-white hover:bg-gray-50">
            <div className={`p-2 rounded-full ${getEventColor(event.type)}`}>
              {getEventIcon(event.type)}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-medium text-gray-900">{event.title}</h4>
                <span className="text-xs text-gray-500">
                  {event.date.toLocaleDateString('fr-FR')} à {event.date.toLocaleTimeString('fr-FR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
              </div>
              
              {event.description && (
                <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                  {event.description}
                </p>
              )}
              
              <div className="flex items-center text-xs text-gray-500">
                <User className="w-3 h-3 mr-1" />
                {event.creator.type === 'patient' ? 'Patient' : 'Médecin'}: {event.creator.name}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}