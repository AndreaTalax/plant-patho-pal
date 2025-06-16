
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase, EXPERT_ID } from '@/integrations/supabase/client';
import { Message, DatabaseConversation } from '../types';
import {
  findOrCreateConversation,
  loadMessages,
  convertToUIMessage,
  sendMessage as sendMessageService
} from '../chatService';

export const useUserChatRealtime = (userId: string) => {
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentDbConversation, setCurrentDbConversation] = useState<DatabaseConversation | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  
  useEffect(() => {
    if (!userId) return;
    
    const initializeExpertChat = async () => {
      try {
        console.log("🔄 Initializing expert chat for user:", userId);
        
        const conversation = await findOrCreateConversation(userId);
        if (!conversation) {
          console.error("❌ Could not start conversation with expert");
          return;
        }
        
        console.log("✅ Found/created conversation:", conversation.id);
        setCurrentDbConversation(conversation);
        setActiveChat('expert');
        
        const messagesData = await loadMessages(conversation.id);
        console.log("📬 Loaded messages:", messagesData.length);
        
        const messagesForConversation = messagesData.map(msg => convertToUIMessage(msg));
        
        if (!messagesForConversation || messagesForConversation.length === 0) {
          setMessages([{ 
            id: 'welcome-1', 
            sender: 'expert', 
            text: '👋 Ciao! Sono Marco, il fitopatologo. Come posso aiutarti con le tue piante?', 
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
          }]);
        } else {
          setMessages(messagesForConversation);
        }
        
      } catch (error) {
        console.error("❌ Error initializing expert chat:", error);
      }
    };
    
    initializeExpertChat();
  }, [userId]);

  // Enhanced realtime subscription for messages
  useEffect(() => {
    if (!currentDbConversation?.id) return;
    
    console.log('🔄 Setting up realtime subscription for conversation:', currentDbConversation.id);
    
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
          console.log('📨 New realtime message received:', payload.new);
          const newMsg = payload.new;
          const formattedMessage = convertToUIMessage(newMsg as any);

          setMessages(prev => {
            console.log('📋 Current messages before update:', prev.length);
            
            // Remove any temporary message that matches this real message
            const withoutTemporary = prev.filter(msg => {
              if (!msg.id.startsWith('temp-')) return true;
              
              const textMatches = msg.text.trim() === formattedMessage.text.trim();
              const senderMatches = msg.sender === formattedMessage.sender;
              const imageMatches = msg.image_url === formattedMessage.image_url;
              
              if (textMatches && senderMatches && imageMatches) {
                console.log('🧹 Removing temporary message:', msg.id);
                return false;
              }
              return true;
            });
            
            // Check if real message already exists
            const messageExists = withoutTemporary.some(msg => msg.id === formattedMessage.id);
            if (messageExists) {
              console.log('⚠️ Real message already exists, skipping:', formattedMessage.id);
              return withoutTemporary;
            }
            
            console.log('✅ Adding new real message:', formattedMessage.id);
            const updated = [...withoutTemporary, formattedMessage];
            console.log('📋 Updated messages count:', updated.length);
            return updated;
          });
          
          if (formattedMessage.sender === 'expert' && 
              !(newMsg as any).metadata?.autoSent) {
            toast.info("Nuova risposta dal fitopatologo!", {
              description: "Controlla la chat per leggere la risposta",
              duration: 4000
            });
          }
        }
      )
      .subscribe((status) => {
        console.log('🔗 Subscription status:', status);
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      console.log('🔌 Cleaning up realtime subscription...');
      if (messagesSubscription) {
        supabase.removeChannel(messagesSubscription);
      }
    };
  }, [currentDbConversation?.id]);
  
  const handleSendMessage = async (text: string, imageUrl?: string) => {
    if ((!text.trim() && !imageUrl)) {
      toast.error("Il messaggio non può essere vuoto");
      return;
    }

    if (isSending) {
      console.log('⚠️ Already sending a message, skipping');
      return;
    }

    console.log('📤 Starting to send message:', { text, imageUrl });
    setIsSending(true);

    // Create temporary message immediately for instant UI feedback
    const tempMessage: Message = {
      id: `temp-${Date.now()}-${Math.random()}`,
      sender: 'user',
      text: text || (imageUrl ? "📸 Immagine allegata" : ""),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      ...(imageUrl ? { image_url: imageUrl } : {})
    };
    
    console.log('⌛ Adding temporary message immediately:', tempMessage.id);
    
    // Add message to UI immediately
    setMessages(prev => {
      const updated = [...prev, tempMessage];
      console.log('📋 Messages after immediate temp add:', updated.length);
      return updated;
    });

    try {
      let conversation = currentDbConversation;
      if (!conversation) {
        console.log('🔄 Creating new conversation...');
        conversation = await findOrCreateConversation(userId);
        if (!conversation) {
          // Remove temp message on error
          setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
          toast.error("Impossibile creare la conversazione");
          return;
        }
        setCurrentDbConversation(conversation);
      }

      console.log('🚀 Sending to backend...');
      const result = await sendMessageService(
        conversation.id,
        userId,
        EXPERT_ID,
        text || "📸 Immagine allegata",
        imageUrl
      );

      console.log('🚚 Backend response:', result);

      if (!result) {
        console.error('❌ Backend returned null/false');
        setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
        toast.error("Errore nell'invio del messaggio");
        return;
      }

      console.log('✅ Message sent successfully, waiting for realtime update to replace temp message');

    } catch (error) {
      console.error('❌ Error sending message:', error);
      // Remove temp message on error
      setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
      toast.error("Errore nell'invio del messaggio");
    } finally {
      setIsSending(false);
    }
  };

  const startChatWithExpert = async () => {
    if (!activeChat) {
      setActiveChat('expert');
    }
  };

  return {
    activeChat,
    setActiveChat,
    messages,
    isSending,
    isConnected,
    handleSendMessage,
    startChatWithExpert,
    currentConversationId: currentDbConversation?.id || null
  };
};
