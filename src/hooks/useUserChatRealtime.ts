
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { DatabaseMessage } from '@/services/chat/types';
import { MARCO_NIGRO_ID } from '@/components/phytopathologist';

export const useUserChatRealtime = (userId: string) => {
  const [activeChat, setActiveChat] = useState<any>(null);
  const [messages, setMessages] = useState<DatabaseMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [initializationError, setInitializationError] = useState<string | null>(null);
  
  const { user } = useAuth();

  // Send notification to expert via edge function
  const sendExpertNotification = useCallback(async (
    conversationId: string,
    senderId: string,
    recipientId: string,
    messageText: string,
    imageUrl?: string
  ) => {
    try {
      console.log('📧 Sending expert notification...', {
        conversationId,
        senderId,
        recipientId,
        messageText: messageText.slice(0, 50) + '...',
        hasImage: !!imageUrl
      });

      const { data, error } = await supabase.functions.invoke('send-specialist-notification', {
        body: {
          conversation_id: conversationId,
          sender_id: senderId,
          recipient_id: recipientId,
          message_text: messageText,
          expert_email: 'agrotecnicomarconigro@gmail.com',
          image_url: imageUrl,
          user_details: {
            firstName: user?.user_metadata?.first_name || 'Utente',
            lastName: user?.user_metadata?.last_name || '',
            email: user?.email || ''
          }
        }
      });

      if (error) {
        console.error('❌ Error sending expert notification:', error);
      } else {
        console.log('✅ Expert notification sent successfully:', data);
      }
    } catch (error) {
      console.error('❌ Failed to send expert notification:', error);
    }
  }, [user]);

  // Start or get existing chat with expert
  const startChatWithExpert = useCallback(async () => {
    try {
      setInitializationError(null);
      console.log('🚀 Starting chat with expert for user:', userId);

      // Check if conversation already exists
      const { data: existingConversations, error: fetchError } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', userId)
        .eq('expert_id', MARCO_NIGRO_ID)
        .order('created_at', { ascending: false })
        .limit(1);

      if (fetchError) {
        console.error('❌ Error fetching conversations:', fetchError);
        setInitializationError('Errore nel recupero delle conversazioni');
        return;
      }

      let conversation;
      if (existingConversations && existingConversations.length > 0) {
        conversation = existingConversations[0];
        console.log('💬 Using existing conversation:', conversation.id);
      } else {
        console.log('🆕 Creating new conversation');
        const { data: newConversation, error: createError } = await supabase
          .from('conversations')
          .insert({
            user_id: userId,
            expert_id: MARCO_NIGRO_ID,
            status: 'active',
            title: 'Consulenza Esperto'
          })
          .select()
          .single();

        if (createError) {
          console.error('❌ Error creating conversation:', createError);
          setInitializationError('Errore nella creazione della conversazione');
          return;
        }

        conversation = newConversation;
      }

      setActiveChat(conversation);
      setCurrentConversationId(conversation.id);
      setIsConnected(true);

      // Load existing messages
      const { data: existingMessages } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversation.id)
        .order('sent_at', { ascending: true });

      if (existingMessages) {
        setMessages(existingMessages);
      }

      // Set up real-time subscription
      const channel = supabase
        .channel(`conversation_${conversation.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=eq.${conversation.id}`
          },
          (payload) => {
            console.log('📨 New message received:', payload.new);
            setMessages(prev => [...prev, payload.new as DatabaseMessage]);
          }
        )
        .subscribe();

      return () => {
        channel.unsubscribe();
      };

    } catch (error) {
      console.error('❌ Error in startChatWithExpert:', error);
      setInitializationError('Errore nell\'inizializzazione della chat');
    }
  }, [userId]);

  // Send message handler
  const handleSendMessage = useCallback(async (
    text: string, 
    imageUrl?: string
  ) => {
    if (!activeChat || !currentConversationId || isSending) return;

    setIsSending(true);
    
    try {
      console.log('📤 Sending message:', { text: text.slice(0, 50) + '...', hasImage: !!imageUrl });

      const messageData = {
        conversation_id: currentConversationId,
        sender_id: userId,
        recipient_id: MARCO_NIGRO_ID,
        content: text,
        text: text, // Also populate text field for consistency
        image_url: imageUrl || null,
        metadata: {
          type: imageUrl ? 'image_with_text' : 'text',
          timestamp: new Date().toISOString()
        }
      };

      const { error: messageError } = await supabase
        .from('messages')
        .insert(messageData);

      if (messageError) {
        console.error('❌ Error sending message:', messageError);
        toast.error('Errore nell\'invio del messaggio');
        return;
      }

      // Send notification to expert
      await sendExpertNotification(
        currentConversationId,
        userId,
        MARCO_NIGRO_ID,
        text,
        imageUrl
      );

      console.log('✅ Message sent successfully');
      
    } catch (error) {
      console.error('❌ Error in handleSendMessage:', error);
      toast.error('Errore nell\'invio del messaggio');
    } finally {
      setIsSending(false);
    }
  }, [activeChat, currentConversationId, userId, isSending, sendExpertNotification]);

  // Reset chat state
  const resetChat = useCallback(() => {
    setActiveChat(null);
    setMessages([]);
    setCurrentConversationId(null);
    setIsConnected(false);
    setInitializationError(null);
  }, []);

  return {
    activeChat,
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
