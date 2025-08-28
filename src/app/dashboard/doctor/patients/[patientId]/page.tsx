// src/app/dashboard/doctor/patients/[patientId]/page.tsx

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Settings } from 'lucide-react';
import NoteEditor from './_components/note-editor';
import PatientInfoPanel from "@/components/doctor/PatientInfoPanel";
import PatientTimeline from "@/components/doctor/PatientTimeline";
import ConsultationDropdown from "@/components/doctor/ConsultationDropdown";



export default async function PatientFilePage({ params }: { params: { patientId: string } }) {
  
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

  // Récupérer les données du patient sans les notes (à cause des problèmes RLS)
  const { data: patient, error } = await supabase
    .from('patients')
    .select(`
    *,
    appointments(*, questionnaires(*, answers)),
    documents(*),
    prescriptions(*, providers(name)),
    medical_history,
    surgical_history
    `)
    .eq('id', patientId)
    .single();

  // Récupérer les notes séparément en utilisant la fonction RPC
  let notes = [];
  try {
    const { data: notesData, error: notesError } = await supabase
      .rpc('get_patient_notes', { p_patient_id: patientId });
    
    if (!notesError && notesData) {
      notes = notesData;
    }
  } catch (notesError) {
    console.error('Error fetching notes via RPC:', notesError);
    // Si la fonction RPC n'existe pas, on essaie la méthode normale
    const { data: fallbackNotes } = await supabase
      .from('notes')
      .select('*, doctors(first_name, last_name)')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });
    
    if (fallbackNotes) {
      notes = fallbackNotes;
    }
  }

  if (error || !patient) {
    console.error("Erreur Supabase:", error);
    return <div>Erreur : Impossible de trouver le dossier pour le patient.</div>;
  }

  // Ajouter les notes récupérées à l'objet patient pour la compatibilité avec le code existant
  const patientWithNotes = {
    ...patient,
    notes: notes || []
  };

  console.log('Patient data loaded:', {
    patientId,
    notesCount: notes?.length || 0,
    notes: notes?.map((n: unknown) => {
      const note = n as { id: string; content: string; created_at: string; doctors?: { first_name: string; last_name: string } };
      return {
        id: note.id,
        content: note.content,
        created_at: note.created_at,
        doctors: note.doctors || { first_name: 'Unknown', last_name: 'Doctor' }
      };
    }),
    hasMedicalHistory: !!patient.medical_history,
    hasSurgicalHistory: !!patient.surgical_history,
    medicalHistoryEntries: patient.medical_history?.entries?.length || 0,
    surgicalHistoryEntries: patient.surgical_history?.entries?.length || 0
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