// src/app/dashboard/doctor/patients/[patientId]/_components/pgv-uploader.tsx

"use client";

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

// On définit un type pour le résultat de l'analyse pour plus de clarté
type AnalysisResult = {
    iah: number;
    conclusion: string;
    suggested_letter: string;
};

export default function PgvUploader({ patientId }: { patientId: string }) {
  const router = useRouter();
  
  // États pour le fichier et l'upload
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [uploadedDocumentId, setUploadedDocumentId] = useState<string | null>(null);

  // Nouveaux états pour l'analyse
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setUploadError("Veuillez sélectionner un fichier.");
      return;
    }
    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(null);
    const supabase = createClient();
    const { data, error: functionError } = await supabase.functions.invoke('upload-pgv', {
        body: file,
        headers: { 'Content-Type': 'application/pdf', 'x-patient-id': patientId, 'x-file-name': file.name }
    });
    setIsUploading(false);
    if (functionError || (data && data.error)) {
      setUploadError(functionError?.message || data?.error);
      return;
    }
    if (data && data.documentId) {
      setUploadSuccess(`Fichier "${file.name}" prêt pour analyse.`);
      setUploadedDocumentId(data.documentId);
    } else {
      setUploadError("Erreur inconnue lors de l'upload.");
    }
  };

  const handleAnalyze = async () => {
    if (!uploadedDocumentId) return;

    setIsAnalyzing(true);
    setAnalysisError(null);
    setAnalysisResult(null);

    const supabase = createClient();
    const { data, error } = await supabase.functions.invoke('analyze-pgv', {
        body: JSON.stringify({ documentId: uploadedDocumentId })
    });

    setIsAnalyzing(false);

    if (error || (data && data.error)) {
        setAnalysisError(error?.message || data.error);
    } else if (data && data.result) {
        setAnalysisResult(data.result);
        // Optionnel : rafraîchir la page pour mettre à jour la liste des documents
        router.refresh();
    } else {
        setAnalysisError("L'analyse a réussi mais n'a retourné aucun résultat.");
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-gray-800">Compte-rendu de Polygraphie (PGV)</h3>
        <div className="mt-4">
          <input type="file" accept="application/pdf" onChange={handleFileChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
          <button onClick={handleUpload} disabled={!file || isUploading} className="mt-4 w-full px-4 py-2 bg-blue-600 text-white font-bold rounded-md hover:bg-blue-700 disabled:bg-gray-400">
            {isUploading ? "Envoi en cours..." : "1. Téléverser le PDF"}
          </button>
        </div>
        {uploadError && <p className="mt-2 text-sm text-red-600">{uploadError}</p>}
        {uploadSuccess && <p className="mt-2 text-sm text-green-600">{uploadSuccess}</p>}
      </div>

      <div>
        <button onClick={handleAnalyze} disabled={!uploadedDocumentId || isAnalyzing} className="w-full px-4 py-2 bg-green-600 text-white font-bold rounded-md hover:bg-green-700 disabled:bg-gray-400">
          {isAnalyzing ? "Analyse par l'IA en cours..." : "2. Lancer l'analyse"}
        </button>
        {analysisError && <p className="mt-2 text-sm text-red-600">{analysisError}</p>}
      </div>

      {/* Section pour afficher les résultats de l'analyse */}
      {analysisResult && (
        <div className="mt-6 p-4 border-t border-gray-200 bg-gray-50 rounded-lg space-y-4">
            <h4 className="text-lg font-bold text-gray-900">Résultats de l'analyse</h4>
            <div>
                <label className="block text-sm font-medium text-gray-700">IAH (Indice d'Apnées-Hypopnées)</label>
                <p className="mt-1 text-2xl font-bold text-blue-600">{analysisResult.iah}</p>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Conclusion suggérée par l'IA</label>
                <textarea
                    readOnly
                    value={analysisResult.conclusion}
                    className="mt-1 block w-full bg-white rounded-md border-gray-300 shadow-sm p-2"
                    rows={3}
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Proposition de courrier au médecin traitant</label>
                <textarea
                    readOnly
                    value={analysisResult.suggested_letter}
                    className="mt-1 block w-full bg-white rounded-md border-gray-300 shadow-sm p-2"
                    rows={5}
                />
            </div>
        </div>
      )}
    </div>
  );
}