
import { useState, useCallback, useEffect } from 'react';
import { ConversationService } from '@/services/chat/conversationService';
import { MessageService } from '@/services/chat/messageService';
import { MARCO_NIGRO_ID } from '@/components/phytopathologist';
import { DatabaseMessage } from '@/services/chat/types';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export const useUserChatRealtime = (userId: string) => {
  const [activeChat, setActiveChat] = useState<'expert' | null>(null);
  const [messages, setMessages] = useState<DatabaseMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [initializationError, setInitializationError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Caricamento messaggi ottimizzato
  const loadMessages = useCallback(async (conversationId: string) => {
    if (!conversationId) return;
    
    try {
      console.log('📚 Caricamento messaggi per conversazione:', conversationId);
      const messagesData = await MessageService.loadMessages(conversationId);
      console.log('✅ Messaggi caricati:', messagesData?.length || 0);
      setMessages(messagesData || []);
    } catch (error) {
      console.error('❌ Errore caricamento messaggi:', error);
    }
  }, []);

  // Setup subscription real-time
  useEffect(() => {
    if (!currentConversationId || !userId) return;

    console.log('🔄 Setup subscription real-time per:', currentConversationId);
    
    const channelName = `conversation_${currentConversationId}_${Date.now()}`;
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
            
            // Toast solo per messaggi dall'esperto
            if (newMessage.sender_id !== userId) {
              toast.success('Nuovo messaggio ricevuto!', {
                duration: 3000,
              });
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

    return () => {
      console.log('🔌 Pulizia subscription');
      supabase.removeChannel(channel);
      setIsConnected(false);
    };
  }, [currentConversationId, userId]);

  // Chat initialization ROBUSTO e SEMPRE FUNZIONANTE
  const startChatWithExpert = useCallback(async () => {
    if (!userId) {
      const error = 'Utente non autenticato';
      setInitializationError(error);
      return;
    }

    // Reset errori precedenti
    setInitializationError(null);
    setRetryCount(prev => prev + 1);

    try {
      console.log('🚀 Avvio chat con esperto (tentativo', retryCount + 1, ') per utente:', userId);
      
      // Tentativo robusto di trovare/creare conversazione
      let conversation = null;
      let attempts = 0;
      const maxAttempts = 3;
      
      while (!conversation && attempts < maxAttempts) {
        attempts++;
        console.log(`🔄 Tentativo ${attempts}/${maxAttempts} creazione conversazione`);
        
        conversation = await ConversationService.findOrCreateConversation(userId);
        
        if (!conversation && attempts < maxAttempts) {
          console.log('⏳ Attendo prima del prossimo tentativo...');
          await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
        }
      }

      if (!conversation) {
        throw new Error('Impossibile stabilire connessione dopo multiple tentativi');
      }

      console.log('✅ Conversazione stabilita:', conversation.id);
      setActiveChat('expert');
      setCurrentConversationId(conversation.id);
      await loadMessages(conversation.id);
      
      // Reset retry count su successo
      setRetryCount(0);
      toast.success('Chat connessa con successo!');
      
    } catch (error: any) {
      console.error('❌ Errore avvio chat:', error);
      const errorMessage = error.message || 'Errore connessione chat';
      setInitializationError(errorMessage);
      
      // Auto-retry con backoff esponenziale (max 5 tentativi)
      if (retryCount < 5) {
        const delay = Math.min(2000 * Math.pow(2, retryCount), 10000);
        console.log(`🔄 Auto-retry in ${delay}ms (tentativo ${retryCount + 1}/5)`);
        setTimeout(() => {
          startChatWithExpert();
        }, delay);
      } else {
        toast.error('Errore persistente nella connessione. Ricarica la pagina.');
      }
    }
  }, [userId, loadMessages, retryCount]);

  // Invio messaggi semplificato
  const handleSendMessage = useCallback(async (messageText: string) => {
    if (!currentConversationId || !userId || !messageText.trim() || isSending) {
      return;
    }

    try {
      setIsSending(true);
      console.log('📤 Invio messaggio:', { conversationId: currentConversationId, messageText });
      
      const success = await MessageService.sendMessage(
        currentConversationId,
        userId,
        messageText.trim()
      );
      
      if (success) {
        console.log('✅ Messaggio inviato con successo');
        // Ricarica messaggi
        setTimeout(() => {
          loadMessages(currentConversationId);
        }, 500);
      } else {
        throw new Error('Errore invio messaggio');
      }
      
    } catch (error: any) {
      console.error('❌ Errore invio messaggio:', error);
      toast.error('Errore nell\'invio del messaggio');
    } finally {
      setIsSending(false);
    }
  }, [currentConversationId, userId, loadMessages, isSending]);

  // Reset completo
  const resetChat = useCallback(() => {
    console.log('🔄 Reset completo della chat');
    setMessages([]);
    setCurrentConversationId(null);
    setActiveChat(null);
    setIsConnected(false);
    setInitializationError(null);
    setIsSending(false);
    setRetryCount(0);
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
