// src/app/dashboard/patient/history/page.tsx

"use client";

import { useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { useDebounce } from 'use-debounce';

// --- TYPES ---
type StructuredEntry = { 
    code: string; 
    system: string; 
    label: string; 
    definedBy: 'patient' | 'doctor'; 
    note: string; 
    creatorName?: string; 
    createdAt?: string; 
};
type HistorySection = { description: string; entries: StructuredEntry[]; };
type HistoryData = {
    medical_history?: HistorySection;
    surgical_history?: HistorySection;
    allergies?: HistorySection;
};
type ApiSuggestion = Omit<StructuredEntry, 'definedBy' | 'note' | 'creatorName' | 'createdAt'> & { isSurgicalSuggestion?: boolean; };

// FONCTION POUR GÉNÉRER UN CODE RAPIDE
const generateQuickCode = (label: string): string => {
    const words = label.split(' ').slice(0, 3);
    return words.map(word => word.substring(0, 3).toUpperCase()).join('-');
};

export default function PatientHistoryPage() {
    const supabase = createClient();
    const [user, setUser] = useState<User | null>(null);
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

    const fetchHistory = useCallback(async (userId: string) => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('patients')
                .select('medical_history, surgical_history, allergies')
                .eq('user_id', userId)
                .single();

            if (error && error.code !== 'PGRST116') {
                toast.error("Erreur lors du chargement des données", { description: error.message });
            }
            
            const medical = data?.medical_history || {};
            const surgical = data?.surgical_history || {};
            const allergies = data?.allergies || {};
            
            setFormData({
                medical_history: { description: medical.description || '', entries: Array.isArray(medical.entries) ? medical.entries : [] },
                surgical_history: { description: surgical.description || '', entries: Array.isArray(surgical.entries) ? surgical.entries : [] },
                allergies: { description: allergies.description || '', entries: Array.isArray(allergies.entries) ? allergies.entries : [] },
            });
        } catch (e: any) { 
            toast.error("Une erreur inattendue est survenue.", { description: e.message }); 
        } finally {
            setIsLoading(false);
        }
    }, [supabase]);

    useEffect(() => {
        const initializePage = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if(user) {
                    setUser(user);
                    await fetchHistory(user.id);
                }
            } catch (e: any) {
                toast.error("Impossible de vérifier l'utilisateur.", { description: e.message });
            } finally {
                setIsLoading(false);
            }
        };
        initializePage();
    }, [supabase, fetchHistory]);
    
    useEffect(() => {
        const searchTerm = activeSearch === 'medical_history' ? debouncedMedicalSearch 
                         : activeSearch === 'surgical_history' ? debouncedSurgicalSearch
                         : debouncedAllergySearch;
        if (!searchTerm || searchTerm.length < 3) {
            setSuggestions([]);
            return;
        }
        const searchTerminology = async () => {
            setIsSearching(true);
            try {
                const response = await fetch(`/api/terminology-search?q=${searchTerm}`);
                const data = await response.json();
                const taggedData = data.map((d: any) => ({...d, isSurgicalSuggestion: d.code.startsWith('Z')}));
                setSuggestions(taggedData);
            } catch(e) { toast.error("La recherche a échoué.") }
            finally { setIsSearching(false); }
        };
        searchTerminology();
    }, [debouncedMedicalSearch, debouncedSurgicalSearch, debouncedAllergySearch, activeSearch]);

    const handleAddEntry = (section: keyof HistoryData, suggestion: ApiSuggestion) => {
        const newEntry: StructuredEntry = { 
            ...suggestion, 
            definedBy: 'patient',
            note: '',
            creatorName: user?.user_metadata?.full_name || 'Patient',
            createdAt: new Date().toISOString()
        };
        setFormData(prev => {
            const currentSection = prev[section] || { description: '', entries: [] };
            if (currentSection.entries.some(e => e.code === newEntry.code)) {
                toast.warning("Cet élément a déjà été ajouté.");
                return prev;
            }
            return { ...prev, [section]: { ...currentSection, entries: [...currentSection.entries, newEntry] } };
        });
        setMedicalSearchTerm('');
        setSurgicalSearchTerm('');
        setAllergySearchTerm('');
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
        if (!user || !formData) return;
        const saveAction = async () => {
            const { error } = await supabase.from('patients').update({ 
                medical_history: formData.medical_history,
                surgical_history: formData.surgical_history,
                allergies: formData.allergies
            }).eq('user_id', user.id);
            if (error) throw error;
        };
        toast.promise(saveAction(), {
            loading: 'Enregistrement...',
            success: 'Modifications enregistrées !',
            error: (err: any) => `Erreur : ${err.message || 'Une erreur est survenue'}`,
        });
    }, [formData, supabase, user]);

    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }
        if (!user) return;
        const handler = setTimeout(() => { handleSave(); }, 1500);
        return () => { clearTimeout(handler); };
    }, [formData, user, handleSave]);

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

    if (isLoading) return <div>Chargement...</div>;

    return (
        <div>
            <h1 className="text-3xl font-bold">Mes Antécédents et Allergies</h1>
            <p className="mt-2 text-gray-600">Vos modifications sont enregistrées automatiquement. Cliquez sur un élément pour lui ajouter une note.</p>

            <div className="mt-8 space-y-8 max-w-2xl">
                {/* SECTION MÉDICALE */}
                <div>
                    <label className="text-xl font-semibold">Antécédents Médicaux</label>
                    <div className="p-3 border rounded-md mt-1">
                        <div className="space-y-3">
                            {(formData.medical_history?.entries || []).map(entry => (
                                <div key={entry.code} className="p-3 bg-gray-50 rounded-lg border">
                                    <div className="flex justify-between items-start gap-2">
                                        <div className="flex items-center gap-2 flex-grow">
                                            <p onClick={() => setEditingNote({ section: 'medical_history', code: entry.code })} className="font-semibold text-gray-800 cursor-pointer hover:text-blue-600">
                                                {entry.label}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <span className="text-xs font-mono text-gray-500">{generateQuickCode(entry.label)}</span>
                                            {entry.definedBy === 'patient' && <span title={`Défini par vous\nLe ${new Date(entry.createdAt || Date.now()).toLocaleDateString('fr-FR')}`} className="flex items-center justify-center h-5 w-5 bg-green-100 text-green-800 text-xs font-bold rounded-full">P</span>}
                                            {entry.definedBy === 'doctor' && <span title={`Défini par le médecin\n${entry.creatorName || 'Médecin'}\nLe ${new Date(entry.createdAt || Date.now()).toLocaleDateString('fr-FR')}`} className="flex items-center justify-center h-5 w-5 bg-blue-100 text-blue-800 text-xs font-bold rounded-full">M</span>}
                                            <button onClick={() => handleRemoveEntry('medical_history', entry.code)} className="text-red-500 hover:text-red-700 font-bold text-xl">&times;</button>
                                        </div>
                                    </div>
                                    <div className="mt-2">
                                        {editingNote?.section === 'medical_history' && editingNote?.code === entry.code ? (
                                            <div ref={noteEditorRef}>
                                                <textarea value={entry.note} onChange={(e) => handleNoteChange('medical_history', entry.code, e.target.value)} placeholder="Ajouter des détails..." rows={2} className="w-full p-2 border rounded-md text-sm" autoFocus />
                                                <button onClick={() => setEditingNote(null)} className="mt-1 px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700">Valider</button>
                                            </div>
                                        ) : (
                                            entry.note && (
                                                <div onClick={() => setEditingNote({ section: 'medical_history', code: entry.code })} className="cursor-pointer p-2 rounded-md hover:bg-gray-100">
                                                    <label className="text-sm font-medium text-gray-600">Note personnelle :</label>
                                                    <p className="text-sm text-gray-800 whitespace-pre-wrap">{entry.note}</p>
                                                </div>
                                            )
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="relative mt-4">
                             <input type="text" value={medicalSearchTerm} onChange={(e) => setMedicalSearchTerm(e.target.value)} onFocus={() => setActiveSearch('medical_history')} placeholder="Rechercher une maladie, un diagnostic..." className="w-full p-2 border rounded-md"/>
                            {isSearching && activeSearch === 'medical_history' && <div className="absolute right-2 top-2 text-sm text-gray-500">Recherche...</div>}
                            {suggestions.length > 0 && activeSearch === 'medical_history' && (
                                <ul className="absolute z-10 w-full bg-white border shadow-lg rounded-md mt-1 max-h-60 overflow-y-auto">
                                    {suggestions.map(sugg => <li key={sugg.code} onClick={() => handleAddEntry('medical_history', sugg)} className="px-4 py-2 hover:bg-gray-100 cursor-pointer">{sugg.label}</li>)}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>

                {/* SECTION CHIRURGICALE */}
                <div>
                    <label className="text-xl font-semibold">Antécédents Chirurgicaux</label>
                    <div className="p-3 border rounded-md mt-1">
                        <div className="space-y-3">
                            {(formData.surgical_history?.entries || []).map(entry => (
                                <div key={entry.code} className="p-3 bg-gray-50 rounded-lg border">
                                    <div className="flex justify-between items-start gap-2">
                                        <div className="flex items-center gap-2 flex-grow">
                                            <p onClick={() => setEditingNote({ section: 'surgical_history', code: entry.code })} className="font-semibold text-gray-800 cursor-pointer hover:text-blue-600">{entry.label}</p>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            {entry.definedBy === 'patient' && <span title={`Défini par vous\nLe ${new Date(entry.createdAt || Date.now()).toLocaleDateString('fr-FR')}`} className="flex items-center justify-center h-5 w-5 bg-green-100 text-green-800 text-xs font-bold rounded-full">P</span>}
                                            {entry.definedBy === 'doctor' && <span title={`Défini par le médecin\n${entry.creatorName || 'Médecin'}\nLe ${new Date(entry.createdAt || Date.now()).toLocaleDateString('fr-FR')}`} className="flex items-center justify-center h-5 w-5 bg-blue-100 text-blue-800 text-xs font-bold rounded-full">M</span>}
                                            <button onClick={() => handleRemoveEntry('surgical_history', entry.code)} className="text-red-500 hover:text-red-700 font-bold text-xl">&times;</button>
                                        </div>
                                    </div>
                                    <div className="mt-2">
                                        {editingNote?.section === 'surgical_history' && editingNote?.code === entry.code ? (
                                            <div ref={noteEditorRef}>
                                                <textarea value={entry.note} onChange={(e) => handleNoteChange('surgical_history', entry.code, e.target.value)} placeholder="Ajouter des détails..." rows={2} className="w-full p-2 border rounded-md text-sm" autoFocus />
                                                <button onClick={() => setEditingNote(null)} className="mt-1 px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700">Valider</button>
                                            </div>
                                        ) : (
                                            entry.note && (
                                                <div onClick={() => setEditingNote({ section: 'surgical_history', code: entry.code })} className="cursor-pointer p-2 rounded-md hover:bg-gray-100">
                                                    <label className="text-sm font-medium text-gray-600">Note personnelle :</label>
                                                    <p className="text-sm text-gray-800 whitespace-pre-wrap">{entry.note}</p>
                                                </div>
                                            )
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="relative mt-4">
                             <input type="text" value={surgicalSearchTerm} onChange={(e) => setSurgicalSearchTerm(e.target.value)} onFocus={() => setActiveSearch('surgical_history')} placeholder="Rechercher une opération..." className="w-full p-2 border rounded-md"/>
                            {isSearching && activeSearch === 'surgical_history' && <div className="absolute right-2 top-2 text-sm text-gray-500">Recherche...</div>}
                            {suggestions.length > 0 && activeSearch === 'surgical_history' && (
                                <ul className="absolute z-10 w-full bg-white border shadow-lg rounded-md mt-1 max-h-60 overflow-y-auto">
                                    {suggestions.map(sugg => <li key={sugg.code} onClick={() => handleAddEntry('surgical_history', sugg)} className="px-4 py-2 hover:bg-gray-100 cursor-pointer">{sugg.label} {sugg.isSurgicalSuggestion && <span className="ml-2 text-xs font-semibold text-green-700">(Suggéré)</span>}</li>)}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>
                
                {/* NOUVELLE SECTION ALLERGIES */}
                <div>
                    <label className="text-xl font-semibold">Allergies</label>
                    <div className="p-3 border rounded-md mt-1">
                        <div className="space-y-3">
                            {(formData.allergies?.entries || []).map(entry => (
                                <div key={entry.code} className="p-3 bg-gray-50 rounded-lg border">
                                    <div className="flex justify-between items-start gap-2">
                                        <div className="flex items-center gap-2 flex-grow">
                                            <p onClick={() => setEditingNote({ section: 'allergies', code: entry.code })} className="font-semibold text-gray-800 cursor-pointer hover:text-blue-600">{entry.label}</p>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <span className="text-xs font-mono text-gray-500">{generateQuickCode(entry.label)}</span>
                                            {entry.definedBy === 'patient' && <span title={`Défini par vous\nLe ${new Date(entry.createdAt || Date.now()).toLocaleDateString('fr-FR')}`} className="flex items-center justify-center h-5 w-5 bg-green-100 text-green-800 text-xs font-bold rounded-full">P</span>}
                                            {entry.definedBy === 'doctor' && <span title={`Défini par le médecin\n${entry.creatorName || 'Médecin'}\nLe ${new Date(entry.createdAt || Date.now()).toLocaleDateString('fr-FR')}`} className="flex items-center justify-center h-5 w-5 bg-blue-100 text-blue-800 text-xs font-bold rounded-full">M</span>}
                                            <button onClick={() => handleRemoveEntry('allergies', entry.code)} className="text-red-500 hover:text-red-700 font-bold text-xl">&times;</button>
                                        </div>
                                    </div>
                                    <div className="mt-2">
                                        {editingNote?.section === 'allergies' && editingNote?.code === entry.code ? (
                                            <div ref={noteEditorRef}>
                                                <textarea value={entry.note} onChange={(e) => handleNoteChange('allergies', entry.code, e.target.value)} placeholder="Décrire la réaction..." rows={2} className="w-full p-2 border rounded-md text-sm" autoFocus />
                                                <button onClick={() => setEditingNote(null)} className="mt-1 px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700">Valider</button>
                                            </div>
                                        ) : (
                                            entry.note && (
                                                <div onClick={() => setEditingNote({ section: 'allergies', code: entry.code })} className="cursor-pointer p-2 rounded-md hover:bg-gray-100">
                                                    <label className="text-sm font-medium text-gray-600">Note :</label>
                                                    <p className="text-sm text-gray-800 whitespace-pre-wrap">{entry.note}</p>
                                                </div>
                                            )
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="relative mt-4">
                            <input type="text" value={allergySearchTerm} onChange={(e) => setAllergySearchTerm(e.target.value)} onFocus={() => setActiveSearch('allergies')} placeholder="Ajouter une allergie..." className="w-full p-2 border rounded-md"/>
                             {isSearching && activeSearch === 'allergies' && <div className="absolute right-2 top-2 text-sm text-gray-500">Recherche...</div>}
                            {suggestions.length > 0 && activeSearch === 'allergies' && (
                                <ul className="absolute z-10 w-full bg-white border shadow-lg rounded-md mt-1 max-h-60 overflow-y-auto">
                                    {suggestions.map(sugg => <li key={sugg.code} onClick={() => handleAddEntry('allergies', sugg)} className="px-4 py-2 hover:bg-gray-100 cursor-pointer">{sugg.label}</li>)}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}