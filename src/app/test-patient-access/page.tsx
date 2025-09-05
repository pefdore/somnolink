// Page de test pour diagnostiquer l'accès aux dossiers patients
// Accessible via http://localhost:3000/test-patient-access

'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestPatientAccessPage() {
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [testPatientId, setTestPatientId] = useState('');

  const runSimpleTest = async () => {
    if (!testPatientId.trim()) {
      alert('Veuillez entrer un ID de patient');
      return;
    }

    setLoading(true);
    const supabase = createClient();

    try {
      console.log('🔍 Test simple - Tentative d\'accès au patient:', testPatientId);

      // Test 1: Accès simple au patient
      const { data: patient, error: patientError } = await supabase
        .from('patients')
        .select('id, first_name, last_name, date_of_birth, email')
        .eq('id', testPatientId)
        .single();

      console.log('🔍 Test simple - Patient:', patient);
      console.log('🔍 Test simple - Erreur:', patientError);

      // Test 2: Accès avec jointures (comme dans la vraie page)
      const { data: patientWithJoins, error: joinsError } = await supabase
        .from('patients')
        .select(`
          *,
          appointments(*, questionnaires(*, answers)),
          documents(*),
          prescriptions(*, providers(name)),
          medical_history,
          surgical_history
        `)
        .eq('id', testPatientId)
        .single();

      console.log('🔍 Test avec jointures - Patient:', patientWithJoins);
      console.log('🔍 Test avec jointures - Erreur:', joinsError);

      setResults({
        patientId: testPatientId,
        simpleAccess: {
          success: !!patient,
          data: patient,
          error: patientError
        },
        joinsAccess: {
          success: !!patientWithJoins,
          data: patientWithJoins,
          error: joinsError
        }
      });

    } catch (error) {
      console.error('💥 Erreur générale:', error);
      setResults({
        patientId: testPatientId,
        error: error
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">🔬 Test Accès Dossiers Patients</h1>
          <p className="text-gray-600 mt-2">
            Testez l'accès aux dossiers patients pour diagnostiquer le problème
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Test d'accès</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <input
                type="text"
                placeholder="Entrez l'ID du patient (ex: 28e2cbb2-e5a2-4292-acca-2afab316fafe)"
                value={testPatientId}
                onChange={(e) => setTestPatientId(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
              />
              <Button onClick={runSimpleTest} disabled={loading}>
                {loading ? 'Test en cours...' : 'Tester l\'accès'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {results && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Résultats du test</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Patient ID testé:</h3>
                    <code className="bg-gray-100 px-2 py-1 rounded">{results.patientId}</code>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Accès simple (sans jointures):</h3>
                    {results.simpleAccess?.success ? (
                      <div className="bg-green-50 p-3 rounded border-l-4 border-green-500">
                        <div className="text-green-800 font-medium">✅ Succès</div>
                        <div className="text-sm text-green-700 mt-1">
                          {results.simpleAccess.data?.first_name} {results.simpleAccess.data?.last_name}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-red-50 p-3 rounded border-l-4 border-red-500">
                        <div className="text-red-800 font-medium">❌ Échec</div>
                        <div className="text-sm text-red-700 mt-1">
                          {results.simpleAccess?.error?.message || 'Erreur inconnue'}
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Accès avec jointures (comme la vraie page):</h3>
                    {results.joinsAccess?.success ? (
                      <div className="bg-green-50 p-3 rounded border-l-4 border-green-500">
                        <div className="text-green-800 font-medium">✅ Succès</div>
                        <div className="text-sm text-green-700 mt-1">
                          Données complètes récupérées
                        </div>
                      </div>
                    ) : (
                      <div className="bg-red-50 p-3 rounded border-l-4 border-red-500">
                        <div className="text-red-800 font-medium">❌ Échec - C'est le problème !</div>
                        <div className="text-sm text-red-700 mt-1">
                          {results.joinsAccess?.error?.message || 'Erreur inconnue'}
                        </div>
                        <div className="text-xs text-red-600 mt-2">
                          Code: {results.joinsAccess?.error?.code}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-blue-900">💡 Diagnostic</CardTitle>
              </CardHeader>
              <CardContent>
                {results.simpleAccess?.success && !results.joinsAccess?.success ? (
                  <div className="space-y-3">
                    <p className="text-blue-800">
                      <strong>Problème identifié :</strong> L'accès simple au patient fonctionne, mais l'accès avec jointures échoue.
                    </p>
                    <p className="text-blue-700">
                      Cela signifie que les politiques RLS sur les tables jointes (appointments, documents, prescriptions)
                      ne permettent pas au médecin d'accéder aux données du patient.
                    </p>
                    <div className="bg-white p-3 rounded mt-4">
                      <strong>Solution :</strong> Corriger les politiques RLS sur les tables jointes
                      ou simplifier la requête pour éviter les jointures problématiques.
                    </div>
                  </div>
                ) : results.simpleAccess?.success && results.joinsAccess?.success ? (
                  <div className="text-green-800">
                    <strong>✅ Tout fonctionne !</strong> Le problème doit être ailleurs.
                    Vérifiez les logs de la console pour plus de détails.
                  </div>
                ) : (
                  <div className="text-red-800">
                    <strong>❌ Problème général :</strong> Impossible d'accéder au patient.
                    Vérifiez que l'ID du patient est correct et que les politiques RLS sont bien configurées.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        <div className="mt-6 text-center">
          <a href="/debug-patient-access" className="text-blue-600 underline">
            ← Retour au diagnostic général
          </a>
        </div>
      </div>
    </div>
  );
}