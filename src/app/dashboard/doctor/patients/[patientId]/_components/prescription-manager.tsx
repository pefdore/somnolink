// src/app/dashboard/doctor/patients/[patientId]/_components/prescription-manager.tsx

"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

type Provider = { id: string; name: string; };

export default function PrescriptionManager({ patientId, doctorId }: { patientId: string; doctorId: string; }) {
  const router = useRouter();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState('');
  const [prescriptionType, setPrescriptionType] = useState('DAP_PPC');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Charger la liste des prestataires au démarrage
  useEffect(() => {
    const fetchProviders = async () => {
      const supabase = createClient();
      const { data } = await supabase.from('providers').select('id, name');
      if (data) setProviders(data);
    };
    fetchProviders();
  }, []);

  const handleInitiateDAP = async () => {
    if (!selectedProvider) {
      setMessage("Veuillez sélectionner un prestataire.");
      return;
    }
    setIsLoading(true);
    setMessage('');

    // --- SIMULATION DE L'APPEL À AMELI PRO ---
    // Dans la vraie vie, ici, vous appelleriez une Edge Function
    // qui utiliserait un robot (Puppeteer, Playwright) pour se connecter
    // à Ameli Pro et soumettre la demande.
    console.log("Lancement de la simulation de demande d'accord préalable...");
    await new Promise(resolve => setTimeout(resolve, 3000)); // On simule une attente de 3 secondes
    const fakeAmeliResponse = {
        submissionId: `AMELI-${Date.now()}`,
        status: 'Reçue',
        details: 'La demande a été reçue et est en cours de traitement.'
    };
    console.log("Réponse simulée d'Ameli Pro :", fakeAmeliResponse);
    // --- FIN DE LA SIMULATION ---

    const supabase = createClient();
    const { error } = await supabase.from('prescriptions').insert({
        patient_id: patientId,
        doctor_id: doctorId,
        provider_id: selectedProvider,
        type: prescriptionType,
        ameli_pro_details: fakeAmeliResponse // On stocke la réponse simulée
    });

    setIsLoading(false);
    if (error) {
      setMessage(`Erreur : ${error.message}`);
    } else {
      setMessage("La demande d'accord préalable a été initiée avec succès !");
      router.refresh(); // Pour afficher la nouvelle prescription dans l'historique
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-gray-800">Nouvelle Prescription</h3>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Type de demande</label>
            <select value={prescriptionType} onChange={(e) => setPrescriptionType(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300">
              <option value="DAP_PPC">DAP - PPC</option>
              <option value="DAP_OAM">DAP - OAM</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Prestataire</label>
            <select value={selectedProvider} onChange={(e) => setSelectedProvider(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300">
              <option value="">-- Choisissez un prestataire --</option>
              {providers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        </div>
      </div>
      <div className="border-t pt-4">
        <button
          onClick={handleInitiateDAP}
          disabled={isLoading || !selectedProvider}
          className="w-full px-6 py-2 bg-emerald-600 text-white font-bold rounded-md hover:bg-emerald-700 disabled:bg-gray-400"
        >
          {isLoading ? "Envoi en cours..." : "Lancer la demande sur Ameli Pro"}
        </button>
        {message && <p className="mt-2 text-center text-sm">{message}</p>}
      </div>
    </div>
  );
}