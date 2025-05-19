
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
  
  // Initialize chat when activeChat changes
  useEffect(() => {
    if (!activeChat || !userId) return;
    
    let messagesSubscription: any;
    
    const initializeChat = async () => {
      try {
        // Get or create conversation
        const conversation = await findOrCreateConversation(userId);
        if (!conversation) {
          toast("Could not start conversation with expert");
          return;
        }
        
        setCurrentDbConversation(conversation);
        
        // Load messages
        const messagesData = await loadMessages(conversation.id);
        
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
          
        console.log("Subscribed to messages channel:", `messages-channel-${conversation.id}`);
      } catch (error) {
        console.error("Error initializing chat:", error);
        toast("Could not initialize chat with expert");
      }
    };
    
    initializeChat();
    
    // Check if there's plant data in session storage
    const storedPlantData = sessionStorage.getItem('plantDataForChat');
    if (storedPlantData) {
      try {
        const plantData = JSON.parse(storedPlantData);
        if (plantData.image && plantData.plantInfo) {
          // Send plant data to expert automatically
          setTimeout(() => {
            handleSendPlantData(plantData.image, plantData.plantInfo);
            // Clear storage after sending to prevent duplicate sends
            sessionStorage.removeItem('plantDataForChat');
          }, 500);
        }
      } catch (error) {
        console.error("Error parsing stored plant data:", error);
      }
    }
    
    return () => {
      if (messagesSubscription) {
        supabase.removeChannel(messagesSubscription);
      }
    };
  }, [activeChat, userId]);
  
  // Send plant data to expert
  const handleSendPlantData = async (imageUrl: string, plantInfo: any) => {
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
      
      // Format message text
      const messageText = `Ho bisogno di aiuto con la mia pianta.
        
Sintomi: ${plantInfo.symptoms || 'Non specificati'}

Dettagli pianta:
- Ambiente: ${plantInfo.isIndoor ? 'Interno' : 'Esterno'}
- Frequenza irrigazione: ${plantInfo.wateringFrequency} volte a settimana
- Esposizione luce: ${plantInfo.lightExposure}`;
      
      // Add message to UI immediately to improve UX
      const tempMessage: Message = {
        id: `temp-${Date.now()}`,
        sender: 'user',
        text: messageText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        plantImage: imageUrl,
        plantDetails: plantInfo
      };
      setMessages(prev => [...prev, tempMessage]);
      
      // Send message with plant data
      const { error: msgError } = await supabase
        .from('messages')
        .insert({
          conversation_id: currentDbConversation!.id,
          sender_id: userId,
          recipient_id: EXPERT_ID,
          text: messageText,
          products: { 
            plantImage: imageUrl,
            plantDetails: plantInfo
          }
        });
        
      if (msgError) {
        // Remove temp message if sending failed
        setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
        toast("Error sending plant data");
        console.error("Error sending plant data:", msgError);
      }
      
      setIsSending(false);
    } catch (error) {
      console.error("Error in handleSendPlantData:", error);
      toast("Error sending plant data");
      setIsSending(false);
    }
  };
  
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
    handleSendPlantData
  };
};
