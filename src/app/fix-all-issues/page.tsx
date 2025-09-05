'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function FixAllIssuesPage() {
  const [results, setResults] = useState<any>({});
  const [loading, setLoading] = useState(false);

  const runAllFixes = async () => {
    setLoading(true);
    const fixes = [
      { name: 'terminology-search', url: '/api/fix-terminology-search' },
      { name: 'relationships', url: '/api/fix-relationships' },
      { name: 'antecedents-rls', url: '/api/fix-antecedents-rls' }
    ];

    const results: any = {};

    for (const fix of fixes) {
      try {
        console.log(`🔧 Application de la correction: ${fix.name}`);
        const response = await fetch(fix.url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });

        if (response.ok) {
          const data = await response.json();
          results[fix.name] = { success: true, data };
          console.log(`✅ ${fix.name}: Correction réussie`);
        } else {
          const error = await response.text();
          results[fix.name] = { success: false, error };
          console.error(`❌ ${fix.name}: Échec - ${error}`);
        }
      } catch (error: any) {
        results[fix.name] = { success: false, error: error.message };
        console.error(`💥 ${fix.name}: Erreur - ${error.message}`);
      }
    }

    setResults(results);
    setLoading(false);
  };

  const testFunctionality = async () => {
    setLoading(true);

    try {
      // Test 1: Recherche CIM
      console.log('🧪 Test de la recherche CIM...');
      const cimResponse = await fetch('/api/terminology-search?q=hypertension');
      const cimResult = cimResponse.ok ? await cimResponse.json() : { error: 'Échec' };

      // Test 2: Ajout d'antécédent (simulation)
      console.log('🧪 Test de l\'ajout d\'antécédent...');
      const antecedentResponse = await fetch('/api/antecedents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: 'test-patient-id',
          code: 'I10',
          label: 'Hypertension essentielle',
          type: 'medical'
        })
      });
      const antecedentResult = antecedentResponse.ok ? await antecedentResponse.json() : { error: 'Échec' };

      setResults({
        ...results,
        tests: {
          cim: { success: cimResponse.ok, data: cimResult },
          antecedent: { success: antecedentResponse.ok, data: antecedentResult }
        }
      });

    } catch (error: any) {
      setResults({
        ...results,
        tests: { error: error.message }
      });
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">🔧 Correction Complète des Problèmes</h1>
          <p className="text-gray-600 mt-2">
            Résolution automatique de tous les problèmes identifiés dans Somnolink
          </p>
        </div>

        <div className="grid gap-6 mb-6">
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-blue-900">🎯 Problèmes identifiés et solutions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                  <div>
                    <strong>API Recherche CIM :</strong> Variables d'environnement manquantes
                    <div className="text-sm text-gray-600">→ Solution: Utilisation de données mockées</div>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                  <div>
                    <strong>Relations base de données :</strong> Clés étrangères non reconnues
                    <div className="text-sm text-gray-600">→ Solution: Création des relations manquantes</div>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                  <div>
                    <strong>Politiques RLS antécédents :</strong> Référence à colonne inexistante
                    <div className="text-sm text-gray-600">→ Solution: Correction des politiques avec relations correctes</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>🚀 Application des corrections</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button
                  onClick={runAllFixes}
                  disabled={loading}
                  className="w-full"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Application des corrections...
                    </>
                  ) : (
                    '🔧 Appliquer toutes les corrections'
                  )}
                </Button>

                <Button
                  onClick={testFunctionality}
                  disabled={loading}
                  variant="outline"
                  className="w-full"
                >
                  🧪 Tester les fonctionnalités
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {Object.keys(results).length > 0 && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>📊 Résultats des corrections</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Corrections */}
                  {['terminology-search', 'relationships', 'antecedents-rls'].map(fix => (
                    <div key={fix} className="flex items-center justify-between p-3 border rounded">
                      <span className="font-medium capitalize">{fix.replace('-', ' ')}</span>
                      {results[fix]?.success ? (
                        <div className="flex items-center text-green-600">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          <span>Corrigé</span>
                        </div>
                      ) : (
                        <div className="flex items-center text-red-600">
                          <XCircle className="h-4 w-4 mr-2" />
                          <span>Échec</span>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Tests */}
                  {results.tests && (
                    <>
                      <div className="border-t pt-4">
                        <h3 className="font-semibold mb-3">Tests de fonctionnalité</h3>

                        <div className="flex items-center justify-between p-3 border rounded">
                          <span className="font-medium">Recherche CIM</span>
                          {results.tests.cim?.success ? (
                            <div className="flex items-center text-green-600">
                              <CheckCircle className="h-4 w-4 mr-2" />
                              <span>{results.tests.cim.data?.length || 0} résultats</span>
                            </div>
                          ) : (
                            <div className="flex items-center text-red-600">
                              <XCircle className="h-4 w-4 mr-2" />
                              <span>Échec</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between p-3 border rounded">
                          <span className="font-medium">Ajout d'antécédent</span>
                          {results.tests.antecedent?.success ? (
                            <div className="flex items-center text-green-600">
                              <CheckCircle className="h-4 w-4 mr-2" />
                              <span>Réussi</span>
                            </div>
                          ) : (
                            <div className="flex items-center text-red-600">
                              <XCircle className="h-4 w-4 mr-2" />
                              <span>Échec</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="text-green-900">✅ Prochaines étapes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-green-800">
                    <strong>Après avoir appliqué les corrections :</strong>
                  </p>
                  <ol className="list-decimal list-inside space-y-2 text-green-700">
                    <li>Actualisez votre espace médecin</li>
                    <li>Cliquez sur "Ouvrir le dossier" d'un patient</li>
                    <li>Essayez d'ajouter un antécédent depuis la barre d'info</li>
                    <li>Vérifiez que la recherche CIM fonctionne</li>
                  </ol>

                  <div className="mt-4 p-3 bg-white rounded border-l-4 border-green-500">
                    <p className="text-green-800">
                      <strong>Si les problèmes persistent :</strong> Les corrections peuvent nécessiter un redémarrage du serveur Next.js.
                      Essayez de redémarrer votre serveur de développement.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="mt-6 text-center">
          <a href="/debug-patient-access" className="text-blue-600 underline mr-4">
            ← Retour au diagnostic
          </a>
          <a href="/test-patient-access" className="text-blue-600 underline">
            ← Retour au test d'accès
          </a>
        </div>
      </div>
    </div>
  );
}