'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Plus, Lock, Unlock, X } from 'lucide-react';
import { toast } from 'sonner';

interface Conversation {
  id: string;
  patient_id: string;
  patient_name: string;
  last_message: string;
  last_message_at: string;
  allow_patient_reply: boolean;
  is_closed: boolean;
  unread_count_patient: number;
}

interface ConversationManagerProps {
  patientId: string;
  patientName: string;
}

export default function ConversationManager({ patientId, patientName }: ConversationManagerProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const supabase = createClient();

  // Récupérer l'ID du médecin connecté
  useEffect(() => {
    const fetchDoctorId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: doctor } = await supabase
          .from('doctors')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (doctor) {
          setDoctorId(doctor.id);
        }
      }
    };
    fetchDoctorId();
  }, [supabase]);

  // Charger les conversations existantes
  const fetchConversations = async () => {
    if (!doctorId) return;

    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          id,
          patient_id,
          last_message,
          last_message_at,
          allow_patient_reply,
          is_closed,
          unread_count_patient,
          patients!inner(first_name, last_name)
        `)
        .eq('doctor_id', doctorId)
        .eq('patient_id', patientId)
        .order('last_message_at', { ascending: false });

      if (error) throw error;

      const formattedConversations = data.map((conv: any) => ({
        ...conv,
        patient_name: `${conv.patients.first_name} ${conv.patients.last_name}`
      }));

      setConversations(formattedConversations);
    } catch (error) {
      console.error('Erreur chargement conversations:', error);
      toast.error('Erreur lors du chargement des conversations');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (doctorId) {
      fetchConversations();
    }
  }, [doctorId, patientId]);

  // Créer une nouvelle conversation
  const createConversation = async (allowReply: boolean = false) => {
    if (!doctorId) return;

    try {
      const { data, error } = await supabase.rpc('create_doctor_conversation', {
        p_doctor_id: doctorId,
        p_patient_id: patientId,
        p_allow_reply: allowReply
      });

      if (error) throw error;

      toast.success('Nouvelle conversation créée');
      fetchConversations(); // Recharger la liste
    } catch (error: any) {
      console.error('Erreur création conversation:', error);
      toast.error(error.message || 'Erreur lors de la création');
    }
  };

  // Mettre à jour les permissions de réponse
  const updateReplyPermission = async (conversationId: string, allowReply: boolean) => {
    if (!doctorId) return;

    try {
      const { error } = await supabase.rpc('update_conversation_reply_permission', {
        p_conversation_id: conversationId,
        p_doctor_id: doctorId,
        p_allow_reply: allowReply
      });

      if (error) throw error;

      toast.success(allowReply ? 'Réponses activées' : 'Discussion clôturée');
      fetchConversations(); // Recharger la liste
    } catch (error: any) {
      console.error('Erreur mise à jour permissions:', error);
      toast.error(error.message || 'Erreur lors de la mise à jour');
    }
  };

  if (isLoading) {
    return <div className="p-4">Chargement...</div>;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Gestion des Conversations - {patientName}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Bouton pour créer une nouvelle conversation */}
        <div className="flex gap-2">
          <Button
            onClick={() => createConversation(false)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Nouvelle Conversation (Sans réponse)
          </Button>
          <Button
            onClick={() => createConversation(true)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Unlock className="h-4 w-4" />
            Nouvelle Conversation (Avec réponse)
          </Button>
        </div>

        {/* Liste des conversations existantes */}
        <div className="space-y-3">
          {conversations.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              Aucune conversation avec ce patient
            </p>
          ) : (
            conversations.map((conversation) => (
              <Card key={conversation.id} className="border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium">Conversation #{conversation.id.slice(0, 8)}</h4>
                        {conversation.is_closed && (
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <Lock className="h-3 w-3" />
                            Clôturée
                          </Badge>
                        )}
                        {conversation.allow_patient_reply && !conversation.is_closed && (
                          <Badge variant="default" className="flex items-center gap-1">
                            <Unlock className="h-3 w-3" />
                            Réponses activées
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-1">
                        {conversation.last_message}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(conversation.last_message_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Switch pour contrôler les réponses */}
                      <div className="flex items-center gap-2">
                        <label className="text-sm">Permettre réponses:</label>
                        <Switch
                          checked={conversation.allow_patient_reply}
                          onCheckedChange={(checked) =>
                            updateReplyPermission(conversation.id, checked)
                          }
                          disabled={conversation.is_closed}
                        />
                      </div>

                      {/* Badge pour messages non lus */}
                      {conversation.unread_count_patient > 0 && (
                        <Badge variant="destructive">
                          {conversation.unread_count_patient} non lu{conversation.unread_count_patient > 1 ? 's' : ''}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Informations sur le système */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">ℹ️ Fonctionnement du système</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Seuls les médecins peuvent créer des conversations</li>
            <li>• Le bouton "Permettre réponses" contrôle si le patient peut répondre</li>
            <li>• Désactiver les réponses clôture la discussion pour le patient</li>
            <li>• Vous pouvez continuer à envoyer des messages même après clôture</li>
            <li>• Vous pouvez créer plusieurs conversations avec le même patient</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}