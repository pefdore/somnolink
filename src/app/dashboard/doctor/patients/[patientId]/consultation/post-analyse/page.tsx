// src/app/dashboard/doctor/patients/[patientId]/consultation/post-analyse/page.tsx

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PatientInfoPanel from "@/components/doctor/PatientInfoPanel";
import PatientTimeline from "@/components/doctor/PatientTimeline";
import ConsultationTabs from "@/components/doctor/ConsultationTabs";

const formatName = (civility: string | null, firstName: string | null, lastName: string | null) => {
  return `${civility || ''} ${firstName || ''} ${lastName || ''}`.trim();
};

const calculateAge = (birthDate: string | null): number | string => {
  if (!birthDate) return 'N/A';
  const birth = new Date(birthDate);
  if (isNaN(birth.getTime())) return '—';
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDifference = today.getMonth() - birth.getMonth();
  if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

export default async function PostAnalysePage({ params }: { params: { patientId: string } }) {
  
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

  // Récupérer les données du patient
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

  // Ajouter les notes récupérées à l'objet patient
  const patientWithNotes = {
    ...patient,
    notes: notes || []
  };

  return (
    <div className="flex h-full">
      {/* --- PANNEAU D'INFORMATION PATIENT PERMANENT À GAUCHE --- */}
      <PatientInfoPanel patient={patientWithNotes} />

      {/* --- TIMELINE DU DOSSIER AU MILIEU --- */}
      <div className="w-1/3 p-6 bg-gray-50 ml-80">
        <PatientTimeline patient={patientWithNotes} doctorId={doctor.id} />
      </div>

      {/* --- CONTENU DE CONSULTATION À DROITE --- */}
      <div className="flex-1 p-6 bg-white border-l border-gray-200">
        <ConsultationTabs patientId={patientId} doctorId={doctor.id} consultationType="post-analyse" />
      </div>
    </div>
  );
}