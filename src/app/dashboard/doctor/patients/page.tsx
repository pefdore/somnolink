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
    .from('patients')
    .select(`
      id,
      first_name,
      last_name,
      date_of_birth,
      appointments!inner ( doctor_id )
    `)
    .eq('appointments.doctor_id', doctor.id);
  
  if (error) {
    return <div className="text-red-500">Erreur lors de la récupération des patients : {error.message}</div>;
  }

  const uniquePatients = patients ? Array.from(new Map(patients.map(p => [p.id, p])).values()) : [];

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Mes Patients</h1>
      </div>
      
      <div className="bg-white shadow-md rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom du Patient</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Âge</th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Ouvrir le dossier</span>
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
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link href={`/dashboard/doctor/patients/${patient.id}`} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">
                      Ouvrir le dossier
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                  <td colSpan={3} className="text-center py-10 text-gray-500">
                      Aucun patient avec un rendez-vous ne vous est assigné.
                  </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}