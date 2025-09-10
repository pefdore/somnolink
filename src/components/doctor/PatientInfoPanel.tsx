'use client';

import { useState, useCallback, useEffect } from 'react';
import { User, Calendar, Shield, AlertTriangle, Pill, Edit, RefreshCw } from 'lucide-react';
import { AntecedentsManagementModal } from './AntecedentsManagementModal';
import { createClient } from '@/lib/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Patient {
  id: string;
  civility: string | null;
  first_name: string | null;
  last_name: string | null;
  date_of_birth: string | null;
  social_security_number: string | null;
  gender: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  birth_name: string | null;
  treating_physician_id?: string | null;
  attending_doctor_first_name: string | null;
  attending_doctor_last_name: string | null;
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
      definedBy?: 'patient' | 'doctor';
      validated_by_doctor?: boolean;
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
      definedBy?: 'patient' | 'doctor';
      validated_by_doctor?: boolean;
    }>;
  };
  treatments?: {
    description: string;
    entries: Array<{
      code?: string;
      system?: string;
      label?: string;
      type?: string;
      note?: string;
      definedBy?: 'patient' | 'doctor';
      validated_by_doctor?: boolean;
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

// Fonction pour afficher les antécédents médicaux avec indicateurs visuels
const renderMedicalHistory = (medicalHistory: Patient['medical_history']) => {
  if (!medicalHistory || !medicalHistory.entries || medicalHistory.entries.length === 0) {
    return <p>• Aucun antécédent médical renseigné</p>;
  }

  return medicalHistory.entries.map((entry, index: number) => {
    // Indicateurs visuels basés sur les données
    const isPatientDeclared = entry.definedBy === 'patient';
    const isValidated = entry.validated_by_doctor === true;

    let badgeText = 'M';
    let tooltipText = 'Ajouté par le médecin';
    let badgeColor = 'bg-blue-100 text-blue-800';

    if (isValidated) {
      badgeText = 'V';
      tooltipText = 'Ajouté par le patient, validé par le médecin';
      badgeColor = 'bg-green-100 text-green-800';
    } else if (isPatientDeclared) {
      badgeText = 'P';
      tooltipText = 'Ajouté par le patient';
      badgeColor = 'bg-yellow-100 text-yellow-800';
    }

    return (
      <div key={index} className="flex items-center space-x-2 mb-1">
        <span
          className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${badgeColor}`}
          title={tooltipText}
        >
          {badgeText}
        </span>
        <span className="text-sm">{entry.label || 'Antécédent médical'}</span>
      </div>
    );
  });
};

// Fonction pour afficher les antécédents chirurgicaux avec indicateurs visuels
const renderSurgicalHistory = (surgicalHistory: Patient['surgical_history']) => {
  if (!surgicalHistory || !surgicalHistory.entries || surgicalHistory.entries.length === 0) {
    return <p>• Aucun antécédent chirurgical renseigné</p>;
  }

  return surgicalHistory.entries.slice(0, 3).map((entry, index: number) => {
    // Indicateurs visuels basés sur les données
    const isPatientDeclared = entry.definedBy === 'patient';
    const isValidated = entry.validated_by_doctor === true;

    let badgeText = 'M';
    let tooltipText = 'Ajouté par le médecin';
    let badgeColor = 'bg-blue-100 text-blue-800';

    if (isValidated) {
      badgeText = 'V';
      tooltipText = 'Ajouté par le patient, validé par le médecin';
      badgeColor = 'bg-green-100 text-green-800';
    } else if (isPatientDeclared) {
      badgeText = 'P';
      tooltipText = 'Ajouté par le patient';
      badgeColor = 'bg-yellow-100 text-yellow-800';
    }

    return (
      <div key={index} className="flex items-center space-x-2 mb-1">
        <span
          className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${badgeColor}`}
          title={tooltipText}
        >
          {badgeText}
        </span>
        <span className="text-sm">{entry.label || 'Antécédent chirurgical'}</span>
      </div>
    );
  });
};

// Fonction pour afficher les traitements avec indicateurs visuels
const renderTreatments = (treatments: Patient['treatments']) => {
  if (!treatments || !treatments.entries || treatments.entries.length === 0) {
    return <p>• Aucun traitement renseigné</p>;
  }

  return treatments.entries.slice(0, 3).map((entry, index: number) => {
    // Indicateurs visuels basés sur les données
    const isPatientDeclared = entry.definedBy === 'patient';
    const isValidated = entry.validated_by_doctor === true;

    let badgeText = 'M';
    let tooltipText = 'Ajouté par le médecin';
    let badgeColor = 'bg-blue-100 text-blue-800';

    if (isValidated) {
      badgeText = 'V';
      tooltipText = 'Ajouté par le patient, validé par le médecin';
      badgeColor = 'bg-green-100 text-green-800';
    } else if (isPatientDeclared) {
      badgeText = 'P';
      tooltipText = 'Ajouté par le patient';
      badgeColor = 'bg-yellow-100 text-yellow-800';
    }

    return (
      <div key={index} className="flex items-center space-x-2 mb-1">
        <span
          className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${badgeColor}`}
          title={tooltipText}
        >
          {badgeText}
        </span>
        <span className="text-sm">{entry.label || 'Traitement'}</span>
      </div>
    );
  });
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

export default function PatientInfoPanel({ patient: initialPatient }: PatientInfoPanelProps) {
  const [patient, setPatient] = useState<Patient>(initialPatient);
  const [loading, setLoading] = useState(false);
  const sleepStatus = getSleepStatus(patient);
  const age = calculateAge(patient.date_of_birth);
  const [showAntecedentsModal, setShowAntecedentsModal] = useState(false);
  const [showPatientInfoModal, setShowPatientInfoModal] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const [availableDoctors, setAvailableDoctors] = useState<Array<{id: string, first_name: string, last_name: string}>>([]);
  const supabase = createClient();

  // Debug logging
  console.log('🔍 [PatientInfoPanel] Received patient data:', {
    id: patient.id,
    email: patient.email,
    address: patient.address,
    city: patient.city,
    postal_code: patient.postal_code,
    gender: patient.gender,
    social_security_number: patient.social_security_number,
    civility: patient.civility
  });

  // Fonction pour récupérer les données du patient
  const fetchPatientData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/doctor/patient/${patient.id}`);
      if (response.ok) {
        const data = await response.json();
        setPatient(data.patient);
        setLastUpdate(Date.now());
        console.log('✅ Données patient mises à jour');
      } else {
        console.error('Erreur lors de la récupération des données patient');
      }
    } catch (error) {
      console.error('Erreur réseau:', error);
    } finally {
      setLoading(false);
    }
  }, [patient.id]);

  const handleDataChange = useCallback(() => {
    // Recharger les données du patient au lieu de recharger toute la page
    fetchPatientData();
    setLastUpdate(Date.now());
  }, [fetchPatientData]);

  // Récupération automatique des données complètes au montage
  useEffect(() => {
    // Récupérer les données complètes au montage pour s'assurer que tous les antécédents sont affichés
    fetchPatientData();
    // Charger la liste des médecins disponibles
    loadAvailableDoctors();
  }, []); // Uniquement au montage

  // Fonction pour charger la liste des médecins disponibles
  const loadAvailableDoctors = async () => {
    try {
      const { data: doctors, error } = await supabase
        .from('doctors')
        .select('id, first_name, last_name')
        .order('last_name', { ascending: true });

      if (error) {
        console.error('Erreur chargement médecins:', error);
      } else {
        setAvailableDoctors(doctors || []);
      }
    } catch (error) {
      console.error('Erreur réseau chargement médecins:', error);
    }
  };

  // Polling automatique pour détecter les changements externes
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        // Vérifier s'il y a eu des changements récents dans les antécédents
        const { data: recentAntecedents } = await supabase
          .from('antecedents')
          .select('updated_at')
          .eq('patient_id', patient.id)
          .order('updated_at', { ascending: false })
          .limit(1);

        if (recentAntecedents && recentAntecedents.length > 0) {
          const lastAntecedentUpdate = new Date(recentAntecedents[0].updated_at).getTime();
          if (lastAntecedentUpdate > lastUpdate) {
            console.log('🔄 Changements détectés, mise à jour des données...');
            fetchPatientData();
            setLastUpdate(Date.now());
          }
        }
      } catch (error) {
        console.error('Erreur lors de la vérification des changements:', error);
      }
    }, 30000); // Vérifier toutes les 30 secondes

    return () => clearInterval(interval);
  }, [patient.id, lastUpdate, fetchPatientData, supabase]);

  const handleModalClose = useCallback(() => {
    setShowAntecedentsModal(false);
    // Déclencher la synchronisation seulement à la fermeture de la modal
    handleDataChange();
  }, [handleDataChange]);

  const handleSavePatientInfo = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Récupérer les valeurs des champs du formulaire
      const socialSecurityNumber = (document.getElementById('socialSecurityNumber') as HTMLInputElement)?.value;
      const gender = (document.querySelector('[name="gender"]') as HTMLSelectElement)?.value;
      const civility = (document.querySelector('[name="civility"]') as HTMLSelectElement)?.value;
      const birthName = (document.getElementById('birthName') as HTMLInputElement)?.value;
      const lastName = (document.getElementById('lastName') as HTMLInputElement)?.value;
      const firstName = (document.getElementById('firstName') as HTMLInputElement)?.value;
      const dateOfBirth = (document.getElementById('dateOfBirth') as HTMLInputElement)?.value;
      const phoneNumber = (document.getElementById('phoneNumber') as HTMLInputElement)?.value;
      const email = (document.getElementById('email') as HTMLInputElement)?.value;
      const treatingPhysicianIdRaw = (document.querySelector('[name="treatingPhysicianId"]') as HTMLSelectElement)?.value;
      const treatingPhysicianId = treatingPhysicianIdRaw === 'none' ? null : treatingPhysicianIdRaw;

      // Récupérer l'adresse
      const address = (document.getElementById('address') as HTMLInputElement)?.value;
      const postalCode = (document.getElementById('postalCode') as HTMLInputElement)?.value;
      const city = (document.getElementById('city') as HTMLInputElement)?.value;

      console.log('🔍 [DOCTOR MODAL] Form field values retrieved:', {
        socialSecurityNumber,
        gender,
        civility,
        birthName,
        lastName,
        firstName,
        dateOfBirth,
        phoneNumber,
        email,
        treatingPhysicianId,
        address,
        postalCode,
        city
      });

      // Préparer les données à envoyer
      const updateData = {
        social_security_number: socialSecurityNumber || null,
        gender: gender || null,
        civility: civility || null,
        birth_name: birthName || null,
        last_name: lastName || null,
        first_name: firstName || null,
        date_of_birth: dateOfBirth ? new Date(dateOfBirth).toISOString() : null,
        phone_number: phoneNumber || null,
        email: email || null,
        treating_physician_id: treatingPhysicianId || null,
        address: address || null,
        city: city || null,
        postal_code: postalCode || null
      };

      console.log('📤 [DOCTOR MODAL] Prepared update data:', updateData);
      console.log('🔗 [DOCTOR MODAL] API endpoint:', `/api/doctor/patient/${patient.id}`);

      // Envoyer la requête de mise à jour
      const response = await fetch(`/api/doctor/patient/${patient.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      console.log('📡 [DOCTOR MODAL] Response status:', response.status);
      console.log('📡 [DOCTOR MODAL] Response ok:', response.ok);

      if (response.ok) {
        const result = await response.json();
        console.log('✅ [DOCTOR MODAL] Patient info updated successfully:', result);
        setShowPatientInfoModal(false);
        handleDataChange(); // Rafraîchir les données
      } else {
        const errorData = await response.json();
        console.error('❌ [DOCTOR MODAL] Error updating patient info:', errorData);
        console.error('❌ [DOCTOR MODAL] Response details:', {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries())
        });
        alert(`Erreur lors de la sauvegarde: ${errorData.error || 'Erreur inconnue'}`);
      }
    } catch (error) {
      console.error('❌ [DOCTOR MODAL] Error during save:', error);
      console.error('❌ [DOCTOR MODAL] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      alert('Erreur lors de la sauvegarde des informations');
    }
  }, [patient.id, handleDataChange]);


  return (
    <aside className="w-80 bg-white border-l border-gray-200 p-6 fixed left-24 top-16 h-[calc(100vh-4rem)] overflow-y-auto">
      {/* En-tête du patient */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
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

          {/* Bouton de rafraîchissement */}
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500">
              Dernière maj: {new Date(lastUpdate).toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
            <button
              onClick={handleDataChange}
              disabled={loading}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
              title="Rafraîchir les données du patient"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Informations de base */}
      <div className="space-y-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3
            className="text-sm font-medium text-blue-800 mb-2 flex items-center cursor-pointer hover:text-blue-600 transition-colors"
            onClick={() => setShowPatientInfoModal(true)}
          >
            <Shield className="w-4 h-4 mr-2" />
            Informations de base
            <Edit className="w-3 h-3 ml-2 opacity-60" />
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
            {patient.gender && (
              <div className="flex justify-between">
                <span className="text-blue-700">Genre</span>
                <span className="font-medium">
                  {patient.gender === 'male' ? 'Homme' :
                   patient.gender === 'female' ? 'Femme' :
                   patient.gender === 'other' ? 'Autre' :
                   patient.gender === 'prefer_not_to_say' ? 'Non spécifié' :
                   patient.gender}
                </span>
              </div>
            )}
            {patient.email && (
              <div className="flex justify-between">
                <span className="text-blue-700">Email</span>
                <span className="font-medium text-xs break-all">{patient.email}</span>
              </div>
            )}
            {patient.address && (
              <div className="flex justify-between">
                <span className="text-blue-700">Numéro et rue</span>
                <span className="font-medium text-xs break-all">{patient.address}</span>
              </div>
            )}
            {patient.city && patient.postal_code && (
              <div className="flex justify-between">
                <span className="text-blue-700">Ville</span>
                <span className="font-medium">{patient.postal_code} {patient.city}</span>
              </div>
            )}
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
          <h3
            className="text-sm font-medium text-gray-800 mb-2 flex items-center cursor-pointer hover:text-blue-600 transition-colors"
            onClick={() => setShowAntecedentsModal(true)}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Antécédents
          </h3>


          <div className="space-y-1 text-sm text-gray-600">
            {/* Antécédents médicaux */}
            <div className="mb-2">
              <h4 className="text-xs font-medium text-gray-700 mb-1">Médicaux:</h4>
              {renderMedicalHistory(patient.medical_history)}
            </div>

            {/* Antécédents chirurgicaux */}
            <div className="mb-2">
              <h4 className="text-xs font-medium text-gray-700 mb-1">Chirurgicaux:</h4>
              {renderSurgicalHistory(patient.surgical_history)}
            </div>

          </div>
        </div>

        {/* Traitements en cours */}
        <div className="bg-green-50 p-4 rounded-lg">
          <h3
            className="text-sm font-medium text-green-800 mb-2 flex items-center cursor-pointer hover:text-green-600 transition-colors"
            onClick={() => setShowAntecedentsModal(true)}
          >
            <Pill className="w-4 h-4 mr-2" />
            Traitements en cours
          </h3>
          <div className="text-sm text-green-700">
            {renderTreatments(patient.treatments)}
          </div>
          <button
            className="text-green-600 text-xs hover:underline mt-2"
            onClick={() => {
              setShowAntecedentsModal(true);
              // Le modal s'ouvrira sur l'onglet "medication" grâce à initialTab
            }}
          >
            Gérer les traitements →
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


      {/* Modal de gestion complète des antécédents */}
      <AntecedentsManagementModal
        patientId={patient.id}
        isOpen={showAntecedentsModal}
        onClose={handleModalClose}
        onDataChange={handleDataChange}
        initialTab="medication"
      />

      {/* Modal d'informations administratives du patient */}
      <Dialog open={showPatientInfoModal} onOpenChange={setShowPatientInfoModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5" />
              Informations administratives du patient
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSavePatientInfo} className="space-y-6">
            {/* Matricule INS et Sexe */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="socialSecurityNumber">Matricule INS</Label>
                <Input
                  id="socialSecurityNumber"
                  type="text"
                  defaultValue={patient.social_security_number || ''}
                  placeholder="123456789012345"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">Genre</Label>
                <Select name="gender" defaultValue={patient.gender || ''}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez votre genre" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Homme</SelectItem>
                    <SelectItem value="female">Femme</SelectItem>
                    <SelectItem value="other">Autre</SelectItem>
                    <SelectItem value="prefer_not_to_say">Préfère ne pas dire</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Civilité */}
            <div className="space-y-2">
              <Label htmlFor="civility">Civilité</Label>
              <Select name="civility" defaultValue={patient.civility || ''}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez votre civilité" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="M.">Monsieur</SelectItem>
                  <SelectItem value="Mme">Madame</SelectItem>
                  <SelectItem value="Mlle">Mademoiselle</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Noms */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="birthName">Nom de naissance</Label>
                <Input
                  id="birthName"
                  type="text"
                  defaultValue={patient.birth_name || patient.last_name || ''}
                  placeholder="Votre nom de naissance"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="firstName">Prénom</Label>
                <Input
                  id="firstName"
                  defaultValue={patient.first_name || ''}
                  disabled
                />
              </div>
            </div>

            {/* Nom d'usage (désactivé car c'est le nom principal) */}
            <div className="space-y-2">
              <Label htmlFor="lastName">Nom d'usage</Label>
              <Input
                id="lastName"
                defaultValue={patient.last_name || ''}
                disabled
              />
            </div>

            {/* Date de naissance et Téléphone */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date de naissance</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  defaultValue={patient.date_of_birth ? new Date(patient.date_of_birth).toISOString().split('T')[0] : ''}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Numéro de téléphone</Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  defaultValue={patient.phone || ''}
                  placeholder="+33 1 23 45 67 89"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                defaultValue={patient.email || ''}
                readOnly
                className="bg-gray-50 cursor-not-allowed opacity-75"
              />
              <p className="text-xs text-gray-500">L'adresse email ne peut pas être modifiée</p>
            </div>

            {/* Médecin traitant */}
            <div className="space-y-2">
              <Label htmlFor="treatingPhysicianId">Médecin traitant</Label>
              <Select name="treatingPhysicianId" defaultValue={patient.treating_physician_id || 'none'}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez votre médecin traitant" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucun médecin traitant</SelectItem>
                  {availableDoctors.map((doctor) => (
                    <SelectItem key={doctor.id} value={doctor.id}>
                      Dr. {doctor.first_name} {doctor.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Adresse */}
            <div className="space-y-4">
              <Label>Adresse</Label>
              <div className="space-y-2">
                <Input
                  id="address"
                  type="text"
                  defaultValue={patient.address || ''}
                  placeholder="Numéro et rue"
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    id="postalCode"
                    type="text"
                    defaultValue={patient.postal_code || ''}
                    placeholder="Code postal"
                  />
                  <Input
                    id="city"
                    type="text"
                    defaultValue={patient.city || ''}
                    placeholder="Ville"
                  />
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full">
              Enregistrer les modifications
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </aside>
  );
}