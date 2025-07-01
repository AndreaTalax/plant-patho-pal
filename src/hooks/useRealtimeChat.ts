
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';
import { DatabaseMessage, DatabaseConversation } from '@/services/chat/types';
import { toast } from 'sonner';

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
            console.log('📨 New message received:', payload.new);
            const newMessage = payload.new as DatabaseMessage;
            
            // Only show toast for messages from others
            if (newMessage.sender_id !== userId) {
              toast.success('Nuovo messaggio ricevuto!', {
                description: newMessage.text?.slice(0, 50) + (newMessage.text?.length > 50 ? '...' : ''),
                duration: 4000,
              });
            }
            
            if (onNewMessage) {
              onNewMessage(newMessage);
            }
          } catch (error) {
            console.error('❌ Error handling new message:', error);
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
            console.log('💬 Conversation updated:', payload.new);
            const updatedConversation = payload.new as DatabaseConversation;
            if (onConversationUpdate) {
              onConversationUpdate(updatedConversation);
            }
          } catch (error) {
            console.error('❌ Error handling conversation update:', error);
          }
        }
      )
      .subscribe((status, err) => {
        console.log('🔗 Real-time subscription status:', status, err);
        setIsConnected(status === 'SUBSCRIBED');
        
        if (status === 'SUBSCRIBED') {
          console.log('✅ Real-time chat connected successfully');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Real-time chat connection failed:', err);
          toast.error('Connessione real-time fallita');
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
      const { error: insertError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: userId,
          recipient_id: recipientId,
          content: text.trim(),
          text: text.trim(),
          image_url: imageUrl,
          sent_at: new Date().toISOString()
        });

      if (insertError) {
        console.error('❌ Direct insert error:', insertError);
        throw new Error(insertError.message || 'Failed to send message');
      }

      console.log('✅ Message sent successfully via direct insert');
      return { success: true };

    } catch (error: any) {
      console.error('❌ Error in sendMessage:', error);
      throw error;
    }
  }, [conversationId, userId]);

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
