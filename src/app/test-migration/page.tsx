'use client';

import { useState } from 'react';

export default function TestMigrationPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const runMigration = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/migrate-treating-physician', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
      } else {
        setError(data.error || 'Erreur lors de la migration');
        if (data.sql_script) {
          console.log('Script SQL à exécuter manuellement:', data.sql_script);
        }
      }
    } catch (err) {
      setError('Erreur réseau: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Test Migration - Médecin Traitant</h1>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Migration de la base de données</h2>
        <p className="text-gray-600 mb-6">
          Cette page permet de tester l'ajout du champ "médecin traitant" à la table patients.
        </p>

        <button
          onClick={runMigration}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Migration en cours...' : 'Lancer la migration'}
        </button>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <h3 className="text-red-800 font-semibold">Erreur</h3>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {result && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="text-green-800 font-semibold">Succès</h3>
            <p className="text-green-700">{result.message}</p>
            {result.details && (
              <details className="mt-2">
                <summary className="cursor-pointer text-green-600">Détails</summary>
                <pre className="mt-2 text-sm text-green-600 bg-green-100 p-2 rounded">
                  {JSON.stringify(result.details, null, 2)}
                </pre>
              </details>
            )}
          </div>
        )}
      </div>

      <div className="mt-8 bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Instructions manuelles</h2>
        <p className="text-gray-600 mb-4">
          Si la migration automatique ne fonctionne pas, exécutez ce script SQL dans Supabase Dashboard > SQL Editor :
        </p>
        <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
{`-- Script à exécuter manuellement dans Supabase SQL Editor
ALTER TABLE patients
ADD COLUMN IF NOT EXISTS treating_physician_id UUID REFERENCES doctors(id);

CREATE INDEX IF NOT EXISTS idx_patients_treating_physician ON patients(treating_physician_id);

COMMENT ON COLUMN patients.treating_physician_id IS 'ID of the primary treating physician for this patient';`}
        </pre>
      </div>
    </div>
  );
}