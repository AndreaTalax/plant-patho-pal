
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase, EXPERT_ID } from '@/integrations/supabase/client';
import { Message, DatabaseConversation, EXPERT } from '../types';
import {
  findOrCreateConversation,
  loadMessages,
  convertToUIMessage,
  sendMessage as sendMessageService
} from '../chatService';

export const useUserChat = (userId: string) => {
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentDbConversation, setCurrentDbConversation] = useState<DatabaseConversation | null>(null);
  const [isSending, setIsSending] = useState(false);
  
  // Initialize chat when component mounts or userId changes
  useEffect(() => {
    if (!userId) return;
    
    const initializeExpertChat = async () => {
      try {
        console.log("Initializing expert chat for user:", userId);
        
        // Get or create conversation with expert
        const conversation = await findOrCreateConversation(userId);
        if (!conversation) {
          console.error("Could not start conversation with expert");
          return;
        }
        
        console.log("Found/created conversation:", conversation.id);
        setCurrentDbConversation(conversation);
        setActiveChat('expert'); // Always set expert as active chat
        
        // Load messages
        const messagesData = await loadMessages(conversation.id);
        console.log("Loaded messages:", messagesData.length);
        
        // Convert to UI format
        const messagesForConversation = messagesData.map(msg => convertToUIMessage(msg));
        
        if (!messagesForConversation || messagesForConversation.length === 0) {
          // Add only an offline message if no messages exist
          setMessages([{ 
            id: '1', 
            sender: 'expert', 
            text: 'Il fitopatologo risponderà al più presto alla tua richiesta.', 
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
          }]);
        } else {
          setMessages(messagesForConversation);
        }
        
      } catch (error) {
        console.error("Error initializing expert chat:", error);
      }
    };
    
    initializeExpertChat();
  }, [userId]);
  
  // Set up realtime subscription for messages when we have a conversation
  useEffect(() => {
    if (!currentDbConversation?.id) return;
    
    console.log("Setting up realtime subscription for conversation:", currentDbConversation.id);
    
    const messagesSubscription = supabase
      .channel(`messages-channel-${currentDbConversation.id}`)
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages',
          filter: `conversation_id=eq.${currentDbConversation.id}`
        }, 
        (payload) => {
          console.log('New message received via subscription:', payload);
          const newMsg = payload.new;
          
          const formattedMessage = convertToUIMessage(newMsg as any);
          
          setMessages(prev => {
            // Check if message already exists to avoid duplicates
            const exists = prev.find(msg => msg.id === formattedMessage.id);
            if (exists) {
              return prev;
            }
            return [...prev, formattedMessage];
          });
        }
      )
      .subscribe();
      
    console.log("Subscribed to messages channel:", `messages-channel-${currentDbConversation.id}`);
    
    return () => {
      if (messagesSubscription) {
        supabase.removeChannel(messagesSubscription);
      }
    };
  }, [currentDbConversation?.id]);
  
  // Send message
  const handleSendMessage = async (text: string) => {
    try {
      setIsSending(true);
      
      // Create conversation if it doesn't exist
      if (!currentDbConversation) {
        const conversation = await findOrCreateConversation(userId);
        if (!conversation) {
          toast("Could not create conversation");
          setIsSending(false);
          return;
        }
        setCurrentDbConversation(conversation);
      }
      
      // Add message to UI immediately to improve UX
      const tempMessage: Message = {
        id: `temp-${Date.now()}`,
        sender: 'user',
        text: text,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, tempMessage]);
      
      const success = await sendMessageService(
        currentDbConversation!.id,
        userId,
        EXPERT_ID,
        text
      );
        
      if (!success) {
        // Remove temp message if sending failed
        setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
        toast("Error sending message");
        setIsSending(false);
        return;
      }
      
      setIsSending(false);
    } catch (error) {
      console.error("Error in handleSendMessage:", error);
      toast("Error sending message");
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
