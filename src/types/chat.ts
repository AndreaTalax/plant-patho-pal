/**
 * Shared chat types to avoid any and improve type safety
 */

export interface ProductRecommendation {
  id: string;
  name: string;
  description?: string;
  price?: number;
  image_url?: string;
  category?: string;
}

export interface MessageMetadata {
  [key: string]: string | number | boolean | null | undefined;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  text?: string; // Backward compatibility
  image_url?: string;
  pdf_path?: string;
  products?: ProductRecommendation[];
  metadata?: MessageMetadata;
  sent_at: string;
  read: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  expert_id: string | null;
  status: 'active' | 'finished' | 'archived';
  title?: string;
  conversation_type?: string;
  last_message_at?: string;
  last_message_text?: string;
  created_at: string;
  updated_at?: string;
}

export interface SendMessageParams {
  conversationId: string;
  senderId: string;
  recipientId: string;
  content: string;
  imageUrl?: string;
  products?: ProductRecommendation[];
}
