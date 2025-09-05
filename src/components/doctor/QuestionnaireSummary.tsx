"use client";

import { FileText, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

interface QuestionnaireSummaryProps {
    questionnaire: {
        id: string;
        type: string;
        submitted_at: string;
        answers: Record<string, unknown>;
    };
    compact?: boolean;
}

export default function QuestionnaireSummary({ questionnaire, compact = false }: QuestionnaireSummaryProps) {
    const answers = questionnaire.answers;
    const epworthScore = answers.epworth_total as number;
    const symptoms = answers.symptoms as Record<string, { frequency?: string; comments?: string }>;
    const consultationReasons = answers.consultation_reasons as Record<string, boolean>;

    // Compter les symptômes fréquents/souvent/toujours
    const severeSymptomsCount = symptoms ? Object.values(symptoms).filter(symptom =>
        symptom.frequency === 'Souvent' || symptom.frequency === 'Toujours'
    ).length : 0;

    // Compter les motifs de consultation
    const consultationReasonsCount = consultationReasons ? Object.values(consultationReasons).filter(Boolean).length : 0;

    if (compact) {
        return (
            <div className="flex items-center gap-3 text-sm">
                {epworthScore !== undefined && (
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        epworthScore > 10 ? 'bg-red-100 text-red-800' :
                        epworthScore > 5 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                    }`}>
                        <Clock className="w-3 h-3" />
                        Epworth: {epworthScore}
                    </div>
                )}
                {severeSymptomsCount > 0 && (
                    <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                        <AlertTriangle className="w-3 h-3" />
                        {severeSymptomsCount} symptôme{severeSymptomsCount > 1 ? 's' : ''} sévère{severeSymptomsCount > 1 ? 's' : ''}
                    </div>
                )}
                {consultationReasonsCount > 0 && (
                    <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        <FileText className="w-3 h-3" />
                        {consultationReasonsCount} motif{consultationReasonsCount > 1 ? 's' : ''}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Score Epworth */}
            {epworthScore !== undefined && (
                <div className="bg-white p-4 rounded-lg border">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Clock className="w-5 h-5 text-blue-600" />
                            <span className="font-medium text-gray-900">Score de Somnolence (Epworth)</span>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                            epworthScore > 10 ? 'bg-red-100 text-red-800' :
                            epworthScore > 5 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                        }`}>
                            {epworthScore}/24
                        </div>
                    </div>
                    <div className="mt-2 text-sm text-gray-600">
                        {epworthScore > 10 ? 'Somnolence sévère - Risque élevé' :
                         epworthScore > 5 ? 'Somnolence modérée' :
                         'Somnolence légère'}
                    </div>
                </div>
            )}

            {/* Symptômes principaux */}
            {symptoms && severeSymptomsCount > 0 && (
                <div className="bg-white p-4 rounded-lg border">
                    <div className="flex items-center gap-2 mb-3">
                        <AlertTriangle className="w-5 h-5 text-orange-600" />
                        <span className="font-medium text-gray-900">Symptômes Fréquents</span>
                        <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-medium">
                            {severeSymptomsCount}
                        </span>
                    </div>
                    <div className="space-y-2">
                        {Object.entries(symptoms)
                            .filter(([, symptom]) => symptom.frequency === 'Souvent' || symptom.frequency === 'Toujours')
                            .map(([key, symptom]) => (
                                <div key={key} className="flex justify-between items-center py-1">
                                    <span className="text-sm text-gray-700 capitalize">
                                        {key.replace(/_/g, ' ')}
                                    </span>
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                                        symptom.frequency === 'Toujours' ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'
                                    }`}>
                                        {symptom.frequency}
                                    </span>
                                </div>
                            ))}
                    </div>
                </div>
            )}

            {/* Motifs de consultation */}
            {consultationReasons && consultationReasonsCount > 0 && (
                <div className="bg-white p-4 rounded-lg border">
                    <div className="flex items-center gap-2 mb-3">
                        <FileText className="w-5 h-5 text-blue-600" />
                        <span className="font-medium text-gray-900">Motifs de Consultation</span>
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                            {consultationReasonsCount}
                        </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {Object.entries(consultationReasons)
                            .filter(([, selected]) => selected)
                            .map(([reason]) => (
                                <span key={reason} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm">
                                    {reason}
                                </span>
                            ))}
                    </div>
                </div>
            )}

            {/* Informations générales importantes */}
            <div className="bg-white p-4 rounded-lg border">
                <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-gray-900">Informations Clés</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    {answers.height && typeof answers.height === 'number' &&
                     answers.weight && typeof answers.weight === 'number' && (
                        <div>
                            <span className="text-gray-600">IMC: </span>
                            <span className="font-medium">
                                {Math.round(answers.weight / Math.pow(answers.height / 100, 2))}
                            </span>
                        </div>
                    )}
                    {answers.neck_circumference && typeof answers.neck_circumference === 'number' && (
                        <div>
                            <span className="text-gray-600">Tour de cou: </span>
                            <span className="font-medium">{answers.neck_circumference} cm</span>
                        </div>
                    )}
                    {answers.profession && typeof answers.profession === 'string' && (
                        <div className="col-span-2">
                            <span className="text-gray-600">Profession: </span>
                            <span className="font-medium">{answers.profession}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}