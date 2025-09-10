'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, CheckCircle, Clock, User } from 'lucide-react';
import CimSearchModal from '@/components/shared/CimSearchModal';

interface Antecedent {
  id: string;
  code: string;
  label: string;
  type: 'medical' | 'surgical';
  note?: string;
  defined_by: 'patient' | 'doctor';
  validated_by_doctor: boolean;
  created_at: string;
}

interface AntecedentsManagerProps {
  patientId: string;
  onChange?: (antecedents: Antecedent[]) => void;
}

const AntecedentsManager: React.FC<AntecedentsManagerProps> = ({
  patientId,
  onChange
}) => {
  const [antecedents, setAntecedents] = useState<Antecedent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCimModal, setShowCimModal] = useState(false);
  const [selectedType, setSelectedType] = useState<'medical' | 'surgical'>('medical');
  const [message, setMessage] = useState('');

  // Charger les antécédents existants
  useEffect(() => {
    loadAntecedents();
  }, [patientId]);

  const loadAntecedents = async () => {
    try {
      const response = await fetch('/api/patient-antecedents');
      if (response.ok) {
        const data = await response.json();
        setAntecedents(data.antecedents || []);
        onChange?.(data.antecedents || []);
      }
    } catch (error) {
      console.error('Erreur chargement antécédents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAntecedent = (type: 'medical' | 'surgical') => {
    setSelectedType(type);
    setShowCimModal(true);
  };

  const handleCimSelect = async (item: { code: string; label: string; system?: string }) => {
    try {
      const response = await fetch('/api/patient-antecedents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: item.code,
          system: item.system,
          label: item.label,
          type: selectedType,
          note: ''
        })
      });

      if (response.status === 409) {
        setMessage('Cet antécédent existe déjà.');
        return;
      }

      if (response.ok) {
        setMessage('Antécédent ajouté avec succès !');
        await loadAntecedents();
      } else {
        const error = await response.json();
        setMessage(`Erreur: ${error.error}`);
      }
    } catch (error) {
      console.error('Erreur ajout antécédent:', error);
      setMessage('Erreur lors de l\'ajout de l\'antécédent.');
    }
  };

  const handleDeleteAntecedent = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet antécédent ?')) {
      return;
    }

    try {
      // Note: Pour les patients, on pourrait ajouter une API pour supprimer
      // leurs propres antécédents, mais pour l'instant on garde simple
      setMessage('Suppression non implémentée pour les patients.');
    } catch (error) {
      console.error('Erreur suppression:', error);
      setMessage('Erreur lors de la suppression.');
    }
  };

  const getStatusIcon = (antecedent: Antecedent) => {
    if (antecedent.validated_by_doctor) {
      return <CheckCircle className="w-4 h-4 text-green-600" />;
    } else if (antecedent.defined_by === 'doctor') {
      return <User className="w-4 h-4 text-blue-600" />;
    } else {
      return <Clock className="w-4 h-4 text-yellow-600" />;
    }
  };

  const getStatusLabel = (antecedent: Antecedent) => {
    if (antecedent.validated_by_doctor) {
      return 'Validé par médecin';
    } else if (antecedent.defined_by === 'doctor') {
      return 'Ajouté par médecin';
    } else {
      return 'Déclaré par vous';
    }
  };

  const medicalAntecedents = antecedents.filter(a => a.type === 'medical');
  const surgicalAntecedents = antecedents.filter(a => a.type === 'surgical');

  if (loading) {
    return <div className="text-center py-4">Chargement des antécédents...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Légende des statuts */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Légende des statuts :</h4>
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center space-x-1">
            <Clock className="w-3 h-3 text-yellow-600" />
            <span>Déclaré par vous</span>
          </div>
          <div className="flex items-center space-x-1">
            <CheckCircle className="w-3 h-3 text-green-600" />
            <span>Validé par médecin</span>
          </div>
          <div className="flex items-center space-x-1">
            <User className="w-3 h-3 text-blue-600" />
            <span>Ajouté par médecin</span>
          </div>
        </div>
      </div>

      {/* Antécédents médicaux */}
      <div className="bg-white p-4 rounded-lg border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Antécédents médicaux</h3>
          <button
            onClick={() => handleAddAntecedent('medical')}
            className="flex items-center space-x-2 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter</span>
          </button>
        </div>

        {medicalAntecedents.length === 0 ? (
          <p className="text-gray-500 text-sm">Aucun antécédent médical déclaré.</p>
        ) : (
          <div className="space-y-2">
            {medicalAntecedents.map((antecedent) => (
              <div key={antecedent.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(antecedent)}
                  <div>
                    <div className="font-medium text-sm">
                      {antecedent.code} - {antecedent.label}
                    </div>
                    <div className="text-xs text-gray-600">
                      {getStatusLabel(antecedent)}
                    </div>
                  </div>
                </div>
                {antecedent.defined_by === 'patient' && (
                  <button
                    onClick={() => handleDeleteAntecedent(antecedent.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Antécédents chirurgicaux */}
      <div className="bg-white p-4 rounded-lg border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Antécédents chirurgicaux</h3>
          <button
            onClick={() => handleAddAntecedent('surgical')}
            className="flex items-center space-x-2 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter</span>
          </button>
        </div>

        {surgicalAntecedents.length === 0 ? (
          <p className="text-gray-500 text-sm">Aucun antécédent chirurgical déclaré.</p>
        ) : (
          <div className="space-y-2">
            {surgicalAntecedents.map((antecedent) => (
              <div key={antecedent.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(antecedent)}
                  <div>
                    <div className="font-medium text-sm">
                      {antecedent.code} - {antecedent.label}
                    </div>
                    <div className="text-xs text-gray-600">
                      {getStatusLabel(antecedent)}
                    </div>
                  </div>
                </div>
                {antecedent.defined_by === 'patient' && (
                  <button
                    onClick={() => handleDeleteAntecedent(antecedent.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Messages */}
      {message && (
        <div className={`p-3 rounded-lg text-sm ${
          message.includes('succès') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {message}
        </div>
      )}

      {/* Modal CIM */}
      <CimSearchModal
        isOpen={showCimModal}
        onClose={() => setShowCimModal(false)}
        onSelect={handleCimSelect}
        type={selectedType}
      />
    </div>
  );
};

export default AntecedentsManager;