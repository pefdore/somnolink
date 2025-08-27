// src/app/auth/layout.tsx

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Si un utilisateur est connecté, on le redirige loin des pages d'auth
  if (user) {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role === 'DOCTOR') {
      redirect('/dashboard/doctor');
    } else {
      redirect('/dashboard/patient');
    }
  }

  return <>{children}</>;
}