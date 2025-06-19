
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

  // Simplified message loading
  const loadMessages = useCallback(async (conversationId: string) => {
    if (!conversationId) return;
    
    try {
      console.log('📚 Loading messages for conversation:', conversationId);
      
      const { data: messagesData, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('sent_at', { ascending: true });

      if (error) {
        console.error('❌ Error loading messages:', error);
        return;
      }

      console.log('✅ Messages loaded:', messagesData?.length || 0);
      setMessages(messagesData || []);
      
    } catch (error) {
      console.error('❌ Error loading messages:', error);
    }
  }, []);

  // Setup real-time subscription - simplified version
  useEffect(() => {
    if (!currentConversationId || !userId) return;

    console.log('🔄 Setting up real-time subscription for:', currentConversationId);
    
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
            console.log('📨 New message received:', payload.new);
            const newMessage = payload.new as DatabaseMessage;
            
            setMessages(prev => {
              const exists = prev.some(msg => msg.id === newMessage.id);
              if (exists) return prev;
              return [...prev, newMessage].sort((a, b) => 
                new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime()
              );
            });
            
            // Show toast for messages from expert
            if (newMessage.sender_id !== userId) {
              toast.success('Nuovo messaggio ricevuto!', {
                description: newMessage.content?.slice(0, 50) + (newMessage.content && newMessage.content.length > 50 ? '...' : ''),
                duration: 4000,
              });
            }
          } catch (error) {
            console.error('❌ Error handling new message:', error);
          }
        }
      )
      .subscribe((status) => {
        console.log('🔗 Subscription status:', status);
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      console.log('🔌 Cleaning up subscription');
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
      
      // Use MessageService to send the message
      const success = await MessageService.sendMessage(
        currentConversationId,
        userId,
        messageText.trim()
      );
      
      if (success) {
        console.log('✅ Message sent successfully');
      } else {
        throw new Error('Failed to send message');
      }
      
    } catch (error) {
      console.error('❌ Error sending message:', error);
      toast.error('Errore nell\'invio del messaggio');
    } finally {
      setIsSending(false);
    }
  }, [currentConversationId, userId]);

  // Clean up when component unmounts or user changes
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
