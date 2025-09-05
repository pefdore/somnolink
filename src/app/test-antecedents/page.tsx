'use client';

import { useState } from 'react';

export default function TestAntecedentsPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testAntecedentsAPI = async () => {
    setLoading(true);
    try {
      console.log('🧪 Test de l\'API antécédents...');

      const response = await fetch('/api/antecedents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: '9b71938b-97d3-4419-8141-c0379e3ab224',
          code: 'I10',
          system: 'CIM-11',
          label: 'Hypertension essentielle (primitive)',
          type: 'medical',
          note: 'Test depuis la page de test'
        })
      });

      const data = await response.json();
      console.log('📊 Réponse API:', response.status, data);

      setResult({
        status: response.status,
        data,
        success: response.ok
      });

    } catch (error: any) {
      console.error('💥 Erreur test:', error);
      setResult({
        error: error.message,
        success: false
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">🧪 Test API Antécédents</h1>
          <p className="text-gray-600 mt-2">
            Test direct de l'API /api/antecedents pour diagnostiquer le problème
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Test d'ajout d'antécédent</h2>

          <div className="mb-4 p-4 bg-gray-50 rounded">
            <h3 className="font-medium mb-2">Données de test :</h3>
            <pre className="text-sm text-gray-600">
{JSON.stringify({
  patientId: '9b71938b-97d3-4419-8141-c0379e3ab224',
  code: 'I10',
  system: 'CIM-11',
  label: 'Hypertension essentielle (primitive)',
  type: 'medical',
  note: 'Test depuis la page de test'
}, null, 2)}
            </pre>
          </div>

          <button
            onClick={testAntecedentsAPI}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Test en cours...' : '🚀 Tester l\'API'}
          </button>
        </div>

        {result && (
          <div className="mt-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Résultat du test</h2>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <span className="font-medium">Status HTTP:</span>
                  <span className={`px-2 py-1 rounded text-sm font-medium ${
                    result.status === 201 ? 'bg-green-100 text-green-800' :
                    result.status >= 400 ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {result.status}
                  </span>
                </div>

                {result.success ? (
                  <div className="p-4 bg-green-50 border border-green-200 rounded">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-green-600 font-medium">✅ Succès</span>
                    </div>
                    <pre className="text-sm text-green-800">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </div>
                ) : (
                  <div className="p-4 bg-red-50 border border-red-200 rounded">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-red-600 font-medium">❌ Erreur</span>
                    </div>
                    <pre className="text-sm text-red-800">
                      {JSON.stringify(result, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 text-center">
          <a href="/debug-patient-access" className="text-blue-600 underline mr-4">
            ← Retour au diagnostic
          </a>
          <a href="/dashboard/doctor" className="text-blue-600 underline">
            ← Retour au dashboard
          </a>
        </div>
      </div>
    </div>
  );
}