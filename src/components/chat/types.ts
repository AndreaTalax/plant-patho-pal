
export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'expert';
  time: string;
  products?: any[];
  plantImage?: string;
  plantDetails?: any;
  userDetails?: any;
}

export interface Conversation {
  id: string;
  title: string;
  lastMessage: string;
  time: string;
  unreadCount: number;
  expertId?: string;
}

export interface User {
  id: string;
  name: string;
  avatar?: string;
  isOnline?: boolean;
}

export const EXPERT: User = {
  id: 'expert-001',
  name: 'Dott. Marco Rossi',
  avatar: '/placeholder.svg',
  isOnline: true
};

// Database types
export interface DatabaseMessage {
  id: string;
  sender_id: string;
  recipient_id: string;
  conversation_id: string;
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
  status: string | null;
  created_at: string | null;
  updated_at: string | null;
  last_message_at: string | null;
  last_message_text?: string | null; // Made optional to match database schema
}

export interface DatabaseProfile {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  avatar_url?: string;
}
