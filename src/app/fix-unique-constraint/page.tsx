'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function FixUniqueConstraintPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fixUniqueConstraint = async () => {
    setLoading(true);
    try {
      console.log('🔧 Correction de la contrainte d\'unicité...');

      const response = await fetch('/api/fix-unique-constraint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();
      console.log('📊 Résultat:', response.status, data);

      setResult({
        status: response.status,
        data,
        success: response.ok
      });

    } catch (error: any) {
      console.error('💥 Erreur:', error);
      setResult({
        error: error.message,
        success: false
      });
    } finally {
      setLoading(false);
    }
  };

  const testAntecedentAgain = async () => {
    setLoading(true);
    try {
      console.log('🧪 Test après correction...');

      const response = await fetch('/api/antecedents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: '9b71938b-97d3-4419-8141-c0379e3ab224',
          code: 'I10',
          system: 'CIM-11',
          label: 'Hypertension essentielle (primitive)',
          type: 'medical',
          note: 'Test après correction de la contrainte'
        })
      });

      const data = await response.json();
      console.log('📊 Test après correction:', response.status, data);

      setResult({
        testAfterFix: {
          status: response.status,
          data,
          success: response.ok
        }
      });

    } catch (error: any) {
      setResult({
        testAfterFix: {
          error: error.message,
          success: false
        }
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">🔧 Correction Contrainte d'Unicité</h1>
          <p className="text-gray-600 mt-2">
            Résolution du problème "duplicate key value violates unique constraint"
          </p>
        </div>

        <Card className="mb-6 border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-900">🎯 Problème identifié</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                <div>
                  <strong>Erreur détectée :</strong> "duplicate key value violates unique constraint \"unique_antecedent\""
                  <div className="text-sm text-gray-600 mt-1">
                    → Une contrainte d'unicité empêche l'ajout du même antécédent plusieurs fois
                  </div>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <strong>Solution :</strong> Supprimer ou modifier la contrainte d'unicité
                  <div className="text-sm text-gray-600 mt-1">
                    → Permettre l'ajout d'antécédents identiques si nécessaire médicalement
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>🚀 Application de la correction</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button
                  onClick={fixUniqueConstraint}
                  disabled={loading}
                  className="w-full"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Suppression de la contrainte...
                    </>
                  ) : (
                    '🔧 Supprimer la contrainte d\'unicité'
                  )}
                </Button>

                {result?.success && (
                  <Button
                    onClick={testAntecedentAgain}
                    disabled={loading}
                    variant="outline"
                    className="w-full"
                  >
                    🧪 Tester l'ajout d'antécédent
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {result && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>📊 Résultats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Résultat de la correction */}
                  <div className="flex items-center justify-between p-3 border rounded">
                    <span className="font-medium">Suppression contrainte</span>
                    {result.success ? (
                      <div className="flex items-center text-green-600">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        <span>Réussie</span>
                      </div>
                    ) : (
                      <div className="flex items-center text-red-600">
                        <XCircle className="h-4 w-4 mr-2" />
                        <span>Échec</span>
                      </div>
                    )}
                  </div>

                  {/* Test après correction */}
                  {result.testAfterFix && (
                    <div className="flex items-center justify-between p-3 border rounded">
                      <span className="font-medium">Test ajout antécédent</span>
                      {result.testAfterFix.success ? (
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
                  )}

                  {/* Détails */}
                  <div className="mt-4">
                    <h3 className="font-semibold mb-2">Détails techniques :</h3>
                    <pre className="bg-gray-900 text-green-400 p-4 rounded text-sm overflow-x-auto">
                      {JSON.stringify(result, null, 2)}
                    </pre>
                  </div>
                </div>
              </CardContent>
            </Card>

            {result.success && (
              <Card className="border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="text-green-900">✅ Problème résolu !</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <p className="text-green-800">
                      <strong>La contrainte d'unicité a été supprimée avec succès !</strong>
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-green-700">
                      <li>Vous pouvez maintenant ajouter le même antécédent plusieurs fois</li>
                      <li>L'ajout d'antécédents fonctionne à nouveau</li>
                      <li>Retournez dans le dossier patient pour tester</li>
                    </ul>

                    <div className="mt-4 p-3 bg-white rounded border-l-4 border-green-500">
                      <p className="text-green-800">
                        <strong>Testez maintenant :</strong> Allez dans un dossier patient et essayez d'ajouter
                        "Hypertension essentielle (I10)" - cela devrait fonctionner !
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        <div className="mt-6 text-center">
          <a href="/test-antecedents" className="text-blue-600 underline mr-4">
            ← Retour au test API
          </a>
          <a href="/dashboard/doctor" className="text-blue-600 underline">
            ← Retour au dashboard
          </a>
        </div>
      </div>
    </div>
  );
}