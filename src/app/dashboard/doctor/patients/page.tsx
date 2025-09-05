// src/app/dashboard/doctor/patients/page.tsx

import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { User } from 'lucide-react';


const calculateAge = (dateOfBirth: string | null): number | string => {
  if (!dateOfBirth) return 'N/A';
  const birthDate = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

export default async function MyPatientsPage() {
  const supabase = createClient();

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
    return <div>Erreur : Votre profil médecin est introuvable.</div>;
  }


  const { data: patients, error } = await supabase
    .from('patient_doctor_relationships')
    .select(`
      patient_id,
      status,
      patients!inner (
        id,
        first_name,
        last_name,
        date_of_birth,
        email
      )
    `)
    .eq('doctor_id', doctor.id)
    .eq('status', 'active');


  // Si la requête principale échoue, essayons une approche alternative
  let finalPatients = patients;
  if (error || !patients || patients.length === 0) {
    // Récupération des relations d'abord
    const { data: relationships, error: relError } = await supabase
      .from('patient_doctor_relationships')
      .select('patient_id, status')
      .eq('doctor_id', doctor.id)
      .eq('status', 'active');

    if (relationships && relationships.length > 0) {
      // Récupération des patients séparément
      const patientIds = relationships.map(rel => rel.patient_id);
      const { data: patientDetails, error: patientError } = await supabase
        .from('patients')
        .select('id, first_name, last_name, date_of_birth, email')
        .in('id', patientIds);

      if (patientDetails) {
        // Combinaison des données
        finalPatients = relationships.map(rel => {
          const patient = patientDetails.find(p => p.id === rel.patient_id);
          return {
            patient_id: rel.patient_id,
            status: rel.status,
            patients: patient ? [patient] : []
          };
        });
      }
    }
  }

  if (error) {
    return <div className="text-red-500">Erreur lors de la récupération des patients : {error.message}</div>;
  }

  const uniquePatients = finalPatients ? finalPatients.map((rel: any) => ({
    id: rel.patients?.id || '',
    first_name: rel.patients?.first_name || '',
    last_name: rel.patients?.last_name || '',
    date_of_birth: rel.patients?.date_of_birth || null,
    status: rel.status || 'active'
  })).filter((p): p is NonNullable<typeof p> => Boolean(p.id)) : [];

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Mes Patients</h1>
          <p className="mt-2 text-gray-600">Tous les patients associés à votre compte</p>
        </div>
      </div>
      
      <div className="bg-white shadow-md rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom du Patient</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Âge</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {uniquePatients.length > 0 ? (
              uniquePatients.map(patient => (
                <tr key={patient.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <User className="h-6 w-6 text-gray-500" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{patient.first_name} {patient.last_name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{calculateAge(patient.date_of_birth)} ans</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      patient.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {patient.status === 'active' ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex space-x-2">
                      <Link href={`/dashboard/doctor/messagerie?patient=${patient.id}`} className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                        💬 Message
                      </Link>
                      <Link href={`/dashboard/doctor/patients/${patient.id}`} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">
                        Ouvrir le dossier
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                  <td colSpan={4} className="text-center py-10 text-gray-500">
                      <div className="text-center">
                          <User className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                          <p className="text-lg font-medium text-gray-900 mb-2">Aucun patient associé</p>
                          <p className="text-sm text-gray-500">
                              Les patients qui s'associent à vous via votre lien d'invitation apparaîtront ici.
                          </p>
                      </div>
                  </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}