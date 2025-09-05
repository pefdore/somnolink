'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { MessageSquare, Send, User } from 'lucide-react';

interface Conversation {
  id: string;
  doctor_id: string;
  doctor_name: string;
  last_message: string;
  last_message_at: string;
  unread_count: number;
}

interface Message {
  id: string;
  content: string;
  created_at: string;
  sender_type: 'doctor' | 'patient';
  sender_name: string;
}

export default function PatientMessagerieFixedPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [patientId, setPatientId] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    initializePatient();
  }, []);

  useEffect(() => {
    if (patientId) {
      loadConversations();
    }
  }, [patientId]);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation);
    }
  }, [selectedConversation]);

  const initializePatient = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: patient } = await supabase
        .from('patients')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (patient) {
        setPatientId(patient.id);
      }
    } catch (error) {
      console.error('Erreur initialisation patient:', error);
    }
  };

  const loadConversations = async () => {
    if (!patientId) return;

    try {
      // Essayer d'abord avec la table conversations
      const { data: convData, error: convError } = await supabase
        .from('conversations')
        .select(`
          id,
          doctor_id,
          last_message,
          last_message_at,
          unread_count_patient
        `)
        .eq('patient_id', patientId)
        .order('last_message_at', { ascending: false });

      if (!convError && convData) {
        // Table conversations existe
        const doctors = await loadDoctors(convData.map(c => c.doctor_id));

        const formattedConversations = convData.map((conv: any) => ({
          id: conv.id,
          doctor_id: conv.doctor_id,
          doctor_name: doctors[conv.doctor_id] || 'Médecin',
          last_message: conv.last_message || 'Aucun message',
          last_message_at: conv.last_message_at || '',
          unread_count: conv.unread_count_patient || 0
        }));

        setConversations(formattedConversations);
      } else {
        // Fallback: construire depuis les messages
        console.log('Table conversations non disponible, fallback vers messages');
        await loadConversationsFromMessages();
      }
    } catch (error) {
      console.error('Erreur chargement conversations:', error);
      await loadConversationsFromMessages();
    } finally {
      setIsLoading(false);
    }
  };

  const loadConversationsFromMessages = async () => {
    try {
      const { data: messagesData } = await supabase
        .from('messages')
        .select(`
          conversation_id,
          sender_id,
          sender_type,
          content,
          created_at
        `)
        .or(`sender_id.eq.${patientId},receiver_id.eq.${patientId}`)
        .order('created_at', { ascending: false });

      if (messagesData) {
        const conversationMap = new Map();

        for (const msg of messagesData) {
          if (!conversationMap.has(msg.conversation_id)) {
            const doctorId = msg.sender_type === 'doctor' ? msg.sender_id :
                           await findDoctorFromConversation(msg.conversation_id);

            conversationMap.set(msg.conversation_id, {
              id: msg.conversation_id,
              doctor_id: doctorId,
              doctor_name: 'Médecin',
              last_message: msg.content,
              last_message_at: msg.created_at,
              unread_count: 0
            });
          }
        }

        setConversations(Array.from(conversationMap.values()));
      }
    } catch (error) {
      console.error('Erreur fallback conversations:', error);
    }
  };

  const findDoctorFromConversation = async (conversationId: string) => {
    try {
      const { data } = await supabase
        .from('messages')
        .select('sender_id, sender_type')
        .eq('conversation_id', conversationId)
        .eq('sender_type', 'doctor')
        .limit(1)
        .single();

      return data?.sender_id || 'unknown';
    } catch {
      return 'unknown';
    }
  };

  const loadDoctors = async (doctorIds: string[]) => {
    try {
      const { data } = await supabase
        .from('doctors')
        .select('id, first_name, last_name')
        .in('id', doctorIds);

      const doctors: { [key: string]: string } = {};
      data?.forEach(doctor => {
        doctors[doctor.id] = `${doctor.first_name} ${doctor.last_name}`;
      });

      return doctors;
    } catch {
      return {};
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const { data } = await supabase
        .from('messages')
        .select(`
          id,
          content,
          created_at,
          sender_id,
          sender_type
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (data) {
        const messagesWithNames = await Promise.all(
          data.map(async (msg: any) => {
            let senderName = 'Inconnu';

            if (msg.sender_type === 'doctor') {
              const { data: doctor } = await supabase
                .from('doctors')
                .select('first_name, last_name')
                .eq('id', msg.sender_id)
                .single();

              if (doctor) {
                senderName = `${doctor.first_name} ${doctor.last_name}`;
              }
            } else {
              const { data: patient } = await supabase
                .from('patients')
                .select('first_name, last_name')
                .eq('id', msg.sender_id)
                .single();

              if (patient) {
                senderName = `${patient.first_name} ${patient.last_name}`;
              }
            }

            return {
              id: msg.id,
              content: msg.content,
              created_at: msg.created_at,
              sender_type: msg.sender_type,
              sender_name: senderName
            };
          })
        );

        setMessages(messagesWithNames);
      }
    } catch (error) {
      console.error('Erreur chargement messages:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !patientId) return;

    try {
      // Trouver l'ID du médecin pour cette conversation
      let doctorId = null;

      // Essayer depuis la table conversations d'abord
      const { data: conv } = await supabase
        .from('conversations')
        .select('doctor_id')
        .eq('id', selectedConversation)
        .single();

      if (conv) {
        doctorId = conv.doctor_id;
      } else {
        // Fallback: chercher dans les messages
        const { data: msg } = await supabase
          .from('messages')
          .select('sender_id, sender_type')
          .eq('conversation_id', selectedConversation)
          .eq('sender_type', 'doctor')
          .limit(1)
          .single();

        if (msg) {
          doctorId = msg.sender_id;
        }
      }

      if (!doctorId) {
        alert('Impossible de trouver le destinataire');
        return;
      }

      const { data: message, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: selectedConversation,
          sender_id: patientId,
          sender_type: 'patient',
          content: newMessage.trim()
        })
        .select()
        .single();

      if (error) {
        console.error('Erreur envoi message:', error);
        alert('Erreur lors de l\'envoi du message');
        return;
      }

      setNewMessage('');
      setMessages(prev => [...prev, {
        id: message.id,
        content: message.content,
        created_at: message.created_at,
        sender_type: 'patient',
        sender_name: 'Vous'
      }]);

      // Créer une notification pour le médecin
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase
            .from('message_notifications')
            .insert({
              message_id: message.id,
              user_id: user.id, // Le patient voit aussi sa propre notification
              type: 'message',
              is_read: true // Le patient a déjà vu son propre message
            });
        }

        // Créer une notification pour le médecin destinataire
        const { data: doctorUser } = await supabase
          .from('doctors')
          .select('user_id')
          .eq('id', doctorId)
          .single();

        if (doctorUser) {
          await supabase
            .from('message_notifications')
            .insert({
              message_id: message.id,
              user_id: doctorUser.user_id,
              type: 'message',
              is_read: false // Le médecin n'a pas encore vu le message
            });
        }

        console.log('Notifications créées pour le message');
      } catch (notifError) {
        console.warn('Erreur création notifications:', notifError);
      }

      // Rafraîchir les conversations
      loadConversations();

    } catch (error) {
      console.error('Erreur envoi message:', error);
      alert('Erreur lors de l\'envoi du message');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Messagerie</h1>
      </div>

      <div className="flex bg-white rounded-lg shadow-lg h-[600px]">
        {/* Liste des conversations */}
        <div className="w-1/3 border-r border-gray-200 overflow-y-auto">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Conversations</h2>
          </div>

          {conversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              Aucune conversation
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedConversation === conversation.id ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => setSelectedConversation(conversation.id)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">
                        {conversation.doctor_name}
                      </h3>
                      <p className="text-sm text-gray-600 truncate">
                        {conversation.last_message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {conversation.last_message_at ? new Date(conversation.last_message_at).toLocaleDateString('fr-FR') : ''}
                      </p>
                    </div>
                    {conversation.unread_count > 0 && (
                      <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                        {conversation.unread_count}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Messages de la conversation sélectionnée */}
        <div className="flex-1 flex flex-col">
          {selectedConversation ? (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    Aucun message dans cette conversation
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender_type === 'patient' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.sender_type === 'patient'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-900'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {new Date(message.created_at).toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Zone de saisie du message */}
              <div className="p-4 border-t border-gray-200">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Tapez votre message..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              Sélectionnez une conversation pour commencer à discuter
            </div>
          )}
        </div>
      </div>
    </div>
  );
}