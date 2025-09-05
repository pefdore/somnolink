// src/app/dashboard/doctor/patients/[patientId]/_components/patient-history-editor.tsx

"use client";

import { useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { useDebounce } from 'use-debounce';


// import type { User } from '@supabase/supabase-js'; // Commenté car non utilisé pour le moment

// --- TYPES (inchangés) ---
type StructuredEntry = {
code: string;
system: string;
label: string;
definedBy: 'patient' | 'doctor';
note: string;
// On ajoute les informations de création
creatorName?: string;
createdAt?: string;
};
type HistorySection = { description: string; entries: StructuredEntry[]; };
type HistoryData = { medical_history?: HistorySection; surgical_history?: HistorySection; allergies?: HistorySection;};
type ApiSuggestion = Omit<StructuredEntry, 'definedBy' | 'note' | 'creatorName' | 'createdAt'> & { isSurgicalSuggestion?: boolean; };

// Le composant accepte maintenant une prop "viewMode" pour ajuster son style
export default function PatientHistoryEditor({ patientId, viewMode = 'full' }: { patientId: string, viewMode?: 'condensed' | 'full' }) {
    // --- États (inchangés) ---
    const supabase = createClient();
    const [doctorName] = useState<string>(''); // doctorName est conservé pour usage futur
    const [formData, setFormData] = useState<HistoryData>({
        medical_history: { description: '', entries: [] },
        surgical_history: { description: '', entries: [] },
        allergies: { description: '', entries: [] }
    });
    const [isLoading, setIsLoading] = useState(true);
    const [medicalSearchTerm, setMedicalSearchTerm] = useState('');
    const [surgicalSearchTerm, setSurgicalSearchTerm] = useState('');
    const [allergySearchTerm, setAllergySearchTerm] = useState('');
    const [debouncedMedicalSearch] = useDebounce(medicalSearchTerm, 500);
    const [debouncedSurgicalSearch] = useDebounce(surgicalSearchTerm, 500);
    const [debouncedAllergySearch] = useDebounce(allergySearchTerm, 500);
    const [activeSearch, setActiveSearch] = useState<keyof HistoryData | null>(null);
    const [suggestions, setSuggestions] = useState<ApiSuggestion[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [editingNote, setEditingNote] = useState<{ section: keyof HistoryData; code: string } | null>(null);
    const isInitialMount = useRef(true);
    const noteEditorRef = useRef<HTMLDivElement>(null);
    const generateQuickCode = (label: string): string => {
        const words = label.split(' ').slice(0, 3); // On prend les 3 premiers mots
        return words.map(word => word.substring(0, 3).toUpperCase()).join('-');
    };


    // --- LOGIQUE (inchangée) ---
    const fetchHistory = useCallback(async () => {
        if (!patientId) return;
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('patients')
                .select('medical_history, surgical_history, allergies')
                .eq('id', patientId)
                .single();

            if (error && error.code !== 'PGRST116') {
                toast.error("Erreur chargement antécédents", { description: error.message });
            }

            const medical = data?.medical_history || {};
            const surgical = data?.surgical_history || {};
            const allergies = data?.allergies || {};

            setFormData({
                medical_history: {
                    description: medical.description || '',
                    entries: Array.isArray(medical.entries) ? medical.entries : [],
                },
                surgical_history: {
                    description: surgical.description || '',
                    entries: Array.isArray(surgical.entries) ? surgical.entries : [],
                },
                allergies: { description: allergies.description || '', entries: Array.isArray(allergies.entries) ? allergies.entries : [] }
            });
        } catch (e: unknown) {
            const error = e as Error;
            toast.error("Erreur inattendue.", { description: error.message });
        } finally {
            setIsLoading(false);
        }
    }, [patientId, supabase]);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    useEffect(() => {
        const searchTerm = activeSearch === 'medical_history' ? debouncedMedicalSearch : activeSearch === 'surgical_history' ? debouncedSurgicalSearch : debouncedAllergySearch;
        console.log('[PATIENT_HISTORY_EDITOR] useEffect triggered - searchTerm:', searchTerm, 'activeSearch:', activeSearch);
        if (!searchTerm || searchTerm.length < 3) {
            setSuggestions([]);
            return;
        }
        const searchTerminology = async () => {
            console.log('[PATIENT_HISTORY_EDITOR] Starting search for:', searchTerm);
            setIsSearching(true);
            try {
                const response = await fetch(`/api/terminology-search?q=${searchTerm}`);
                console.log('[PATIENT_HISTORY_EDITOR] API response status:', response.status);
                const data = await response.json() as ApiSuggestion[];
                console.log('[PATIENT_HISTORY_EDITOR] API response data length:', data.length);
                const taggedData = data.map((d) => ({ ...d, isSurgicalSuggestion: d.code.startsWith('Z') }));
                setSuggestions(taggedData);
            } catch (error) {
                console.error('[PATIENT_HISTORY_EDITOR] Search error:', error);
                toast.error("La recherche a échoué.");
            }
            finally { setIsSearching(false); }
        };
        searchTerminology();
    }, [debouncedMedicalSearch, debouncedSurgicalSearch, debouncedAllergySearch, activeSearch]);

    const handleAddEntry = (section: keyof HistoryData, suggestion: ApiSuggestion) => {
        const newEntry: StructuredEntry = { ...suggestion, definedBy: 'doctor', note: '', creatorName: doctorName || 'Médecin', createdAt: new Date().toISOString() };
        setFormData(prev => {
            const currentSection = prev[section] || { description: '', entries: [] };
            if (currentSection.entries.some(e => e.code === newEntry.code)) {
                toast.warning("Cet antécédent a déjà été ajouté.");
                return prev;
            }
            return { ...prev, [section]: { ...currentSection, entries: [...currentSection.entries, newEntry] } };
        });
        setMedicalSearchTerm('');
        setSurgicalSearchTerm('');
        setSuggestions([]);
        setActiveSearch(null);
    };

    const handleRemoveEntry = (section: keyof HistoryData, code: string) => {
        setFormData(prev => {
            const currentSection = prev[section] || { description: '', entries: [] };
            return { ...prev, [section]: { ...currentSection, entries: currentSection.entries.filter(e => e.code !== code) } };
        });
    };

    const handleNoteChange = (section: keyof HistoryData, code: string, newNote: string) => {
        setFormData(prev => {
            const currentSection = prev[section] || { description: '', entries: [] };
            return { ...prev, [section]: { ...currentSection, entries: currentSection.entries.map(e => e.code === code ? { ...e, note: newNote } : e) } };
        });
    };
    
    const handleSave = useCallback(async () => {
        if (!patientId || !formData) return;
        
        const { error } = await supabase.from('patients').update({
            medical_history: formData.medical_history,
            surgical_history: formData.surgical_history,
            allergies: formData.allergies
        }).eq('id', patientId);

        if (error) {
            toast.error("Erreur lors de l'enregistrement automatique.", { description: error.message });
        } else {
             // Vous pouvez décommenter la ligne suivante pour avoir une confirmation visuelle discrète
             // console.log("Sauvegarde automatique réussie.");
        }
    }, [formData, supabase, patientId]);

    // La sauvegarde est maintenant gérée par un useEffect pour un enregistrement automatique
    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }

        const handler = setTimeout(() => {
            handleSave();
        }, 1500); // Délai de 1.5s après la dernière modification

        return () => {
            clearTimeout(handler);
        };
    }, [formData, handleSave]); // Se déclenche à chaque changement du formulaire

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (noteEditorRef.current && !noteEditorRef.current.contains(event.target as Node)) {
                setEditingNote(null);
            }
        }
        if (editingNote) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [editingNote]);

    if (isLoading) return <div className="p-4">Chargement...</div>;
    
    // Classes conditionnelles basées sur viewMode
    const containerClasses = viewMode === 'condensed' ? "p-0" : "bg-white p-6 rounded-lg shadow-md";
    const titleClasses = viewMode === 'condensed' ? "text-base font-semibold text-gray-700" : "text-lg font-semibold text-gray-700";
    const sectionWrapperClasses = viewMode === 'condensed' ? "p-2 border rounded-md mt-1 bg-gray-50" : "p-3 border rounded-md mt-1 bg-gray-50";
    const entryClasses = viewMode === 'condensed' ? "p-2 bg-white rounded-lg border" : "p-3 bg-white rounded-lg border";
    const entryLabelClasses = viewMode === 'condensed' ? "text-sm font-semibold text-gray-800 cursor-pointer hover:text-blue-600" : "font-semibold text-gray-800 cursor-pointer hover:text-blue-600";
    const inputClasses = viewMode === 'condensed' ? "w-full p-1.5 border rounded-md text-sm" : "w-full p-2 border rounded-md";


    return (
        <div className={containerClasses}>
            <div className="space-y-6">

                {/* Section Médicale */}
                <div>
                    <label className={titleClasses}>Médicaux</label>
                    <div className={sectionWrapperClasses}>
                        <div className="space-y-2">
                            {(formData.medical_history?.entries || []).map(entry => (
                                <div key={entry.code} className={entryClasses}>
                                    <div className="flex justify-between items-start gap-2">
                                        <div className="flex items-center gap-2 flex-grow">
                                            <p onClick={() => setEditingNote({ section: 'medical_history', code: entry.code })} className={entryLabelClasses}>
                                                {entry.label} <span className="text-gray-500 font-normal">({entry.code})</span>
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            {entry.definedBy === 'patient' && <span title={`Défini par le ${entry.creatorName || 'Patient'}\nLe ${new Date(entry.createdAt || Date.now()).toLocaleDateString('fr-FR')}`} className="flex items-center justify-center h-5 w-5 bg-green-100 text-green-800 text-xs font-bold rounded-full">P</span>}
                                            {entry.definedBy === 'doctor' && <span title={`Défini par le ${entry.creatorName || 'Médecin'}\nLe ${new Date(entry.createdAt || Date.now()).toLocaleDateString('fr-FR')}`} className="flex items-center justify-center h-5 w-5 bg-blue-100 text-blue-800 text-xs font-bold rounded-full">M</span>}
                                            <button onClick={() => handleRemoveEntry('medical_history', entry.code)} className="text-red-500 hover:text-red-700 font-bold text-xl">&times;</button>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-2">
                                        {editingNote?.section === 'medical_history' && editingNote?.code === entry.code ? (
                                             <div ref={noteEditorRef}>
                                                <textarea value={entry.note} onChange={(e) => handleNoteChange('medical_history', entry.code, e.target.value)} placeholder="Ajouter une note..." rows={2} className="w-full p-2 border rounded-md text-sm" autoFocus />
                                                <button onClick={() => setEditingNote(null)} className="mt-1 px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700">Valider</button>
                                            </div>
                                        ) : (
                                            entry.note && (
                                                <div onClick={() => setEditingNote({ section: 'medical_history', code: entry.code })} className="cursor-pointer p-2 rounded-md hover:bg-gray-100">
                                                    <p className="text-sm text-gray-800 whitespace-pre-wrap"><strong className="text-gray-600">Note:</strong> {entry.note}</p>
                                                </div>
                                            )
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="relative mt-3">
                             <input type="text" value={medicalSearchTerm} onChange={(e) => setMedicalSearchTerm(e.target.value)} onFocus={() => setActiveSearch('medical_history')} placeholder="Ajouter..." className={inputClasses}/>
                             {isSearching && activeSearch === 'medical_history' && <div className="absolute right-2 top-1.5 text-xs text-gray-500">...</div>}
                             {suggestions.length > 0 && activeSearch === 'medical_history' && (
                                 <ul className="absolute z-10 w-full bg-white border shadow-lg rounded-md mt-1 max-h-60 overflow-y-auto">
                                     {suggestions.map(sugg => <li key={sugg.code} onClick={() => handleAddEntry('medical_history', sugg)} className="px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer">{sugg.label}</li>)}
                                 </ul>
                             )}
                        </div>
                    </div>
                </div>
                
                {/* Section Chirurgicale */}
                <div>
                    <label className={titleClasses}>Chirurgicaux</label>
                    <div className={sectionWrapperClasses}>
                        <div className="space-y-2">
                            {(formData.surgical_history?.entries || []).map(entry => (
                                <div key={entry.code} className={entryClasses}>
                                    <div className="flex justify-between items-start gap-2">
                                        <div className="flex items-center gap-2 flex-grow">
                                            <p onClick={() => setEditingNote({ section: 'surgical_history', code: entry.code })} className={entryLabelClasses}>
                                                 {entry.label} <span className="text-gray-500 font-normal">({entry.code})</span>
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            {entry.definedBy === 'patient' && <span title="Défini par le patient" className="flex items-center justify-center h-5 w-5 bg-green-100 text-green-800 text-xs font-bold rounded-full">P</span>}
                                            {entry.definedBy === 'doctor' && <span title="Défini par le médecin" className="flex items-center justify-center h-5 w-5 bg-blue-100 text-blue-800 text-xs font-bold rounded-full">M</span>}
                                            <button onClick={() => handleRemoveEntry('surgical_history', entry.code)} className="text-red-500 hover:text-red-700 font-bold text-xl">&times;</button>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-2">
                                        {editingNote?.section === 'surgical_history' && editingNote?.code === entry.code ? (
                                            <div ref={noteEditorRef}>
                                                <textarea value={entry.note} onChange={(e) => handleNoteChange('surgical_history', entry.code, e.target.value)} placeholder="Ajouter une note..." rows={2} className="w-full p-2 border rounded-md text-sm" autoFocus />
                                                <button onClick={() => setEditingNote(null)} className="mt-1 px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700">Valider</button>
                                            </div>
                                        ) : (
                                            entry.note && (
                                                <div onClick={() => setEditingNote({ section: 'surgical_history', code: entry.code })} className="cursor-pointer p-2 rounded-md hover:bg-gray-100">
                                                    <p className="text-sm text-gray-800 whitespace-pre-wrap"><strong className="text-gray-600">Note:</strong> {entry.note}</p>
                                                </div>
                                            )
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="relative mt-3">
                            <input type="text" value={surgicalSearchTerm} onChange={(e) => setSurgicalSearchTerm(e.target.value)} onFocus={() => setActiveSearch('surgical_history')} placeholder="Ajouter..." className={inputClasses}/>
                             {isSearching && activeSearch === 'surgical_history' && <div className="absolute right-2 top-1.5 text-xs text-gray-500">...</div>}
                            {suggestions.length > 0 && activeSearch === 'surgical_history' && (
                                <ul className="absolute z-10 w-full bg-white border shadow-lg rounded-md mt-1 max-h-60 overflow-y-auto">
                                    {suggestions.map(sugg => <li key={sugg.code} onClick={() => handleAddEntry('surgical_history', sugg)} className="px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer">{sugg.label} {sugg.isSurgicalSuggestion && <span className="ml-2 text-xs font-semibold text-green-700">(Suggéré)</span>}</li>)}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>
                
                {/* Section Allergies */}
                <div>
                    <label className={titleClasses}>Allergies</label>
                    <div className={sectionWrapperClasses}>
                        <div className="space-y-2">
                            {(formData.allergies?.entries || []).map(entry => (
                                <div key={entry.code} className={entryClasses}>
                                    <div className="flex justify-between items-start gap-2">
                                        <div className="flex items-center gap-2 flex-grow">
                                            <p onClick={() => setEditingNote({ section: 'allergies', code: entry.code })} className={entryLabelClasses}>{entry.label}</p>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <span className="text-xs font-mono text-gray-500">{generateQuickCode(entry.label)}</span>
                                            {entry.definedBy === 'patient' && <span title={`Défini par le patient\n${entry.creatorName || 'Patient'}\nLe ${new Date(entry.createdAt || Date.now()).toLocaleDateString('fr-FR')}`} className="flex items-center justify-center h-5 w-5 bg-green-100 text-green-800 text-xs font-bold rounded-full">P</span>}
                                            {entry.definedBy === 'doctor' && <span title={`Défini par le médecin\n${entry.creatorName || 'Médecin'}\nLe ${new Date(entry.createdAt || Date.now()).toLocaleDateString('fr-FR')}`} className="flex items-center justify-center h-5 w-5 bg-blue-100 text-blue-800 text-xs font-bold rounded-full">M</span>}
                                            <button onClick={() => handleRemoveEntry('allergies', entry.code)} className="text-red-500 hover:text-red-700 font-bold text-xl">&times;</button>
                                        </div>
                                    </div>
                                    <div className="mt-2">
                                        {editingNote?.section === 'allergies' && editingNote?.code === entry.code ? (
                                            <div ref={noteEditorRef}>
                                                <textarea value={entry.note} onChange={(e) => handleNoteChange('allergies', entry.code, e.target.value)} placeholder="Ajouter une note..." rows={2} className="w-full p-2 border rounded-md text-sm" autoFocus />
                                                <button onClick={() => setEditingNote(null)} className="mt-1 px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700">Valider</button>
                                            </div>
                                        ) : (
                                            entry.note && (
                                                <div onClick={() => setEditingNote({ section: 'allergies', code: entry.code })} className="cursor-pointer p-2 rounded-md hover:bg-gray-100">
                                                    <p className="text-sm text-gray-800 whitespace-pre-wrap"><strong className="text-gray-600">Note:</strong> {entry.note}</p>
                                                </div>
                                            )
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="relative mt-3">
                            <input type="text" value={allergySearchTerm} onChange={(e) => setAllergySearchTerm(e.target.value)} onFocus={() => setActiveSearch('allergies')} placeholder="Ajouter..." className={inputClasses}/>
                             {isSearching && activeSearch === 'allergies' && <div className="absolute right-2 top-1.5 text-xs text-gray-500">...</div>}
                            {suggestions.length > 0 && activeSearch === 'allergies' && (
                                <ul className="absolute z-10 w-full bg-white border shadow-lg rounded-md mt-1 max-h-60 overflow-y-auto">
                                    {suggestions.map(sugg => <li key={sugg.code} onClick={() => handleAddEntry('allergies', sugg)} className="px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer">{sugg.label}</li>)}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}