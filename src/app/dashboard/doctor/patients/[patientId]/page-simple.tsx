// Version simplifiée pour diagnostiquer le problème
// src/app/dashboard/doctor/patients/[patientId]/page-simple.tsx

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function PatientFilePageSimple({ params }: { params: { patientId: string } }) {

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

  // Test simple : juste récupérer les données de base du patient
  console.log('🔍 Test simple - Tentative d\'accès au patient:', patientId);

  const { data: patient, error } = await supabase
    .from('patients')
    .select('id, first_name, last_name, date_of_birth, email')
    .eq('id', patientId)
    .single();

  console.log('🔍 Test simple - Résultat:', { patient, error });

  if (error || !patient) {
    console.error("❌ Erreur simple:", error);
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Erreur de diagnostic</h1>
        <div className="bg-red-50 p-4 rounded">
          <p><strong>Patient ID:</strong> {patientId}</p>
          <p><strong>Erreur:</strong> {error?.message || 'Patient non trouvé'}</p>
          <p><strong>Code:</strong> {error?.code}</p>
          <p><strong>Détails:</strong> {error?.details}</p>
        </div>
        <div className="mt-4">
          <a href="/debug-patient-access" className="text-blue-600 underline">
            ← Retour au diagnostic complet
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-green-600 mb-4">✅ Succès !</h1>
      <div className="bg-green-50 p-4 rounded">
        <p><strong>Patient trouvé:</strong> {patient.first_name} {patient.last_name}</p>
        <p><strong>ID:</strong> {patient.id}</p>
        <p><strong>Email:</strong> {patient.email}</p>
      </div>
      <div className="mt-4">
        <a href="/debug-patient-access" className="text-blue-600 underline">
          ← Retour au diagnostic complet
        </a>
      </div>
    </div>
  );
}