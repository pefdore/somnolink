'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Send, Paperclip, User, MessageSquare, Clock, File, X, Settings, Plus, Search, CheckCircle, XCircle } from 'lucide-react';

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  conversationId?: string;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount?: number;
  allowReply?: boolean;
}

interface Conversation {
  id: string;
  patient_id: string;
  patient_name: string;
  last_message: string;
  last_message_at: string;
  unread_count: number;
  allow_patient_reply: boolean;
}

interface Message {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
  sender_type: string;
  allow_reply: boolean;
  read_at: string | null;
  message_attachments?: any[];
}

export default function MessageriePage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [allPatients, setAllPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [allowReply, setAllowReply] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const supabase = createClient();

  useEffect(() => {
    fetchAllPatients();
    fetchConversations();
  }, []);

  useEffect(() => {
    if (selectedPatient) {
      fetchConversation();
    }
  }, [selectedPatient]);

  const fetchAllPatients = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Récupérer le profil médecin
      const { data: doctor } = await supabase
        .from('doctors')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!doctor) return;

      // Récupérer tous les patients associés au médecin
      const { data: patientsData, error } = await supabase
        .from('patient_doctor_relationships')
        .select('patient_id')
        .eq('doctor_id', doctor.id)
        .eq('status', 'active');

      if (error) {
        console.error('Erreur récupération patients:', error);
        return;
      }

      // Récupérer les détails des patients séparément
      const patientIds = patientsData?.map((rel: any) => rel.patient_id) || [];
      const { data: patientsDetails, error: patientsError } = await supabase
        .from('patients')
        .select('id, first_name, last_name, email')
        .in('id', patientIds);

      const formattedPatients: Patient[] = patientsDetails?.map((patient: any) => ({
        id: patient.id,
        first_name: patient.first_name || '',
        last_name: patient.last_name || '',
        email: patient.email || ''
      })) || [];

      setAllPatients(formattedPatients);
    } catch (error) {
      console.error('Erreur récupération patients:', error);
    }
  };

  const fetchConversations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Récupérer le profil médecin
      const { data: doctor } = await supabase
        .from('doctors')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!doctor) return;

      // Récupérer les conversations du médecin
      const { data: conversationsData, error } = await supabase
        .from('conversations')
        .select(`
          id,
          patient_id,
          last_message,
          last_message_at,
          unread_count_doctor,
          allow_patient_reply
        `)
        .eq('doctor_id', doctor.id)
        .order('last_message_at', { ascending: false });

      if (error) {
        console.error('Erreur récupération conversations:', error);
        return;
      }

      // Récupérer les détails des patients pour les conversations
      const patientIds = conversationsData?.map((conv: any) => conv.patient_id) || [];
      const { data: patientsDetails, error: patientsError } = await supabase
        .from('patients')
        .select('id, first_name, last_name, email')
        .in('id', patientIds);

      // Créer une map des patients pour un accès rapide
      const patientsMap = new Map();
      patientsDetails?.forEach((patient: any) => {
        patientsMap.set(patient.id, patient);
      });

      const formattedPatients: Patient[] = conversationsData?.map((conv: any) => {
        const patient = patientsMap.get(conv.patient_id);
        return {
          id: conv.patient_id,
          first_name: patient?.first_name || '',
          last_name: patient?.last_name || '',
          email: patient?.email || '',
          conversationId: conv.id,
          lastMessage: conv.last_message,
          lastMessageAt: conv.last_message_at,
          unreadCount: conv.unread_count_doctor || 0,
          allowReply: conv.allow_patient_reply || false
        };
      }) || [];

      setPatients(formattedPatients);
    } catch (error) {
      console.error('Erreur lors de la récupération des conversations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchConversation = async () => {
    try {
      const { data: messagesData, error } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${selectedPatient?.id},receiver_id.eq.${selectedPatient?.id}`)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(messagesData || []);
    } catch (error) {
      console.error('Erreur lors de la récupération de la conversation:', error);
    }
  };

  const sendMessage = async () => {
    if ((!newMessage.trim() && attachments.length === 0) || !selectedPatient || isSending) return;

    setIsSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { data: doctor } = await supabase
        .from('doctors')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!doctor) throw new Error('Profil médecin non trouvé');

      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patientId: selectedPatient.id,
          content: newMessage,
          allowReply: allowReply,
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'envoi du message');
      }

      const result = await response.json();
      
      // Uploader les pièces jointes si le message a été créé avec succès
      if (attachments.length > 0 && result.message?.id) {
        await uploadAttachments(result.message.id);
      }

      setNewMessage('');
      setAllowReply(false);
      setAttachments([]);
      
      // Rafraîchir la conversation
      fetchConversation();
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de l\'envoi du message');
    } finally {
      setIsSending(false);
    }
  };

  const uploadAttachments = async (messageId: string) => {
    for (const file of attachments) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('messageId', messageId);

      try {
        const response = await fetch('/api/attachments', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          console.error('Erreur lors de l\'upload de la pièce jointe');
        }
      } catch (error) {
        console.error('Erreur lors de l\'upload:', error);
      }
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      setAttachments(prev => [...prev, ...Array.from(files)]);
    }
    // Reset the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-white rounded-lg shadow-sm">
      {/* Liste des patients */}
      <div className="w-1/3 border-r border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Messagerie</h2>
              <p className="text-sm text-gray-600">Vos patients</p>
            </div>
            <button
              onClick={() => setShowNewConversation(!showNewConversation)}
              className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              title="Nouvelle conversation"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>

          {/* Recherche */}
          <div className="mt-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un patient..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="overflow-y-auto h-[calc(100vh-250px)]">
          {/* Conversations existantes */}
          {patients.length > 0 && (
            <div className="p-3 border-b border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Conversations actives</h3>
              {patients
                .filter(patient =>
                  `${patient.first_name} ${patient.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  patient.email.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map((patient) => (
                  <div
                    key={patient.id}
                    className={`p-3 rounded-lg cursor-pointer hover:bg-gray-50 mb-1 ${
                      selectedPatient?.id === patient.id ? 'bg-blue-50 border border-blue-200' : ''
                    }`}
                    onClick={() => setSelectedPatient(patient)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 truncate text-sm">
                          {patient.first_name} {patient.last_name}
                        </h4>
                        <p className="text-xs text-gray-500 truncate">{patient.lastMessage || 'Aucun message'}</p>
                      </div>
                      {patient.unreadCount && patient.unreadCount > 0 && (
                        <div className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                          {patient.unreadCount}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}

          {/* Tous les patients */}
          <div className="p-3">
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Tous les patients {showNewConversation ? '(sélection pour nouvelle conversation)' : ''}
            </h3>
            {allPatients.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <User className="mx-auto h-12 w-12 text-gray-300 mb-2" />
                <p className="text-sm">Aucun patient associé</p>
              </div>
            ) : (
              allPatients
                .filter(patient =>
                  `${patient.first_name} ${patient.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  patient.email.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map((patient) => {
                  const hasConversation = patients.some(p => p.id === patient.id);
                  return (
                    <div
                      key={patient.id}
                      className={`p-3 rounded-lg cursor-pointer hover:bg-gray-50 mb-1 ${
                        selectedPatient?.id === patient.id ? 'bg-blue-50 border border-blue-200' : ''
                      } ${hasConversation ? 'opacity-60' : ''}`}
                      onClick={() => setSelectedPatient(patient)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          hasConversation ? 'bg-green-100' : 'bg-gray-100'
                        }`}>
                          <User className={`h-4 w-4 ${hasConversation ? 'text-green-600' : 'text-gray-600'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 truncate text-sm">
                            {patient.first_name} {patient.last_name}
                          </h4>
                          <p className="text-xs text-gray-500 truncate">{patient.email}</p>
                        </div>
                        {hasConversation && (
                          <div title="Conversation existante">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>
      </div>

      {/* Conversation */}
      <div className="flex-1 flex flex-col">
        {selectedPatient ? (
          <>
            <div className="p-4 border-b border-gray-200 bg-white">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold">
                    {selectedPatient.first_name} {selectedPatient.last_name}
                  </h3>
                  <p className="text-sm text-gray-500">{selectedPatient.email}</p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <MessageSquare className="mx-auto h-12 w-12 text-gray-300 mb-2" />
                  <p>Aucun message échangé</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender_id === selectedPatient.id ? 'justify-start' : 'justify-end'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.sender_id === selectedPatient.id
                          ? 'bg-white border border-gray-200'
                          : 'bg-blue-600 text-white'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p
                        className={`text-xs mt-1 ${
                          message.sender_id === selectedPatient.id
                            ? 'text-gray-400'
                            : 'text-blue-100'
                        }`}
                      >
                        {formatDate(message.created_at)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-gray-200 bg-white">
              <div className="space-y-3">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Écrivez votre message..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      multiple
                      className="hidden"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className="p-2 text-gray-400 hover:text-gray-600 cursor-pointer"
                      title="Ajouter une pièce jointe"
                    >
                      <Paperclip className="h-5 w-5" />
                    </label>
                    
                    <label className="flex items-center space-x-2 text-sm text-gray-600">
                      <input
                        type="checkbox"
                        checked={allowReply}
                        onChange={(e) => setAllowReply(e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span>Autoriser la réponse</span>
                    </label>
                  </div>
                  
                  {/* Affichage des pièces jointes sélectionnées */}
                  {attachments.length > 0 && (
                    <div className="flex-1">
                      <div className="flex flex-wrap gap-2">
                        {attachments.map((file, index) => (
                          <div
                            key={index}
                            className="flex items-center space-x-1 bg-gray-100 px-2 py-1 rounded text-xs"
                          >
                            <File className="h-3 w-3" />
                            <span className="truncate max-w-xs">{file.name}</span>
                            <button
                              onClick={() => removeAttachment(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={sendMessage}
                    disabled={(!newMessage.trim() && attachments.length === 0) || isSending}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="h-4 w-4" />
                    <span>{isSending ? 'Envoi...' : 'Envoyer'}</span>
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center text-gray-500">
              <MessageSquare className="mx-auto h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium mb-2">Sélectionnez une conversation</h3>
              <p>Choisissez un patient dans la liste pour commencer à discuter</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}