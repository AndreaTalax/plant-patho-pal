
import { useState, useEffect } from 'react';
import { useRealtimeChat } from '@/hooks/useRealtimeChat';
import { ConversationService } from '@/services/chat/conversationService';
import { MARCO_NIGRO_ID } from '@/components/phytopathologist';
import { Message } from '@/components/chat/types';
import { DatabaseMessage } from '@/services/chat/types';
import { convertToUIMessage } from '@/services/chat/messageUtils';

export const useUserChatRealtime = (userId: string) => {
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSending, setIsSending] = useState(false);

  const handleNewMessage = (newMessage: DatabaseMessage) => {
    const uiMessage = convertToUIMessage(newMessage);
    setMessages(prev => {
      const exists = prev.some(msg => msg.id === uiMessage.id);
      if (exists) return prev;
      return [...prev, uiMessage];
    });
  };

  const { isConnected, sendMessage, getConversation } = useRealtimeChat({
    conversationId: conversationId || undefined,
    userId,
    onNewMessage: handleNewMessage
  });

  // Create or find conversation with expert
  const startChatWithExpert = async () => {
    try {
      const conversation = await ConversationService.findOrCreateConversation(userId);
      if (conversation) {
        setConversationId(conversation.id);
        setActiveChat('expert');
        
        // Load initial messages
        const result = await getConversation(conversation.id);
        const uiMessages = result.messages.map((msg: DatabaseMessage) => 
          convertToUIMessage(msg)
        );
        setMessages(uiMessages);
      }
    } catch (error) {
      console.error('Error starting chat:', error);
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!conversationId || isSending) return;

    try {
      setIsSending(true);
      await sendMessage(MARCO_NIGRO_ID, text);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  return {
    activeChat,
    setActiveChat,
    messages,
    isSending,
    isConnected,
    handleSendMessage,
    startChatWithExpert
  };
};
