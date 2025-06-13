
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

  // Setup real-time subscriptions
  useEffect(() => {
    if (!userId) return;

    console.log('🔄 Setting up real-time chat subscriptions...');

    // Create a unique channel for this user/conversation
    const channelName = conversationId 
      ? `chat:conversation:${conversationId}`
      : `chat:user:${userId}`;

    const realtimeChannel = supabase.channel(channelName);

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
            : undefined
        },
        (payload) => {
          console.log('📨 New message received:', payload.new);
          const newMessage = payload.new as DatabaseMessage;
          
          // Only show toast for messages from others
          if (newMessage.sender_id !== userId) {
            toast.success('Nuovo messaggio ricevuto!');
          }
          
          onNewMessage?.(newMessage);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversations'
        },
        (payload) => {
          console.log('💬 Conversation updated:', payload.new);
          const updatedConversation = payload.new as DatabaseConversation;
          onConversationUpdate?.(updatedConversation);
        }
      )
      .subscribe((status) => {
        console.log('🔗 Real-time subscription status:', status);
        setIsConnected(status === 'SUBSCRIBED');
        
        if (status === 'SUBSCRIBED') {
          console.log('✅ Real-time chat connected successfully');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Real-time chat connection failed');
          toast.error('Connessione chat in tempo reale fallita');
        }
      });

    setChannel(realtimeChannel);

    return () => {
      console.log('🔌 Cleaning up real-time subscriptions...');
      realtimeChannel.unsubscribe();
      setChannel(null);
      setIsConnected(false);
    };
  }, [conversationId, userId, onNewMessage, onConversationUpdate]);

  // Send message via API
  const sendMessage = useCallback(async (
    recipientId: string,
    text: string,
    imageUrl?: string,
    products?: any[]
  ) => {
    if (!conversationId) {
      throw new Error('No conversation ID provided');
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          conversationId,
          recipientId,
          text,
          imageUrl,
          products
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to send message');
      }

      return result.message;
    } catch (error) {
      console.error('❌ Error sending message:', error);
      throw error;
    }
  }, [conversationId]);

  // Get conversation data via API
  const getConversation = useCallback(async (id: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`/api/get-conversation/${id}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to get conversation');
      }

      return result;
    } catch (error) {
      console.error('❌ Error getting conversation:', error);
      throw error;
    }
  }, []);

  return {
    isConnected,
    sendMessage,
    getConversation,
    channel
  };
};
