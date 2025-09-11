"use client";

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { X, Search, User } from 'lucide-react';

interface Doctor {
  id: string;
  nom: string;
  prenom: string;
  specialite: string;
  ville: string;
  departement: string;
  numero_rpps: string;
  fullName: string;
  displayName: string;
}

interface DoctorAutocompleteProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  className?: string;
}

export default function DoctorAutocomplete({
  value = '',
  onChange,
  placeholder = "Rechercher un médecin...",
  label = "Médecin traitant",
  required = false,
  className = ''
}: DoctorAutocompleteProps) {
  const [query, setQuery] = useState('');
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Recherche de médecins
  const searchDoctors = async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setDoctors([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/doctor-search?q=${encodeURIComponent(searchQuery)}&limit=10`);
      if (response.ok) {
        const data = await response.json();
        setDoctors(data.doctors || []);
        setIsOpen(true);
      } else {
        console.error('Erreur lors de la recherche de médecins');
        setDoctors([]);
      }
    } catch (error) {
      console.error('Erreur réseau:', error);
      setDoctors([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query) {
        searchDoctors(query);
      } else {
        setDoctors([]);
        setIsOpen(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Fermer le dropdown quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sélection d'un médecin
  const handleSelectDoctor = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setQuery(doctor.displayName);
    onChange(doctor.numero_rpps); // On stocke le numéro RPPS comme valeur
    setIsOpen(false);
  };

  // Effacer la sélection
  const handleClear = () => {
    setSelectedDoctor(null);
    setQuery('');
    onChange('');
    setDoctors([]);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  // Gestion des changements de l'input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setQuery(newValue);

    // Si l'utilisateur efface complètement, on réinitialise
    if (!newValue) {
      setSelectedDoctor(null);
      onChange('');
    }
  };

  return (
    <div className={`relative ${className}`}>
      {label && (
        <Label htmlFor="doctor-search" className="block text-sm font-medium mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
      )}

      <div className="relative">
        <div className="relative">
          <Input
            ref={inputRef}
            id="doctor-search"
            type="text"
            value={query}
            onChange={handleInputChange}
            onFocus={() => {
              if (doctors.length > 0) {
                setIsOpen(true);
              }
            }}
            placeholder={placeholder}
            className="pr-10"
            autoComplete="off"
          />

          <div className="absolute inset-y-0 right-0 flex items-center pr-3 space-x-1">
            {isLoading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
            )}
            {query && (
              <button
                type="button"
                onClick={handleClear}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            {!query && (
              <Search className="h-4 w-4 text-gray-400" />
            )}
          </div>
        </div>

        {/* Dropdown des résultats */}
        {isOpen && doctors.length > 0 && (
          <div
            ref={dropdownRef}
            className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto"
          >
            {doctors.map((doctor) => (
              <button
                key={doctor.id}
                type="button"
                onClick={() => handleSelectDoctor(doctor)}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0"
              >
                <div className="flex items-start space-x-3">
                  <User className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">
                      Dr. {doctor.prenom} {doctor.nom}
                    </div>
                    <div className="text-sm text-gray-500 truncate">
                      {doctor.specialite} • {doctor.ville} ({doctor.departement})
                    </div>
                    <div className="text-xs text-gray-400">
                      RPPS: {doctor.numero_rpps}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Message quand aucun résultat */}
        {isOpen && query.length >= 2 && doctors.length === 0 && !isLoading && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg p-4 text-center text-gray-500">
            Aucun médecin trouvé pour "{query}"
          </div>
        )}
      </div>

      {/* Valeur cachée pour le formulaire */}
      <input
        type="hidden"
        name="treating_physician_id"
        value={value}
      />
    </div>
  );
}