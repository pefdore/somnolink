'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, XCircle, User, Users, Link } from 'lucide-react';

export default function DebugPatientAccessPage() {
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    runDiagnostics();
  }, []);

  const runDiagnostics = async () => {
    try {
      setLoading(true);
      const supabase = createClient();

      // Test 1: Utilisateur connecté
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      // Test 2: Profil médecin
      let doctor = null;
      let doctorError = null;
      if (user) {
        const result = await supabase
          .from('doctors')
          .select('id')
          .eq('user_id', user.id)
          .single();
        doctor = result.data;
        doctorError = result.error;
      }

      // Test 3: Tous les patients
      const { data: allPatients, error: allPatientsError } = await supabase
        .from('patients')
        .select('id, first_name, last_name, user_id')
        .limit(10);

      // Test 4: Relations patient-médecin
      let relations = null;
      let relationsError = null;
      if (doctor) {
        const result = await supabase
          .from('patient_doctor_relationships')
          .select(`
            id,
            patient_id,
            doctor_id,
            status,
            patients!patient_doctor_relationships_patient_id_fkey (
              first_name,
              last_name
            )
          `)
          .eq('doctor_id', doctor.id)
          .limit(5);
        relations = result.data;
        relationsError = result.error;
      }

      // Test 5: Accès à un patient spécifique
      let patientAccessTest = null;
      let patientAccessError = null;
      if (relations && relations.length > 0) {
        const patientId = relations[0].patient_id;
        const result = await supabase
          .from('patients')
          .select('id, first_name, last_name')
          .eq('id', patientId)
          .single();
        patientAccessTest = result.data;
        patientAccessError = result.error;
      }

      setResults({
        user: {
          id: user?.id,
          role: user?.user_metadata?.role,
          email: user?.email,
          error: userError?.message
        },
        doctor: {
          id: doctor?.id,
          error: doctorError?.message
        },
        allPatients: {
          count: allPatients?.length || 0,
          data: allPatients,
          error: allPatientsError?.message
        },
        relations: {
          count: relations?.length || 0,
          data: relations,
          error: relationsError?.message
        },
        patientAccess: {
          accessible: !!patientAccessTest,
          data: patientAccessTest,
          error: patientAccessError?.message
        }
      });

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Diagnostic en cours...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="flex items-center text-red-600 mb-4">
              <XCircle className="h-5 w-5 mr-2" />
              <span className="font-medium">Erreur de diagnostic</span>
            </div>
            <p className="text-gray-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">🔍 Diagnostic Accès Patients</h1>
          <p className="text-gray-600 mt-2">
            Analyse détaillée des problèmes d'accès aux dossiers patients
          </p>
        </div>

        <div className="grid gap-6">
          {/* Utilisateur connecté */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Utilisateur connecté
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center">
                  {results.user.id ? (
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600 mr-2" />
                  )}
                  <span>ID: {results.user.id || 'Non connecté'}</span>
                </div>
                <div>Rôle: {results.user.role || 'N/A'}</div>
                <div>Email: {results.user.email || 'N/A'}</div>
                {results.user.error && (
                  <div className="text-red-600 text-sm">Erreur: {results.user.error}</div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Profil médecin */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Profil médecin
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center">
                  {results.doctor.id ? (
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600 mr-2" />
                  )}
                  <span>ID Médecin: {results.doctor.id || 'Non trouvé'}</span>
                </div>
                {results.doctor.error && (
                  <div className="text-red-600 text-sm">Erreur: {results.doctor.error}</div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Patients dans la base */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Patients dans la base ({results.allPatients.count})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {results.allPatients.count === 0 ? (
                <div className="text-center py-4">
                  <XCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                  <p className="text-gray-600">Aucun patient trouvé dans la base</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {results.allPatients.data?.map((patient: any) => (
                    <div key={patient.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span>{patient.first_name} {patient.last_name}</span>
                      <span className="text-sm text-gray-500">{patient.id}</span>
                    </div>
                  ))}
                </div>
              )}
              {results.allPatients.error && (
                <div className="text-red-600 text-sm mt-2">Erreur: {results.allPatients.error}</div>
              )}
            </CardContent>
          </Card>

          {/* Relations patient-médecin */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Link className="h-5 w-5 mr-2" />
                Relations patient-médecin ({results.relations.count})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {results.relations.count === 0 ? (
                <div className="text-center py-4">
                  <XCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                  <p className="text-gray-600">Aucune relation trouvée</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Les médecins ne peuvent voir que les patients qui leur sont associés
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {results.relations.data?.map((rel: any) => (
                    <div key={rel.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span>{rel.patients?.first_name} {rel.patients?.last_name}</span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        rel.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {rel.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {results.relations.error && (
                <div className="text-red-600 text-sm mt-2">Erreur: {results.relations.error}</div>
              )}
            </CardContent>
          </Card>

          {/* Test d'accès patient */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertCircle className="h-5 w-5 mr-2" />
                Test d'accès patient
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                {results.patientAccess.accessible ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    <span>Accès réussi à {results.patientAccess.data?.first_name} {results.patientAccess.data?.last_name}</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 text-red-600 mr-2" />
                    <span>Échec de l'accès patient</span>
                  </>
                )}
              </div>
              {results.patientAccess.error && (
                <div className="text-red-600 text-sm mt-2">Erreur: {results.patientAccess.error}</div>
              )}
            </CardContent>
          </Card>

          {/* Solutions recommandées */}
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-blue-900">💡 Solutions recommandées</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {results.allPatients.count === 0 && (
                  <div className="p-3 bg-white rounded border-l-4 border-blue-500">
                    <strong>Créer des patients de test</strong>
                    <p className="text-sm mt-1">Il n'y a aucun patient dans la base de données.</p>
                  </div>
                )}

                {results.relations.count === 0 && results.doctor.id && (
                  <div className="p-3 bg-white rounded border-l-4 border-blue-500">
                    <strong>Créer des relations patient-médecin</strong>
                    <p className="text-sm mt-1">Le médecin n'est associé à aucun patient.</p>
                  </div>
                )}

                {!results.patientAccess.accessible && results.relations.count > 0 && (
                  <div className="p-3 bg-white rounded border-l-4 border-blue-500">
                    <strong>Corriger les politiques RLS</strong>
                    <p className="text-sm mt-1">Les politiques de sécurité bloquent l'accès.</p>
                  </div>
                )}

                <div className="pt-4">
                  <Button onClick={runDiagnostics} className="w-full">
                    🔄 Relancer le diagnostic
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}