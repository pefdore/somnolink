// src/app/dashboard/doctor/layout.tsx

import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { LayoutDashboard, Users, LogOut, Calendar, CheckSquare, MessageSquare, LinkIcon, Mail, CalendarDays, Sparkles } from 'lucide-react';
import DoctorHeaderBar from '@/components/doctor/DoctorHeaderBar';
import { MenuBadge } from '@/components/ui/menu-badge';

export default async function DoctorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.user_metadata.role !== 'DOCTOR') {
    redirect('/auth/login');
  }

  const { data: doctorProfile } = await supabase
    .from('doctors')
    .select('id, first_name, last_name')
    .eq('user_id', user.id)
    .single();
    
  const initials = doctorProfile
    ? `Dr. ${doctorProfile.last_name[0]}`.toUpperCase()
    : '??';

  const signOut = async () => {
    'use server';
    const supabase = createClient();
    await supabase.auth.signOut();
    redirect('/auth/login');
  };

  return (
    <div className="flex min-h-screen">
      {/* Conteneur principal avec barre latérale et contenu */}
      <div className="flex w-full">
        {/* Barre de navigation à gauche pour le médecin - Version élargie avec labels */}
        <nav className="w-24 bg-gray-900 text-white flex flex-col p-3 fixed h-screen z-30">
          <div className="text-center mb-6">
            <div className="mx-auto w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-sm font-bold">
              {initials}
            </div>
          </div>

          <ul className="flex-grow space-y-4">
            <li>
              <Link href="/dashboard/doctor" className="flex flex-col items-center p-2 rounded hover:bg-gray-700 group">
                <div className="w-6 h-6 mb-1 flex items-center justify-center">
                  <LayoutDashboard size={20} />
                </div>
                <span className="text-xs opacity-80 group-hover:opacity-100">Dashboard</span>
              </Link>
            </li>
            <li>
              <Link href="/dashboard/doctormodern" className="flex flex-col items-center p-2 rounded hover:bg-gray-700 group">
                <div className="w-6 h-6 mb-1 flex items-center justify-center">
                  <Sparkles size={20} />
                </div>
                <span className="text-xs opacity-80 group-hover:opacity-100">Workspace</span>
              </Link>
            </li>
            <li>
              <Link href="/dashboard/doctor/agenda" className="flex flex-col items-center p-2 rounded hover:bg-gray-700 group">
                <div className="w-6 h-6 mb-1 flex items-center justify-center">
                  <Calendar size={20} />
                </div>
                <span className="text-xs opacity-80 group-hover:opacity-100">Agenda</span>
              </Link>
            </li>
            <li>
              <Link href="/dashboard/doctor/taches" className="flex flex-col items-center p-2 rounded hover:bg-gray-700 group">
                <div className="w-6 h-6 mb-1 flex items-center justify-center">
                  <CheckSquare size={20} />
                </div>
                <span className="text-xs opacity-80 group-hover:opacity-100">Tâches</span>
              </Link>
            </li>
            <li>
              <MenuBadge>
                <Link href="/dashboard/doctor/messagerie" className="flex flex-col items-center p-2 rounded hover:bg-gray-700 group">
                  <div className="w-6 h-6 mb-1 flex items-center justify-center">
                    <MessageSquare size={20} />
                  </div>
                  <span className="text-xs opacity-80 group-hover:opacity-100">Messagerie</span>
                </Link>
              </MenuBadge>
            </li>
            <li>
              <Link href="/dashboard/doctor/patients" className="flex flex-col items-center p-2 rounded hover:bg-gray-700 group">
                <div className="w-6 h-6 mb-1 flex items-center justify-center">
                  <Users size={20} />
                </div>
                <span className="text-xs opacity-80 group-hover:opacity-100">Patients</span>
              </Link>
            </li>
            <li>
              <Link href="/dashboard/doctor/invitations" className="flex flex-col items-center p-2 rounded hover:bg-gray-700 group">
                <div className="w-6 h-6 mb-1 flex items-center justify-center">
                  <Users size={20} />
                </div>
                <span className="text-xs opacity-80 group-hover:opacity-100">Association</span>
              </Link>
            </li>
          </ul>
          
          <form action={signOut}>
            <button type="submit" className="w-full flex flex-col items-center p-2 rounded hover:bg-red-700 group" title="Déconnexion">
              <div className="w-6 h-6 mb-1 flex items-center justify-center">
                <LogOut size={20} />
              </div>
              <span className="text-xs opacity-80 group-hover:opacity-100">Déconnexion</span>
            </button>
          </form>
        </nav>

        {/* Contenu principal avec barre horizontale */}
        <div className="flex-1 flex flex-col">
          {/* Barre horizontale supérieure fixe */}
          <div className="relative sticky top-0 z-20">
            {/* Barre horizontale supérieure */}
            <DoctorHeaderBar doctor={doctorProfile} />
          </div>
          
          {/* Contenu principal de la page */}
          <main className="flex-1 bg-gray-50 ml-24 overflow-auto px-2">
            <div className="max-w-7xl mx-auto py-2">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}