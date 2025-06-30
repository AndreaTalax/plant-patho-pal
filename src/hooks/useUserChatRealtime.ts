
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { DatabaseMessage } from '@/services/chat/types';
import { MARCO_NIGRO_ID } from '@/components/phytopathologist';
import { ConversationService } from '@/services/chat/conversationService';
import { MessageService } from '@/services/chat/messageService';

export const useUserChatRealtime = (userId: string) => {
  const [activeChat, setActiveChat] = useState<any>(null);
  const [messages, setMessages] = useState<DatabaseMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [initializationError, setInitializationError] = useState<string | null>(null);
  
  const { user } = useAuth();

  // Start or get existing chat with expert
  const startChatWithExpert = useCallback(async () => {
    try {
      setInitializationError(null);
      console.log('🚀 Starting chat with expert for user:', userId);

      // Find or create conversation using direct service
      const conversation = await ConversationService.findOrCreateConversation(userId);
      
      if (!conversation) {
        setInitializationError('Errore nella creazione della conversazione');
        return;
      }

      setActiveChat(conversation);
      setCurrentConversationId(conversation.id);
      setIsConnected(true);

      // Load existing messages using direct service
      try {
        const existingMessages = await MessageService.loadMessages(conversation.id);
        setMessages(existingMessages || []);
      } catch (messageError) {
        console.warn('⚠️ Could not load existing messages:', messageError);
        setMessages([]);
      }

      // Set up real-time subscription
      const channel = supabase
        .channel(`conversation_${conversation.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=eq.${conversation.id}`
          },
          (payload) => {
            console.log('📨 New message received:', payload.new);
            setMessages(prev => [...prev, payload.new as DatabaseMessage]);
          }
        )
        .subscribe();

      return () => {
        channel.unsubscribe();
      };

    } catch (error) {
      console.error('❌ Error in startChatWithExpert:', error);
      setInitializationError('Errore nell\'inizializzazione della chat');
    }
  }, [userId]);

  // Send message handler using direct service
  const handleSendMessage = useCallback(async (
    text: string, 
    imageUrl?: string
  ) => {
    if (!activeChat || !currentConversationId || isSending) return;

    setIsSending(true);
    
    try {
      console.log('📤 Sending message:', { text: text.slice(0, 50) + '...', hasImage: !!imageUrl });

      const success = await MessageService.sendMessage(
        currentConversationId,
        userId,
        text,
        imageUrl
      );

      if (!success) {
        toast.error('Errore nell\'invio del messaggio');
        return;
      }

      console.log('✅ Message sent successfully');
      
    } catch (error) {
      console.error('❌ Error in handleSendMessage:', error);
      toast.error('Errore nell\'invio del messaggio');
    } finally {
      setIsSending(false);
    }
  }, [activeChat, currentConversationId, userId, isSending]);

  // Reset chat state
  const resetChat = useCallback(() => {
    setActiveChat(null);
    setMessages([]);
    setCurrentConversationId(null);
    setIsConnected(false);
    setInitializationError(null);
  }, []);

  return {
    activeChat,
    messages,
    isSending,
    isConnected,
    handleSendMessage,
    startChatWithExpert,
    currentConversationId,
    initializationError,
    resetChat
  };
};
