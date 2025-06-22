
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

  // Simplified message loading
  const loadMessages = useCallback(async (conversationId: string) => {
    if (!conversationId) return;
    
    try {
      console.log('📚 Caricamento messaggi per conversazione:', conversationId);
      const messagesData = await MessageService.loadMessages(conversationId);
      console.log('✅ Messaggi caricati:', messagesData?.length || 0);
      setMessages(messagesData || []);
    } catch (error) {
      console.error('❌ Errore caricamento messaggi:', error);
      // Non mostrare toast per evitare spam
    }
  }, []);

  // Simplified real-time subscription
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

  // Simplified chat initialization
  const startChatWithExpert = useCallback(async () => {
    if (!userId) {
      const error = 'Utente non autenticato';
      setInitializationError(error);
      toast.error(error);
      return;
    }

    if (activeChat && currentConversationId) {
      console.log('✅ Chat già attiva:', currentConversationId);
      return;
    }

    try {
      console.log('🚀 Avvio chat con esperto per utente:', userId);
      setInitializationError(null);
      setActiveChat('expert');
      
      const conversation = await ConversationService.findOrCreateConversation(userId);
      
      if (conversation) {
        console.log('✅ Conversazione pronta:', conversation.id);
        setCurrentConversationId(conversation.id);
        await loadMessages(conversation.id);
        toast.success('Chat avviata con successo!');
      } else {
        throw new Error('Impossibile creare o trovare la conversazione');
      }
    } catch (error: any) {
      console.error('❌ Errore avvio chat:', error);
      const errorMessage = error.message || 'Errore nell\'avvio della chat';
      setInitializationError(errorMessage);
      toast.error(errorMessage);
      setActiveChat(null);
      setCurrentConversationId(null);
    }
  }, [userId, loadMessages, activeChat, currentConversationId]);

  // Simplified message sending
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
        // Ricarica messaggi dopo breve delay
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

  // Reset function for troubleshooting
  const resetChat = useCallback(() => {
    console.log('🔄 Reset completo della chat');
    setMessages([]);
    setCurrentConversationId(null);
    setActiveChat(null);
    setIsConnected(false);
    setInitializationError(null);
    setIsSending(false);
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
    resetChat
  };
};
