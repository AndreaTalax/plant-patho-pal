
import { useState, useEffect } from 'react';
import { supabase, EXPERT_ID } from '@/integrations/supabase/client';
import { Conversation, DatabaseConversation, Message, Product } from '../types';
import { 
  loadConversations,
  loadMessages, 
  convertToUIMessage, 
  sendMessage as sendMessageService,
  updateConversationStatus
} from '../chatService';
import { toast } from '@/components/ui/use-toast';

export const useExpertConversation = (userId: string) => {
  // State management
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [dbConversations, setDbConversations] = useState<DatabaseConversation[]>([]);
  const [currentDbConversation, setCurrentDbConversation] = useState<DatabaseConversation | null>(null);
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  
  // Load conversations from database
  useEffect(() => {
    const fetchConversations = async () => {
      const data = await loadConversations(true, userId);
      
      // Set database conversations
      setDbConversations(data);
      
      // Convert to UI format
      const convertedConversations = data.map((conv: DatabaseConversation) => {
        const username = conv.user?.username || conv.user_id;
        return {
          id: conv.id,
          username: username,
          lastMessage: conv.last_message_text || "No messages yet",
          unread: false, // TODO: Implement unread status
          blocked: conv.status === "blocked",
          messages: []
        };
      });
      
      setConversations(convertedConversations);
    };
    
    fetchConversations();
    
    // Set up a realtime subscription for conversations
    const conversationsSubscription = supabase
      .channel('conversations-channel')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'conversations' 
        }, 
        (payload) => {
          console.log('Conversation change received:', payload);
          fetchConversations();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(conversationsSubscription);
    };
  }, [userId]);
  
  // Handle chat selection
  const handleChatSelection = async (conversationId: string) => {
    const selected = dbConversations.find(conv => conv.id === conversationId);
    if (!selected) return;
    
    setCurrentDbConversation(selected);
    
    // Load messages for this conversation
    const messagesData = await loadMessages(conversationId);
    
    // Convert to UI format
    const messagesForConversation = messagesData.map(msg => convertToUIMessage(msg));
    
    // Find conversation in UI state and update
    const uiConversation = conversations.find(conv => conv.id === conversationId);
    if (uiConversation) {
      setCurrentConversation({
        ...uiConversation,
        messages: messagesForConversation || [],
        unread: false // Mark as read
      });
      
      // Update state to mark as read
      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversationId ? {...conv, unread: false} : conv
        )
      );
    }
    
    // Set up realtime subscription for messages in this conversation
    const messagesSubscription = supabase
      .channel(`messages-channel-${conversationId}`)
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        }, 
        (payload) => {
          console.log('Message received:', payload);
          const newMsg = payload.new;
          
          const formattedMessage = convertToUIMessage(newMsg as any);
          
          // Update current conversation
          setCurrentConversation(prev => {
            if (!prev) return null;
            return {
              ...prev,
              messages: [...prev.messages, formattedMessage]
            };
          });
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(messagesSubscription);
    };
  };
  
  // Delete conversation
  const handleDeleteConversation = async (conversationId: string) => {
    try {
      // Archive conversation instead of deleting it
      const success = await updateConversationStatus(conversationId, 'archived');
        
      if (!success) {
        toast.error("Error archiving conversation");
        return;
      }
      
      setConversations(prev => prev.filter(conv => conv.id !== conversationId));
      if (currentConversation?.id === conversationId) {
        setCurrentConversation(null);
      }
      
      toast.success("Conversation deleted successfully");
    } catch (error) {
      console.error("Error in handleDeleteConversation:", error);
      toast.error("Error deleting conversation");
    }
  };
  
  // Block/Unblock user
  const handleToggleBlockUser = async (conversationId: string) => {
    try {
      const isCurrentlyBlocked = conversations.find(c => c.id === conversationId)?.blocked || false;
      const newStatus = isCurrentlyBlocked ? 'active' : 'blocked';
      
      const success = await updateConversationStatus(conversationId, newStatus);
        
      if (!success) {
        toast.error(`Error ${isCurrentlyBlocked ? 'unblocking' : 'blocking'} user`);
        return;
      }
      
      // Update UI state
      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversationId ? {...conv, blocked: !isCurrentlyBlocked} : conv
        )
      );
      
      if (currentConversation?.id === conversationId) {
        setCurrentConversation(prev => 
          prev ? {...prev, blocked: !isCurrentlyBlocked} : null
        );
      }
      
      toast.success(isCurrentlyBlocked 
        ? "User has been unblocked" 
        : "User has been blocked"
      );
    } catch (error) {
      console.error("Error in handleToggleBlockUser:", error);
      toast.error("Error changing user block status");
    }
  };
  
  // Send product recommendations
  const handleSendProductRecommendations = async (products: Product[]) => {
    if (!currentDbConversation || products.length === 0) {
      return;
    }
    
    try {
      setIsSending(true);

      const success = await sendMessageService(
        currentDbConversation.id,
        EXPERT_ID,
        currentDbConversation.user_id,
        'I recommend the following products for your plant:',
        products
      );
        
      if (!success) {
        toast.error("Error sending product recommendations");
        setIsSending(false);
        return;
      }
      
      toast.success("Product recommendations sent!");
      setIsSending(false);
    } catch (error) {
      console.error("Error in sendProductRecommendations:", error);
      toast.error("Error sending product recommendations");
      setIsSending(false);
    }
  };
  
  // Send a regular text message
  const handleSendMessage = async (text: string) => {
    if (!currentDbConversation) return;
    
    try {
      setIsSending(true);
      
      const success = await sendMessageService(
        currentDbConversation.id,
        EXPERT_ID,
        currentDbConversation.user_id,
        text
      );
        
      if (!success) {
        toast.error("Error sending message");
        setIsSending(false);
        return;
      }
      
      setIsSending(false);
      toast.success("Reply sent successfully!");
    } catch (error) {
      console.error("Error in sendMessage:", error);
      toast.error("Error sending message");
      setIsSending(false);
    }
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
