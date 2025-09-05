'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function DiagnosticPage() {
  const [status, setStatus] = useState('Chargement...');
  const [conversations, setConversations] = useState<any[]>([]);
  const supabase = createClient();

  useEffect(() => {
    checkDatabaseStatus();
  }, []);

  const checkDatabaseStatus = async () => {
    try {
      // Vérifier l'utilisateur
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        setStatus('Erreur: Non connecté');
        return;
      }

      setStatus(`Utilisateur trouvé: ${user.email}`);

      // Vérifier le patient
      const { data: patient, error: patientError } = await supabase
        .from('patients')
        .select('id, first_name, last_name')
        .eq('user_id', user.id)
        .single();

      if (patientError || !patient) {
        setStatus('Erreur: Patient non trouvé');
        return;
      }

      setStatus(`Patient trouvé: ${patient.first_name} ${patient.last_name} (ID: ${patient.id})`);

      // Tester la table conversations
      const { data: convData, error: convError } = await supabase
        .from('conversations')
        .select('*')
        .eq('patient_id', patient.id)
        .limit(5);

      if (convError) {
        setStatus(`Table conversations - Erreur: ${convError.message}`);
        console.error('Erreur conversations:', convError);

        // Tester avec les messages directs
        const { data: msgData, error: msgError } = await supabase
          .from('messages')
          .select('*')
          .or(`sender_id.eq.${patient.id},receiver_id.eq.${patient.id}`)
          .limit(5);

        if (msgError) {
          setStatus(`Messages - Erreur: ${msgError.message}`);
          console.error('Erreur messages:', msgError);
        } else {
          setStatus(`Messages trouvés: ${msgData?.length || 0}`);
          console.log('Messages:', msgData);
        }
      } else {
        setStatus(`Conversations trouvées: ${convData?.length || 0}`);
        setConversations(convData || []);
        console.log('Conversations:', convData);
      }

    } catch (error: any) {
      setStatus(`Erreur inattendue: ${error.message}`);
      console.error('Erreur:', error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Diagnostic Messagerie Patient</h1>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Status</h2>
        <p className="text-gray-700">{status}</p>
      </div>

      {conversations.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Conversations</h2>
          <div className="space-y-2">
            {conversations.map((conv, index) => (
              <div key={conv.id || index} className="border rounded p-4">
                <p><strong>ID:</strong> {conv.id}</p>
                <p><strong>Docteur:</strong> {conv.doctor_id}</p>
                <p><strong>Dernier message:</strong> {conv.last_message}</p>
                <p><strong>Date:</strong> {conv.last_message_at}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6">
        <button
          onClick={checkDatabaseStatus}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Rafraîchir le diagnostic
        </button>
      </div>
    </div>
  );
}