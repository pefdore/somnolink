'use client';

import { useState, useRef } from 'react';
import { Plus, ChevronDown } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ConsultationDropdownProps {
  patientId: string;
}

const consultationTypes = [
  { id: 'pose-machine', label: 'Pose machine', path: 'pose-machine' },
  { id: 'post-analyse', label: 'Post analyse', path: 'post-analyse' },
  { id: 'suivi-4-mois', label: 'Suivi à 4 mois', path: 'suivi-4-mois' },
  { id: 'suivi-annuel', label: 'Suivi annuel', path: 'suivi-annuel' },
  { id: 'consultation-libre', label: 'Consultation libre', path: 'consultation-libre' },
];

export default function ConsultationDropdown({ patientId }: ConsultationDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const handleConsultationClick = (consultationPath: string) => {
    setIsOpen(false);
    router.push(`/dashboard/doctor/patients/${patientId}/consultation/${consultationPath}`);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
      >
        <Plus className="w-4 h-4" />
        <span>Démarrer une consultation</span>
        <ChevronDown className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10">
          {consultationTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => handleConsultationClick(type.path)}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 first:rounded-t-md last:rounded-b-md"
            >
              {type.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}