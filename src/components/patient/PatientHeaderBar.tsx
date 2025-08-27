'use client';

import { useState, useRef, useEffect } from 'react';
import { Settings, Bell, Home } from 'lucide-react';
import { useRouter } from 'next/navigation';

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
    <header className="bg-gray-900 text-white flex items-center justify-between rounded-none w-full py-3 px-6">
      {/* Section gauche - Logo et navigation */}
      <div className="flex items-center space-x-4">
        {/* Logo/Accueil */}
        <button
          onClick={handleHomeClick}
          className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-800 transition-colors"
          title="Accueil"
        >
          <Home className="w-6 h-6 text-white" />
          <span className="text-lg font-bold">Somnolink</span>
        </button>
      </div>

      {/* Section droite - Notifications et paramètres */}
      <div className="flex items-center space-x-3">
        {/* Notifications */}
        <button className="p-2 rounded-lg hover:bg-gray-800 transition-colors" title="Notifications">
          <Bell className="w-5 h-5 text-gray-300" />
        </button>

        {/* Paramètres */}
        <button
          className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
          title="Paramètres"
          onClick={handleSettingsClick}
        >
          <Settings className="w-5 h-5 text-gray-300" />
        </button>

        {/* Nom du patient */}
        {patient && (
          <div className="ml-2">
            <p className="text-sm font-medium text-white">
              {patient.first_name} {patient.last_name}
            </p>
          </div>
        )}
      </div>

      {/* Menu déroulant paramètres */}
      {isSettingsOpen && (
        <div ref={settingsMenuRef} className="absolute right-4 top-16 bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50">
          <button 
            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
            onClick={() => router.push('/dashboard/patient/profil')}
          >
            Mon profil
          </button>
          <button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50">
            Préférences de notification
          </button>
          <button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50">
            Aide et support
          </button>
        </div>
      )}
    </header>
  );
}