import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { DatabaseMessage } from '@/services/chat/types';
import { MARCO_NIGRO_ID } from '@/components/phytopathologist';
import { ConversationService } from '@/services/chat/conversationService';
import { MessageService } from '@/services/chat/messageService';

// Hook aggiornato per chat realtime
export const useUserChatRealtime = (userId: string) => {
  const [activeChat, setActiveChat] = useState<any>(null);
  const [messages, setMessages] = useState<DatabaseMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [initializationError, setInitializationError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);

  const { user } = useAuth();

  // Avvia chat con l’esperto
  const startChatWithExpert = useCallback(async () => {
    if (isInitializing) return;

    try {
      setIsInitializing(true);
      setInitializationError(null);

      if (!userId || !MARCO_NIGRO_ID) throw new Error('ID utente o esperto mancanti');

      // Trova o crea conversazione
      const conversation = await ConversationService.findOrCreateConversation(userId);
      if (!conversation) throw new Error('Impossibile creare o trovare la conversazione');

      setActiveChat(conversation);
      setCurrentConversationId(conversation.id);

      // Carica messaggi iniziali
      const existingMessages = await MessageService.loadMessages(conversation.id);
      setMessages(existingMessages || []);

      // Configura sottoscrizione realtime
      const channelName = `conversation_${conversation.id}`;
      const channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=eq.${conversation.id}`
          },
          (payload) => {
            const newMessage = payload.new as DatabaseMessage;
            setMessages(prev => {
              if (prev.some(msg => msg.id === newMessage.id)) return prev;
              return [...prev, newMessage];
            });
          }
        )
        .subscribe(status => {
          setIsConnected(status === 'SUBSCRIBED');
        });

      // Cleanup
      return () => supabase.removeChannel(channel);

    } catch (error: any) {
      console.error('Errore inizializzazione chat:', error);
      setInitializationError(error?.message || 'Errore sconosciuto');
    } finally {
      setIsInitializing(false);
    }
  }, [userId, isInitializing]);

  // Invia messaggio
  const handleSendMessage = useCallback(async (text: string, imageUrl?: string) => {
    if (!activeChat || !currentConversationId || isSending) return;
    if (!text?.trim() && !imageUrl) {
      toast.error('Il messaggio non può essere vuoto');
      return;
    }

    setIsSending(true);
    try {
      await MessageService.sendMessage(
        currentConversationId,
        userId,
        text || '📸 Immagine allegata',
        imageUrl
      );

      // Fallback: ricarica messaggi dopo invio
      const refreshedMessages = await MessageService.loadMessages(currentConversationId);
      setMessages(refreshedMessages || []);
    } catch (error) {
      console.error('Errore invio messaggio:', error);
      toast.error('Errore nell\'invio del messaggio');
    } finally {
      setIsSending(false);
    }
  }, [activeChat, currentConversationId, userId, isSending]);

  // Reset chat
  const resetChat = useCallback(() => {
    setActiveChat(null);
    setMessages([]);
    setCurrentConversationId(null);
    setIsConnected(false);
    setInitializationError(null);
    setIsInitializing(false);
  }, []);

  // Debug: log ogni cambiamento dei messaggi
  useEffect(() => {
    console.log('💬 Messages updated:', messages.map(m => m.text || m.content));
  }, [messages]);

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
