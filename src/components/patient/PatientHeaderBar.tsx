'use client';

import { useState, useRef, useEffect } from 'react';
import { Settings, Bell, Home } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useNotifications } from '@/hooks/useNotifications';

interface PatientHeaderBarProps {
  patient?: {
    id: string;
    first_name: string;
    last_name: string;
  } | null;
}

export default function PatientHeaderBar({ patient }: PatientHeaderBarProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const router = useRouter();
  const settingsMenuRef = useRef<HTMLDivElement>(null);
  const { unreadCount } = useNotifications();

  // Fermer le menu paramètres quand on clique à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsMenuRef.current && !settingsMenuRef.current.contains(event.target as Node)) {
        setIsSettingsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleHomeClick = () => {
    router.push('/dashboard/patient');
  };

  const handleSettingsClick = () => {
    setIsSettingsOpen(!isSettingsOpen);
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3">
      {/* Container principal avec max-width */}
      <div className="max-w-7xl mx-auto flex items-center justify-between">

        {/* Section gauche - Logo et titre */}
        <div className="flex items-center space-x-4">
          <button
            onClick={handleHomeClick}
            className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
            title="Accueil"
          >
            <Home className="w-5 h-5 text-gray-600" />
            <span className="text-lg font-medium text-gray-900">
              Somnolink
            </span>
          </button>
        </div>

        {/* Section centrale - Informations contextuelles */}
        <div className="hidden md:flex items-center space-x-4">
          <span className="text-sm text-gray-600">
            {new Date().toLocaleDateString('fr-FR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long'
            })}
          </span>
        </div>

        {/* Section droite - Actions et profil */}
        <div className="flex items-center space-x-3">
          {/* Bouton d'urgence sobre */}
          <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors" title="Urgence">
            <span className="text-lg">🚨</span>
          </button>

          {/* Notifications avec badge sobre */}
          <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <Bell className="w-5 h-5 text-gray-600" />
            {unreadCount > 0 && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-medium">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              </div>
            )}
          </button>

          {/* Paramètres avec menu sobre */}
          <div className="relative">
            <button
              onClick={handleSettingsClick}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title="Paramètres"
            >
              <Settings className="w-5 h-5 text-gray-600" />
            </button>

            {/* Menu déroulant sobre */}
            {isSettingsOpen && (
              <div ref={settingsMenuRef} className="absolute right-0 top-12 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50">
                <div className="px-3 py-2 border-b border-gray-200">
                  <p className="text-sm font-medium text-gray-900">Paramètres</p>
                </div>

                <button
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors flex items-center"
                  onClick={() => router.push('/dashboard/patient/profil')}
                >
                  <span className="mr-3">👤</span>
                  <span>Mon profil</span>
                </button>

                <button className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors flex items-center">
                  <span className="mr-3">🔔</span>
                  <span>Notifications</span>
                </button>

                <button className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors flex items-center">
                  <span className="mr-3">❓</span>
                  <span>Aide & Support</span>
                </button>
              </div>
            )}
          </div>

          {/* Profil utilisateur sobre */}
          {patient && (
            <div className="flex items-center space-x-3 ml-4 pl-4 border-l border-gray-200">
              <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center text-gray-700 font-medium text-sm">
                {patient.first_name[0]}{patient.last_name[0]}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-gray-900">
                  {patient.first_name}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}