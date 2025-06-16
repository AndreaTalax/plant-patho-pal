
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
    const uiMessage = convertToUIMessage(newMessage);
    setMessages(prev => {
      // Avoid duplicates
      const exists = prev.some(msg => msg.id === uiMessage.id);
      if (exists) return prev;
      return [...prev, uiMessage];
    });
  };

  const handleConversationUpdate = (updatedConversation: DatabaseConversation) => {
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

      const uiMessages = messagesData.map((msg: DatabaseMessage) => 
        convertToUIMessage(msg)
      );
      setMessages(uiMessages);
      
      console.log('✅ Loaded conversation and messages successfully');
    } catch (error) {
      console.error('❌ Error in refreshMessages:', error);
    }
  };

  useEffect(() => {
    if (conversationId) {
      refreshMessages();
    }
  }, [conversationId]);

  return (
    <>
      {children({
        messages,
        isConnected,
        sendMessage,
        refreshMessages
      })}
    </>
  );
};
