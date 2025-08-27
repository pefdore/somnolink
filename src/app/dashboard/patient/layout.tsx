// src/app/dashboard/patient/layout.tsx

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server'; // Client serveur pour la sécurité
import Link from 'next/link';
import PatientHeaderBar from '@/components/patient/PatientHeaderBar';

// Ce composant est la "coquille" qui entourera toutes les pages du dossier /patient
export default async function PatientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login'); // Sécurité : si pas connecté, on dégage
  }

  // On récupère le profil pour afficher les initiales
  const { data: patientProfile } = await supabase
    .from('patients')
    .select('id, first_name, last_name')
    .eq('user_id', user.id)
    .single();
    
  const initials = patientProfile
    ? `${patientProfile.first_name[0]}${patientProfile.last_name[0]}`.toUpperCase()
    : '??';

  // La fonction de déconnexion. C'est une "Server Action".
  // Elle s'exécute sur le serveur pour détruire la session de manière sécurisée.
  const signOut = async () => {
    'use server'; // Magie de Next.js pour une fonction serveur
    const supabase = createClient();
    await supabase.auth.signOut();
    redirect('/auth/login');
  };

  return (
    <div className="flex min-h-screen">
      {/* Conteneur principal avec barre latérale et contenu */}
      <div className="flex w-full">
        {/* Barre de navigation à gauche pour le patient */}
        <nav className="w-64 bg-gray-800 text-white flex flex-col p-4 fixed h-screen z-30">
          <div className="text-center mb-10">
            <div className="mx-auto w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center text-3xl font-bold">
              {initials}
            </div>
            <p className="mt-2">{patientProfile?.first_name} {patientProfile?.last_name}</p>
          </div>

          <ul className="flex-grow space-y-2">
            <li><Link href="/dashboard/patient" className="block p-2 rounded hover:bg-gray-700">Dashboard</Link></li>
            <li><Link href="/dashboard/patient/todo" className="block p-2 rounded hover:bg-gray-700">À faire</Link></li>
            <li><Link href="/dashboard/patient/history" className="block p-2 rounded hover:bg-gray-700">Mes antécédents</Link></li>
            <li><Link href="/dashboard/patient/documents" className="block p-2 rounded hover:bg-gray-700">Mes documents</Link></li>
            <li><Link href="/dashboard/patient/profil" className="block p-2 rounded hover:bg-gray-700">Mon profil</Link></li>
          </ul>
          
          {/* Formulaire de déconnexion en bas */}
          <form action={signOut}>
            <button type="submit" className="w-full p-2 bg-red-600 rounded hover:bg-red-700 text-left">
              Déconnexion
            </button>
          </form>
        </nav>

        {/* Contenu principal avec barre horizontale */}
        <div className="flex-1 flex flex-col ml-64">
          {/* Barre horizontale supérieure fixe */}
          <div className="relative sticky top-0 z-20">
            {/* Barre horizontale supérieure */}
            <PatientHeaderBar patient={patientProfile} />
          </div>
          
          {/* Contenu principal de la page */}
          <main className="flex-1 bg-gray-100 overflow-auto">
            <div className="p-8">
              {children} {/* C'est ici que le contenu de nos pages (page.tsx) sera injecté */}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}