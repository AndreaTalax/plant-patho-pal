
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Message, Conversation, DatabaseMessage, DatabaseConversation } from '../types';
import { convertToUIMessage } from '../utils/messageConverter';
import { ChatMessageService } from '../services/messageService';
import { ChatConversationService } from '../services/conversationService';
import { MARCO_NIGRO_ID } from '@/components/phytopathologist';
import { toast } from 'sonner';

export const useExpertConversation = (userId: string) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [realtimeChannel, setRealtimeChannel] = useState<any>(null);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
    setupRealtimeSubscription();

    return () => {
      if (realtimeChannel) {
        realtimeChannel.unsubscribe();
        supabase.removeChannel(realtimeChannel);
      }
    };
  }, []);

  const setupRealtimeSubscription = () => {
    console.log('🔄 Setting up expert realtime subscription');
    
    const channel = supabase
      .channel(`expert-messages-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `or(sender_id.eq.${userId},recipient_id.eq.${userId})`
        },
        (payload) => {
          console.log('📨 Expert received new message:', payload.new);
          const newMessage = payload.new as DatabaseMessage;
          
          // Update the conversation with the new message
          setConversations(prev => prev.map(conv => {
            if (conv.id === newMessage.conversation_id) {
              const uiMessage = convertToUIMessage(newMessage);
              
              // Check if message already exists to avoid duplicates
              const messageExists = conv.messages.some(msg => msg.id === uiMessage.id);
              if (messageExists) {
                console.log('⚠️ Message already exists in conversation, skipping');
                return conv;
              }
              
              console.log('✅ Adding new message to conversation:', conv.id);
              return {
                ...conv,
                messages: [...conv.messages, uiMessage],
                lastMessage: uiMessage.text,
                lastMessageTime: uiMessage.time
              };
            }
            return conv;
          }));
          
          // If this is the current conversation, update it too
          if (currentConversation && currentConversation.id === newMessage.conversation_id) {
            setCurrentConversation(prev => {
              if (!prev) return prev;
              
              const uiMessage = convertToUIMessage(newMessage);
              const messageExists = prev.messages.some(msg => msg.id === uiMessage.id);
              
              if (messageExists) {
                return prev;
              }
              
              return {
                ...prev,
                messages: [...prev.messages, uiMessage]
              };
            });
          }
          
          // Show notification for new messages from users (not own messages)
          if (newMessage.sender_id !== userId) {
            toast.info('Nuovo messaggio ricevuto', {
              description: newMessage.text?.slice(0, 50) + (newMessage.text && newMessage.text.length > 50 ? '...' : ''),
              duration: 4000
            });
          }
        }
      )
      .subscribe((status) => {
        console.log('🔗 Expert realtime subscription status:', status);
      });

    setRealtimeChannel(channel);
  };

  const loadConversations = async () => {
    try {
      console.log('📚 Loading expert conversations...');
      const conversationsData = await ChatConversationService.loadConversations(userId);
      
      const formattedConversations = await Promise.all(
        conversationsData.map(async (conv: DatabaseConversation) => {
          const messages = await ChatMessageService.loadMessages(conv.id);
          const uiMessages = messages.map(convertToUIMessage);
          
          return {
            id: conv.id,
            userId: conv.user_id,
            expertId: conv.expert_id,
            userName: conv.title || 'Utente',
            lastMessage: uiMessages[uiMessages.length - 1]?.text || '',
            lastMessageTime: uiMessages[uiMessages.length - 1]?.time || '',
            messages: uiMessages,
            blocked: conv.status === 'blocked',
            user_id: conv.user_id
          };
        })
      );
      
      console.log('✅ Loaded conversations:', formattedConversations.length);
      setConversations(formattedConversations);
    } catch (error) {
      console.error('❌ Error loading conversations:', error);
      toast.error('Errore nel caricamento delle conversazioni');
    }
  };

  const handleChatSelection = (conversationId: string) => {
    const conversation = conversations.find(c => c.id === conversationId);
    if (conversation) {
      console.log('🎯 Selected conversation:', conversationId);
      setCurrentConversation(conversation);
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!currentConversation || !text.trim()) return;
    
    setIsSending(true);
    
    try {
      console.log('📤 Expert sending message:', text);
      
      // Add temporary message to UI immediately
      const tempMessage: Message = {
        id: `temp-${Date.now()}`,
        sender: 'expert',
        text: text.trim(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      // Update current conversation with temp message
      setCurrentConversation(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          messages: [...prev.messages, tempMessage]
        };
      });
      
      // Send message to database
      await ChatMessageService.sendMessage(
        currentConversation.id,
        userId,
        currentConversation.userId,
        text.trim()
      );
      
      console.log('✅ Expert message sent successfully');
      
      // Remove temporary message - the real message will come via realtime
      setTimeout(() => {
        setCurrentConversation(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            messages: prev.messages.filter(msg => msg.id !== tempMessage.id)
          };
        });
      }, 1000);
      
    } catch (error) {
      console.error('❌ Error sending expert message:', error);
      toast.error('Errore nell\'invio del messaggio');
      
      // Remove temporary message on error
      setCurrentConversation(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          messages: prev.messages.filter(msg => msg.id !== tempMessage.id)
        };
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteConversation = async (conversationId: string) => {
    try {
      console.log('🗑️ Deleting conversation:', conversationId);
      await ChatConversationService.deleteConversation(conversationId);
      
      setConversations(prev => prev.filter(c => c.id !== conversationId));
      
      if (currentConversation?.id === conversationId) {
        setCurrentConversation(null);
      }
      
      toast.success('Conversazione eliminata');
    } catch (error) {
      console.error('❌ Error deleting conversation:', error);
      toast.error('Errore nell\'eliminazione della conversazione');
    }
  };

  const handleToggleBlockUser = async (conversationId: string) => {
    try {
      const conversation = conversations.find(c => c.id === conversationId);
      if (!conversation) return;
      
      const newStatus = conversation.blocked ? 'active' : 'blocked';
      console.log('🚫 Toggling block status for conversation:', conversationId, 'to:', newStatus);
      
      await ChatConversationService.updateConversationStatus(conversationId, newStatus);
      
      setConversations(prev => prev.map(c => 
        c.id === conversationId ? { ...c, blocked: !c.blocked } : c
      ));
      
      if (currentConversation?.id === conversationId) {
        setCurrentConversation(prev => prev ? { ...prev, blocked: !prev.blocked } : prev);
      }
      
      toast.success(newStatus === 'blocked' ? 'Utente bloccato' : 'Utente sbloccato');
    } catch (error) {
      console.error('❌ Error toggling block status:', error);
      toast.error('Errore nell\'aggiornamento dello stato');
    }
  };

  const handleSendProductRecommendations = async (products: any[]) => {
    if (!currentConversation) return;
    
    const productText = `🌿 Raccomandazioni prodotti:\n\n${products.map(p => 
      `• ${p.name}: ${p.description}`
    ).join('\n')}`;
    
    await handleSendMessage(productText);
    setIsProductDialogOpen(false);
  };

  return {
    conversations,
    currentConversation,
    isProductDialogOpen,
    setIsProductDialogOpen,
    isSending,
    handleChatSelection,
    handleDeleteConversation,
    handleToggleBlockUser,
    handleSendProductRecommendations,
    handleSendMessage,
  };
};
