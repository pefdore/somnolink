// src/app/page.tsx

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ModernHeader } from '@/components/landing/ModernHeader';
import { PatientHero } from '@/components/landing/PatientHero';
import { PatientFeatures } from '@/components/landing/PatientFeatures';
import { HowItWorks } from '@/components/landing/HowItWorks';

export default async function LandingPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Si un utilisateur est connecté, on le redirige
  if (user) {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role === 'DOCTOR') {
      redirect('/dashboard/doctor');
    } else {
      redirect('/dashboard/patient');
    }
  }

  // Si personne n'est connecté, on affiche la nouvelle landing page moderne
  return (
    <div className="min-h-screen bg-white">
      <ModernHeader />
      <main>
        <PatientHero />
        <PatientFeatures />
        <HowItWorks />
      </main>
      
      {/* Footer simple */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">SL</span>
              </div>
              <span className="text-xl font-bold">Somnolink</span>
            </div>
            
            <nav className="flex flex-wrap justify-center gap-6 md:gap-8">
              <a href="#features" className="text-gray-300 hover:text-white transition-colors">
                Fonctionnalités
              </a>
              <a href="#how-it-works" className="text-gray-300 hover:text-white transition-colors">
                Comment ça marche
              </a>
              <a href="/auth/login" className="text-gray-300 hover:text-white transition-colors">
                Connexion
              </a>
              <a href="/doctor-presentation" className="text-blue-300 hover:text-blue-200 transition-colors">
                Espace médecin
              </a>
            </nav>
          </div>
          
          <div className="mt-8 pt-8 border-t border-gray-700">
            <p className="text-gray-400">
              © 2024 Somnolink. Tous droits réservés. Plateforme de suivi médical sécurisée.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}