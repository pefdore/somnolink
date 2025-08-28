'use client';

import { useState, useEffect } from 'react';
import { User, Calendar, Shield, AlertTriangle, Pill, Plus } from 'lucide-react';

interface Patient {
  id: string;
  civility: string | null;
  first_name: string | null;
  last_name: string | null;
  date_of_birth: string | null;
  social_security_number: string | null;
  allergies: {
    description: string;
    entries: Array<{
      code: string;
      system: string;
      label: string;
      definedBy: 'patient' | 'doctor';
      note: string;
      creatorName?: string;
      createdAt?: string;
    }>;
  } | null;
  email: string | null;
  phone: string | null;
  birth_name: string | null;
  attending_doctor_first_name: string | null;
  attending_doctor_last_name: string | null;
  appointments?: Array<{
    questionnaires?: Array<{
      id: string;
      title?: string;
      completed_at?: string;
    }>;
  }>;
  documents?: Array<{
    id: string;
    type?: string;
    name?: string;
    created_at?: string;
    uploaded_by?: string;
  }>;
  prescriptions?: Array<{
    id: string;
    type?: string;
    name?: string;
    created_at?: string;
  }>;
  notes?: Array<{
    id: string;
    content: string;
    created_at: string;
    doctors?: {
      first_name?: string;
      last_name?: string;
    };
  }>;
  medical_history?: {
    description: string;
    entries: Array<{
      code?: string;
      system?: string;
      label?: string;
      type?: string;
      note?: string;
    }>;
  };
  surgical_history?: {
    description: string;
    entries: Array<{
      code?: string;
      system?: string;
      label?: string;
      type?: string;
      note?: string;
    }>;
  };
  // Pour le statut sommeil, nous allons le déterminer dynamiquement
}

interface PatientInfoPanelProps {
  patient: Patient;
}

const calculateAge = (birthDate: string | null): number | string => {
  if (!birthDate) return 'N/A';
  const birth = new Date(birthDate);
  if (isNaN(birth.getTime())) return '—';
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDifference = today.getMonth() - birth.getMonth();
  if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

const getSleepStatus = (patient: Patient) => {
  // Logique avancée pour déterminer le statut sommeil basée sur les données réelles
  const hasQuestionnaires = patient.appointments?.some((appt) =>
    (appt.questionnaires?.length ?? 0) > 0
  );
  
  const hasPgvDocuments = patient.documents?.some((doc) =>
    doc.type === 'pgv' || doc.name?.toLowerCase().includes('pgv')
  );
  
  const hasPrescriptions = (patient.prescriptions?.length ?? 0) > 0;
  
  // Logique de détermination du statut
  if (hasPgvDocuments) {
    // Vérifier si le patient a une prescription PPC ou OAM
    const hasCpapPrescription = patient.prescriptions?.some((pres) =>
      pres.type === 'cpap' || pres.name?.toLowerCase().includes('ppc')
    );
    
    const hasOamPrescription = patient.prescriptions?.some((pres) =>
      pres.type === 'oam' || pres.name?.toLowerCase().includes('oam')
    );
    
    if (hasCpapPrescription) {
      return { status: 'Appareillé PPC', color: 'green', icon: '💤' };
    }
    if (hasOamPrescription) {
      return { status: 'OAM', color: 'blue', icon: '😴' };
    }
    return { status: 'PGV réalisé - En attente prescription', color: 'yellow', icon: '⏳' };
  }
  
  if (hasQuestionnaires) {
    return { status: 'Questionnaires complétés - En attente PGV', color: 'orange', icon: '📝' };
  }
  
  if (hasPrescriptions) {
    // Vérifier le type de prescription
    const hasSleepPrescription = patient.prescriptions?.some((pres) =>
      pres.type?.includes('sleep') || pres.name?.toLowerCase().includes('sommeil')
    );
    
    if (hasSleepPrescription) {
      return { status: 'Traitement sommeil prescrit', color: 'purple', icon: '💊' };
    }
  }
  
  // Statut par défaut si aucune donnée spécifique
  return { status: 'En dépistage initial', color: 'gray', icon: '🔍' };
};

const formatName = (civility: string | null, firstName: string | null, lastName: string | null) => {
  return `${civility || ''} ${firstName || ''} ${lastName || ''}`.trim();
};

// Fonction pour afficher les antécédents médicaux
const renderMedicalHistory = (medicalHistory: Patient['medical_history']) => {
  if (!medicalHistory || !medicalHistory.entries || medicalHistory.entries.length === 0) {
    return <p>• Aucun antécédent médical renseigné</p>;
  }

  return medicalHistory.entries.slice(0, 3).map((entry, index: number) => (
    <p key={index}>• {entry.label || 'Antécédent médical'}</p>
  ));
};

// Fonction pour afficher les antécédents chirurgicaux
const renderSurgicalHistory = (surgicalHistory: Patient['surgical_history']) => {
  if (!surgicalHistory || !surgicalHistory.entries || surgicalHistory.entries.length === 0) {
    return <p>• Aucun antécédent chirurgical renseigné</p>;
  }

  return surgicalHistory.entries.slice(0, 3).map((entry, index: number) => (
    <p key={index}>• {entry.label || 'Antécédent chirurgical'}</p>
  ));
};

// Fonction utilitaire pour mapper les couleurs aux classes Tailwind
const getStatusColorClass = (color: string) => {
  switch (color) {
    case 'green': return 'bg-green-100 text-green-800';
    case 'blue': return 'bg-blue-100 text-blue-800';
    case 'orange': return 'bg-orange-100 text-orange-800';
    case 'yellow': return 'bg-yellow-100 text-yellow-800';
    case 'purple': return 'bg-purple-100 text-purple-800';
    case 'gray': return 'bg-gray-100 text-gray-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export default function PatientInfoPanel({ patient }: PatientInfoPanelProps) {
  const sleepStatus = getSleepStatus(patient);
  const age = calculateAge(patient.date_of_birth);
  const [showMedicalSearch, setShowMedicalSearch] = useState(false);
  const [showSurgicalSearch, setShowSurgicalSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState<'medical' | 'surgical'>('medical');

  const handleAddAntecedent = (type: 'medical' | 'surgical') => {
    setSearchType(type);
    if (type === 'medical') {
      setShowMedicalSearch(true);
      setShowSurgicalSearch(false);
    } else {
      setShowSurgicalSearch(true);
      setShowMedicalSearch(false);
    }
  };

  const handleSearchCim = async (term: string): Promise<Array<{ code: string; label: string; system?: string }>> => {
    if (term.length < 3) {
      return [];
    }
    
    try {
      const response = await fetch(`/api/terminology-search?q=${encodeURIComponent(term)}`);
      if (!response.ok) {
        throw new Error('Erreur de recherche CIM');
      }
      const results = await response.json();
      return results;
    } catch (error) {
      console.error('Erreur lors de la recherche CIM:', error);
      // Fallback vers des données simulées en cas d'erreur
      return [
        { code: 'I10', label: 'Hypertension essentielle (primitive)' },
        { code: 'E11', label: 'Diabète sucré de type 2' },
        { code: 'J45', label: 'Asthme' }
      ].filter(item => item.label.toLowerCase().includes(term.toLowerCase()));
    }
  };

  const handleSelectCim = async (item: { code: string; label: string; system?: string }): Promise<void> => {
    try {
      console.log(`Ajout d'antécédent: ${item.label} (${item.code}) pour ${searchType}`);
      
      const response = await fetch('/api/antecedents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patientId: patient.id,
          code: item.code,
          system: item.system || 'CIM-11',
          label: item.label,
          type: searchType,
          note: `Ajouté via recherche CIM`
        })
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'ajout de l\'antécédent');
      }

      const result = await response.json();
      console.log('Antécédent ajouté avec succès:', result);

      // Recharger les données du patient pour afficher le nouvel antécédent
      // Vous pourriez vouloir implémenter une mise à jour locale de l'état ici

    } catch (error) {
      console.error('Erreur lors de l\'ajout de l\'antécédent:', error);
      alert('Erreur lors de l\'ajout de l\'antécédent. Veuillez réessayer.');
    } finally {
      setShowMedicalSearch(false);
      setShowSurgicalSearch(false);
      setSearchTerm('');
    }
  };

  const CimSearchModal = () => {
    const [searchResults, setSearchResults] = useState<Array<{ code: string; label: string }>>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
      const searchCim = async () => {
        if (searchTerm.length < 3) {
          setSearchResults([]);
          setError(null);
          return;
        }

        setIsLoading(true);
        setError(null);
        
        try {
          const results = await handleSearchCim(searchTerm);
          setSearchResults(results);
        } catch (err) {
          setError('Erreur lors de la recherche. Veuillez réessayer.');
          console.error('Erreur recherche CIM:', err);
        } finally {
          setIsLoading(false);
        }
      };

      const debounceTimer = setTimeout(searchCim, 300);
      return () => clearTimeout(debounceTimer);
    }, [searchTerm]);

    if (!showMedicalSearch && !showSurgicalSearch) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg w-96">
          <h3 className="text-lg font-semibold mb-4">
            Recherche CIM - Antécédents {searchType === 'medical' ? 'médicaux' : 'chirurgicaux'}
          </h3>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher dans la CIM-11..."
            className="w-full p-2 border border-gray-300 rounded mb-4"
            autoFocus
          />
          
          <div className="max-h-60 overflow-y-auto">
            {isLoading && (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-sm text-gray-600 mt-2">Recherche en cours...</p>
              </div>
            )}
            
            {error && (
              <div className="text-red-600 text-sm p-2 bg-red-50 rounded mb-2">
                {error}
              </div>
            )}
            
            {!isLoading && searchTerm.length >= 3 && searchResults.length === 0 && !error && (
              <div className="text-gray-500 text-sm p-2 text-center">
                Aucun résultat trouvé pour "{searchTerm}"
              </div>
            )}
            
            {!isLoading && searchResults.map((item, index) => (
              <div
                key={index}
                className="p-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                onClick={() => handleSelectCim(item)}
              >
                <strong className="text-blue-600">{item.code}</strong> - {item.label}
              </div>
            ))}
          </div>
          
          <div className="flex justify-end space-x-2 mt-4">
            <button
              onClick={() => {
                setShowMedicalSearch(false);
                setShowSurgicalSearch(false);
                setSearchTerm('');
                setSearchResults([]);
                setError(null);
              }}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Annuler
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <aside className="w-80 bg-white border-l border-gray-200 p-6 fixed left-24 top-16 h-[calc(100vh-4rem)] overflow-y-auto">
      {/* En-tête du patient */}
      <div className="mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <User className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {formatName(patient.civility, patient.first_name, patient.last_name)}
            </h2>
            <div className="mt-1 flex items-center space-x-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColorClass(sleepStatus.color)}`}>
                <span className="mr-1">{sleepStatus.icon}</span>
                {sleepStatus.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Informations de base */}
      <div className="space-y-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-blue-800 mb-2 flex items-center">
            <Shield className="w-4 h-4 mr-2" />
            Informations de base
          </h3>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-blue-700">Âge</span>
              <span className="font-medium">{age} ans</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-700">NSS</span>
              <span className="font-medium">{patient.social_security_number || 'Non renseigné'}</span>
            </div>
            {patient.date_of_birth && (
              <div className="flex justify-between">
                <span className="text-blue-700">Naissance</span>
                <span className="font-medium">
                  {new Date(patient.date_of_birth).toLocaleDateString('fr-FR')}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Allergies */}
        <div className="bg-red-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-red-800 mb-2 flex items-center">
            <AlertTriangle className="w-4 h-4 mr-2" />
            Allergies
          </h3>
          <p className="text-sm text-red-700">
            {patient.allergies?.entries && patient.allergies.entries.length > 0
              ? patient.allergies.entries.map(entry => entry.label).join(', ')
              : 'Aucune allergie connue'}
          </p>
          {patient.allergies?.entries && patient.allergies.entries.length > 0 && (
            <button className="text-red-600 text-xs hover:underline mt-2">
              Voir tous les détails →
            </button>
          )}
        </div>

        {/* Antécédents médicaux (version condensée) */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-800 mb-2 flex items-center">
            <Calendar className="w-4 h-4 mr-2" />
            Antécédents
          </h3>
          <div className="space-y-1 text-sm text-gray-600">
            {/* Antécédents médicaux */}
            <div className="mb-2">
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-xs font-medium text-gray-700">Médicaux:</h4>
                <button
                  onClick={() => handleAddAntecedent('medical')}
                  className="text-blue-600 hover:text-blue-800 text-xs flex items-center"
                >
                  <Plus className="w-3 h-3 mr-1" /> Ajouter
                </button>
              </div>
              {renderMedicalHistory(patient.medical_history)}
            </div>
            
            {/* Antécédents chirurgicaux */}
            <div className="mb-2">
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-xs font-medium text-gray-700">Chirurgicaux:</h4>
                <button
                  onClick={() => handleAddAntecedent('surgical')}
                  className="text-blue-600 hover:text-blue-800 text-xs flex items-center"
                >
                  <Plus className="w-3 h-3 mr-1" /> Ajouter
                </button>
              </div>
              {renderSurgicalHistory(patient.surgical_history)}
            </div>
            
            <button className="text-blue-600 text-xs hover:underline mt-2">
              Voir tous les antécédents →
            </button>
          </div>
        </div>

        {/* Traitements en cours */}
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-green-800 mb-2 flex items-center">
            <Pill className="w-4 h-4 mr-2" />
            Traitements en cours
          </h3>
          <p className="text-sm text-green-700">
            Aucun traitement renseigné
          </p>
          <button className="text-green-600 text-xs hover:underline mt-2">
            Ajouter un traitement →
          </button>
        </div>

        {/* Dernière consultation */}
        <div className="bg-purple-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-purple-800 mb-2">
            Dernière consultation
          </h3>
          <p className="text-sm text-purple-700">
            Non renseignée
          </p>
        </div>
      </div>

      {/* Actions rapides */}
      <div className="mt-6 space-y-2">
        <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
          Prendre un rendez-vous
        </button>
        <button className="w-full border border-blue-600 text-blue-600 py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors">
          Envoyer un message
        </button>
      </div>

      {/* Modal de recherche CIM */}
      <CimSearchModal />
    </aside>
  );
}