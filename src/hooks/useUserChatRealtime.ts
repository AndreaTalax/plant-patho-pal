
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

  // Simplified deduplication helper
  const withDeduplication = useCallback(async <T>(key: string, operation: () => Promise<T>): Promise<T | null> => {
    if (globalRequestTracker.has(key)) {
      console.log('⏳ Riutilizzo richiesta esistente:', key);
      try {
        return await globalRequestTracker.get(key);
      } catch (error) {
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

  // Optimized message loading with faster timeout
  const loadMessages = useCallback(async (conversationId: string) => {
    if (!conversationId) return;
    
    const requestKey = `load-messages-${conversationId}`;
    
    try {
      console.log('📚 Caricamento messaggi per conversazione:', conversationId);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // Timeout ridotto a 3 secondi
      
      const messagesData = await withDeduplication(requestKey, async () => {
        const result = await MessageService.loadMessages(conversationId);
        clearTimeout(timeoutId);
        return result;
      });
      
      if (messagesData) {
        console.log('✅ Messaggi caricati:', messagesData.length);
        setMessages(messagesData);
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('⏰ Timeout nel caricamento messaggi, continuo senza');
        setMessages([]); // Imposta array vuoto per continuare
      } else {
        console.error('❌ Errore caricamento messaggi:', error);
      }
    }
  }, [withDeduplication]);

  // Optimized real-time subscription
  useEffect(() => {
    if (!currentConversationId || !userId || subscriptionRef.current) return;

    console.log('🔄 Configurazione subscription real-time per:', currentConversationId);
    
    const channelName = `conversation_${currentConversationId}`;
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
            console.log('📨 Nuovo messaggio ricevuto:', payload.new);
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
            console.error('❌ Errore gestione nuovo messaggio:', error);
          }
        }
      )
      .subscribe((status) => {
        console.log('🔗 Stato subscription:', status);
        setIsConnected(status === 'SUBSCRIBED');
      });

    subscriptionRef.current = channel;

    return () => {
      console.log('🔌 Pulizia subscription');
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }
      setIsConnected(false);
    };
  }, [currentConversationId, userId]);

  // Faster chat initialization with reduced retry logic
  const startChatWithExpert = useCallback(async () => {
    if (!userId || isInitializingRef.current) {
      console.log('⚠️ Inizializzazione già in corso o ID utente mancante');
      return;
    }

    const requestKey = `init-chat-${userId}`;
    isInitializingRef.current = true;
    setInitializationError(null);

    try {
      console.log('🚀 Avvio chat con esperto');
      
      const conversation = await withDeduplication(requestKey, () =>
        ConversationService.findOrCreateConversation(userId)
      );

      if (!conversation) {
        throw new Error('Impossibile stabilire la conversazione');
      }

      console.log('✅ Conversazione stabilita:', conversation.id);
      setActiveChat('expert');
      setCurrentConversationId(conversation.id);
      
      // Carica messaggi senza bloccare l'UI
      loadMessages(conversation.id);
      
      setRetryCount(0);
      toast.success('Chat connessa!');
      
    } catch (error: any) {
      console.error('❌ Errore avvio chat:', error);
      const errorMessage = error.message || 'Errore di connessione';
      setInitializationError(errorMessage);
      
      // Retry automatico solo una volta con delay ridotto
      if (retryCount < 1) {
        console.log(`🔄 Nuovo tentativo in 2 secondi...`);
        setTimeout(() => {
          isInitializingRef.current = false;
          setRetryCount(prev => prev + 1);
          startChatWithExpert();
        }, 2000);
      } else {
        toast.error('Problema di connessione. Riprova tra poco.');
        isInitializingRef.current = false;
      }
    } finally {
      if (retryCount >= 1) {
        isInitializingRef.current = false;
      }
    }
  }, [userId, loadMessages, retryCount, withDeduplication]);

  // Optimized message sending
  const handleSendMessage = useCallback(async (messageText: string) => {
    if (!currentConversationId || !userId || !messageText.trim() || isSending) {
      return;
    }

    const requestKey = `send-message-${currentConversationId}-${Date.now()}`;

    try {
      setIsSending(true);
      console.log('📤 Invio messaggio');
      
      const success = await withDeduplication(requestKey, () =>
        MessageService.sendMessage(currentConversationId, userId, messageText.trim())
      );
      
      if (success) {
        console.log('✅ Messaggio inviato');
        // Ricarica messaggi dopo un breve delay
        setTimeout(() => loadMessages(currentConversationId), 500);
      } else {
        throw new Error('Invio fallito');
      }
      
    } catch (error: any) {
      console.error('❌ Errore invio messaggio:', error);
      toast.error('Errore nell\'invio del messaggio');
    } finally {
      setIsSending(false);
    }
  }, [currentConversationId, userId, loadMessages, isSending, withDeduplication]);

  // Simplified reset function
  const resetChat = useCallback(() => {
    console.log('🔄 Reset chat');
    
    isInitializingRef.current = false;
    globalRequestTracker.clear();
    
    if (subscriptionRef.current) {
      supabase.removeChannel(subscriptionRef.current);
      subscriptionRef.current = null;
    }
    
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
