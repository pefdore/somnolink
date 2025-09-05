'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2, User, Clock } from 'lucide-react';

interface AssociationRequest {
  id: string;
  patient_id: string;
  patient_first_name: string;
  patient_last_name: string;
  patient_email: string;
  requested_at: string;
  status: string;
}

export default function DoctorRequestsPage() {
  const supabase = createClient();
  
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [requests, setRequests] = useState<AssociationRequest[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadAssociationRequests();
  }, []);

  const loadAssociationRequests = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Charger les demandes d'association en attente pour ce médecin
      const { data: relationshipsData, error: relationshipsError } = await supabase
        .from('patient_doctor_relationships')
        .select('id, patient_id, status, requested_at')
        .eq('doctor_id', session.user.id)
        .eq('status', 'pending')
        .order('requested_at', { ascending: false });

      if (relationshipsError) {
        setError('Erreur lors du chargement des demandes');
        return;
      }

      if (!relationshipsData || relationshipsData.length === 0) {
        setRequests([]);
        setLoading(false);
        return;
      }

      // Charger les informations des patients
      const patientIds = relationshipsData.map(r => r.patient_id);
      const { data: patientsData, error: patientsError } = await supabase
        .from('patients')
        .select('id, first_name, last_name, email')
        .in('id', patientIds);

      if (patientsError) {
        setError('Erreur lors du chargement des informations patients');
        return;
      }

      // Combiner les données
      const formattedRequests = relationshipsData.map(request => {
        const patient = patientsData?.find(p => p.id === request.patient_id);
        return {
          id: request.id,
          patient_id: request.patient_id,
          patient_first_name: patient?.first_name || 'Inconnu',
          patient_last_name: patient?.last_name || '',
          patient_email: patient?.email || '',
          requested_at: request.requested_at,
          status: request.status
        };
      });

      setRequests(formattedRequests);
    } catch (err) {
      setError('Erreur lors du chargement des demandes');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestAction = async (requestId: string, action: 'accept' | 'reject') => {
    setProcessing(requestId);
    setError(null);
    setSuccess(null);

    try {
      const { error } = await supabase
        .from('patient_doctor_relationships')
        .update({ 
          status: action === 'accept' ? 'active' : 'rejected',
          accepted_at: action === 'accept' ? new Date().toISOString() : null
        })
        .eq('id', requestId);

      if (error) {
        setError(action === 'accept'
          ? "Erreur lors de l'acceptation de la demande"
          : "Erreur lors du refus de la demande");
        return;
      }

      setSuccess(`Demande ${action === 'accept' ? 'acceptée' : 'refusée'} avec succès`);
      
      // Mettre à jour la liste localement
      setRequests(prev => prev.filter(request => request.id !== requestId));
    } catch (err) {
      setError(action === 'accept'
        ? "Erreur lors de l'acceptation de la demande"
        : "Erreur lors du refus de la demande");
    } finally {
      setProcessing(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Chargement des demandes d'association...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Demandes d'association</h1>
          <p className="text-gray-600">
            Gérer les demandes des patients souhaitant s'associer à vous
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center">
              <XCircle className="h-4 w-4 text-red-600 mr-2" />
              <h3 className="font-medium text-red-800">Erreur</h3>
            </div>
            <p className="text-red-700 mt-1">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
              <h3 className="font-medium text-green-800">Succès</h3>
            </div>
            <p className="text-green-700 mt-1">{success}</p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {requests.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune demande en attente</h3>
              <p className="text-gray-600">
                Les demandes d'association de vos patients apparaîtront ici
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {requests.map((request) => (
                <div key={request.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="h-6 w-6 text-blue-600" />
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-medium text-gray-900">
                          {request.patient_first_name} {request.patient_last_name}
                        </h3>
                        <p className="text-gray-600 text-sm">{request.patient_email}</p>
                        <p className="text-gray-500 text-xs">
                          Demandé le {formatDate(request.requested_at)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <Button
                        onClick={() => handleRequestAction(request.id, 'reject')}
                        disabled={processing === request.id}
                        variant="outline"
                        className="border-red-300 text-red-700 hover:bg-red-50"
                      >
                        {processing === request.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <XCircle className="h-4 w-4 mr-2" />
                        )}
                        Refuser
                      </Button>
                      
                      <Button
                        onClick={() => handleRequestAction(request.id, 'accept')}
                        disabled={processing === request.id}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {processing === request.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle className="h-4 w-4 mr-2" />
                        )}
                        Accepter
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-2">Comment ça fonctionne ?</h3>
          <ul className="text-blue-800 space-y-2 text-sm">
            <li>• Les patients peuvent vous trouver via la recherche et demander une association</li>
            <li>• Vous recevrez une notification pour chaque nouvelle demande</li>
            <li>• Une fois acceptée, le patient aura accès à votre espace médecin</li>
            <li>• Vous pouvez également générer des liens d'invitation personnels</li>
          </ul>
        </div>
      </div>
    </div>
  );
}