// src/app/dashboard/patient/todo/_components/morning-after.tsx

"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export function MorningAfter({ patientId, appointmentId, isDone }: { patientId: string, appointmentId: string, isDone: boolean }) {
  const router = useRouter();
  const supabase = createClient();
  
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
        const checkbox = e.target as HTMLInputElement;
        setFormData(prev => ({ ...prev, [name]: checkbox.checked }));
    } else if (type === 'radio') {
        setFormData(prev => ({ ...prev, [name]: value }));
    } else {
        setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    const { error } = await supabase.from('questionnaires').insert({
        patient_id: patientId,
        appointment_id: appointmentId,
        type: 'MORNING_AFTER',
        answers: formData,
        submitted_at: new Date().toISOString()
    });
    
    setIsLoading(false);

    if (error) {
        setMessage(`Erreur : ${error.message}`);
    } else {
        setMessage('Questionnaire enregistré avec succès !');
        router.refresh();
    }
  };

  if (isDone) {
    return (
      <div className="p-6 bg-green-100 text-green-800 rounded-lg">
        <h2 className="font-bold text-lg">Étape terminée !</h2>
        <p>Merci d'avoir rempli ce questionnaire.</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="font-bold text-lg">Formulaire Patient - Évaluation post-enregistrement du sommeil</h2>
      <p className="text-sm text-gray-600 mt-2">Pour aider votre médecin à mieux comprendre les résultats de votre enregistrement de sommeil de la nuit dernière, veuillez remplir ce formulaire.</p>
      
      <form onSubmit={handleSubmit} className="mt-6 space-y-8">
        {/* Section 1: Votre nuit de sommeil */}
        <fieldset className="space-y-6">
            <legend className="text-lg font-semibold">1. Votre nuit de sommeil pendant l'enregistrement</legend>
            
            <div>
                <label className="block mb-1">À quelle heure approximative vous êtes-vous couché ?</label>
                <input type="time" name="bedTime" onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 p-2 border" />
            </div>
            
            <div>
                <label className="block mb-1">À quelle heure approximative pensez-vous vous être endormi ?</label>
                <input type="time" name="sleepTime" onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 p-2 border" />
            </div>
            
            <div>
                <label className="block mb-1">Combien de fois pensez-vous vous être réveillé pendant la nuit ?</label>
                <input type="number" name="wakeUpCount" min="0" onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 p-2 border" />
            </div>
            
            <div>
                <label className="block mb-1">Si oui, approximativement combien de temps êtes-vous resté éveillé au total ? (minutes)</label>
                <input type="number" name="awakeDuration" min="0" onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 p-2 border" />
            </div>
            
            <div>
                <label className="block mb-1">Vous êtes-vous levé pendant la nuit ?</label>
                <div className="flex space-x-4 mt-2">
                    <label className="inline-flex items-center">
                        <input type="radio" name="gotUp" value="true" onChange={handleChange} className="mr-2" />
                        Oui
                    </label>
                    <label className="inline-flex items-center">
                        <input type="radio" name="gotUp" value="false" onChange={handleChange} className="mr-2" />
                        Non
                    </label>
                </div>
            </div>
            
            <div>
                <label className="block mb-1">Si oui, pour quelle(s) raison(s) ?</label>
                <textarea name="gotUpReasons" onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 p-2 border" placeholder="Ex: aller aux toilettes, boire, inconfort..." />
            </div>
            
            <div>
                <label className="block mb-1">À quelle heure définitive vous êtes-vous levé ce matin ?</label>
                <input type="time" name="wakeUpTime" onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 p-2 border" />
            </div>
            
            <div>
                <label className="block mb-1">Globalement, comment évalueriez-vous la qualité de votre sommeil cette nuit ?</label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-2">
                    {["Très bonne", "Bonne", "Moyenne", "Mauvaise", "Très mauvaise"].map((option) => (
                        <label key={option} className="inline-flex items-center">
                            <input type="radio" name="sleepQuality" value={option} onChange={handleChange} className="mr-2" />
                            {option}
                        </label>
                    ))}
                </div>
            </div>
            
            <div>
                <label className="block mb-1">Comment cette nuit se compare-t-elle à une nuit habituelle ?</label>
                <div className="flex flex-col space-y-2 mt-2">
                    {["Mieux qu'une nuit habituelle", "Similaire à une nuit habituelle", "Moins bien qu'une nuit habituelle"].map((option) => (
                        <label key={option} className="inline-flex items-center">
                            <input type="radio" name="comparison" value={option} onChange={handleChange} className="mr-2" />
                            {option}
                        </label>
                    ))}
                </div>
            </div>
            
            <div>
                <label className="block mb-1">Décrivez tout événement ou sensation inhabituelle pendant la nuit :</label>
                <textarea name="unusualEvents" onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 p-2 border" placeholder="Difficulté à vous installer, gêne avec les capteurs, rêves vifs, sueurs anormales..." />
            </div>
        </fieldset>

        {/* Section 2: Symptômes respiratoires */}
        <fieldset className="space-y-6">
            <legend className="text-lg font-semibold">2. Symptômes respiratoires pendant la nuit</legend>
            
            <div>
                <label className="block mb-1">Avez-vous ronflé cette nuit ?</label>
                <div className="flex space-x-4 mt-2">
                    {["Oui", "Non", "Je ne sais pas"].map((option) => (
                        <label key={option} className="inline-flex items-center">
                            <input type="radio" name="snored" value={option} onChange={handleChange} className="mr-2" />
                            {option}
                        </label>
                    ))}
                </div>
            </div>
            
            <div>
                <label className="block mb-1">Si oui, quelle était l'intensité ?</label>
                <div className="flex space-x-4 mt-2">
                    {["Faible", "Modérée", "Sévère"].map((option) => (
                        <label key={option} className="inline-flex items-center">
                            <input type="radio" name="snoreIntensity" value={option} onChange={handleChange} className="mr-2" />
                            {option}
                        </label>
                    ))}
                </div>
            </div>
            
            <div>
                <label className="block mb-1">Avez-vous eu l'impression d'arrêter de respirer ou de vous étouffer ?</label>
                <div className="flex space-x-4 mt-2">
                    {["Oui", "Non", "Je ne sais pas"].map((option) => (
                        <label key={option} className="inline-flex items-center">
                            <input type="radio" name="choking" value={option} onChange={handleChange} className="mr-2" />
                            {option}
                        </label>
                    ))}
                </div>
            </div>
            
            <div>
                <label className="block mb-1">Si oui, avez-vous une idée de la fréquence ou du moment ?</label>
                <textarea name="chokingDetails" onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 p-2 border" />
            </div>
            
            <div>
                <label className="block mb-1">Vous êtes-vous réveillé avec une sensation de suffocation ou d'essoufflement ?</label>
                <div className="flex space-x-4 mt-2">
                    <label className="inline-flex items-center">
                        <input type="radio" name="wokeChoking" value="true" onChange={handleChange} className="mr-2" />
                        Oui
                    </label>
                    <label className="inline-flex items-center">
                        <input type="radio" name="wokeChoking" value="false" onChange={handleChange} className="mr-2" />
                        Non
                    </label>
                </div>
            </div>
            
            <div>
                <label className="block mb-1">Avez-vous eu une respiration laborieuse ou des efforts respiratoires importants ?</label>
                <div className="flex space-x-4 mt-2">
                    {["Oui", "Non", "Je ne sais pas"].map((option) => (
                        <label key={option} className="inline-flex items-center">
                            <input type="radio" name="breathingEffort" value={option} onChange={handleChange} className="mr-2" />
                            {option}
                        </label>
                    ))}
                </div>
            </div>
        </fieldset>

        {/* Section 3: Votre état au réveil */}
        <fieldset className="space-y-6">
            <legend className="text-lg font-semibold">3. Votre état au réveil ce matin</legend>
            
            <div>
                <label className="block mb-1">Comment vous sentez-vous ce matin ? (cochez une ou plusieurs)</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                    {[
                        "Reposé(e)", "Fatigué(e)", "Mal à la tête (Céphalées matinales)", 
                        "Bouche sèche", "Mal à la gorge", "En forme"
                    ].map((option) => (
                        <label key={option} className="inline-flex items-center">
                            <input 
                                type="checkbox" 
                                name={`feeling_${option.toLowerCase().replace(/[()\s]/g, '_')}`} 
                                onChange={handleChange} 
                                className="mr-2" 
                            />
                            {option}
                        </label>
                    ))}
                    <div className="flex items-center">
                        <input 
                            type="checkbox" 
                            name="feeling_other" 
                            onChange={handleChange} 
                            className="mr-2" 
                        />
                        Autre (précisez) :
                        <input 
                            type="text" 
                            name="feeling_other_text" 
                            onChange={handleChange} 
                            className="ml-2 p-1 border-b border-gray-300 flex-1" 
                            placeholder="..."
                        />
                    </div>
                </div>
            </div>
            
            <div>
                <label className="block mb-1">Si vous avez eu mal à la tête, quelle était l'intensité ?</label>
                <div className="flex space-x-4 mt-2">
                    {["Faible", "Modérée", "Sévère"].map((option) => (
                        <label key={option} className="inline-flex items-center">
                            <input type="radio" name="headacheIntensity" value={option} onChange={handleChange} className="mr-2" />
                            {option}
                        </label>
                    ))}
                </div>
            </div>
            
            <div>
                <label className="block mb-1">Comment évalueriez-vous votre niveau de somnolence actuel ?</label>
                <div className="flex flex-col space-y-2 mt-2">
                    {[
                        "Pas du tout somnolent", 
                        "Très légèrement somnolent", 
                        "Modérément somnolent", 
                        "Sévèrement somnolent"
                    ].map((option) => (
                        <label key={option} className="inline-flex items-center">
                            <input type="radio" name="sleepiness" value={option} onChange={handleChange} className="mr-2" />
                            {option}
                        </label>
                    ))}
                </div>
            </div>
        </fieldset>

        {/* Section 4: Appareil de traitement */}
        <fieldset className="space-y-6">
            <legend className="text-lg font-semibold">4. Si vous utilisez un appareil de traitement (PPC ou Orthèse Mandibulaire)</legend>
            
            <div>
                <label className="block mb-1">Quel appareil avez-vous utilisé cette nuit ?</label>
                <div className="flex flex-col space-y-2 mt-2">
                    {[
                        "PPC (Pression Positive Continue)", 
                        "Orthèse d'Avancée Mandibulaire (OAM)", 
                        "Aucun"
                    ].map((option) => (
                        <label key={option} className="inline-flex items-center">
                            <input type="radio" name="deviceType" value={option} onChange={handleChange} className="mr-2" />
                            {option}
                        </label>
                    ))}
                    <div className="flex items-center">
                        <input 
                            type="radio" 
                            name="deviceType" 
                            value="Autre" 
                            onChange={handleChange} 
                            className="mr-2" 
                        />
                        Autre (précisez) :
                        <input 
                            type="text" 
                            name="deviceType_other" 
                            onChange={handleChange} 
                            className="ml-2 p-1 border-b border-gray-300 flex-1" 
                            placeholder="..."
                        />
                    </div>
                </div>
            </div>
            
            <div>
                <label className="block mb-1">Avez-vous utilisé l'appareil pendant toute la nuit ?</label>
                <div className="flex space-x-4 mt-2">
                    <label className="inline-flex items-center">
                        <input type="radio" name="usedAllNight" value="true" onChange={handleChange} className="mr-2" />
                        Oui
                    </label>
                    <label className="inline-flex items-center">
                        <input type="radio" name="usedAllNight" value="false" onChange={handleChange} className="mr-2" />
                        Non
                    </label>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block mb-1">Si non, durée approximative :</label>
                    <div className="flex space-x-2">
                        <input 
                            type="number" 
                            name="deviceDuration_hours" 
                            min="0" 
                            max="24" 
                            onChange={handleChange} 
                            className="mt-1 block w-full rounded-md border-gray-300 p-2 border" 
                            placeholder="Heures"
                        />
                        <input 
                            type="number" 
                            name="deviceDuration_minutes" 
                            min="0" 
                            max="59" 
                            onChange={handleChange} 
                            className="mt-1 block w-full rounded-md border-gray-300 p-2 border" 
                            placeholder="Minutes"
                        />
                    </div>
                </div>
                
                <div>
                    <label className="block mb-1">Raison de l'arrêt :</label>
                    <input 
                        type="text" 
                        name="stopReason" 
                        onChange={handleChange} 
                        className="mt-1 block w-full rounded-md border-gray-300 p-2 border" 
                        placeholder="Ex: gêne, fuites..."
                    />
                </div>
            </div>
            
            <div>
                <label className="block mb-1">Si vous avez utilisé une PPC, confort du masque :</label>
                <div className="flex space-x-4 mt-2 flex-wrap">
                    {["Très confortable", "Confortable", "Acceptable", "Gênant", "Très gênant"].map((option) => (
                        <label key={option} className="inline-flex items-center mr-4 mb-2">
                            <input type="radio" name="maskComfort" value={option} onChange={handleChange} className="mr-2" />
                            {option}
                        </label>
                    ))}
                </div>
            </div>
            
            <div>
                <label className="block mb-1">Si vous avez utilisé une PPC, fuites d'air importantes ?</label>
                <div className="flex space-x-4 mt-2">
                    {["Oui", "Non", "Je ne sais pas"].map((option) => (
                        <label key={option} className="inline-flex items-center">
                            <input type="radio" name="airLeaks" value={option} onChange={handleChange} className="mr-2" />
                            {option}
                        </label>
                    ))}
                </div>
            </div>
            
            <div>
                <label className="block mb-1">Si vous avez utilisé une OAM, confort de l'orthèse :</label>
                <div className="flex space-x-4 mt-2 flex-wrap">
                    {["Très confortable", "Confortable", "Acceptable", "Gênant", "Très gênant"].map((option) => (
                        <label key={option} className="inline-flex items-center mr-4 mb-2">
                            <input type="radio" name="oralApplianceComfort" value={option} onChange={handleChange} className="mr-2" />
                            {option}
                        </label>
                    ))}
                </div>
            </div>
            
            <div>
                <label className="block mb-1">Problèmes ou inconfort rencontrés avec l'appareil :</label>
                <textarea name="deviceProblems" onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 p-2 border" placeholder="Masque, tuyau, pression, bruit..." />
            </div>
        </fieldset>

        {/* Section 5: Autres facteurs */}
        <fieldset className="space-y-6">
            <legend className="text-lg font-semibold">5. Autres facteurs influençant votre sommeil</legend>
            
            <div>
                <label className="block mb-1">Avez-vous pris des médicaments le soir ou pendant la nuit ?</label>
                <div className="flex space-x-4 mt-2">
                    <label className="inline-flex items-center">
                        <input type="radio" name="tookMeds" value="true" onChange={handleChange} className="mr-2" />
                        Oui
                    </label>
                    <label className="inline-flex items-center">
                        <input type="radio" name="tookMeds" value="false" onChange={handleChange} className="mr-2" />
                        Non
                    </label>
                </div>
            </div>
            
            <div>
                <label className="block mb-1">Si oui, précisez (nom, dose, heure) :</label>
                <textarea name="medsDetails" onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 p-2 border" />
            </div>
            
            <div>
                <label className="block mb-1">Avez-vous consommé de l'alcool le soir avant l'enregistrement ?</label>
                <div className="flex space-x-4 mt-2">
                    <label className="inline-flex items-center">
                        <input type="radio" name="alcohol" value="true" onChange={handleChange} className="mr-2" />
                        Oui
                    </label>
                    <label className="inline-flex items-center">
                        <input type="radio" name="alcohol" value="false" onChange={handleChange} className="mr-2" />
                        Non
                    </label>
                </div>
            </div>
            
            <div>
                <label className="block mb-1">Si oui, quelle quantité approximative ?</label>
                <input type="text" name="alcoholQuantity" onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 p-2 border" />
            </div>
            
            <div>
                <label className="block mb-1">Avez-vous consommé de la caféine le soir ?</label>
                <div className="flex space-x-4 mt-2">
                    <label className="inline-flex items-center">
                        <input type="radio" name="caffeine" value="true" onChange={handleChange} className="mr-2" />
                        Oui
                    </label>
                    <label className="inline-flex items-center">
                        <input type="radio" name="caffeine" value="false" onChange={handleChange} className="mr-2" />
                        Non
                    </label>
                </div>
            </div>
            
            <div>
                <label className="block mb-1">Si oui, quelle quantité approximative ?</label>
                <input type="text" name="caffeineQuantity" onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 p-2 border" />
            </div>
            
            <div>
                <label className="block mb-1">Autres événements inhabituels ayant pu affecter votre sommeil :</label>
                <textarea name="unusualEvents" onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 p-2 border" placeholder="Stress, repas tardif, exercice intense..." />
            </div>
        </fieldset>

        {/* Section 6: Commentaires libres */}
        <fieldset className="space-y-4">
            <legend className="text-lg font-semibold">6. Commentaires libres</legend>
            <div>
                <label className="block mb-1">Autres éléments à signaler :</label>
                <textarea name="comments" onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 p-2 border" rows={4} />
            </div>
        </fieldset>

        <button type="submit" disabled={isLoading} className="w-full px-4 py-2 font-bold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400">
            {isLoading ? 'Enregistrement...' : 'Soumettre le questionnaire'}
        </button>
        {message && <p className="mt-4 p-3 text-center rounded-md bg-blue-50 text-blue-800">{message}</p>}
      </form>
    </div>
  );
}