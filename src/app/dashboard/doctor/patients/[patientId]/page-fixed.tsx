// Version corrigée de la page du dossier patient
// Utilise des requêtes séparées au lieu des jointures complexes

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Settings } from 'lucide-react';
import NoteEditor from './_components/note-editor';
import PatientInfoPanel from "@/components/doctor/PatientInfoPanel";
import PatientTimeline from "@/components/doctor/PatientTimeline";
import ConsultationDropdown from "@/components/doctor/ConsultationDropdown";

export default async function PatientFilePageFixed({ params }: { params: { patientId: string } }) {

  const supabase = createClient();
  const { patientId } = params;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.user_metadata.role !== 'DOCTOR') {
    redirect('/auth/login');
  }

  const { data: doctor } = await supabase
    .from('doctors')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!doctor) {
    return <div>Erreur: Profil médecin introuvable.</div>
  }

  // CORRECTION : Récupérer les données SÉPARÉMENT au lieu d'utiliser des jointures

  // 1. Récupérer les données de base du patient
  const { data: patient, error: patientError } = await supabase
    .from('patients')
    .select('id, first_name, last_name, date_of_birth, email, medical_history, surgical_history')
    .eq('id', patientId)
    .single();

  if (patientError || !patient) {
    console.error("Erreur patient:", patientError);
    return <div>Erreur : Impossible de trouver le dossier pour le patient.</div>;
  }

  // 2. Récupérer les rendez-vous séparément
  const { data: appointments, error: appointmentsError } = await supabase
    .from('appointments')
    .select('id, appointment_datetime, type, notes, status')
    .eq('patient_id', patientId);

  // Transformer les rendez-vous pour correspondre au format attendu
  const formattedAppointments = appointments?.map(apt => ({
    id: apt.id,
    date: apt.appointment_datetime,
    type: apt.type,
    notes: apt.notes,
    status: apt.status
  })) || [];

  // 3. Récupérer les notes médicales séparément
  let notes = [];
  try {
    const { data: notesData, error: notesError } = await supabase
      .rpc('get_patient_notes', { p_patient_id: patientId });

    if (!notesError && notesData) {
      notes = notesData;
    }
  } catch (notesError) {
    console.error('Error fetching notes via RPC:', notesError);
    // Fallback : récupérer directement
    const { data: fallbackNotes } = await supabase
      .from('notes')
      .select('*, doctors(first_name, last_name)')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });

    if (fallbackNotes) {
      notes = fallbackNotes;
    }
  }

  // 4. Créer l'objet patient complet avec toutes les données
  const patientWithNotes: any = {
    ...patient,
    civility: 'M.', // Valeurs par défaut pour les champs manquants
    birth_name: patient.last_name,
    social_security_number: '',
    allergies: '',
    phone: '',
    address: '',
    emergency_contact: '',
    attending_doctor_first_name: 'Dr.',
    attending_doctor_last_name: 'Inconnu',
    gender: 'Non spécifié', // Propriétés manquantes requises
    city: '',
    postal_code: '',
    appointments: formattedAppointments,
    notes: notes || [],
    documents: [],
    prescriptions: []
  };

  console.log('Patient data loaded (version corrigée):', {
    patientId,
    patientName: `${patient.first_name} ${patient.last_name}`,
    appointmentsCount: appointments?.length || 0,
    notesCount: notes?.length || 0
  });

  return (
    <div className="flex h-full">
      {/* --- PANNEAU D'INFORMATION PATIENT PERMANENT À GAUCHE --- */}
      <PatientInfoPanel patient={patientWithNotes} />

      {/* --- CONTENU PRINCIPAL AVEC TIMELINE --- */}
      <main className="flex-1 p-6 bg-gray-50 ml-80">

        {/* Boutons d'action en haut à droite */}
        <div className="flex justify-end space-x-4 mb-6">
          <ConsultationDropdown patientId={patient.id} />

          <button className="flex items-center space-x-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
            <Settings className="w-4 h-4" />
            <span>Action sur le dossier</span>
          </button>
        </div>

        {/* Timeline du dossier */}
        <PatientTimeline patient={patientWithNotes} />

        {/* Éditeur de notes (conservé pour l'historique) */}
        <div className="mt-6">
          <NoteEditor patientId={patient.id} doctorId={doctor.id} />
        </div>
      </main>
    </div>
  );
}