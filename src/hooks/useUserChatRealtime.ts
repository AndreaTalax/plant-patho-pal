
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
  const [isInitializing, setIsInitializing] = useState(false);
  
  const { user } = useAuth();

  // Inizializzazione chat con fallback robusto
  const startChatWithExpert = useCallback(async () => {
    if (isInitializing) {
      console.log('🔄 useUserChatRealtime: Inizializzazione già in corso');
      return;
    }

    try {
      setIsInitializing(true);
      setInitializationError(null);
      console.log('🚀 useUserChatRealtime: Avvio chat con esperto per:', userId);

      // Trova o crea conversazione usando il servizio diretto
      const conversation = await ConversationService.findOrCreateConversation(userId);
      
      if (!conversation) {
        throw new Error('Impossibile creare o trovare la conversazione');
      }

      setActiveChat(conversation);
      setCurrentConversationId(conversation.id);

      // Carica messaggi esistenti con fallback
      try {
        const existingMessages = await MessageService.loadMessages(conversation.id);
        setMessages(existingMessages || []);
        console.log('✅ useUserChatRealtime: Messaggi caricati:', existingMessages?.length || 0);
      } catch (messageError) {
        console.warn('⚠️ useUserChatRealtime: Impossibile caricare messaggi esistenti:', messageError);
        setMessages([]); // Fallback a lista vuota
      }

      // Configura sottoscrizione real-time con fallback
      try {
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
              console.log('📨 useUserChatRealtime: Nuovo messaggio ricevuto:', payload.new);
              const newMessage = payload.new as DatabaseMessage;
              
              setMessages(prev => {
                // Evita duplicati
                const exists = prev.some(msg => msg.id === newMessage.id);
                if (exists) {
                  console.log('⚠️ useUserChatRealtime: Messaggio già esistente, ignorato');
                  return prev;
                }
                return [...prev, newMessage];
              });
            }
          )
          .subscribe((status) => {
            console.log('🔗 useUserChatRealtime: Stato sottoscrizione:', status);
            setIsConnected(status === 'SUBSCRIBED');
          });

        // Cleanup function
        return () => {
          try {
            channel.unsubscribe();
          } catch (error) {
            console.warn('⚠️ useUserChatRealtime: Errore durante cleanup sottoscrizione:', error);
          }
        };
      } catch (realtimeError) {
        console.warn('⚠️ useUserChatRealtime: Errore configurazione real-time:', realtimeError);
        setIsConnected(false); // Funziona comunque senza real-time
      }

      console.log('✅ useUserChatRealtime: Inizializzazione completata con successo');

    } catch (error) {
      console.error('❌ useUserChatRealtime: Errore inizializzazione:', error);
      setInitializationError(error instanceof Error ? error.message : 'Errore sconosciuto');
    } finally {
      setIsInitializing(false);
    }
  }, [userId, isInitializing]);

  // Gestore invio messaggi con fallback
  const handleSendMessage = useCallback(async (
    text: string, 
    imageUrl?: string
  ) => {
    if (!activeChat || !currentConversationId || isSending) {
      console.log('⚠️ useUserChatRealtime: Condizioni invio non soddisfatte');
      return;
    }

    if (!text?.trim() && !imageUrl) {
      toast.error('Il messaggio non può essere vuoto');
      return;
    }

    setIsSending(true);
    
    try {
      console.log('📤 useUserChatRealtime: Invio messaggio:', { text: text?.slice(0, 50), hasImage: !!imageUrl });

      const success = await MessageService.sendMessage(
        currentConversationId,
        userId,
        text || '📸 Immagine allegata',
        imageUrl
      );

      if (!success) {
        throw new Error('Invio fallito');
      }

      console.log('✅ useUserChatRealtime: Messaggio inviato con successo');
      
      // Ricarica messaggi dopo l'invio (fallback se real-time non funziona)
      setTimeout(async () => {
        try {
          const refreshedMessages = await MessageService.loadMessages(currentConversationId);
          setMessages(refreshedMessages || []);
        } catch (error) {
          console.warn('⚠️ useUserChatRealtime: Impossibile ricaricare messaggi:', error);
        }
      }, 1000);
      
    } catch (error) {
      console.error('❌ useUserChatRealtime: Errore invio messaggio:', error);
      toast.error('Errore nell\'invio del messaggio');
    } finally {
      setIsSending(false);
    }
  }, [activeChat, currentConversationId, userId, isSending]);

  // Reset stato chat
  const resetChat = useCallback(() => {
    console.log('🔄 useUserChatRealtime: Reset stato chat');
    setActiveChat(null);
    setMessages([]);
    setCurrentConversationId(null);
    setIsConnected(false);
    setInitializationError(null);
    setIsInitializing(false);
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
    resetChat,
    isInitializing
  };
};
