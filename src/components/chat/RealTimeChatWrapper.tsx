
import React, { useEffect, useState } from 'react';
import { useRealtimeChat } from '@/hooks/useRealtimeChat';
import { DatabaseMessage, DatabaseConversation } from '@/services/chat/types';
import { processMessages, clearMessageCache } from '@/services/chat/messageUtils';
import { Message } from '@/components/chat/types';
import { supabase } from '@/integrations/supabase/client';

interface RealTimeChatWrapperProps {
  conversationId: string;
  userId: string;
  children: (props: {
    messages: Message[];
    isConnected: boolean;
    sendMessage: (recipientId: string, text: string, imageUrl?: string) => Promise<any>;
    refreshMessages: () => void;
  }) => React.ReactNode;
}

export const RealTimeChatWrapper: React.FC<RealTimeChatWrapperProps> = ({
  conversationId,
  userId,
  children
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversation, setConversation] = useState<DatabaseConversation | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const handleNewMessage = (newMessage: DatabaseMessage) => {
    console.log('📨 Nuovo messaggio ricevuto via realtime:', newMessage);
    
    // Aggiorna i messaggi utilizzando la nuova funzione di processing
    setMessages(prev => {
      const allMessages = [...prev.map(msg => ({
        id: msg.id,
        sender_id: msg.sender === 'expert' ? '07c7fe19-33c3-4782-b9a0-4e87c8aa7044' : userId,
        content: msg.text,
        text: msg.text,
        sent_at: new Date().toISOString(),
        image_url: msg.image_url,
        products: msg.products
      } as DatabaseMessage)), newMessage];
      
      return processMessages(allMessages);
    });
  };

  const handleConversationUpdate = (updatedConversation: DatabaseConversation) => {
    console.log('💬 Conversazione aggiornata:', updatedConversation);
    setConversation(updatedConversation);
  };

  const { isConnected, sendMessage } = useRealtimeChat({
    conversationId,
    userId,
    onNewMessage: handleNewMessage,
    onConversationUpdate: handleConversationUpdate
  });

  // Load initial conversation data using direct API call
  const refreshMessages = async () => {
    try {
      console.log('🔄 Loading conversation and messages for:', conversationId);
      setLastRefresh(new Date());
      
      // Load conversation details
      const { data: conversationData, error: conversationError } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .single();

      if (conversationError) {
        console.error('❌ Error loading conversation:', conversationError);
        return;
      }

      console.log('✅ Conversazione caricata:', conversationData);
      setConversation(conversationData);

      // Load messages with proper ordering
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('sent_at', { ascending: true });

      if (messagesError) {
        console.error('❌ Error loading messages:', messagesError);
        return;
      }

      console.log('📬 Messaggi raw dal database (ordinati per data):', messagesData?.length || 0);

      // Usa la nuova funzione per processare i messaggi
      const uiMessages = messagesData ? processMessages(messagesData) : [];
      
      console.log('📩 Messaggi processati per UI:', uiMessages.length);
      setMessages(uiMessages);
      
      console.log('✅ Loaded conversation and messages successfully');
    } catch (error) {
      console.error('❌ Error in refreshMessages:', error);
    }
  };

  // Enhanced sendMessage wrapper that calls refreshMessages after sending
  const enhancedSendMessage = async (recipientId: string, text: string, imageUrl?: string) => {
    try {
      console.log('📤 Invio messaggio:', { recipientId, text, imageUrl });
      
      const result = await sendMessage(recipientId, text, imageUrl);
      console.log('✅ Messaggio inviato, risultato:', result);
      
      // Clear cache e refresh messaggi dopo invio
      clearMessageCache(conversationId);
      
      // Refresh messages dopo un breve delay per permettere al database di essere aggiornato
      setTimeout(async () => {
        console.log('🔄 Aggiornamento messaggi dopo invio...');
        await refreshMessages();
      }, 500);
      
      return result;
    } catch (error) {
      console.error('❌ Errore nell\'invio del messaggio:', error);
      throw error;
    }
  };

  // Load messages on mount and when conversation changes
  useEffect(() => {
    if (conversationId) {
      console.log('🚀 Inizializzazione chat per conversazione:', conversationId);
      refreshMessages();
    }
  }, [conversationId]);

  // Listen for cache clear events
  useEffect(() => {
    const handleCacheClear = (event: CustomEvent) => {
      if (event.detail?.conversationId === conversationId) {
        console.log('🧹 Ricevuto evento clear cache, refreshing...');
        refreshMessages();
      }
    };

    window.addEventListener('clearMessageCache', handleCacheClear as EventListener);
    
    return () => {
      window.removeEventListener('clearMessageCache', handleCacheClear as EventListener);
    };
  }, [conversationId]);

  // Debug log per stato corrente
  useEffect(() => {
    console.log('📊 Stato corrente chat:', {
      conversationId,
      userId,
      isConnected,
      messagesCount: messages.length,
      lastRefresh: lastRefresh.toISOString(),
      messages: messages.map(m => ({ id: m.id, text: m.text.substring(0, 50), time: m.time }))
    });
  }, [conversationId, userId, isConnected, messages, lastRefresh]);

  return (
    <>
      {children({
        messages,
        isConnected,
        sendMessage: enhancedSendMessage,
        refreshMessages
      })}
    </>
  );
};
