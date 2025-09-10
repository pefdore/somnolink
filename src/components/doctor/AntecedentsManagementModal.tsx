'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Plus,
  X,
  Check,
  FileText,
  Pill,
  AlertTriangle,
  Trash2,
  User,
  Stethoscope,
  Search,
  Loader2
} from 'lucide-react';

// Fonction pour générer un code rapide
const generateQuickCode = (label: string): string => {
  const words = label.split(' ').slice(0, 3);
  return words.map(word => word.substring(0, 3).toUpperCase()).join('-');
};

interface Antecedent {
  id: string;
  code: string;
  label: string;
  system: string;
  type: 'medical' | 'surgical' | 'allergy' | 'treatment' | 'medication';
  defined_by: 'patient' | 'doctor';
  validated_by_doctor: boolean;
  note?: string;
  created_at: string;
}

interface AntecedentsManagementModalProps {
  patientId: string;
  isOpen: boolean;
  onClose: () => void;
  onDataChange?: () => void;
  initialTab?: string;
}

export function AntecedentsManagementModal({
  patientId,
  isOpen,
  onClose,
  onDataChange,
  initialTab = 'medical'
}: AntecedentsManagementModalProps) {

  const [antecedents, setAntecedents] = useState<Antecedent[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletedAntecedents, setDeletedAntecedents] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState(initialTab || 'medical');
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchQueries, setSearchQueries] = useState<Record<string, string>>({
    medical: '',
    surgical: '',
    allergy: '',
    medication: ''
  });
  const [searchResults, setSearchResults] = useState<Record<string, Array<{ code: string; label: string; system?: string; searchSystem?: string }>>>({
    medical: [],
    surgical: [],
    allergy: [],
    medication: []
  });
  const [isSearching, setIsSearching] = useState<Record<string, boolean>>({
    medical: false,
    surgical: false,
    allergy: false,
    medication: false
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [addType, setAddType] = useState<'medical' | 'surgical' | 'allergy' | 'treatment'>('medical');
  const [activeSearchField, setActiveSearchField] = useState<string | null>(null);
  const [medicationResults, setMedicationResults] = useState<any[]>([]);
  const [searchCountry, setSearchCountry] = useState<'fr' | 'us' | 'all'>('fr');
  const supabase = createClient();

  useEffect(() => {
    if (isOpen && patientId) {
      loadAntecedents();
    }
  }, [isOpen, patientId]);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const loadAntecedents = async (overrideDeletedSet?: Set<string>) => {
    try {
      setLoading(true);
      // console.log('🔄 DEBUG: Chargement des antécédents pour patient:', patientId);

      // Charger les antécédents de la table antecedents
      const { data: tableAntecedents, error: tableError } = await supabase
        .from('antecedents')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

      if (tableError) throw tableError;

      // console.log('📊 DEBUG: Antécédents de la table:', tableAntecedents?.length || 0);

      // Charger les antécédents des champs JSON de la table patients
      const { data: patientData, error: patientError } = await supabase
        .from('patients')
        .select('medical_history, surgical_history, allergies')
        .eq('id', patientId)
        .single();

      if (patientError) {
        console.error('Erreur chargement données patient:', patientError);
      }

      // Convertir les antécédents JSON en format compatible
      const jsonAntecedents: Antecedent[] = [];

      // Traiter les antécédents médicaux du JSON
      if (patientData?.medical_history?.entries) {
        patientData.medical_history.entries.forEach((entry: any, index: number) => {
          if (entry.label) {
            jsonAntecedents.push({
              id: `json-medical-${index}`,
              code: entry.code || generateQuickCode(entry.label),
              label: entry.label,
              system: entry.system || 'CIM-11',
              type: 'medical',
              defined_by: 'patient', // Par défaut patient pour les données JSON
              validated_by_doctor: false, // Par défaut non validé
              note: entry.note || '',
              created_at: entry.createdAt || new Date().toISOString()
            });
          }
        });
      }

      // Traiter les antécédents chirurgicaux du JSON
      if (patientData?.surgical_history?.entries) {
        patientData.surgical_history.entries.forEach((entry: any, index: number) => {
          if (entry.label) {
            jsonAntecedents.push({
              id: `json-surgical-${index}`,
              code: entry.code || generateQuickCode(entry.label),
              label: entry.label,
              system: entry.system || 'CISP2',
              type: 'surgical',
              defined_by: 'patient',
              validated_by_doctor: false,
              note: entry.note || '',
              created_at: entry.createdAt || new Date().toISOString()
            });
          }
        });
      }

      // Traiter les allergies du JSON
      if (patientData?.allergies?.entries) {
        patientData.allergies.entries.forEach((entry: any, index: number) => {
          if (entry.label) {
            jsonAntecedents.push({
              id: `json-allergy-${index}`,
              code: entry.code || generateQuickCode(entry.label),
              label: entry.label,
              system: entry.system || 'CIM-11',
              type: 'allergy',
              defined_by: 'patient',
              validated_by_doctor: false,
              note: entry.note || '',
              created_at: entry.createdAt || new Date().toISOString()
            });
          }
        });
      }

      // Créer un ensemble des codes d'antécédents présents dans la table pour éviter les doublons
      const tableCodes = new Set((tableAntecedents || []).map(a => `${a.code}-${a.type}`));

      // Filtrer les antécédents JSON pour exclure ceux qui existent déjà dans la table
      // et ceux qui ont été supprimés (même s'ils sont dans les JSON)
      const filteredJsonAntecedents = jsonAntecedents.filter(jsonAntecedent => {
        const codeKey = `${jsonAntecedent.code}-${jsonAntecedent.type}`;
        const currentDeletedSet = overrideDeletedSet || new Set(deletedAntecedents); // Utiliser l'override ou l'état actuel
        const shouldInclude = !tableCodes.has(codeKey) && !currentDeletedSet.has(codeKey);
        // console.log('🔍 DEBUG: Filtrage JSON -', jsonAntecedent.label, '(' + jsonAntecedent.type + '):', {
        //   codeKey,
        //   inTable: tableCodes.has(codeKey),
        //   inDeleted: currentDeletedSet.has(codeKey),
        //   shouldInclude
        // });
        return shouldInclude;
      });

      // Fusionner les deux sources : table d'abord, puis JSON filtrés
      const allAntecedents = [...(tableAntecedents || []), ...filteredJsonAntecedents];

      // console.log('📋 DEBUG: Total antécédents après fusion:', allAntecedents.length);
      // console.log('📋 DEBUG: Antécédents treatment:', allAntecedents.filter(a => a.type === 'treatment').length);
      // console.log('📋 DEBUG: Antécédents medication:', allAntecedents.filter(a => a.type === 'medication').length);

      // Debug détaillé des antécédents finaux
      // console.log('🔍 DEBUG: Liste détaillée des antécédents finaux:');
      // allAntecedents.forEach((ant, index) => {
      //   console.log(`  ${index + 1}. ${ant.code}-${ant.type} (${ant.label}) - Défini par: ${ant.defined_by} - Validé: ${ant.validated_by_doctor}`);
      // });

      setAntecedents(allAntecedents);
      // console.log('✅ DEBUG: State mis à jour avec', allAntecedents.length, 'antécédents');
    } catch (error) {
      console.error('❌ Erreur chargement antécédents:', error);
    } finally {
      setLoading(false);
    }
  };

  const addAntecedent = async (antecedent: { code: string; label: string; system?: string }, type: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: doctorProfile } = await supabase
        .from('doctors')
        .select('id')
        .eq('user_id', user.id)
        .single();

      // Vérifier si l'antécédent existe déjà
      const { data: existingAntecedent, error: checkError } = await supabase
        .from('antecedents')
        .select('id')
        .eq('patient_id', patientId)
        .eq('code', antecedent.code)
        .eq('type', type)
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = not found
        throw checkError;
      }

      if (existingAntecedent) {
        alert('Cet antécédent existe déjà pour ce patient');
        return;
      }

      const { error } = await supabase
        .from('antecedents')
        .insert({
          patient_id: patientId,
          code: antecedent.code,
          label: antecedent.label,
          system: antecedent.system || 'CIM-11',
          type: type,
          doctor_id: doctorProfile?.id
        });

      if (error) throw error;
      await loadAntecedents();
      setShowAddModal(false);
      onDataChange?.();

    } catch (error) {
      console.error('Erreur ajout antécédent:', error);
      alert('Erreur lors de l\'ajout de l\'antécédent');
    }
  };

  const validateAntecedent = async (id: string) => {
    try {
      const { error } = await supabase
        .from('antecedents')
        .update({ validated_by_doctor: true })
        .eq('id', id);

      if (error) throw error;
      await loadAntecedents();
      onDataChange?.();
    } catch (error) {
      console.error('Erreur validation:', error);
      alert('Erreur lors de la validation de l\'antécédent');
    }
  };

  const removeAntecedent = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet antécédent ? Cette action est irréversible.')) {
      return;
    }

    // console.log('🗑️ DEBUG: Tentative de suppression de l\'antécédent ID:', id);

    try {
      // Vérifier si c'est un antécédent JSON (commence par 'json-')
      const isJsonAntecedent = id.startsWith('json-');

      if (isJsonAntecedent) {
        // Pour les antécédents JSON : les marquer comme supprimés côté client
        // console.log('🗑️ DEBUG: Antécédent JSON détecté, suppression côté client uniquement');

        const antecedentToDelete = antecedents.find(a => a.id === id);
        if (antecedentToDelete) {
          const deletedKey = `${antecedentToDelete.code}-${antecedentToDelete.type}`;
          // console.log('🗑️ DEBUG: Marquage comme supprimé:', deletedKey);
          // console.log('🗑️ DEBUG: Type d\'antécédent supprimé:', antecedentToDelete.type);
          // console.log('🗑️ DEBUG: Défini par:', antecedentToDelete.defined_by);

          const updatedDeletedSet = new Set(deletedAntecedents);
          updatedDeletedSet.add(deletedKey);
          // console.log('🗑️ DEBUG: Après ajout, ensemble des supprimés:', Array.from(updatedDeletedSet));

          setDeletedAntecedents(updatedDeletedSet);

          // Recharger les données pour appliquer le filtrage avec le nouvel ensemble
          // console.log('✅ DEBUG: Rechargement des données après suppression JSON...');
          await loadAntecedents(updatedDeletedSet);
          // console.log('✅ DEBUG: Données rechargées après suppression JSON');

          return;
        }
      }

      // Pour les antécédents de la table (UUID valide)
      // Récupérer l'utilisateur actuel
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      // console.log('🗑️ DEBUG: Utilisateur actuel:', user?.id, 'Erreur:', userError);

      if (userError || !user) {
        console.error('❌ Erreur récupération utilisateur:', userError);
        alert('Erreur d\'authentification');
        return;
      }

      // Récupérer le profil médecin
      const { data: doctorProfile, error: doctorError } = await supabase
        .from('doctors')
        .select('id')
        .eq('user_id', user.id)
        .single();

      // console.log('🗑️ DEBUG: Profil médecin:', doctorProfile, 'Erreur:', doctorError);

      if (doctorError || !doctorProfile) {
        console.error('❌ Erreur récupération profil médecin:', doctorError);
        alert('Erreur de récupération du profil médecin');
        return;
      }

      // Vérifier d'abord si l'antécédent existe
      const { data: existingAntecedent, error: checkError } = await supabase
        .from('antecedents')
        .select('*')
        .eq('id', id)
        .single();

      // console.log('🗑️ DEBUG: Antécédent trouvé avant suppression:', existingAntecedent);
      // console.log('🗑️ DEBUG: Erreur de vérification:', checkError);

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (!existingAntecedent) {
        // console.log('⚠️ DEBUG: Antécédent non trouvé dans la base');
        alert('Cet antécédent n\'existe pas ou a déjà été supprimé');
        return;
      }

      // Vérifier la relation patient-médecin
      const { data: relationship, error: relError } = await supabase
        .from('patient_doctor_relationships')
        .select('*')
        .eq('patient_id', existingAntecedent.patient_id)
        .eq('doctor_id', doctorProfile.id)
        .eq('status', 'active')
        .single();

      // console.log('🗑️ DEBUG: Relation patient-médecin:', relationship, 'Erreur:', relError);

      if (relError && relError.code !== 'PGRST116') {
        console.error('❌ Erreur vérification relation:', relError);
      }

      if (!relationship) {
        // console.log('⚠️ DEBUG: Aucune relation active trouvée');
        alert('Vous n\'avez pas les permissions pour supprimer cet antécédent');
        return;
      }

      // console.log('🗑️ DEBUG: Tentative de suppression avec les paramètres:', {
      //   id,
      //   patient_id: existingAntecedent.patient_id,
      //   doctor_id: existingAntecedent.doctor_id,
      //   user_doctor_id: doctorProfile.id
      // });

      const { error } = await supabase
        .from('antecedents')
        .delete()
        .eq('id', id);

      // console.log('🗑️ DEBUG: Résultat de la suppression:', { error: error?.message, code: error?.code, details: error });

      if (error) throw error;

      // console.log('✅ DEBUG: Suppression réussie, vérification...');

      // Ajouter l'antécédent supprimé à l'ensemble des supprimés pour éviter le rechargement depuis JSON
      const antecedentToDelete = antecedents.find(a => a.id === id);
      if (antecedentToDelete) {
        const deletedKey = `${antecedentToDelete.code}-${antecedentToDelete.type}`;
        // console.log('🗑️ DEBUG: Marquage comme supprimé:', deletedKey);
        // console.log('🗑️ DEBUG: Type d\'antécédent supprimé:', antecedentToDelete.type);
        // console.log('🗑️ DEBUG: Défini par:', antecedentToDelete.defined_by);
        // console.log('🗑️ DEBUG: Avant mise à jour deletedAntecedents:', Array.from(deletedAntecedents));
        setDeletedAntecedents(prev => {
          const newSet = new Set(prev);
          newSet.add(deletedKey);
          // console.log('🗑️ DEBUG: Après ajout, ensemble des supprimés:', Array.from(newSet));
          return newSet;
        });
      }

      // Vérifier que l'antécédent a bien été supprimé
      // console.log('🗑️ DEBUG: Tentative de vérification après suppression avec ID:', id);
      const { data: checkAfterDelete, error: checkAfterError } = await supabase
        .from('antecedents')
        .select('*')
        .eq('id', id)
        .single();

      // console.log('🗑️ DEBUG: Résultat vérification après suppression:', {
      //   data: checkAfterDelete,
      //   error: checkAfterError,
      //   errorCode: checkAfterError?.code,
      //   errorMessage: checkAfterError?.message,
      //   errorDetails: checkAfterError?.details
      // });

      // console.log('✅ DEBUG: Rechargement des données...');
      await loadAntecedents();
      // console.log('✅ DEBUG: Données rechargées');
      onDataChange?.();

    } catch (error: any) {
      console.error('❌ Erreur suppression:', error);
      alert(`Erreur lors de la suppression de l'antécédent: ${error.message}`);
    }
  };

  const updateDoctorNote = async (id: string, note: string) => {
    try {
      const { error } = await supabase
        .from('antecedents')
        .update({ note: note })
        .eq('id', id);

      if (error) throw error;
      await loadAntecedents();
      onDataChange?.();
      setEditingNote(null);
      setNoteText('');

    } catch (error) {
      console.error('Erreur mise à jour note:', error);
      alert('Erreur lors de la sauvegarde de la note');
    }
  };

  const startEditingNote = (id: string, currentNote: string) => {
    setEditingNote(id);
    setNoteText(currentNote || '');
  };

  const cancelEditingNote = () => {
    setEditingNote(null);
    setNoteText('');
  };

  const filterByType = (type: string) => {
    return antecedents.filter(ant => ant.type === type);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'medical': return <Stethoscope className="w-4 h-4" />;
      case 'surgical': return <FileText className="w-4 h-4" />;
      case 'allergy': return <AlertTriangle className="w-4 h-4" />;
      case 'treatment': return <Pill className="w-4 h-4" />;
      case 'medication': return <Search className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'medical': return 'bg-blue-100 text-blue-800';
      case 'surgical': return 'bg-green-100 text-green-800';
      case 'allergy': return 'bg-red-100 text-red-800';
      case 'treatment': return 'bg-purple-100 text-purple-800';
      case 'medication': return 'bg-cyan-100 text-cyan-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Fonction de recherche CIM et CISP2 intégrée
  const searchTerminology = async (query: string, type: string) => {
    if (query.length < 3) {
      setSearchResults(prev => ({ ...prev, [type]: [] }));
      return;
    }

    setIsSearching(prev => ({ ...prev, [type]: true }));

    try {
      // Recherche simultanée dans CIM-11 et CISP2 pour le champ médical
      const searchPromises = [];

      if (type === 'medical') {
        // Pour le médical : chercher dans CIM-11 et CISP2
        searchPromises.push(
          fetch(`/api/terminology-search?q=${encodeURIComponent(query)}&system=CIM-11`),
          fetch(`/api/terminology-search?q=${encodeURIComponent(query)}&system=CISP2`)
        );
      } else if (type === 'surgical') {
        // Pour le chirurgical : chercher dans CISP2 et CIM-11
        searchPromises.push(
          fetch(`/api/terminology-search?q=${encodeURIComponent(query)}&system=CISP2`),
          fetch(`/api/terminology-search?q=${encodeURIComponent(query)}&system=CIM-11`)
        );
      } else {
        // Pour les autres types : seulement CIM-11
        searchPromises.push(
          fetch(`/api/terminology-search?q=${encodeURIComponent(query)}&system=CIM-11`)
        );
      }

      const responses = await Promise.all(searchPromises);

      // Traiter les réponses
      const allResults = [];
      for (let i = 0; i < responses.length; i++) {
        const response = responses[i];
        if (response.ok) {
          const data = await response.json();
          if (data && Array.isArray(data)) {
            // Ajouter le système d'origine à chaque résultat
            const system = type === 'medical' ?
              (i === 0 ? 'CIM-11' : 'CISP2') :
              (i === 0 ? 'CISP2' : 'CIM-11');

            const resultsWithSystem = data.map((item: any) => ({
              ...item,
              system: item.system || system,
              searchSystem: system
            }));
            allResults.push(...resultsWithSystem);
          }
        }
      }

      // Trier par score de pertinence et limiter à 10 résultats par système
      const sortedResults = allResults
        .sort((a: any, b: any) => (b.score || 0) - (a.score || 0))
        .slice(0, 20); // Maximum 20 résultats au total

      setSearchResults(prev => ({ ...prev, [type]: sortedResults }));

    } catch (error) {
      console.error('Erreur lors de la recherche terminologique:', error);
      setSearchResults(prev => ({ ...prev, [type]: [] }));
    } finally {
      setIsSearching(prev => ({ ...prev, [type]: false }));
    }
  };

  // Gestionnaire de changement des champs de recherche
  const handleSearchChange = (type: string, value: string) => {
    setSearchQueries(prev => ({ ...prev, [type]: value }));
    setActiveSearchField(type);

    // Déclencher la recherche avec un debounce
    const timeoutId = setTimeout(() => {
      searchTerminology(value, type);
    }, 300);

    return () => clearTimeout(timeoutId);
  };

  // Sélection d'un résultat de recherche
  const handleSelectResult = (type: string, result: { code: string; label: string; system?: string }) => {
    addAntecedent(result, type);
    setSearchQueries(prev => ({ ...prev, [type]: '' }));
    setSearchResults(prev => ({ ...prev, [type]: [] }));
    setActiveSearchField(null);
  };

  // Fonction de recherche de médicaments avec API française en priorité
  const searchMedications = async (query: string) => {
    if (query.length < 2) {
      setMedicationResults([]);
      return;
    }

    setIsSearching(prev => ({ ...prev, medication: true }));

    try {
      // console.log('🔍 Recherche médicaments:', query, 'pays:', searchCountry);

      // 1. Essayer l'API française en priorité
      if (searchCountry === 'fr' || searchCountry === 'all') {
        try {
          // console.log('🇫🇷 Tentative API française...');
          const frenchResponse = await fetch(`/api/medicaments-fr?q=${encodeURIComponent(query)}&limit=15`);

          if (frenchResponse.ok) {
            const frenchData = await frenchResponse.json();
            if (frenchData.success && frenchData.medications?.length > 0) {
              // console.log('✅ Médicaments français trouvés:', frenchData.medications.length);

              // Les données françaises sont déjà transformées avec chaque présentation comme résultat séparé
              const formattedFrenchMeds = frenchData.medications.map((med: any) => ({
                id: med.id,
                name: med.name,
                source: 'fr-gouv',
                country: 'fr',
                pharmaceuticalForm: med.pharmaceuticalForm,
                administrationRoutes: med.administrationRoutes,
                holder: med.holder,
                authorizationStatus: med.authorizationStatus,
                ammDate: med.ammDate,
                presentations: med.presentations,
                // Extraire les informations de la présentation pour l'affichage
                genericName: '',
                manufacturer: med.holder,
                dosage: med.pharmaceuticalForm,
                strength: med.presentations?.[0]?.label || '',
                reimbursementRate: med.presentations?.[0]?.reimbursementRate,
                price: med.presentations?.[0]?.price
              }));

              // Trier par nom de médicament pour grouper les présentations similaires
              const sortedFrenchMeds = formattedFrenchMeds.sort((a: any, b: any) => {
                const nameA = a.name.split(' - ')[0]; // Extraire le nom de base
                const nameB = b.name.split(' - ')[0];
                return nameA.localeCompare(nameB);
              });

              setMedicationResults(sortedFrenchMeds);
              setIsSearching(prev => ({ ...prev, medication: false }));
              return;
            }
          }
        } catch (frenchError) {
          // console.log('⚠️ Échec API française, tentative fallback:', frenchError);
        }
      }

      // 2. Fallback vers l'API actuelle
      // console.log('🔄 Fallback vers API actuelle...');
      const response = await fetch(`/api/drug-search?q=${encodeURIComponent(query)}&country=${searchCountry}`);
      const data = await response.json();

      if (data.error) {
        // console.error('❌ Erreur API médicaments (fallback):', data.error);
        setMedicationResults([]);
      } else {
        // console.log('✅ Médicaments trouvés (fallback):', data.medications?.length || 0);
        setMedicationResults(data.medications || []);
      }
    } catch (error) {
      console.error('❌ Erreur recherche médicaments:', error);
      setMedicationResults([]);
    } finally {
      setIsSearching(prev => ({ ...prev, medication: false }));
    }
  };

  // Gestionnaire de changement pour la recherche de médicaments
  const handleMedicationSearchChange = (value: string) => {
    setSearchQueries(prev => ({ ...prev, medication: value }));
    setActiveSearchField('medication');

    // Déclencher la recherche avec un debounce
    const timeoutId = setTimeout(() => {
      searchMedications(value);
    }, 300);

    return () => clearTimeout(timeoutId);
  };

  // Sélection d'un médicament
  const handleSelectMedication = (medication: any) => {
    // Créer un code unique pour le médicament
    const code = medication.id || `MED-${Date.now()}`;

    // Construire un label plus informatif incluant le dosage si disponible
    let label = medication.name;
    if (medication.strength && medication.strength !== medication.name) {
      // Éviter la duplication si le strength est déjà dans le nom
      const strengthInName = medication.name.toLowerCase().includes(medication.strength.toLowerCase());
      if (!strengthInName) {
        label = `${medication.name} (${medication.strength})`;
      }
    }

    // Déterminer le système source
    let system = 'OpenFDA';
    if (medication.source === 'openmedic') {
      system = 'OpenMedic';
    } else if (medication.source === 'fr-gouv') {
      system = 'Base de données officielle française';
    }

    // console.log('🛠️ DEBUG: Ajout de médicament avec type treatment:', { code, label, system });
    addAntecedent({ code, label, system }, 'treatment');
    setSearchQueries(prev => ({ ...prev, medication: '' }));
    setMedicationResults([]);
    setActiveSearchField(null);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent
          className="max-w-6xl max-h-[90vh] overflow-y-auto"
          aria-describedby="antecedents-description"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Gestion des Antécédents Médicaux
            </DialogTitle>
            <div id="antecedents-description" className="sr-only">
              Interface de gestion complète des antécédents médicaux du patient
            </div>
          </DialogHeader>

          <div className="space-y-6">


            {/* Antécédents patient à valider */}
            {antecedents.filter(a => a.defined_by === 'patient' && !a.validated_by_doctor).length > 0 && (
              <Alert className="border-orange-200 bg-orange-50">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-700">
                  <strong className="text-orange-800">Antécédents patient à valider:</strong> Le patient a partagé {antecedents.filter(a => a.defined_by === 'patient' && !a.validated_by_doctor).length} antécédent(s) qui nécessitent votre validation.
                  <Button
                    variant="outline"
                    size="sm"
                    className="ml-2 border-orange-300 text-orange-700 hover:bg-orange-100"
                    onClick={() => setActiveTab('medical')}
                  >
                    Voir les antécédents →
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {/* Inputs de recherche CIM/CISP2 par type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium">Médical (CIM-11)</span>
                </div>
                <div className="relative">
                  <Input
                    placeholder="Tapez pour rechercher dans CIM-11 et CISP2..."
                    value={searchQueries.medical}
                    onChange={(e) => handleSearchChange('medical', e.target.value)}
                    onFocus={() => setActiveSearchField('medical')}
                    onBlur={() => setTimeout(() => setActiveSearchField(null), 200)}
                    className="w-full"
                  />
                  {isSearching.medical && (
                    <div className="absolute right-3 top-3">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    </div>
                  )}
                  {activeSearchField === 'medical' && searchResults.medical.length > 0 && (
                    <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-md shadow-lg mt-1 max-h-60 overflow-y-auto">
                      {searchResults.medical.map((result, index) => (
                        <div
                          key={index}
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                          onClick={() => handleSelectResult('medical', result)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="font-medium text-blue-600">{result.code}</div>
                              <div className="text-sm text-gray-700">{result.label}</div>
                            </div>
                            <div className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                              result.searchSystem === 'CIM-11'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {result.searchSystem}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {activeSearchField === 'medical' && searchQueries.medical.length >= 3 && searchResults.medical.length === 0 && !isSearching.medical && (
                    <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-md shadow-lg mt-1 p-4">
                      <div className="text-sm text-gray-500 text-center">
                        Aucun résultat trouvé dans CIM-11 et CISP2
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium">Chirurgical (CISP2)</span>
                </div>
                <div className="relative">
                  <Input
                    placeholder="Tapez pour rechercher dans CISP2 et CIM-11..."
                    value={searchQueries.surgical}
                    onChange={(e) => handleSearchChange('surgical', e.target.value)}
                    onFocus={() => setActiveSearchField('surgical')}
                    onBlur={() => setTimeout(() => setActiveSearchField(null), 200)}
                    className="w-full"
                  />
                  {isSearching.surgical && (
                    <div className="absolute right-3 top-3">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                    </div>
                  )}
                  {activeSearchField === 'surgical' && searchResults.surgical.length > 0 && (
                    <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-md shadow-lg mt-1 max-h-60 overflow-y-auto">
                      {searchResults.surgical.map((result, index) => (
                        <div
                          key={index}
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                          onClick={() => handleSelectResult('surgical', result)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="font-medium text-green-600">{result.code}</div>
                              <div className="text-sm text-gray-700">{result.label}</div>
                            </div>
                            <div className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                              result.searchSystem === 'CISP2'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {result.searchSystem}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <span className="text-sm font-medium">Allergies</span>
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Rechercher une allergie..."
                    value={searchQueries.allergy}
                    onChange={(e) => setSearchQueries(prev => ({ ...prev, allergy: e.target.value }))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && searchQueries.allergy.trim()) {
                        setAddType('allergy');
                        setShowAddModal(true);
                      }
                    }}
                    className="flex-1"
                  />
                  <Button
                    onClick={() => {
                      if (searchQueries.allergy.trim()) {
                        setAddType('allergy');
                        setShowAddModal(true);
                      }
                    }}
                    disabled={!searchQueries.allergy.trim()}
                    size="sm"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>


              {/* Recherche de médicaments */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Pill className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-medium">Traitements</span>
                </div>
                <div className="flex gap-2">
                  <Select value={searchCountry} onValueChange={(value: 'fr' | 'us' | 'all') => setSearchCountry(value)}>
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fr">🇫🇷</SelectItem>
                      <SelectItem value="us">🇺🇸</SelectItem>
                      <SelectItem value="all">🌍</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="relative flex-1">
                    <Input
                      placeholder={
                        searchCountry === 'fr' ? "Rechercher un traitement français..." :
                        searchCountry === 'us' ? "Rechercher un traitement international..." :
                        "Rechercher un traitement..."
                      }
                      value={searchQueries.medication}
                      onChange={(e) => handleMedicationSearchChange(e.target.value)}
                      onFocus={() => setActiveSearchField('medication')}
                      onBlur={() => setTimeout(() => setActiveSearchField(null), 200)}
                      className="w-full"
                    />
                    {isSearching.medication && (
                      <div className="absolute right-3 top-3">
                        <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                      </div>
                    )}
                    {activeSearchField === 'medication' && medicationResults.length > 0 && (
                      <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-md shadow-lg mt-1 max-h-60 overflow-y-auto">
                        {medicationResults.map((medication, index) => {
                          // Détecter s'il y a plusieurs présentations du même médicament
                          const baseName = medication.name.split(' - ')[0];
                          const similarMeds = medicationResults.filter(m =>
                            m.name.split(' - ')[0] === baseName && m.id !== medication.id
                          );
                          const hasMultiplePresentations = similarMeds.length > 0;

                          return (
                            <div
                              key={`${medication.source}-${medication.id}-${index}`}
                              className="px-4 py-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                              onClick={() => handleSelectMedication(medication)}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                                      medication.country === 'fr'
                                        ? 'bg-blue-100 text-blue-800'
                                        : 'bg-green-100 text-green-800'
                                    }`}>
                                      {medication.country === 'fr' ? '🇫🇷 FR' : '🇺🇸 US'}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      {medication.source === 'fr-gouv' ? 'Données officielles' :
                                       medication.source === 'openmedic' ? 'OpenMedic' : 'OpenFDA'}
                                    </span>
                                    {/* Indicateur de présentations multiples */}
                                    {hasMultiplePresentations && (
                                      <span className="px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                        {similarMeds.length + 1} dosages
                                      </span>
                                    )}
                                    {/* Badge de remboursement pour les médicaments français */}
                                    {medication.reimbursementRate && medication.source === 'fr-gouv' && (
                                      <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                                        {medication.reimbursementRate} remboursé
                                      </span>
                                    )}
                                  </div>
                                <div className="font-medium text-purple-600 truncate">
                                  {medication.name}
                                </div>
                                {medication.genericName && medication.genericName !== medication.name && (
                                  <div className="text-sm text-gray-700 truncate">
                                    DCI: {medication.genericName}
                                  </div>
                                )}
                                <div className="text-xs text-gray-500 truncate">
                                  {medication.holder || medication.manufacturer} • {medication.pharmaceuticalForm || medication.dosage}
                                  {medication.strength && ` • ${medication.strength}`}
                                </div>
                                {/* Informations supplémentaires pour les médicaments français */}
                                {medication.source === 'fr-gouv' && (
                                  <div className="flex items-center gap-2 mt-1">
                                    {medication.price && (
                                      <span className="text-xs text-green-600 font-medium">
                                        {medication.price.toFixed(2)} €
                                      </span>
                                    )}
                                    {medication.reimbursementRate && (
                                      <span className="text-xs text-blue-600 font-medium">
                                        {medication.reimbursementRate} remboursé
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ) } ) }
                      </div>
                    )}
                    {activeSearchField === 'medication' && searchQueries.medication.length >= 2 && medicationResults.length === 0 && !isSearching.medication && (
                      <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-md shadow-lg mt-1 p-4">
                        <div className="text-sm text-gray-500 text-center">
                          Aucun traitement trouvé pour "{searchQueries.medication}"
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Onglets par type */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="medical" className="gap-2">
                  <Stethoscope className="w-4 h-4" />
                  Médicaux
                </TabsTrigger>
                <TabsTrigger value="surgical" className="gap-2">
                  <FileText className="w-4 h-4" />
                  Chirurgicaux
                </TabsTrigger>
                <TabsTrigger value="allergy" className="gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Allergies
                </TabsTrigger>
                <TabsTrigger value="medication" className="gap-2">
                  <Pill className="w-4 h-4" />
                  Traitements
                </TabsTrigger>
              </TabsList>

              {['medical', 'surgical', 'allergy'].map((type) => (
                <TabsContent key={type} value={type} className="space-y-4">
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    </div>
                  ) : filterByType(type).length === 0 ? (
                    <Card>
                      <CardContent className="flex flex-col items-center justify-center py-8">
                        {getTypeIcon(type)}
                        <p className="text-gray-500 mt-2">Aucun antécédent {type}</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-2">
                      {filterByType(type).map((antecedent) => (
                        <Card key={antecedent.id} className="relative">
                          <CardContent className="p-3">
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  {getTypeIcon(antecedent.type)}
                                  <div className="min-w-0 flex-1">
                                    <h4 className="font-medium text-sm text-gray-900 truncate">
                                      {antecedent.code} - {antecedent.label}
                                    </h4>
                                    <p className="text-xs text-gray-500 truncate">{antecedent.system}</p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1 flex-wrap">
                                  <Badge className={`${getTypeColor(antecedent.type)} text-xs px-1.5 py-0.5`}>
                                    {antecedent.type}
                                  </Badge>
                                  <Badge variant={antecedent.defined_by === 'doctor' ? 'default' : 'secondary'} className="text-xs px-1.5 py-0.5">
                                    {antecedent.defined_by === 'doctor' ? 'Médecin' : 'Patient'}
                                  </Badge>
                                  {antecedent.validated_by_doctor && antecedent.defined_by === 'patient' && (
                                    <Badge className="bg-green-100 text-green-800 text-xs px-1.5 py-0.5">
                                      <Check className="w-3 h-3 mr-1" />
                                      Validé
                                    </Badge>
                                  )}
                                </div>

                                {/* Notes condensées */}
                                <div className="flex items-center gap-2 mt-2">
                                  {editingNote === antecedent.id ? (
                                    <Textarea
                                      value={noteText}
                                      onChange={(e) => setNoteText(e.target.value)}
                                      onBlur={() => updateDoctorNote(antecedent.id, noteText)}
                                      placeholder="Ajouter une note médicale..."
                                      rows={2}
                                      className="text-xs flex-1 border-gray-300 focus:border-blue-500"
                                      autoFocus
                                    />
                                  ) : (
                                    <div
                                      className="flex items-center gap-1 flex-1 min-w-0 cursor-pointer hover:bg-gray-50 p-1 rounded"
                                      onClick={() => startEditingNote(antecedent.id, antecedent.note || '')}
                                    >
                                      <Stethoscope className="w-3 h-3 text-green-600 flex-shrink-0" />
                                      <span className={`text-xs truncate flex-1 ${antecedent.note ? 'text-green-700' : 'text-gray-400 italic'}`}>
                                        {antecedent.note || 'Ajouter une note'}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Actions compactes */}
                              <div className="flex gap-1 ml-2">
                                {!antecedent.validated_by_doctor && antecedent.defined_by === 'patient' && (
                                  <Button
                                    size="sm"
                                    onClick={() => validateAntecedent(antecedent.id)}
                                    className="h-7 px-2 text-xs gap-1 bg-green-600 hover:bg-green-700"
                                  >
                                    <Check className="w-3 h-3" />
                                    Valider
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => removeAntecedent(antecedent.id)}
                                  className="h-7 px-2 text-xs gap-1"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
              ))}

              {/* Onglet Traitements */}
              <TabsContent value="medication" className="space-y-4">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                  </div>
                ) : (filterByType('medication').length === 0 && filterByType('treatment').length === 0) ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-8">
                      <Pill className="w-8 h-8 text-gray-400" />
                      <p className="text-gray-500 mt-2">Aucun traitement ajouté</p>
                      <p className="text-sm text-gray-400 mt-1">
                        Utilisez la recherche ci-dessus pour ajouter des traitements
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-2">
                    {[...filterByType('medication'), ...filterByType('treatment')].map((antecedent) => (
                      <Card key={antecedent.id} className="relative">
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <Pill className="w-4 h-4 text-purple-600" />
                                <div className="min-w-0 flex-1">
                                  <h4 className="font-medium text-sm text-gray-900 truncate">
                                    {antecedent.code} - {antecedent.label}
                                  </h4>
                                  <p className="text-xs text-gray-500 truncate">
                                    Source: {antecedent.system}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-1 flex-wrap">
                                <Badge className="bg-purple-100 text-purple-800 text-xs px-1.5 py-0.5">
                                  Traitement
                                </Badge>
                                <Badge variant="default" className="text-xs px-1.5 py-0.5">
                                  Médecin
                                </Badge>
                              </div>

                              {/* Notes condensées */}
                              <div className="flex items-center gap-2 mt-2">
                                {editingNote === antecedent.id ? (
                                  <Textarea
                                    value={noteText}
                                    onChange={(e) => setNoteText(e.target.value)}
                                    onBlur={() => updateDoctorNote(antecedent.id, noteText)}
                                    placeholder="Ajouter une note sur le traitement..."
                                    rows={2}
                                    className="text-xs flex-1 border-gray-300 focus:border-purple-500"
                                    autoFocus
                                  />
                                ) : (
                                  <div
                                    className="flex items-center gap-1 flex-1 min-w-0 cursor-pointer hover:bg-gray-50 p-1 rounded"
                                    onClick={() => startEditingNote(antecedent.id, antecedent.note || '')}
                                  >
                                    <Stethoscope className="w-3 h-3 text-green-600 flex-shrink-0" />
                                    <span className={`text-xs truncate flex-1 ${antecedent.note ? 'text-green-700' : 'text-gray-400 italic'}`}>
                                      {antecedent.note || 'Ajouter une note'}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Actions compactes */}
                            <div className="flex gap-1 ml-2">
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => removeAntecedent(antecedent.id)}
                                className="h-7 px-2 text-xs gap-1"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>

    </>
  );
}