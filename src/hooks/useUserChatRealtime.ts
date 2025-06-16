
import { useState, useCallback, useEffect } from 'react';
import { ConversationService } from '@/services/chat/conversationService';
import { MessageService } from '@/services/chat/messageService';
import { useRealtimeChat } from './useRealtimeChat';
import { MARCO_NIGRO_ID } from '@/components/phytopathologist';
import { DatabaseMessage } from '@/services/chat/types';
import { toast } from 'sonner';

export const useUserChatRealtime = (userId: string) => {
  const [activeChat, setActiveChat] = useState<'expert' | null>(null);
  const [messages, setMessages] = useState<DatabaseMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);

  // Setup real-time chat
  const { isConnected, sendMessage } = useRealtimeChat({
    conversationId: currentConversationId || undefined,
    userId,
    onNewMessage: (message) => {
      console.log('📨 New message received:', message);
      setMessages(prev => {
        const exists = prev.some(msg => msg.id === message.id);
        if (exists) return prev;
        return [...prev, message].sort((a, b) => 
          new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime()
        );
      });
    }
  });

  // Load messages when conversation changes
  const loadMessages = useCallback(async (conversationId: string) => {
    if (!conversationId) return;
    
    try {
      console.log('📚 Loading messages for conversation:', conversationId);
      
      const response = await fetch('/api/get-conversation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await import('@/integrations/supabase/client')).supabase.auth.getSession().then(s => s.data.session?.access_token)}`
        },
        body: JSON.stringify({ conversationId })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.messages) {
          console.log('✅ Messages loaded:', data.messages.length);
          setMessages(data.messages);
        }
      } else {
        console.error('❌ Failed to load messages:', response.statusText);
      }
    } catch (error) {
      console.error('❌ Error loading messages:', error);
    }
  }, []);

  const startChatWithExpert = useCallback(async () => {
    if (!userId) {
      toast.error('Utente non autenticato');
      return;
    }

    try {
      console.log('🚀 Starting chat with expert for user:', userId);
      setActiveChat('expert');
      
      // Find or create conversation
      const conversation = await ConversationService.findOrCreateConversation(userId);
      
      if (conversation) {
        console.log('✅ Conversation ready:', conversation.id);
        setCurrentConversationId(conversation.id);
        await loadMessages(conversation.id);
        toast.success('Chat avviata con successo!');
      } else {
        console.error('❌ Failed to create/find conversation');
        toast.error('Errore nell\'avvio della chat');
        setActiveChat(null);
      }
    } catch (error) {
      console.error('❌ Error starting chat:', error);
      toast.error('Errore nell\'avvio della chat');
      setActiveChat(null);
    }
  }, [userId, loadMessages]);

  const handleSendMessage = useCallback(async (messageText: string) => {
    if (!currentConversationId || !userId || !messageText.trim()) {
      console.error('❌ Cannot send message: missing data');
      return;
    }

    try {
      setIsSending(true);
      console.log('📤 Sending message:', { conversationId: currentConversationId, userId, messageText });
      
      await sendMessage(MARCO_NIGRO_ID, messageText.trim());
      console.log('✅ Message sent successfully');
      
    } catch (error) {
      console.error('❌ Error sending message:', error);
      toast.error('Errore nell\'invio del messaggio');
    } finally {
      setIsSending(false);
    }
  }, [currentConversationId, userId, sendMessage]);

  // Clean up when component unmounts or user changes
  useEffect(() => {
    return () => {
      setMessages([]);
      setCurrentConversationId(null);
      setActiveChat(null);
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
