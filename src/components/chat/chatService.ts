
import { supabase } from '@/integrations/supabase/client';
import { ChatApi } from '@/services/chat/chatApi';
import { ConversationService } from '@/services/chat/conversationService';
import { convertToUIMessage } from '@/services/chat/messageUtils';
import { ConversationData, MessageData, DatabaseConversation, DatabaseMessage } from '@/services/chat/types';
import { Message } from './types';

// Re-export types for backward compatibility
export type { ConversationData, MessageData, DatabaseConversation, DatabaseMessage };

// Main ChatService class with simplified interface
export class ChatService {
  static async getConversations(userId: string): Promise<ConversationData[]> {
    return ChatApi.getConversations(userId);
  }

  static async getMessages(conversationId: string): Promise<MessageData[]> {
    return ChatApi.getMessages(conversationId);
  }

  static async sendMessage(
    conversationId: string,
    senderId: string,
    recipientId: string,
    text: string,
    products?: any[]
  ): Promise<boolean> {
    return ChatApi.sendMessage(conversationId, senderId, recipientId, text, products);
  }

  static async createConversationWithExpert(userId: string, title?: string): Promise<string | null> {
    return ConversationService.createConversationWithExpert(userId, title);
  }

  static async markMessagesAsRead(conversationId: string, userId: string): Promise<void> {
    return ChatApi.markMessagesAsRead(conversationId, userId);
  }
}

// Legacy compatibility functions
export const loadConversations = async (isExpertView: boolean, userId: string): Promise<DatabaseConversation[]> => {
  try {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .or(isExpertView ? `expert_id.eq.${userId}` : `user_id.eq.${userId}`)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error loading conversations:', error);
      throw error;
    }

    const transformedData: DatabaseConversation[] = (data || []).map(conv => ({
      ...conv,
      user: undefined
    }));

    return transformedData;
  } catch (error) {
    console.error('Error in loadConversations:', error);
    return [];
  }
};

export const loadMessages = async (conversationId: string): Promise<DatabaseMessage[]> => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('sent_at', { ascending: true });

    if (error) {
      console.error('Error loading messages:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in loadMessages:', error);
    return [];
  }
};

export { convertToUIMessage };

export const sendMessage = async (
  conversationId: string,
  senderId: string,
  recipientId: string,
  text: string,
  products?: any[]
): Promise<boolean> => {
  return ChatService.sendMessage(conversationId, senderId, recipientId, text, products);
};

export const findOrCreateConversation = async (userId: string) => {
  return ConversationService.findOrCreateConversation(userId);
};

export const updateConversationStatus = async (conversationId: string, status: string): Promise<boolean> => {
  return ConversationService.updateConversationStatus(conversationId, status);
};
