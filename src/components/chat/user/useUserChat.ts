
import { useState, useEffect } from 'react';
import { toast } from '@/components/ui/sonner';
import { supabase, EXPERT_ID } from '@/integrations/supabase/client';
import { Message, DatabaseConversation, EXPERT } from '../types';
import {
  findOrCreateConversation,
  loadMessages,
  convertToUIMessage,
  sendMessage as sendMessageService
} from '../chatService';
import { useTheme } from '@/context/ThemeContext';

export const useUserChat = (userId: string) => {
  const { t } = useTheme();
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentDbConversation, setCurrentDbConversation] = useState<DatabaseConversation | null>(null);
  const [isSending, setIsSending] = useState(false);
  
  // Initialize chat when activeChat changes
  useEffect(() => {
    if (!activeChat || !userId) return;
    
    let messagesSubscription: any;
    
    const initializeChat = async () => {
      // Get or create conversation
      const conversation = await findOrCreateConversation(userId);
      if (!conversation) {
        toast.error("Could not start conversation with expert");
        return;
      }
      
      setCurrentDbConversation(conversation);
      
      // Load messages
      const messagesData = await loadMessages(conversation.id);
      
      // Convert to UI format
      const messagesForConversation = messagesData.map(msg => convertToUIMessage(msg));
      
      if (!messagesForConversation || messagesForConversation.length === 0) {
        // Add initial greeting message if no messages exist
        setMessages([{ 
          id: '1', 
          sender: 'expert', 
          text: 'Good morning! I am Marco Nigro, a plant pathologist specialized in plant diagnosis and treatment. How can I help you today?', 
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
        }]);
      } else {
        setMessages(messagesForConversation);
      }
      
      // Set up realtime subscription for messages in this conversation
      messagesSubscription = supabase
        .channel(`messages-channel-${conversation.id}`)
        .on('postgres_changes', 
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'messages',
            filter: `conversation_id=eq.${conversation.id}`
          }, 
          (payload) => {
            console.log('Message received:', payload);
            const newMsg = payload.new;
            
            const formattedMessage = convertToUIMessage(newMsg as any);
            
            setMessages(prev => [...prev, formattedMessage]);
          }
        )
        .subscribe();
    };
    
    initializeChat();
    
    return () => {
      if (messagesSubscription) {
        supabase.removeChannel(messagesSubscription);
      }
    };
  }, [activeChat, userId]);
  
  // Send message
  const handleSendMessage = async (text: string) => {
    try {
      setIsSending(true);
      
      // Create conversation if it doesn't exist
      if (!currentDbConversation) {
        const conversation = await findOrCreateConversation(userId);
        if (!conversation) {
          toast.error("Could not create conversation");
          setIsSending(false);
          return;
        }
        setCurrentDbConversation(conversation);
      }
      
      const success = await sendMessageService(
        currentDbConversation!.id,
        userId,
        EXPERT_ID,
        text
      );
        
      if (!success) {
        toast.error("Error sending message");
        setIsSending(false);
        return;
      }
      
      setIsSending(false);
      toast.success(t("notificationSent", { name: EXPERT.name }) || `Message sent to ${EXPERT.name}`);
    } catch (error) {
      console.error("Error in handleSendMessage:", error);
      toast.error("Error sending message");
      setIsSending(false);
    }
  };

  return {
    activeChat,
    setActiveChat,
    messages,
    isSending,
    handleSendMessage,
  };
};
