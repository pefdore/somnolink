// src/app/dashboard/patient/todo/page.tsx

import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { PreConsultation } from './_components/pre-consultation';
import { MorningAfter } from './_components/morning-after'; // Importer le nouveau composant

// On ajoute `searchParams` pour savoir quel onglet est actif
export default async function TodoPage({ searchParams }: { searchParams: { tab: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const activeTab = searchParams.tab || 'pre-consultation'; // L'onglet par défaut

  const { data: patient } = await supabase.from('patients').select('id').eq('user_id', user.id).single();
  if (!patient) return <div>Profil patient introuvable.</div>;

  // On cherche le dernier RDV planifié
  const { data: appointment } = await supabase
    .from('appointments')
    .select('id, appointment_date')
    .eq('patient_id', patient.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  // On vérifie si les questionnaires ont été soumis
  const { data: questionnaires } = appointment 
    ? await supabase.from('questionnaires').select('type').eq('appointment_id', appointment.id)
    : { data: [] };

  const submittedTypes = questionnaires?.map(q => q.type) || [];
  const isPreConsultationDone = submittedTypes.includes('PRE_CONSULTATION');
  const isMorningAfterDone = submittedTypes.includes('MORNING_AFTER');

  const appointmentDate = appointment ? new Date(appointment.appointment_date) : null;
  const now = new Date();

  // Logique de déblocage
  const canDoMorningAfter = isPreConsultationDone && appointmentDate && now.toDateString() >= new Date(appointmentDate.getTime() + 24*60*60*1000).toDateString(); // Le lendemain du RDV
  // ... autres logiques de déblocage ...

  const TabLink = ({ name, label, enabled }: { name: string, label: string, enabled: boolean }) => {
    const isActive = activeTab === name;
    if (!enabled) {
      return <span className="px-3 py-2 font-medium text-sm rounded-md text-gray-400 bg-gray-100 cursor-not-allowed">{label}</span>;
    }
    return (
      <Link href={`/dashboard/patient/todo?tab=${name}`} 
            className={`px-3 py-2 font-medium text-sm rounded-md ${isActive ? 'text-blue-600 bg-blue-100' : 'text-gray-700 hover:bg-gray-200'}`}>
        {label}
      </Link>
    );
  };
  
  return (
    <div>
      <h1 className="text-3xl font-bold">À faire</h1>
      
      <div className="mt-8 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <TabLink name="pre-consultation" label="Pré-consultation" enabled={true} />
          <TabLink name="morning-after" label="Au réveil" enabled={canDoMorningAfter ?? false} />
          {/* ... autres onglets ... */}
        </nav>
      </div>

      <div className="mt-8">
        {activeTab === 'pre-consultation' && (
          <PreConsultation 
            patientId={patient.id} 
            appointment={appointment} 
            isDone={isPreConsultationDone}
          />
        )}
        {activeTab === 'morning-after' && appointment && (
          <MorningAfter
            patientId={patient.id}
            appointmentId={appointment.id}
            isDone={isMorningAfterDone}
          />
        )}
      </div>
    </div>
  );
}