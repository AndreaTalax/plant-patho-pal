
import React, { useEffect, useState } from 'react';
import { useRealtimeChat } from '@/hooks/useRealtimeChat';
import { DatabaseMessage, DatabaseConversation } from '@/services/chat/types';
import { convertToUIMessage } from '@/services/chat/messageUtils';
import { Message } from '@/components/chat/types';

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

  const { isConnected, sendMessage, getConversation } = useRealtimeChat({
    conversationId,
    userId,
    onNewMessage: handleNewMessage,
    onConversationUpdate: handleConversationUpdate
  });

  // Load initial conversation data
  const refreshMessages = async () => {
    try {
      const result = await getConversation(conversationId);
      setConversation(result.conversation);
      
      const uiMessages = result.messages.map((msg: DatabaseMessage) => 
        convertToUIMessage(msg)
      );
      setMessages(uiMessages);
    } catch (error) {
      console.error('Error loading conversation:', error);
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
