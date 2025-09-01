
import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { supabase, EXPERT_ID } from '@/integrations/supabase/client';
import { Message, DatabaseConversation } from '@/components/chat/types';
import {
  loadMessages,
  convertToUIMessage,
  sendMessage as sendMessageService
} from '@/components/chat/chatService';

export const useUserChatRealtime = (userId: string) => {
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentDbConversation, setCurrentDbConversation] = useState<DatabaseConversation | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [subscription, setSubscription] = useState<any>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [initializationError, setInitializationError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  
  // Add refs to prevent multiple simultaneous operations
  const initializingRef = useRef(false);
  const loadingMessagesRef = useRef(false);
  
  // Rate limiting for API calls
  const rateLimitRef = useRef<Map<string, number>>(new Map());
  
  const canMakeRequest = (key: string, minInterval: number = 2000) => {
    const now = Date.now();
    const lastRequest = rateLimitRef.current.get(key) || 0;
    if (now - lastRequest < minInterval) {
      console.log(`⏳ Rate limiting ${key}, waiting...`);
      return false;
    }
    rateLimitRef.current.set(key, now);
    return true;
  };
  
  // Funzione per caricare i messaggi esistenti
  const loadExistingMessages = async (conversationId: string, retryCount = 0) => {
    if (loadingMessagesRef.current) {
      console.log('📚 Already loading messages, skipping...');
      return false;
    }
    
    if (!canMakeRequest(`load-messages-${conversationId}`, 1000)) {
      return false;
    }
    
    loadingMessagesRef.current = true;
    
    try {
      console.log('📚 Loading existing messages for conversation:', conversationId);
      
      const messagesData = await loadMessages(conversationId);
      
      console.log('📬 Raw messages loaded:', messagesData);
      
      if (messagesData && messagesData.length > 0) {
        const convertedMessages = messagesData.map(msg => {
          const converted = convertToUIMessage(msg);
          console.log('🔄 Converting message:', { original: msg, converted });
          return converted;
        });
        
        console.log('✅ Setting messages:', convertedMessages);
        setMessages(convertedMessages);
        return true;
      } else {
        console.log('📭 No existing messages, setting welcome message');
        const welcomeMessage = { 
          id: 'welcome-1', 
          sender: 'expert' as const, 
          text: '👋 Ciao! Sono Marco, il fitopatologo. Come posso aiutarti con le tue piante?', 
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
        };
        setMessages([welcomeMessage]);
        return true;
      }
    } catch (error) {
      console.error('❌ Error loading existing messages:', error);
      
      // Exponential backoff for retries
      if (retryCount < 2) {
        const delay = Math.pow(2, retryCount) * 2000;
        console.log(`🔄 Retrying message load in ${delay}ms...`);
        setTimeout(() => {
          loadExistingMessages(conversationId, retryCount + 1);
        }, delay);
        return false;
      }
      
      // Fallback welcome message
      setMessages([{ 
        id: 'welcome-error', 
        sender: 'expert' as const, 
        text: '👋 Ciao! Sono Marco, il fitopatologo. Come posso aiutarti con le tue piante?', 
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
      }]);
      return false;
    } finally {
      loadingMessagesRef.current = false;
    }
  };

  // Inizializzazione della chat expert
  useEffect(() => {
    if (!userId || isInitialized || initializingRef.current) return;
    
    const initializeExpertChat = async () => {
      if (initializingRef.current) {
        console.log('🔄 Already initializing, skipping...');
        return;
      }
      
      if (!canMakeRequest(`init-chat-${userId}`, 3000)) {
        console.log('⏳ Rate limiting initialization...');
        return;
      }
      
      initializingRef.current = true;
      setIsInitializing(true);
      setInitializationError(null);
      
      try {
        console.log("🔄 Initializing expert chat for user:", userId);
        
        // Cerca conversazione esistente
        const { data: conversationList, error } = await supabase
          .from('conversations')
          .select('*')
          .eq('user_id', userId)
          .eq('expert_id', EXPERT_ID)
          .order('created_at', { ascending: false })
          .limit(1);

        if (error) {
          console.error("❌ Error fetching conversation:", error);
          throw new Error("Errore nel caricamento della conversazione");
        }

        let conversation = conversationList?.[0];

        if (!conversation) {
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
            throw new Error("Errore nella creazione della conversazione");
          }

          conversation = newConversation;
          console.log("✅ New conversation created:", conversation.id);
        } else {
          console.log("✅ Found existing conversation:", conversation.id);
        }
        
        setCurrentDbConversation(conversation);
        setActiveChat('expert');
        
        // Carica i messaggi esistenti
        await loadExistingMessages(conversation.id);
        
        setIsInitialized(true);
        console.log("✅ Chat initialized successfully");
        toast.success("Chat collegata con successo!");
        
      } catch (error) {
        console.error("❌ Error initializing expert chat:", error);
        setInitializationError(error instanceof Error ? error.message : "Errore sconosciuto");
        toast.error("Errore nell'inizializzazione della chat. Riprova.");
      } finally {
        initializingRef.current = false;
        setIsInitializing(false);
      }
    };
    
    initializeExpertChat();
  }, [userId, isInitialized]);

  // Setup real-time subscription
  useEffect(() => {
    if (!currentDbConversation?.id || !isInitialized) return;
    
    console.log('🔄 Setting up realtime subscription for conversation:', currentDbConversation.id);
    
    // Cleanup subscription precedente
    if (subscription) {
      try {
        subscription.unsubscribe();
        supabase.removeChannel(subscription);
      } catch (error) {
        console.warn('⚠️ Error cleaning up old subscription:', error);
      }
    }
    
    const messagesSubscription = supabase
      .channel(`messages-channel-${currentDbConversation.id}-${Date.now()}`)
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
              const messageExists = prev.some(msg => msg.id === formattedMessage.id);
              if (messageExists) {
                console.log('⚠️ Message already exists, skipping:', formattedMessage.id);
                return prev;
              }
              
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
              
              console.log('✅ Adding new message to UI:', formattedMessage.id);
              return [...withoutTemp, formattedMessage];
            });
            
            if (formattedMessage.sender === 'expert') {
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
        } else if (status === 'TIMED_OUT') {
          console.error('⏰ Realtime connection timed out');
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
  }, [currentDbConversation?.id, userId, isInitialized]);
  
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

      // Reload messages after send
      setTimeout(() => {
        console.log('🔄 Reloading messages after send...');
        loadExistingMessages(currentDbConversation.id);
      }, 1000);

    } catch (error) {
      console.error('❌ Error sending message:', error);
      setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
      toast.error("Errore nell'invio del messaggio");
    } finally {
      setIsSending(false);
    }
  };

  const startChatWithExpert = async () => {
    console.log('🎯 startChatWithExpert called');
    if (!activeChat && !isInitialized && !initializingRef.current) {
      setIsInitialized(false); // Force re-initialization
    }
  };

  const resetChat = () => {
    console.log('🔄 Resetting chat state');
    setIsInitialized(false);
    setInitializationError(null);
    setMessages([]);
    setActiveChat(null);
    setCurrentDbConversation(null);
    setIsConnected(false);
    if (subscription) {
      try {
        subscription.unsubscribe();
        supabase.removeChannel(subscription);
      } catch (error) {
        console.warn('⚠️ Error during reset cleanup:', error);
      }
    }
    setSubscription(null);
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
    currentConversationId: currentDbConversation?.id || null,
    initializationError,
    resetChat,
    isInitializing
  };
};
