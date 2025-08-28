"use client";

type Questionnaire = {
    id: string;
    type: string;
    submitted_at: string;
    answers: Record<string, unknown>;
};

interface SymptomData {
    frequency?: string;
    comments?: string;
    details?: Record<string, unknown>;
}

const questionnaireTitles: Record<string, string> = {
    'PRE_CONSULTATION_SLEEP_FULL': 'Questionnaire de Pré-consultation Sommeil Complet',
    'MORNING_AFTER': 'Questionnaire "Au Réveil"',
    'PRE_CONSULTATION': 'Questionnaire de Pré-consultation'
};

const formatValue = (value: unknown): string => {
    if (value === null || value === undefined) return 'Non renseigné';
    if (typeof value === 'boolean') return value ? 'Oui' : 'Non';
    if (typeof value === 'object') {
        if (Array.isArray(value)) return value.join(', ');
        return JSON.stringify(value);
    }
    return String(value);
};

const renderSection = (title: string, data: Record<string, unknown>, mapper?: Record<string, string>) => (
    <div className="space-y-4">
        <h4 className="font-semibold text-lg text-blue-800 border-b pb-2">{title}</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(data).map(([key, value]) => {
                if (value === null || value === undefined || value === '') return null;
                
                const displayName = mapper?.[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                const formattedValue = formatValue(value);
                
                return (
                    <div key={key} className="bg-gray-50 p-4 rounded-lg border">
                        <p className="font-medium text-sm text-gray-700 mb-1">{displayName}</p>
                        <p className="text-gray-900 text-base">{formattedValue}</p>
                    </div>
                );
            })}
        </div>
    </div>
);

const renderEpworthScale = (epworth: Record<string, string>) => {
    const epworthQuestions: Record<string, string> = {
        'reading': 'Assis en train de lire',
        'tv': 'En regardant la télévision',
        'public': 'Assis, inactif dans un lieu public',
        'passenger': 'Passager en voiture pendant 1 heure',
        'lying_down': 'Allongé pour une sieste',
        'talking': 'Assis en train de parler à quelqu\'un',
        'after_lunch': 'Assis calmement après un déjeuner sans alcool',
        'in_car': 'En voiture, à un arrêt (feu, embouteillage)'
    };

    return (
        <div className="space-y-3">
            <h4 className="font-semibold text-lg text-blue-800 border-b pb-2">Échelle de Somnolence d&apos;Epworth</h4>
            {Object.entries(epworth).map(([key, score]) => (
                <div key={key} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border">
                    <span className="text-gray-700">{epworthQuestions[key] || key}</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        parseInt(score) > 2 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-blue-100 text-blue-800'
                    }`}>
                        Score: {score}
                    </span>
                </div>
            ))}
        </div>
    );
};

const renderSymptoms = (symptoms: Record<string, SymptomData>) => {
    const symptomLabels: Record<string, string> = {
        'snoring': 'Ronflements',
        'breathing_pauses': 'Pauses respiratoires observées',
        'choking': 'Sensation d\'étouffement',
        'headaches': 'Maux de tête matinaux',
        'nycturia': 'Réveils nocturnes pour uriner',
        'non_restorative_sleep': 'Sommeil non réparateur',
        'daytime_fatigue': 'Fatigue diurne',
        'concentration_memory': 'Difficultés de concentration/mémoire',
        'irritability_mood': 'Irritabilité/changements d\'humeur'
    };

    return (
        <div className="space-y-4">
            <h4 className="font-semibold text-lg text-blue-800 border-b pb-2">Symptômes</h4>
            {Object.entries(symptoms).map(([key, symptomData]: [string, SymptomData]) => (
                <div key={key} className="bg-gray-50 p-4 rounded-lg border">
                    <h5 className="font-medium text-gray-800">{symptomLabels[key] || key}</h5>
                    {symptomData.frequency && (
                        <p className="text-sm text-gray-600 mt-1">
                            Fréquence: {symptomData.frequency}
                        </p>
                    )}
                    {symptomData.comments && (
                        <p className="text-sm text-gray-600 mt-1">
                            Commentaires: {symptomData.comments}
                        </p>
                    )}
                    {symptomData.details && Object.entries(symptomData.details).map(([detailKey, detailValue]) => (
                        <p key={detailKey} className="text-sm text-gray-600 mt-1">
                            {detailKey}: {formatValue(detailValue)}
                        </p>
                    ))}
                </div>
            ))}
        </div>
    );
};

const renderChecklist = (data: Record<string, boolean>, title: string, labels: Record<string, string>) => {
    const selectedItems = Object.entries(data)
        .filter(([, value]) => value)
        .map(([key]) => labels[key] || key);

    if (selectedItems.length === 0) return null;

    return (
        <div className="space-y-3">
            <h4 className="font-semibold text-lg text-blue-800 border-b pb-2">{title}</h4>
            <div className="flex flex-wrap gap-2">
                {selectedItems.map(item => (
                    <span key={item} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                        {item}
                    </span>
                ))}
            </div>
        </div>
    );
};

export default function QuestionnaireViewer({ questionnaires }: { questionnaires: Questionnaire[] }) {
    if (!questionnaires || questionnaires.length === 0) {
        return <p className="text-gray-500">Aucun questionnaire soumis.</p>;
    }

    return (
        <div className="space-y-6">
            {questionnaires.map((q) => {
                const answers = q.answers;
                
                return (
                    <div key={q.id} className="bg-white rounded-lg shadow-md border-2 border-blue-100 overflow-hidden">
                        <div className="bg-blue-50 px-6 py-4 border-b border-blue-200">
                            <h3 className="text-2xl font-bold text-blue-900">
                                {questionnaireTitles[q.type] || q.type}
                            </h3>
                            <p className="text-blue-700 mt-1">
                                Soumis le {new Date(q.submitted_at).toLocaleDateString('fr-FR', { 
                                    weekday: 'long', 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </p>
                            {answers.epworth_total && (
                                <span className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-medium ${
                                    answers.epworth_total > 10 
                                        ? 'bg-red-100 text-red-800' 
                                        : 'bg-green-100 text-green-800'
                                }`}>
                                    Score Epworth: {answers.epworth_total}
                                </span>
                            )}
                        </div>
                        
                        <div className="p-6 space-y-8">
                            {/* Informations générales */}
                            {renderSection('Informations Générales', {
                                height: answers.height ? `${answers.height} cm` : null,
                                weight: answers.weight ? `${answers.weight} kg` : null,
                                neck_circumference: answers.neck_circumference ? `${answers.neck_circumference} cm` : null,
                                profession: answers.profession,
                                family_situation: answers.family_situation === 'seul' ? 'Seul(e)' : 
                                               answers.family_situation === 'en_couple' ? 'En couple' : 
                                               answers.family_situation
                            })}

                            {/* Rendez-vous */}
                            {answers.appointment_date && answers.appointment_time && (
                                renderSection('Rendez-vous', {
                                    date: new Date(`${answers.appointment_date}T${answers.appointment_time}`).toLocaleDateString('fr-FR'),
                                    heure: answers.appointment_time
                                })
                            )}

                            {/* Échelle Epworth */}
                            {answers.epworth && renderEpworthScale(answers.epworth)}

                            {/* Motifs de consultation */}
                            {answers.consultation_reasons && renderChecklist(
                                answers.consultation_reasons,
                                'Motifs de Consultation',
                                {
                                    'Ronflements importants': 'Ronflements importants',
                                    'Sensation de fatigue': 'Sensation de fatigue',
                                    'Somnolence excessive': 'Somnolence excessive',
                                    'Pauses respiratoires observées': 'Pauses respiratoires observées',
                                    'Sensation d\'étouffement': 'Sensation d\'étouffement',
                                    'Maux de tête le matin': 'Maux de tête le matin',
                                    'Réveils fréquents pour uriner (Nycturie)': 'Réveils fréquents pour uriner',
                                    'Sommeil non réparateur': 'Sommeil non réparateur',
                                    'Difficultés de concentration / mémoire': 'Difficultés de concentration/mémoire',
                                    'Irritabilité / changements d\'humeur': 'Irritabilité/changements d\'humeur'
                                }
                            )}

                            {/* Symptômes */}
                            {answers.symptoms && renderSymptoms(answers.symptoms)}

                            {/* Habitudes de sommeil */}
                            {answers.sleep_habits && renderSection('Habitudes de Sommeil', answers.sleep_habits, {
                                weekday_bedtime: 'Coucher en semaine',
                                weekday_waketime: 'Lever en semaine',
                                weekday_hours: 'Heures de sommeil (semaine)',
                                weekend_bedtime: 'Coucher week-end',
                                weekend_waketime: 'Lever week-end',
                                weekend_hours: 'Heures de sommeil (week-end)',
                                naps: 'Fait des siestes',
                                insomnia: 'Souffre d\'insomnie',
                                shift_work: 'Travail en horaires décalés'
                            })}

                            {/* Antécédents médicaux */}
                            {answers.medical_history && renderChecklist(
                                answers.medical_history,
                                'Antécédents Médicaux',
                                {
                                    'Hypertension artérielle': 'Hypertension artérielle',
                                    'Maladie cardiaque': 'Maladie cardiaque',
                                    'Accident vasculaire cérébral (AVC)': 'AVC',
                                    'Diabète': 'Diabète',
                                    'Maladie respiratoire (asthme, BPCO)': 'Maladie respiratoire',
                                    'Maladie neurologique': 'Maladie neurologique',
                                    'Dépression': 'Dépression',
                                    'Anxiété': 'Anxiété',
                                    'Trouble bipolaire': 'Trouble bipolaire',
                                    'Hypothyroïdie': 'Hypothyroïdie',
                                    'Problèmes rénaux': 'Problèmes rénaux',
                                    'Problèmes hépatiques': 'Problèmes hépatiques',
                                    'Anémie': 'Anémie',
                                    'Fibromyalgie ou douleurs chroniques': 'Fibromyalgie/douleurs chroniques'
                                }
                            )}

                            {/* Traitements actuels */}
                            {answers.current_treatments && (
                                renderSection('Traitements Actuels', {
                                    traitements: answers.current_treatments
                                })
                            )}

                            {/* Habitudes de vie */}
                            {answers.life_habits && renderSection('Habitudes de Vie', answers.life_habits, {
                                smoking_status: 'Tabagisme',
                                smoking_details: 'Détails tabagisme',
                                alcohol_status: 'Consommation d\'alcool',
                                alcohol_details: 'Détails consommation alcool'
                            })}

                            {/* Conduite automobile */}
                            {answers.driving_info && renderSection('Conduite Automobile', answers.driving_info, {
                                has_license: 'Permis de conduire',
                                license_type: 'Type de permis',
                                sleepy_while_driving: 'Somnolence au volant',
                                accident_related_to_sleepiness: 'Accident lié à la somnolence'
                            })}

                            {/* Commentaires libres */}
                            {answers.free_comments && (
                                renderSection('Commentaires Libres', {
                                    commentaires: answers.free_comments
                                })
                            )}

                            {/* Consentement */}
                            {answers.consent_signature && (
                                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                                    <h4 className="font-semibold text-green-800">Consentement Signé</h4>
                                    <p className="text-green-700 mt-1">
                                        Le patient a confirmé avoir lu et compris les informations sur les risques et obligations légales.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}