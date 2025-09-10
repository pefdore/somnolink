'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface TestResult {
  test: string;
  status: 'pending' | 'running' | 'success' | 'error';
  message: string;
  details?: any;
}

export default function TestSynchronizationPage() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const supabase = createClient();

  const addResult = (result: TestResult) => {
    setResults(prev => [...prev, result]);
  };

  const updateResult = (index: number, updates: Partial<TestResult>) => {
    setResults(prev => prev.map((r, i) => i === index ? { ...r, ...updates } : r));
  };

  const runTests = async () => {
    setIsRunning(true);
    setResults([]);

    try {
      // Test 1: Vérifier la connexion à Supabase
      const test1Index = results.length;
      addResult({
        test: 'Connexion Supabase',
        status: 'running',
        message: 'Test de la connexion à la base de données...'
      });

      const { data: connectionTest, error: connectionError } = await supabase
        .from('patients')
        .select('count')
        .limit(1);

      if (connectionError) {
        updateResult(test1Index, {
          status: 'error',
          message: 'Erreur de connexion à Supabase',
          details: connectionError
        });
      } else {
        updateResult(test1Index, {
          status: 'success',
          message: 'Connexion Supabase réussie'
        });
      }

      // Test 2: Vérifier l'existence du champ treating_physician_id
      const test2Index = results.length;
      addResult({
        test: 'Champ treating_physician_id',
        status: 'running',
        message: 'Vérification de l\'existence du champ treating_physician_id...'
      });

      const { data: schemaTest, error: schemaError } = await supabase
        .rpc('execute_sql', {
          sql: `
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'patients'
            AND column_name = 'treating_physician_id'
          `
        });

      if (schemaError || !schemaTest || schemaTest.length === 0) {
        updateResult(test2Index, {
          status: 'error',
          message: 'Le champ treating_physician_id n\'existe pas',
          details: schemaError || 'Champ non trouvé'
        });
      } else {
        updateResult(test2Index, {
          status: 'success',
          message: 'Champ treating_physician_id trouvé',
          details: schemaTest[0]
        });
      }

      // Test 3: Vérifier les données des patients de test
      const test3Index = results.length;
      addResult({
        test: 'Données patients test',
        status: 'running',
        message: 'Récupération des données des patients de test...'
      });

      const { data: patientsData, error: patientsError } = await supabase
        .from('patients')
        .select(`
          id,
          first_name,
          last_name,
          email,
          social_security_number,
          civility,
          birth_name,
          treating_physician_id,
          phone_number,
          date_of_birth,
          address,
          city,
          postal_code
        `)
        .in('email', ['somnolink4@yopmail.com', 'pfdore.pro@gmail.com']);

      if (patientsError) {
        updateResult(test3Index, {
          status: 'error',
          message: 'Erreur lors de la récupération des données patients',
          details: patientsError
        });
      } else {
        updateResult(test3Index, {
          status: 'success',
          message: `${patientsData?.length || 0} patient(s) trouvé(s)`,
          details: patientsData
        });
      }

      // Test 4: Vérifier les médecins disponibles
      const test4Index = results.length;
      addResult({
        test: 'Médecins disponibles',
        status: 'running',
        message: 'Récupération de la liste des médecins...'
      });

      const { data: doctorsData, error: doctorsError } = await supabase
        .from('doctors')
        .select('id, first_name, last_name, email')
        .order('last_name');

      if (doctorsError) {
        updateResult(test4Index, {
          status: 'error',
          message: 'Erreur lors de la récupération des médecins',
          details: doctorsError
        });
      } else {
        updateResult(test4Index, {
          status: 'success',
          message: `${doctorsData?.length || 0} médecin(s) trouvé(s)`,
          details: doctorsData
        });
      }

      // Test 5: Test de mise à jour des données
      if (patientsData && patientsData.length > 0) {
        const test5Index = results.length;
        addResult({
          test: 'Test mise à jour',
          status: 'running',
          message: 'Test de mise à jour des données administratives...'
        });

        const testPatient = patientsData[0];
        const updateData = {
          social_security_number: '123456789012345',
          civility: 'M.',
          birth_name: testPatient.last_name,
          treating_physician_id: doctorsData && doctorsData.length > 0 ? doctorsData[0].id : null
        };

        const { data: updateTestResult, error: updateError } = await supabase
          .from('patients')
          .update(updateData)
          .eq('id', testPatient.id)
          .select()
          .single();

        if (updateError) {
          updateResult(test5Index, {
            status: 'error',
            message: 'Erreur lors de la mise à jour',
            details: updateError
          });
        } else {
          updateResult(test5Index, {
            status: 'success',
            message: 'Mise à jour réussie',
            details: updateTestResult
          });
        }
      }

    } catch (error) {
      addResult({
        test: 'Erreur générale',
        status: 'error',
        message: 'Une erreur inattendue s\'est produite',
        details: error
      });
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-50 border-green-200';
      case 'error': return 'text-red-600 bg-red-50 border-red-200';
      case 'running': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'running': return '🔄';
      default: return '⏳';
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Test de Synchronisation - Profils Administratifs</h1>

      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">Tests Automatisés</h2>
        <p className="text-gray-600 mb-6">
          Ces tests vérifient la synchronisation entre les espaces patient et médecin pour les comptes de test :
          <strong>somnolink4@yopmail.com</strong> et <strong>pfdore.pro@gmail.com</strong>
        </p>

        <button
          onClick={runTests}
          disabled={isRunning}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRunning ? 'Tests en cours...' : 'Lancer les tests'}
        </button>
      </div>

      <div className="space-y-4">
        {results.map((result, index) => (
          <div
            key={index}
            className={`border rounded-lg p-4 ${getStatusColor(result.status)}`}
          >
            <div className="flex items-center space-x-3 mb-2">
              <span className="text-lg">{getStatusIcon(result.status)}</span>
              <h3 className="font-semibold">{result.test}</h3>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                result.status === 'success' ? 'bg-green-100 text-green-800' :
                result.status === 'error' ? 'bg-red-100 text-red-800' :
                result.status === 'running' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {result.status.toUpperCase()}
              </span>
            </div>

            <p className="mb-2">{result.message}</p>

            {result.details && (
              <details className="mt-3">
                <summary className="cursor-pointer font-medium">Détails</summary>
                <pre className="mt-2 text-sm bg-white p-3 rounded border overflow-x-auto">
                  {typeof result.details === 'string'
                    ? result.details
                    : JSON.stringify(result.details, null, 2)
                  }
                </pre>
              </details>
            )}
          </div>
        ))}
      </div>

      {results.length === 0 && !isRunning && (
        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <p className="text-gray-500">Cliquez sur "Lancer les tests" pour vérifier la synchronisation</p>
        </div>
      )}

      <div className="mt-8 bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Instructions de Test Manuel</h2>
        <div className="space-y-4 text-sm text-gray-600">
          <div>
            <h3 className="font-semibold text-gray-800">1. Test depuis l'espace Patient</h3>
            <p>Connectez-vous avec <strong>somnolink4@yopmail.com</strong> ou <strong>pfdore.pro@gmail.com</strong></p>
            <p>Allez dans Profil → Modifiez les informations administratives → Sauvegardez</p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-800">2. Vérification dans l'espace Médecin</h3>
            <p>Connectez-vous en tant que médecin → Ouvrez le dossier du patient</p>
            <p>Cliquez sur "Informations de base" → Vérifiez que les modifications apparaissent</p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-800">3. Test inverse</h3>
            <p>Modifiez les informations depuis l'espace médecin → Vérifiez la synchronisation dans l'espace patient</p>
          </div>
        </div>
      </div>
    </div>
  );
}