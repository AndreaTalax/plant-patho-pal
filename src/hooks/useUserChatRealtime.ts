
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

  // Caricamento messaggi ottimizzato con migliore gestione errori
  const loadMessages = useCallback(async (conversationId: string) => {
    if (!conversationId) return;
    
    try {
      console.log('📚 Caricamento messaggi per conversazione:', conversationId);
      
      const { data: messagesData, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('sent_at', { ascending: true });

      if (error) {
        console.error('❌ Errore caricamento messaggi:', error);
        toast.error('Errore nel caricamento dei messaggi');
        return;
      }

      console.log('✅ Messaggi caricati:', messagesData?.length || 0);
      setMessages(messagesData || []);
      
    } catch (error) {
      console.error('❌ Errore caricamento messaggi:', error);
      toast.error('Errore nel caricamento dei messaggi');
    }
  }, []);

  // Setup real-time subscription con gestione errori migliorata
  useEffect(() => {
    if (!currentConversationId || !userId) return;

    console.log('🔄 Setup subscription real-time per:', currentConversationId);
    
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
            
            // Toast solo per messaggi dall'esperto
            if (newMessage.sender_id !== userId) {
              toast.success('Nuovo messaggio ricevuto!', {
                description: newMessage.content?.slice(0, 50) + (newMessage.content && newMessage.content.length > 50 ? '...' : ''),
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
        
        if (status === 'CHANNEL_ERROR') {
          console.error('❌ Errore connessione real-time');
          toast.error('Errore di connessione real-time');
        }
      });

    return () => {
      console.log('🔌 Pulizia subscription');
      supabase.removeChannel(channel);
      setIsConnected(false);
    };
  }, [currentConversationId, userId]);

  const startChatWithExpert = useCallback(async () => {
    if (!userId) {
      toast.error('Utente non autenticato');
      return;
    }

    try {
      console.log('🚀 Avvio chat veloce con esperto per utente:', userId);
      setActiveChat('expert');
      
      // Trova o crea conversazione con migliore gestione errori
      let conversation;
      try {
        conversation = await ConversationService.findOrCreateConversation(userId);
      } catch (error) {
        console.error('❌ Errore nel servizio conversazione:', error);
        toast.error('Errore nella creazione della conversazione');
        setActiveChat(null);
        return;
      }
      
      if (conversation) {
        console.log('✅ Conversazione pronta:', conversation.id);
        setCurrentConversationId(conversation.id);
        
        // Carica messaggi
        await loadMessages(conversation.id);
        
        toast.success('Chat avviata!', {
          description: 'Connessione con Marco Nigro stabilita',
          duration: 2000,
        });
      } else {
        console.error('❌ Errore creazione/ricerca conversazione');
        toast.error('Errore nell\'avvio della chat');
        setActiveChat(null);
      }
    } catch (error) {
      console.error('❌ Errore avvio chat:', error);
      toast.error('Errore nell\'avvio della chat');
      setActiveChat(null);
    }
  }, [userId, loadMessages]);

  const handleSendMessage = useCallback(async (messageText: string) => {
    if (!currentConversationId || !userId || !messageText.trim()) {
      console.error('❌ Impossibile inviare messaggio: dati mancanti');
      return;
    }

    try {
      setIsSending(true);
      console.log('📤 Invio messaggio:', { conversationId: currentConversationId, userId, messageText });
      
      const success = await MessageService.sendMessage(
        currentConversationId,
        userId,
        messageText.trim()
      );
      
      if (success) {
        console.log('✅ Messaggio inviato con successo');
        // Ricarica i messaggi dopo un breve delay
        setTimeout(() => {
          loadMessages(currentConversationId);
        }, 500);
      } else {
        throw new Error('Errore invio messaggio');
      }
      
    } catch (error) {
      console.error('❌ Errore invio messaggio:', error);
      toast.error('Errore nell\'invio del messaggio');
    } finally {
      setIsSending(false);
    }
  }, [currentConversationId, userId, loadMessages]);

  // Pulizia al cambio utente
  useEffect(() => {
    return () => {
      setMessages([]);
      setCurrentConversationId(null);
      setActiveChat(null);
      setIsConnected(false);
    };
  }, [userId]);

  return {
    activeChat,
    setActiveChat,
    messages,
    isSending,
    isConnected,
    handleSendMessage,
    startChatWithExpert,
    currentConversationId
  };
};
