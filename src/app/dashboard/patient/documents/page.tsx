// src/app/dashboard/patient/documents/page.tsx

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Download } from 'lucide-react';

export default async function PatientDocumentsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');

  // Étape 1 : D'abord, on récupère le profil du patient ET ON ATTEND le résultat.
  const { data: patientProfile, error: profileError } = await supabase
    .from('patients')
    .select('id')
    .eq('user_id', user.id)
    .single();

  // Si on ne trouve pas de profil, on s'arrête là.
  if (profileError || !patientProfile) {
    return <div>Erreur : impossible de trouver votre profil patient.</div>;
  }

  // Étape 2 : Maintenant qu'on a le patientId, on peut l'utiliser pour chercher les documents.
  const { data: documents, error } = await supabase
    .from('documents')
    .select('*')
    .eq('patient_id', patientProfile.id)
    .order('created_at', { ascending: false });


  if (error) {
    return <div className="text-red-500">Erreur lors de la récupération des documents : {error.message}</div>
  }

  // Fonction pour créer une URL de téléchargement sécurisée et temporaire
  const getDownloadUrl = async (filePath: string) => {
    'use server'
    const supabase = createClient();
    const { data } = await supabase.storage.from('patient-documents').createSignedUrl(filePath, 60); // Valide 60 secondes
    return data?.signedUrl;
  };

  return (
    <div>
      <h1 className="text-3xl font-bold">Mes Documents</h1>
      <p className="mt-2 text-gray-600">Retrouvez ici les documents partagés par votre médecin.</p>

      <div className="mt-8 space-y-4">
        {documents && documents.length > 0 ? (
          documents.map(doc => (
            <div key={doc.id} className="bg-white p-4 rounded-lg shadow flex justify-between items-center">
              <div>
                <p className="font-semibold">{doc.file_name}</p>
                <p className="text-sm text-gray-500">Type: {doc.document_type}</p>
              </div>
              <form action={async () => {
                  'use server'
                  const url = await getDownloadUrl(doc.file_path);
                  if (url) redirect(url);
                }}>
                <button type="submit" className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                  <Download className="mr-2 h-4 w-4" />
                  Télécharger
                </button>
              </form>
            </div>
          ))
        ) : (
          <p className="text-gray-500">Aucun document disponible pour le moment.</p>
        )}
      </div>
    </div>
  );
} // <--- L'ACCOLADE MANQUANTE EST ICI