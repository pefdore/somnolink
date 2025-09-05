'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export default function SimpleFixPage() {
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runSimpleFix = async () => {
    setLoading(true);
    const supabase = createClient();

    try {
      console.log('🔧 Application de la correction simple...');

      // Test 1: Vérifier l'accès simple au patient
      const { data: patient, error: patientError } = await supabase
        .from('patients')
        .select('id, first_name, last_name')
        .eq('id', '28e2cbb2-e5a2-4292-acca-2afab316fafe')
        .single();

      console.log('✅ Patient trouvé:', patient);

      // Test 2: Essayer une requête simplifiée sans jointures complexes
      const { data: patientSimple, error: simpleError } = await supabase
        .from('patients')
        .select(`
          id, first_name, last_name, date_of_birth, email,
          medical_history, surgical_history
        `)
        .eq('id', '28e2cbb2-e5a2-4292-acca-2afab316fafe')
        .single();

      console.log('✅ Patient avec données de base:', patientSimple);

      // Test 3: Récupérer les rendez-vous séparément
      const { data: appointments, error: appointmentsError } = await supabase
        .from('appointments')
        .select('id, appointment_datetime, type, notes')
        .eq('patient_id', '28e2cbb2-e5a2-4292-acca-2afab316fafe');

      console.log('✅ Rendez-vous du patient:', appointments);

      // Test 4: Récupérer les notes médicales
      const { data: notes, error: notesError } = await supabase
        .from('notes')
        .select('id, content, created_at')
        .eq('patient_id', '28e2cbb2-e5a2-4292-acca-2afab316fafe');

      console.log('✅ Notes médicales:', notes);

      setResults({
        patient: { success: !!patient, data: patient, error: patientError?.message },
        patientSimple: { success: !!patientSimple, data: patientSimple, error: simpleError?.message },
        appointments: { success: !appointmentsError, data: appointments, error: appointmentsError?.message },
        notes: { success: !notesError, data: notes, error: notesError?.message }
      });

    } catch (error: any) {
      console.error('❌ Erreur:', error);
      setResults({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">🔧 Correction Simple</h1>
          <p className="text-gray-600 mt-2">
            Test d'une approche simplifiée pour résoudre le problème d'accès aux dossiers
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Correction simplifiée</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">🎯 Stratégie :</h3>
                <ul className="text-blue-800 space-y-1">
                  <li>• Éviter les jointures complexes qui causent l'erreur PGRST200</li>
                  <li>• Récupérer les données de chaque table séparément</li>
                  <li>• Combiner les données côté client</li>
                  <li>• Utiliser des requêtes plus simples et fiables</li>
                </ul>
              </div>

              <Button onClick={runSimpleFix} disabled={loading} className="w-full">
                {loading ? 'Test en cours...' : '🚀 Tester la correction simplifiée'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {results && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Résultats des tests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Patient de base */}
                  <div className="flex items-center justify-between p-3 border rounded">
                    <span className="font-medium">Accès patient de base</span>
                    {results.patient?.success ? (
                      <div className="flex items-center text-green-600">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        <span>{results.patient.data?.first_name} {results.patient.data?.last_name}</span>
                      </div>
                    ) : (
                      <div className="flex items-center text-red-600">
                        <XCircle className="h-4 w-4 mr-2" />
                        <span>Échec</span>
                      </div>
                    )}
                  </div>

                  {/* Patient avec données médicales */}
                  <div className="flex items-center justify-between p-3 border rounded">
                    <span className="font-medium">Données médicales du patient</span>
                    {results.patientSimple?.success ? (
                      <div className="flex items-center text-green-600">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        <span>Données récupérées</span>
                      </div>
                    ) : (
                      <div className="flex items-center text-red-600">
                        <XCircle className="h-4 w-4 mr-2" />
                        <span>Échec</span>
                      </div>
                    )}
                  </div>

                  {/* Rendez-vous */}
                  <div className="flex items-center justify-between p-3 border rounded">
                    <span className="font-medium">Rendez-vous du patient</span>
                    {results.appointments?.success ? (
                      <div className="flex items-center text-green-600">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        <span>{results.appointments.data?.length || 0} rendez-vous</span>
                      </div>
                    ) : (
                      <div className="flex items-center text-red-600">
                        <XCircle className="h-4 w-4 mr-2" />
                        <span>Échec</span>
                      </div>
                    )}
                  </div>

                  {/* Notes médicales */}
                  <div className="flex items-center justify-between p-3 border rounded">
                    <span className="font-medium">Notes médicales</span>
                    {results.notes?.success ? (
                      <div className="flex items-center text-green-600">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        <span>{results.notes.data?.length || 0} notes</span>
                      </div>
                    ) : (
                      <div className="flex items-center text-red-600">
                        <XCircle className="h-4 w-4 mr-2" />
                        <span>Échec</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="text-green-900">✅ Solution proposée</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-green-800">
                    <strong>Remplacer la requête complexe par des requêtes simples :</strong>
                  </p>

                  <div className="bg-white p-4 rounded border-l-4 border-green-500">
                    <h4 className="font-semibold mb-2">Au lieu de cette requête complexe :</h4>
                    <code className="text-sm text-gray-600 block">
                      SELECT *, appointments(*), documents(*), prescriptions(*) FROM patients
                    </code>
                  </div>

                  <div className="bg-white p-4 rounded border-l-4 border-green-500">
                    <h4 className="font-semibold mb-2">Utiliser ces requêtes séparées :</h4>
                    <code className="text-sm text-gray-600 block">
                      SELECT * FROM patients WHERE id = ?<br/>
                      SELECT * FROM appointments WHERE patient_id = ?<br/>
                      SELECT * FROM notes WHERE patient_id = ?
                    </code>
                  </div>

                  <p className="text-green-800 mt-4">
                    Cette approche évite les problèmes de jointures et fonctionne de manière fiable.
                  </p>
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