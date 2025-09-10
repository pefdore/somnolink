'use client';

import { useState, useEffect, useCallback } from 'react';
import { searchCISP2Dataset } from '@/data/cisp2-dataset';

interface CimSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (item: { code: string; label: string; system?: string }) => void;
  title?: string;
  type?: 'medical' | 'surgical';
}

type ClassificationSystem = 'CIM-11' | 'CISP-2';

const CimSearchModal: React.FC<CimSearchModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  title = "Recherche Classification",
  type = 'medical'
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ code: string; label: string; system?: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSystem, setSelectedSystem] = useState<ClassificationSystem>('CIM-11');

  const handleSearch = useCallback(async (term: string, system: ClassificationSystem): Promise<Array<{ code: string; label: string; system?: string }>> => {
    if (term.length < 2) {
      return [];
    }

    if (system === 'CISP-2') {
      // Recherche dans le dataset CISP-2 local
      const results = searchCISP2Dataset(term);
      return results.map(item => ({
        code: item.code,
        label: item.label,
        system: 'CISP-2'
      }));
    } else {
      // Recherche CIM-11 via API
      try {
        const response = await fetch(`/api/terminology-search?q=${encodeURIComponent(term)}&system=CIM-11`);
        if (!response.ok) {
          throw new Error('Erreur de recherche CIM-11');
        }
        const results = await response.json();
        return results.map((item: any) => ({
          ...item,
          system: 'CIM-11'
        }));
      } catch (error) {
        console.error('Erreur lors de la recherche CIM-11:', error);
        // Fallback vers des données simulées en cas d'erreur
        return [
          { code: 'I10', label: 'Hypertension essentielle (primitive)', system: 'CIM-11' },
          { code: 'E11', label: 'Diabète sucré de type 2', system: 'CIM-11' },
          { code: 'J45', label: 'Asthme', system: 'CIM-11' },
          { code: 'I25', label: 'Maladie ischémique chronique du cœur', system: 'CIM-11' },
          { code: 'J44', label: 'Autre maladie pulmonaire obstructive chronique', system: 'CIM-11' }
        ].filter(item => item.label.toLowerCase().includes(term.toLowerCase()));
      }
    }
  }, []);

  useEffect(() => {
    const searchTerminology = async () => {
      if (searchTerm.length < 2) {
        setSearchResults([]);
        setError(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const results = await handleSearch(searchTerm, selectedSystem);
        setSearchResults(results);
      } catch (err) {
        setError('Erreur lors de la recherche. Veuillez réessayer.');
        console.error('Erreur recherche:', err);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchTerminology, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm, selectedSystem, handleSearch]);

  const handleSelect = (item: { code: string; label: string; system?: string }) => {
    onSelect({ ...item, system: item.system || selectedSystem });
    onClose();
    setSearchTerm('');
    setSearchResults([]);
    setError(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-96 max-h-[80vh] overflow-hidden flex flex-col">
        <h3 className="text-lg font-semibold mb-4">
          {title} - Antécédents {type === 'medical' ? 'médicaux' : 'chirurgicaux'}
        </h3>

        {/* Sélecteur de système de classification */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setSelectedSystem('CIM-11')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              selectedSystem === 'CIM-11'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            CIM-11
          </button>
          <button
            onClick={() => setSelectedSystem('CISP-2')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              selectedSystem === 'CISP-2'
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            CISP-2
          </button>
        </div>

        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={`Rechercher dans ${selectedSystem}...`}
          className="w-full p-2 border border-gray-300 rounded mb-4"
          autoFocus
        />

        <div className="flex-1 overflow-y-auto">
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

          {!isLoading && searchTerm.length >= 2 && searchResults.length === 0 && !error && (
            <div className="text-gray-500 text-sm p-2 text-center">
              Aucun résultat trouvé pour "{searchTerm}" dans {selectedSystem}
            </div>
          )}

          {!isLoading && searchResults.map((item, index) => (
            <div
              key={index}
              className="p-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
              onClick={() => handleSelect(item)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <strong className={`${
                    selectedSystem === 'CIM-11' ? 'text-blue-600' : 'text-green-600'
                  }`}>
                    {item.code}
                  </strong> - {item.label}
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  selectedSystem === 'CIM-11'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-green-100 text-green-800'
                }`}>
                  {selectedSystem}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end space-x-2 mt-4 pt-4 border-t">
          <button
            onClick={() => {
              onClose();
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

export default CimSearchModal;