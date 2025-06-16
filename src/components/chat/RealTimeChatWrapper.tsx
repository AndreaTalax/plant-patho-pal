
import React, { useEffect, useState } from 'react';
import { useRealtimeChat } from '@/hooks/useRealtimeChat';
import { DatabaseMessage, DatabaseConversation } from '@/services/chat/types';
import { convertToUIMessage } from '@/services/chat/messageUtils';
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

  const handleNewMessage = (newMessage: DatabaseMessage) => {
    console.log('📨 Nuovo messaggio ricevuto via realtime:', newMessage);
    const uiMessage = convertToUIMessage(newMessage);
    console.log('🔄 Messaggio convertito per UI:', uiMessage);
    
    setMessages(prev => {
      // Avoid duplicates
      const exists = prev.some(msg => msg.id === uiMessage.id);
      if (exists) {
        console.log('⚠️ Messaggio già esistente, skip:', uiMessage.id);
        return prev;
      }
      
      const newMessages = [...prev, uiMessage];
      console.log('✅ Messaggi aggiornati:', newMessages);
      return newMessages;
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

      // Load messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('sent_at', { ascending: true });

      if (messagesError) {
        console.error('❌ Error loading messages:', messagesError);
        return;
      }

      console.log('📬 Messaggi raw dal database:', messagesData);

      const uiMessages = messagesData.map((msg: DatabaseMessage) => {
        const converted = convertToUIMessage(msg);
        console.log('🔄 Messaggio convertito:', { original: msg, converted });
        return converted;
      });
      
      console.log('📩 Messaggi ricevuti (UI format):', uiMessages);
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
      
      // Refresh messages immediately after sending
      console.log('🔄 Aggiornamento messaggi dopo invio...');
      await refreshMessages();
      
      return result;
    } catch (error) {
      console.error('❌ Errore nell\'invio del messaggio:', error);
      throw error;
    }
  };

  useEffect(() => {
    if (conversationId) {
      console.log('🚀 Inizializzazione chat per conversazione:', conversationId);
      refreshMessages();
    }
  }, [conversationId]);

  // Debug log per stato corrente
  useEffect(() => {
    console.log('📊 Stato corrente chat:', {
      conversationId,
      userId,
      isConnected,
      messagesCount: messages.length,
      messages: messages
    });
  }, [conversationId, userId, isConnected, messages]);

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
