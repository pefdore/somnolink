// src/app/page.tsx

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Header } from '@/components/landing/header';
import { Hero } from '@/components/landing/hero';
import { Features } from '@/components/landing/features';

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

  // Si personne n'est connecté, on affiche la landing page
  return (
    <div className="bg-white">
      <Header />
      <main>
        <Hero />
        <Features />
      </main>
    </div>
  );
}