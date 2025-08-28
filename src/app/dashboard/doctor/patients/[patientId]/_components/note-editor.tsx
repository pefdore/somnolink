// src/app/dashboard/doctor/patients/[patientId]/_components/note-editor.tsx

"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function NoteEditor({ patientId, doctorId }: { patientId: string, doctorId: string }) {
  const router = useRouter();
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  // On n'a plus besoin de l'état "error" car Sonner s'en occupe
  
  const handleSaveNote = async () => {
    if (content.trim() === '') {
        // On peut aussi utiliser un toast d'avertissement ici
        toast.warning("La note ne peut pas être vide.");
        return;
    }
    
    setIsSaving(true);
    
    // Appeler l'API pour insérer la note
    const response = await fetch('/api/notes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        patientId,
        doctorId,
        content,
      }),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Erreur lors de la sauvegarde');
    }
    
    setIsSaving(false);

    if (response.ok) {
        toast.success('Note enregistrée avec succès');
        setContent('');
        // Mettre à jour l'interface avec la nouvelle note sans recharger la page
        // La note sera automatiquement affichée grâce au revalidatePath dans l'API
        // et au rafraîchissement des données côté serveur
        router.refresh();
    } else {
        toast.error('Erreur lors de la sauvegarde', {
            description: result.error || 'Une erreur est survenue',
        });
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-semibold text-gray-800">Ajouter une note au dossier</h3>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Rédigez vos observations ici..."
        rows={5}
        className="mt-4 w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
      />
      <div className="mt-4 flex justify-end">
        <button
          onClick={handleSaveNote}
          disabled={isSaving}
          className="px-6 py-2 bg-blue-600 text-white font-bold rounded-md hover:bg-blue-700 disabled:bg-gray-400"
        >
          {isSaving ? "Enregistrement..." : "Ajouter la note"}
        </button>
      </div>
      {/* On peut supprimer la ligne qui affichait l'erreur ici */}
    </div>
  );
}