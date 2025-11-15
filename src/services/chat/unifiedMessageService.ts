import { supabase } from '@/integrations/supabase/client';
import { ChatMessage, SendMessageParams } from '@/types/chat';
import { logger } from '@/utils/logger';
import { toast } from 'sonner';
import { conversationCache, CacheKeys, invalidateOnNewMessage } from '@/services/cache/conversationCache';

/**
 * Unified Message Service
 * Consolidates all message-related operations to avoid duplication
 */
export class UnifiedMessageService {
  /**
   * Load messages for a conversation (with caching)
   */
  static async loadMessages(conversationId: string): Promise<ChatMessage[]> {
    const cacheKey = CacheKeys.messages(conversationId);
    
    // Try cache first
    const cached = conversationCache.get<ChatMessage[]>(cacheKey);
    if (cached) {
      logger.log('✅ Returning cached messages');
      return cached;
    }

    try {
      logger.log('📚 Loading messages for conversation:', conversationId);
      
      if (!conversationId) {
        logger.warn('📭 Missing conversation ID');
        return [];
      }

      // Try edge function first (handles auth/RLS reliably)
      const { data, error } = await supabase.functions.invoke('get-conversation', {
        body: { conversationId }
      });

      if (error) {
        logger.warn('⚠️ Edge function failed, falling back to direct query', error);
      } else if (data?.messages) {
        logger.log('✅ Messages loaded via edge function', data.messages.length);
        const messages = data.messages as ChatMessage[];
        // Cache for 2 minutes
        conversationCache.set(cacheKey, messages, 2 * 60 * 1000);
        return messages;
      }

      // Fallback: direct DB query
      const { data: messages, error: dbError } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('sent_at', { ascending: true })
        .limit(100);

      if (dbError) {
        logger.error('❌ Error loading messages (fallback)', dbError);
        return [];
      }

      logger.log('✅ Messages loaded (fallback)', messages?.length || 0);
      // Parse products JSON to proper type
      const parsedMessages = (messages || []).map(msg => ({
        ...msg,
        products: msg.products ? (typeof msg.products === 'string' ? JSON.parse(msg.products) : msg.products) : undefined
      })) as ChatMessage[];
      
      // Cache for 2 minutes
      conversationCache.set(cacheKey, parsedMessages, 2 * 60 * 1000);
      
      return parsedMessages;

    } catch (error) {
      logger.error('❌ Error loading messages', error);
      return [];
    }
  }

  /**
   * Send a message
   */
  static async sendMessage(params: SendMessageParams): Promise<boolean> {
    try {
      logger.log('📤 Sending message', {
        conversationId: params.conversationId,
        senderId: params.senderId,
        contentLength: params.content?.length || 0,
        hasImage: !!params.imageUrl,
        hasProducts: !!params.products
      });

      // Verify session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        logger.error('❌ Invalid session', sessionError);
        toast.error('Sessione scaduta, ricarica la pagina');
        return false;
      }

      if (!params.conversationId || !params.senderId || !params.content?.trim()) {
        logger.error('❌ Incomplete message data');
        toast.error('Dati messaggio incompleti');
        return false;
      }

      // Verify conversation exists and is not archived
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .select('id, status, user_id, expert_id')
        .eq('id', params.conversationId)
        .maybeSingle();

      if (convError || !conversation) {
        logger.error('❌ Conversation not found', convError);
        toast.error('Conversazione non disponibile');
        return false;
      }

      if (conversation.status === 'finished') {
        logger.error('❌ Cannot send message to archived conversation');
        toast.error('Impossibile inviare messaggi a una conversazione archiviata');
        return false;
      }

      // Send via edge function (handles notifications)
      const { error } = await supabase.functions.invoke('send-message', {
        body: {
          conversationId: params.conversationId,
          senderId: params.senderId,
          recipientId: params.recipientId,
          text: params.content,
          imageUrl: params.imageUrl,
          products: params.products
        }
      });

      if (error) {
        logger.error('❌ Error calling send-message function', error);
        throw error;
      }

      // Invalidate message cache after sending
      invalidateOnNewMessage(params.conversationId);

      logger.log('✅ Message sent successfully');
      return true;
    } catch (error) {
      logger.error('❌ Error in sendMessage', error);
      throw error;
    }
  }

  /**
   * Send an image message (convenience method)
   */
  static async sendImageMessage(
    conversationId: string,
    senderId: string,
    recipientId: string,
    imageUrl: string
  ): Promise<boolean> {
    return this.sendMessage({
      conversationId,
      senderId,
      recipientId,
      content: '📷 Immagine inviata',
      imageUrl
    });
  }

  /**
   * Mark messages as read
   */
  static async markMessagesAsRead(
    conversationId: string,
    userId: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ read: true })
        .eq('conversation_id', conversationId)
        .eq('recipient_id', userId)
        .eq('read', false);

      if (error) {
        logger.error('❌ Error marking messages as read', error);
        return false;
      }

      logger.log('✅ Messages marked as read');
      return true;
    } catch (error) {
      logger.error('❌ Error in markMessagesAsRead', error);
      return false;
    }
  }
}
