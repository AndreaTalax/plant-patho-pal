
export interface ConversationData {
  id: string;
  user_id: string;
  expert_id: string | null;
  title: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  last_message_at: string | null;
  last_message_text: string | null;
}

export interface MessageData {
  id: string;
  conversation_id: string;
  sender_id: string;
  recipient_id: string;
  text: string;
  sent_at: string;
  read: boolean;
  products?: any;
  metadata?: any;
}

export interface DatabaseConversation {
  id: string;
  user_id: string;
  expert_id: string | null;
  title: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  last_message_at: string | null;
  last_message_text: string | null;
  user?: any;
}

export interface DatabaseMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  recipient_id: string;
  content: string; // Required field in database
  text: string; // Legacy field for compatibility
  sent_at: string;
  read: boolean;
  products?: any;
  metadata?: any;
  image_url?: string; // Added missing image_url property
}
