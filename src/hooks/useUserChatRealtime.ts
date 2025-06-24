
import { useState, useCallback, useEffect, useRef } from 'react';
import { ConversationService } from '@/services/chat/conversationService';
import { MessageService } from '@/services/chat/messageService';
import { MARCO_NIGRO_ID } from '@/components/phytopathologist';
import { DatabaseMessage } from '@/services/chat/types';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

// Global request tracking to prevent duplicate requests
const globalRequestTracker = new Map<string, Promise<any>>();

export const useUserChatRealtime = (userId: string) => {
  const [activeChat, setActiveChat] = useState<'expert' | null>(null);
  const [messages, setMessages] = useState<DatabaseMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [initializationError, setInitializationError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  
  // Refs to prevent multiple operations
  const isInitializingRef = useRef(false);
  const subscriptionRef = useRef<any>(null);

  // Deduplication helper
  const withDeduplication = useCallback(async <T>(key: string, operation: () => Promise<T>): Promise<T | null> => {
    if (globalRequestTracker.has(key)) {
      console.log('🔄 Waiting for existing request:', key);
      try {
        return await globalRequestTracker.get(key);
      } catch (error) {
        console.error('❌ Existing request failed:', error);
        globalRequestTracker.delete(key);
        throw error;
      }
    }

    const promise = operation();
    globalRequestTracker.set(key, promise);
    
    try {
      const result = await promise;
      globalRequestTracker.delete(key);
      return result;
    } catch (error) {
      globalRequestTracker.delete(key);
      throw error;
    }
  }, []);

  // Load messages with deduplication
  const loadMessages = useCallback(async (conversationId: string) => {
    if (!conversationId) return;
    
    const requestKey = `load-messages-${conversationId}`;
    
    try {
      console.log('📚 Loading messages for conversation:', conversationId);
      const messagesData = await withDeduplication(requestKey, () => 
        MessageService.loadMessages(conversationId)
      );
      
      if (messagesData) {
        console.log('✅ Messages loaded:', messagesData.length);
        setMessages(messagesData);
      }
    } catch (error) {
      console.error('❌ Error loading messages:', error);
    }
  }, [withDeduplication]);

  // Setup real-time subscription (single instance)
  useEffect(() => {
    if (!currentConversationId || !userId || subscriptionRef.current) return;

    console.log('🔄 Setting up real-time subscription for:', currentConversationId);
    
    const channelName = `conversation_${currentConversationId}_${userId}`;
    const channel = supabase.channel(channelName);

    channel
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${currentConversationId}`
        },
        (payload) => {
          try {
            console.log('📨 New message received:', payload.new);
            const newMessage = payload.new as DatabaseMessage;
            
            setMessages(prev => {
              const exists = prev.some(msg => msg.id === newMessage.id);
              if (exists) return prev;
              
              return [...prev, newMessage].sort((a, b) => 
                new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime()
              );
            });
            
            if (newMessage.sender_id !== userId) {
              toast.success('Nuovo messaggio ricevuto!');
            }
          } catch (error) {
            console.error('❌ Error handling new message:', error);
          }
        }
      )
      .subscribe((status) => {
        console.log('🔗 Subscription status:', status);
        setIsConnected(status === 'SUBSCRIBED');
      });

    subscriptionRef.current = channel;

    return () => {
      console.log('🔌 Cleaning up subscription');
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }
      setIsConnected(false);
    };
  }, [currentConversationId, userId]);

  // Chat initialization with proper deduplication
  const startChatWithExpert = useCallback(async () => {
    if (!userId || isInitializingRef.current) {
      console.log('⚠️ Already initializing or no user ID');
      return;
    }

    const requestKey = `init-chat-${userId}`;
    isInitializingRef.current = true;
    setInitializationError(null);
    setRetryCount(prev => prev + 1);

    try {
      console.log('🚀 Starting chat with expert (attempt', retryCount + 1, ')');
      
      const conversation = await withDeduplication(requestKey, () =>
        ConversationService.findOrCreateConversation(userId)
      );

      if (!conversation) {
        throw new Error('Unable to establish conversation');
      }

      console.log('✅ Conversation established:', conversation.id);
      setActiveChat('expert');
      setCurrentConversationId(conversation.id);
      await loadMessages(conversation.id);
      
      setRetryCount(0);
      toast.success('Chat connected successfully!');
      
    } catch (error: any) {
      console.error('❌ Error starting chat:', error);
      const errorMessage = error.message || 'Connection error';
      setInitializationError(errorMessage);
      
      // Auto-retry with exponential backoff (max 3 attempts)
      if (retryCount < 3) {
        const delay = Math.min(2000 * Math.pow(2, retryCount), 8000);
        console.log(`🔄 Auto-retry in ${delay}ms (attempt ${retryCount + 1}/3)`);
        setTimeout(() => {
          isInitializingRef.current = false;
          startChatWithExpert();
        }, delay);
      } else {
        toast.error('Persistent connection error. Please refresh the page.');
        isInitializingRef.current = false;
      }
    } finally {
      if (retryCount >= 3) {
        isInitializingRef.current = false;
      }
    }
  }, [userId, loadMessages, retryCount, withDeduplication]);

  // Send message with deduplication
  const handleSendMessage = useCallback(async (messageText: string) => {
    if (!currentConversationId || !userId || !messageText.trim() || isSending) {
      return;
    }

    const requestKey = `send-message-${currentConversationId}-${Date.now()}`;

    try {
      setIsSending(true);
      console.log('📤 Sending message');
      
      const success = await withDeduplication(requestKey, () =>
        MessageService.sendMessage(currentConversationId, userId, messageText.trim())
      );
      
      if (success) {
        console.log('✅ Message sent successfully');
        // Reload messages after a short delay
        setTimeout(() => loadMessages(currentConversationId), 1000);
      } else {
        throw new Error('Failed to send message');
      }
      
    } catch (error: any) {
      console.error('❌ Error sending message:', error);
      toast.error('Error sending message');
    } finally {
      setIsSending(false);
    }
  }, [currentConversationId, userId, loadMessages, isSending, withDeduplication]);

  // Reset function
  const resetChat = useCallback(() => {
    console.log('🔄 Resetting chat');
    
    // Clear all tracking
    isInitializingRef.current = false;
    globalRequestTracker.clear();
    
    // Clean up subscription
    if (subscriptionRef.current) {
      supabase.removeChannel(subscriptionRef.current);
      subscriptionRef.current = null;
    }
    
    // Reset state
    setMessages([]);
    setCurrentConversationId(null);
    setActiveChat(null);
    setIsConnected(false);
    setInitializationError(null);
    setIsSending(false);
    setRetryCount(0);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
      }
      globalRequestTracker.clear();
    };
  }, []);

  return {
    activeChat,
    setActiveChat,
    messages,
    isSending,
    isConnected,
    handleSendMessage,
    startChatWithExpert,
    currentConversationId,
    initializationError,
    resetChat,
    retryCount
  };
};
