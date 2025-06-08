
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { MARCO_NIGRO_ID } from '@/components/phytopathologist';
import { Message, DatabaseConversation, DatabaseMessage } from './types';

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

export class ChatService {
  // Get all conversations for a user
  static async getConversations(userId: string): Promise<ConversationData[]> {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .or(`user_id.eq.${userId},expert_id.eq.${userId}`)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching conversations:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getConversations:', error);
      toast.error('Errore nel caricamento delle conversazioni');
      return [];
    }
  }

  // Get messages for a specific conversation
  static async getMessages(conversationId: string): Promise<MessageData[]> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('sent_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        throw error;
      }

      // Transform the data to match MessageData interface
      const transformedData: MessageData[] = (data || []).map(msg => ({
        id: msg.id,
        conversation_id: msg.conversation_id,
        sender_id: msg.sender_id,
        recipient_id: msg.recipient_id,
        text: msg.text,
        sent_at: msg.sent_at,
        read: msg.read,
        products: Array.isArray(msg.products) ? msg.products : (msg.products ? [msg.products] : undefined),
        metadata: msg.metadata
      }));

      return transformedData;
    } catch (error) {
      console.error('Error in getMessages:', error);
      toast.error('Errore nel caricamento dei messaggi');
      return [];
    }
  }

  // Send a new message
  static async sendMessage(
    conversationId: string,
    senderId: string,
    recipientId: string,
    text: string,
    products?: any[]
  ): Promise<boolean> {
    try {
      console.log('📤 Sending message:', { conversationId, senderId, recipientId, text });

      // Verify user authentication
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || user.id !== senderId) {
        console.error('❌ Authentication failed or user mismatch');
        toast.error('Errore di autenticazione');
        return false;
      }

      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: senderId,
          recipient_id: recipientId,
          text: text,
          products: products || null,
          read: false
        });

      if (error) {
        console.error('Error sending message:', error);
        
        if (error.message.includes('row-level security')) {
          toast.error('Permesso negato', {
            description: 'Assicurati di essere autenticato'
          });
        } else {
          toast.error('Errore nell\'invio del messaggio');
        }
        return false;
      }

      console.log('✅ Message sent successfully');
      return true;

    } catch (error) {
      console.error('Error in sendMessage:', error);
      toast.error('Errore nell\'invio del messaggio');
      return false;
    }
  }

  static async createConversationWithExpert(userId: string, title?: string): Promise<string | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || user.id !== userId) {
        console.error('❌ Authentication failed');
        toast.error('Errore di autenticazione');
        return null;
      }

      // Check if conversation already exists
      const { data: existingConversation } = await supabase
        .from('conversations')
        .select('id')
        .eq('user_id', userId)
        .eq('expert_id', MARCO_NIGRO_ID)
        .single();

      if (existingConversation) {
        return existingConversation.id;
      }

      // Create new conversation
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          user_id: userId,
          expert_id: MARCO_NIGRO_ID,
          title: title || 'Consulenza esperto',
          status: 'active'
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating conversation:', error);
        toast.error('Errore nella creazione della conversazione');
        return null;
      }

      return data.id;

    } catch (error) {
      console.error('Error in createConversationWithExpert:', error);
      toast.error('Errore nella creazione della conversazione');
      return null;
    }
  }

  static async markMessagesAsRead(conversationId: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ read: true })
        .eq('conversation_id', conversationId)
        .eq('recipient_id', userId)
        .eq('read', false);

      if (error) {
        console.error('Error marking messages as read:', error);
      }
    } catch (error) {
      console.error('Error in markMessagesAsRead:', error);
    }
  }
}

// Additional exported functions for compatibility
export const loadConversations = async (isExpertView: boolean, userId: string): Promise<DatabaseConversation[]> => {
  try {
    // Simplified query without join to avoid foreign key issues
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .or(isExpertView ? `expert_id.eq.${userId}` : `user_id.eq.${userId}`)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error loading conversations:', error);
      throw error;
    }

    // Transform to match expected interface
    const transformedData: DatabaseConversation[] = (data || []).map(conv => ({
      ...conv,
      user: undefined // Remove user field to avoid type issues
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

export const convertToUIMessage = (dbMessage: DatabaseMessage): Message => {
  return {
    id: dbMessage.id,
    text: dbMessage.text,
    sender: dbMessage.sender_id === MARCO_NIGRO_ID ? 'expert' : 'user',
    time: new Date(dbMessage.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    products: Array.isArray(dbMessage.products) ? dbMessage.products : undefined
  };
};

export const sendMessage = async (
  conversationId: string,
  senderId: string,
  recipientId: string,
  text: string,
  products?: any[]
): Promise<boolean> => {
  return ChatService.sendMessage(conversationId, senderId, recipientId, text, products);
};

export const findOrCreateConversation = async (userId: string): Promise<DatabaseConversation | null> => {
  try {
    // Check if conversation already exists
    const { data: existingConversation } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .eq('expert_id', MARCO_NIGRO_ID)
      .single();

    if (existingConversation) {
      return existingConversation;
    }

    // Create new conversation
    const { data, error } = await supabase
      .from('conversations')
      .insert({
        user_id: userId,
        expert_id: MARCO_NIGRO_ID,
        title: 'Consulenza esperto',
        status: 'active'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating conversation:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in findOrCreateConversation:', error);
    return null;
  }
};

export const updateConversationStatus = async (conversationId: string, status: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('conversations')
      .update({ status })
      .eq('id', conversationId);

    if (error) {
      console.error('Error updating conversation status:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in updateConversationStatus:', error);
    return false;
  }
};
