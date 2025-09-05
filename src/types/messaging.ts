export interface Message {
  id: string;
  doctor_id: string;
  patient_id: string;
  content: string;
  sender_type: 'doctor' | 'patient';
  allow_reply: boolean;
  created_at: string;
  updated_at: string;
  attachments?: Attachment[];
}

export interface Attachment {
  id: string;
  message_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  created_at: string;
}

export interface Notification {
  id: string;
  doctor_id: string;
  patient_id: string;
  type: 'message' | 'appointment' | 'other';
  message: string;
  read: boolean;
  created_at: string;
  updated_at: string;
}

export interface ConversationSummary {
  doctor_id: string;
  patient_id: string;
  last_message: string;
  last_message_at: string;
  unread_count: number;
  doctor_name: string;
}