
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';
import { DatabaseMessage, DatabaseConversation } from '@/services/chat/types';
import { toast } from 'sonner';
import { invalidateOnNewMessage, invalidateConversationCache } from '@/services/cache/conversationCache';
import { logger } from '@/utils/logger';

interface UseRealtimeChatProps {
  conversationId?: string;
  userId: string;
  onNewMessage?: (message: DatabaseMessage) => void;
  onConversationUpdate?: (conversation: DatabaseConversation) => void;
}

export const useRealtimeChat = ({
  conversationId,
  userId,
  onNewMessage,
  onConversationUpdate
}: UseRealtimeChatProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  // Setup real-time subscriptions with better error handling
  useEffect(() => {
    if (!userId) return;

    console.log('🔄 Setting up real-time chat subscriptions for user:', userId);

    // Create a unique channel for this user/conversation
    const channelName = conversationId 
      ? `chat:conversation:${conversationId}`
      : `chat:user:${userId}`;

    const realtimeChannel = supabase.channel(channelName, {
      config: {
        presence: {
          key: userId,
        },
      },
    });

    // Subscribe to new messages in this conversation or user's conversations
    realtimeChannel
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: conversationId 
            ? `conversation_id=eq.${conversationId}`
            : `or(sender_id.eq.${userId},recipient_id.eq.${userId})`
        },
        (payload) => {
          try {
            logger.log('📨 New message received:', payload.new);
            const newMsg = payload.new as DatabaseMessage;
            
            // Invalidate cache for this conversation
            invalidateOnNewMessage(newMsg.conversation_id);
            
            // Show toast for messages from others, but also process all messages
            if (newMsg.sender_id !== userId) {
              toast.success('Nuovo messaggio ricevuto!', {
                description: newMsg.text?.slice(0, 50) + (newMsg.text?.length > 50 ? '...' : ''),
                duration: 4000,
              });
            } else {
              // Log own messages for debugging
              logger.log('📤 Own message received via realtime:', newMsg.id);
            }
            
            if (onNewMessage) {
              onNewMessage(newMsg);
            }
          } catch (error) {
            logger.error('❌ Error handling new message:', error);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversations',
          filter: conversationId 
            ? `id=eq.${conversationId}`
            : `or(user_id.eq.${userId},expert_id.eq.${userId})`
        },
        (payload) => {
          try {
            logger.log('💬 Conversation updated:', payload.new);
            const updatedConversation = payload.new as DatabaseConversation;
            
            // Invalidate conversation cache
            invalidateConversationCache(updatedConversation.id, updatedConversation.user_id);
            
            if (onConversationUpdate) {
              onConversationUpdate(updatedConversation);
            }
          } catch (error) {
            logger.error('❌ Error handling conversation update:', error);
          }
        }
      )
      .subscribe((status, err) => {
        logger.log('🔗 Subscription status:', status, err);
        setIsConnected(status === 'SUBSCRIBED');
        
        if (status === 'SUBSCRIBED') {
          logger.log('✅ Real-time connected successfully');
        } else if (status === 'CHANNEL_ERROR') {
          logger.error('❌ Real-time connection failed:', err);
          toast.error('Connessione real-time fallita');
        } else if (status === 'TIMED_OUT') {
          logger.error('⏰ Real-time connection timed out');
          setIsConnected(false);
        }
      });

    setChannel(realtimeChannel);

    return () => {
      console.log('🔌 Cleaning up real-time chat subscriptions');
      try {
        if (realtimeChannel) {
          realtimeChannel.unsubscribe();
          supabase.removeChannel(realtimeChannel);
        }
      } catch (error) {
        console.warn('⚠️ Error during channel cleanup:', error);
      }
      setChannel(null);
      setIsConnected(false);
    };
  }, [conversationId, userId, onNewMessage, onConversationUpdate]);

  // Send message function using direct database insert with better error handling
  const sendMessage = useCallback(async (recipientId: string, text: string, imageUrl?: string, products?: any) => {
    if (!conversationId || !text.trim()) {
      throw new Error('Missing required data for sending message');
    }

    try {
      console.log('📤 Sending message via direct database insert:', {
        conversationId,
        recipientId,
        text,
        hasImage: !!imageUrl,
        hasProducts: !!products
      });

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('User not authenticated');
      }

      // Inserimento diretto nel database
      const { data: insertedMessage, error: insertError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: userId,
          recipient_id: recipientId,
          content: text.trim(),
          text: text.trim(),
          image_url: imageUrl,
          sent_at: new Date().toISOString()
        })
        .select()
        .single();

      if (insertError) {
        console.error('❌ Direct insert error:', insertError);
        throw new Error(insertError.message || 'Failed to send message');
      }

      console.log('✅ Message sent successfully via direct insert:', insertedMessage);
      
      // Immediately trigger callback for own message to show in UI
      if (onNewMessage && insertedMessage) {
        console.log('🔄 Triggering immediate callback for own message');
        onNewMessage(insertedMessage as DatabaseMessage);
      }
      
      return { success: true, message: insertedMessage };

    } catch (error: any) {
      console.error('❌ Error in sendMessage:', error);
      throw error;
    }
  }, [conversationId, userId, onNewMessage]);

  // Add cleanup on unmount
  useEffect(() => {
    return () => {
      if (channel) {
        try {
          channel.unsubscribe();
          supabase.removeChannel(channel);
        } catch (error) {
          console.warn('⚠️ Error during final cleanup:', error);
        }
      }
    };
  }, [channel]);

  return {
    isConnected,
    channel,
    sendMessage
  };
};
