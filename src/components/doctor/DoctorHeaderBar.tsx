'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Settings, UserPlus, Bell, Search, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface DoctorHeaderBarProps {
  doctor?: {
    id: string;
    first_name: string;
    last_name: string;
  } | null;
}

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
}

export default function DoctorHeaderBar({ doctor }: DoctorHeaderBarProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const settingsMenuRef = useRef<HTMLDivElement>(null);

  const searchPatients = useCallback(async (query: string) => {
    if (!query.trim() || !doctor?.id) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    try {
      const { data, error } = await supabase
        .from('patients')
        .select(`
          id,
          first_name,
          last_name,
          appointments!inner ( doctor_id )
        `)
        .eq('appointments.doctor_id', doctor.id)
        .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%`)
        .limit(10);

      if (error) {
        console.error('Erreur de recherche:', error);
        setSearchResults([]);
        setShowResults(true); // Afficher le dropdown même en cas d'erreur
      } else {
        // Extraire les données patients de la réponse, qui peut inclure les rendez-vous
        const patients = data ? data.map(patient => ({
          id: patient.id,
          first_name: patient.first_name,
          last_name: patient.last_name
        })) : [];
        setSearchResults(patients);
        setShowResults(true); // Toujours afficher le dropdown
      }
    } catch (error) {
      console.error('Erreur de recherche:', error);
      setSearchResults([]);
      setShowResults(true); // Afficher le dropdown même en cas d'erreur
    } finally {
      setIsSearching(false);
    }
  }, [doctor?.id, supabase]);

  useEffect(() => {
    if (searchQuery.length < 3) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }
    setShowResults(true); // Afficher le dropdown immédiatement quand la recherche commence
    const handler = setTimeout(() => {
      searchPatients(searchQuery);
    }, 300);

    return () => clearTimeout(handler);
  }, [searchQuery, searchPatients]);

  const handlePatientSelect = (patientId: string) => {
    setSearchQuery('');
    setShowResults(false);
    router.push(`/dashboard/doctor/patients/${patientId}`);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowResults(false);
  };

  // Fermer les dropdowns quand on clique à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Fermer le dropdown de recherche si on clique en dehors
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
      
      // Fermer le menu paramètres si on clique en dehors
      if (settingsMenuRef.current && !settingsMenuRef.current.contains(event.target as Node)) {
        setIsSettingsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="bg-gray-900 text-white flex items-center justify-between rounded-none w-full py-3">
      {/* Section gauche - Recherche et actions rapides */}
      <div className="flex items-center space-x-4 pl-28">
        {/* Barre de recherche avec résultats */}
        <div className="relative" ref={searchContainerRef}>
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher un patient..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-700 bg-gray-800 text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
              onFocus={() => setShowResults(true)}
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Dropdown des résultats de recherche */}
          {showResults && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-40 max-h-60 overflow-y-auto" style={{ minWidth: '300px' }}>
              {isSearching ? (
                <div className="p-4 text-center text-gray-500">
                  Recherche en cours...
                </div>
              ) : searchResults.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  Aucun patient trouvé
                </div>
              ) : (
                <div className="py-1">
                  {searchResults.map((patient) => (
                    <button
                      key={patient.id}
                      onClick={() => handlePatientSelect(patient.id)}
                      className="w-full text-left px-4 py-2 text-sm text-gray-800 hover:bg-gray-100"
                    >
                      {patient.first_name} {patient.last_name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bouton nouveau patient rond */}
        <button
          className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors"
          title="Nouveau patient"
        >
          <UserPlus className="w-5 h-5" />
        </button>
      </div>

      {/* Section droite - Notifications et paramètres */}
      <div className="flex items-center space-x-3 pr-6">
        {/* Notifications */}
        <button className="p-2 rounded-lg hover:bg-gray-800 transition-colors" title="Notifications">
          <Bell className="w-5 h-5 text-gray-300" />
        </button>

        {/* Paramètres */}
        <button
          className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
          title="Paramètres"
          onClick={() => setIsSettingsOpen(!isSettingsOpen)}
        >
          <Settings className="w-5 h-5 text-gray-300" />
        </button>

        {/* Nom du médecin */}
        {doctor && (
          <div className="ml-2">
            <p className="text-sm font-medium text-white">
              Dr. {doctor.first_name} {doctor.last_name}
            </p>
          </div>
        )}
      </div>

      {/* Menu déroulant paramètres (à implémenter) */}
      {isSettingsOpen && (
        <div ref={settingsMenuRef} className="absolute right-4 top-16 bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50">
          <button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50">
            Paramètres du compte
          </button>
          <button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50">
            Préférences d'affichage
          </button>
          <button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50">
            Aide et support
          </button>
        </div>
      )}
    </header>
  );
}