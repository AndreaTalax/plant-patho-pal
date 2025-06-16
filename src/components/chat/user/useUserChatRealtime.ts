
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
  const [isConnected, setIsConnected] = useState(false);
  const [subscription, setSubscription] = useState<any>(null);
  
  useEffect(() => {
    if (!userId) return;
    
    const initializeExpertChat = async () => {
      try {
        console.log("🔄 Initializing expert chat for user:", userId);
        
        // Use safer query instead of .single()
        const { data: conversationList, error } = await supabase
          .from('conversations')
          .select('*')
          .eq('user_id', userId)
          .eq('expert_id', EXPERT_ID)
          .limit(1);

        let conversation = conversationList?.[0];

        if (!conversation) {
          // Create new conversation if none exists
          console.log("🆕 No conversation found, creating new one...");
          const { data: newConversation, error: createError } = await supabase
            .from('conversations')
            .insert({
              user_id: userId,
              expert_id: EXPERT_ID,
              title: 'Consulenza esperto',
              status: 'active'
            })
            .select()
            .single();

          if (createError) {
            console.error("❌ Error creating conversation:", createError);
            toast.error("Errore nella creazione della conversazione");
            return;
          }

          conversation = newConversation;
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
        toast.error("Errore nell'inizializzazione della chat");
      }
    };
    
    initializeExpertChat();
  }, [userId]);

  // Enhanced realtime subscription for messages with better cleanup
  useEffect(() => {
    if (!currentDbConversation?.id) return;
    
    console.log('🔄 Setting up realtime subscription for conversation:', currentDbConversation.id);
    
    const messagesSubscription = supabase
      .channel(`messages-channel-${currentDbConversation.id}`, {
        config: {
          presence: {
            key: userId,
          },
        },
      })
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages',
          filter: `conversation_id=eq.${currentDbConversation.id}`
        }, 
        (payload) => {
          try {
            console.log('📨 New realtime message received:', payload.new);
            const newMsg = payload.new;
            const formattedMessage = convertToUIMessage(newMsg as any);

            setMessages(prev => {
              // Check if message already exists
              const messageExists = prev.some(msg => msg.id === formattedMessage.id);
              if (messageExists) {
                console.log('⚠️ Message already exists, skipping:', formattedMessage.id);
                return prev;
              }
              
              // Remove any temporary message with same content
              const withoutTemp = prev.filter(msg => {
                if (!msg.id.startsWith('temp-')) return true;
                
                const contentMatches = msg.text.trim() === formattedMessage.text.trim() && 
                                     msg.sender === formattedMessage.sender;
                
                if (contentMatches) {
                  console.log('🧹 Removing temporary message:', msg.id);
                  return false;
                }
                return true;
              });
              
              console.log('✅ Adding new message:', formattedMessage.id);
              return [...withoutTemp, formattedMessage];
            });
            
            if (formattedMessage.sender === 'expert' && 
                !(newMsg as any).metadata?.autoSent) {
              toast.info("Nuova risposta dal fitopatologo!", {
                description: "Controlla la chat per leggere la risposta",
                duration: 4000
              });
            }
          } catch (error) {
            console.error('❌ Error handling realtime message:', error);
          }
        }
      )
      .subscribe((status, err) => {
        console.log('🔗 Subscription status:', status, err);
        setIsConnected(status === 'SUBSCRIBED');
        
        if (status === 'SUBSCRIBED') {
          console.log('✅ Realtime connected successfully');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Realtime connection failed:', err);
          setIsConnected(false);
        }
      });

    setSubscription(messagesSubscription);

    return () => {
      console.log('🔌 Cleaning up realtime subscription...');
      try {
        if (messagesSubscription) {
          messagesSubscription.unsubscribe();
          supabase.removeChannel(messagesSubscription);
        }
      } catch (error) {
        console.warn('⚠️ Error during subscription cleanup:', error);
      }
      setSubscription(null);
    };
  }, [currentDbConversation?.id, userId]);
  
  const handleSendMessage = async (text: string, imageUrl?: string) => {
    if ((!text.trim() && !imageUrl)) {
      toast.error("Il messaggio non può essere vuoto");
      return;
    }

    if (isSending) {
      console.log('⚠️ Already sending a message, skipping');
      return;
    }

    if (!currentDbConversation?.id) {
      toast.error("Chat non disponibile");
      return;
    }

    console.log('📤 Starting to send message:', { text, imageUrl });
    setIsSending(true);

    // Create temporary message for immediate UI feedback
    const tempMessage: Message = {
      id: `temp-${Date.now()}-${Math.random()}`,
      sender: 'user',
      text: text || "📸 Immagine allegata",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      ...(imageUrl ? { image_url: imageUrl } : {})
    };
    
    console.log('⌛ Adding temporary message:', tempMessage.id);
    setMessages(prev => [...prev, tempMessage]);

    try {
      console.log('🚀 Sending to backend...');
      const result = await sendMessageService(
        currentDbConversation.id,
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

      console.log('✅ Message sent successfully');

    } catch (error) {
      console.error('❌ Error sending message:', error);
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (subscription) {
        try {
          subscription.unsubscribe();
          supabase.removeChannel(subscription);
        } catch (error) {
          console.warn('⚠️ Error during final cleanup:', error);
        }
      }
    };
  }, [subscription]);

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
