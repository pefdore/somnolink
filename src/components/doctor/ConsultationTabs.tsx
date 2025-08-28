'use client';

import { useState } from 'react';
import { FileText, ClipboardList } from 'lucide-react';

interface ConsultationTabsProps {
  consultationType: string;
}

const tabs = [
  { id: 'consultation-note', label: 'Note de consultation', icon: FileText },
  { id: 'questionnaire', label: 'Questionnaire', icon: ClipboardList },
];

export default function ConsultationTabs({ consultationType }: ConsultationTabsProps) {
  const [activeTab, setActiveTab] = useState('consultation-note');

  return (
    <div className="h-full flex flex-col">
      {/* Menu horizontal des onglets */}
      <div className="flex border-b border-gray-200">
        {tabs.map((tab) => {
          const IconComponent = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                isActive
                  ? 'border-blue-500 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <IconComponent className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Contenu des onglets */}
      <div className="flex-1 p-6">
        {activeTab === 'consultation-note' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Note de consultation - {consultationType}</h2>
            <p className="text-gray-600">
              Interface pour la note de consultation. Ici vous pourrez rédiger le compte-rendu de la consultation.
            </p>
            {/* TODO: Implémenter l'éditeur de note de consultation */}
          </div>
        )}

        {activeTab === 'questionnaire' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Questionnaire - {consultationType}</h2>
            <p className="text-gray-600">
              Interface pour le questionnaire. Ici vous pourrez gérer les questionnaires spécifiques à ce type de consultation.
            </p>
            {/* TODO: Implémenter l'interface de questionnaire */}
          </div>
        )}
      </div>
    </div>
  );
}