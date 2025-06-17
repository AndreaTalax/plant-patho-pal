
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase, EXPERT_ID } from '@/integrations/supabase/client';
import { Message, DatabaseConversation } from '../types';
import {
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
  const [isInitialized, setIsInitialized] = useState(false);
  const [connectionRetries, setConnectionRetries] = useState(0);
  const [lastMessageLoad, setLastMessageLoad] = useState<Date | null>(null);
  
  // Funzione per caricare i messaggi esistenti con retry
  const loadExistingMessages = async (conversationId: string, retryCount = 0) => {
    try {
      console.log('📚 Loading existing messages for conversation:', conversationId, 'retry:', retryCount);
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
        setLastMessageLoad(new Date());
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
        setLastMessageLoad(new Date());
        return true;
      }
    } catch (error) {
      console.error('❌ Error loading existing messages:', error);
      
      // Retry logic
      if (retryCount < 3) {
        console.log('🔄 Retrying message load in 2s...');
        setTimeout(() => {
          loadExistingMessages(conversationId, retryCount + 1);
        }, 2000);
        return false;
      }
      
      // Fallback welcome message
      setMessages([{ 
        id: 'welcome-error', 
        sender: 'expert' as const, 
        text: '👋 Ciao! Sono Marco, il fitopatologo. Come posso aiutarti con le tue piante?', 
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
      }]);
      setLastMessageLoad(new Date());
      return false;
    }
  };

  // Funzione per testare la connessione a Supabase
  const testSupabaseConnection = async () => {
    try {
      console.log('🔍 Testing Supabase connection...');
      const { data, error } = await supabase.from('conversations').select('id').limit(1);
      
      if (error) {
        console.error('❌ Supabase connection failed:', error);
        return false;
      }
      
      console.log('✅ Supabase connection successful');
      return true;
    } catch (error) {
      console.error('❌ Supabase connection test failed:', error);
      return false;
    }
  };

  // Inizializzazione della chat expert con retry
  useEffect(() => {
    if (!userId || isInitialized) return;
    
    const initializeExpertChat = async () => {
      try {
        console.log("🔄 Initializing expert chat for user:", userId);
        
        // Test connessione prima di procedere
        const connectionOk = await testSupabaseConnection();
        if (!connectionOk) {
          toast.error("Problema di connessione al server. Riprova tra poco.");
          return;
        }
        
        // Cerca conversazione esistente
        const { data: conversationList, error } = await supabase
          .from('conversations')
          .select('*')
          .eq('user_id', userId)
          .eq('expert_id', EXPERT_ID)
          .limit(1);

        if (error) {
          console.error("❌ Error fetching conversation:", error);
          toast.error("Errore nel caricamento della conversazione");
          return;
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
            toast.error("Errore nella creazione della conversazione");
            return;
          }

          conversation = newConversation;
        }
        
        console.log("✅ Found/created conversation:", conversation.id);
        setCurrentDbConversation(conversation);
        setActiveChat('expert');
        
        // Carica i messaggi esistenti
        const messagesLoaded = await loadExistingMessages(conversation.id);
        
        if (messagesLoaded) {
          setIsInitialized(true);
          toast.success("Chat collegata con successo!");
        } else {
          toast.warning("Chat collegata, ma potrebbero esserci problemi nel caricamento dei messaggi");
          setIsInitialized(true);
        }
        
      } catch (error) {
        console.error("❌ Error initializing expert chat:", error);
        toast.error("Errore nell'inizializzazione della chat");
      }
    };
    
    initializeExpertChat();
  }, [userId, isInitialized]);

  // Setup real-time subscription con retry robusto
  useEffect(() => {
    if (!currentDbConversation?.id || !isInitialized) return;
    
    console.log('🔄 Setting up realtime subscription for conversation:', currentDbConversation.id);
    
    // Cleanup subscription precedente se esiste
    if (subscription) {
      try {
        subscription.unsubscribe();
        supabase.removeChannel(subscription);
      } catch (error) {
        console.warn('⚠️ Error cleaning up old subscription:', error);
      }
    }
    
    const messagesSubscription = supabase
      .channel(`messages-channel-${currentDbConversation.id}-${Math.random()}`, {
        config: {
          presence: {
            key: userId,
          },
          broadcast: { self: false },
          private: false
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
              const newMessages = [...withoutTemp, formattedMessage];
              console.log('📋 Updated messages array:', newMessages);
              return newMessages;
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
          setConnectionRetries(0);
          toast.success("Connessione real-time attivata");
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Realtime connection failed:', err);
          setIsConnected(false);
          setConnectionRetries(prev => prev + 1);
          
          // Retry logic
          if (connectionRetries < 3) {
            console.log('🔄 Retrying connection in 5s...');
            setTimeout(() => {
              console.log('🔄 Attempting to reconnect...');
              // Force re-setup
              setIsInitialized(false);
              setTimeout(() => setIsInitialized(true), 1000);
            }, 5000);
          } else {
            toast.error("Connessione real-time non disponibile. I messaggi potrebbero non aggiornarsi automaticamente.");
          }
        } else if (status === 'TIMED_OUT') {
          console.error('⏰ Realtime connection timed out');
          setIsConnected(false);
          toast.warning("Connessione lenta. Riprova tra poco.");
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
  }, [currentDbConversation?.id, userId, isInitialized, connectionRetries]);

  // Periodic message refresh se la connessione real-time fallisce
  useEffect(() => {
    if (!isConnected && currentDbConversation?.id && isInitialized) {
      console.log('🔄 Setting up fallback message polling...');
      
      const interval = setInterval(async () => {
        console.log('🔄 Polling for new messages (fallback)...');
        await loadExistingMessages(currentDbConversation.id);
      }, 10000); // ogni 10 secondi
      
      return () => clearInterval(interval);
    }
  }, [isConnected, currentDbConversation?.id, isInitialized]);
  
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
    setMessages(prev => {
      const newMessages = [...prev, tempMessage];
      console.log('📋 Messages with temp message:', newMessages);
      return newMessages;
    });

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

      // Ricarica i messaggi dopo l'invio per assicurarsi che tutto sia sincronizzato
      setTimeout(() => {
        console.log('🔄 Reloading messages after send...');
        loadExistingMessages(currentDbConversation.id);
      }, 1500);

    } catch (error) {
      console.error('❌ Error sending message:', error);
      setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
      toast.error("Errore nell'invio del messaggio");
    } finally {
      setIsSending(false);
    }
  };

  const startChatWithExpert = async () => {
    console.log('🎯 startChatWithExpert called - current state:', { activeChat, isInitialized });
    if (!activeChat && !isInitialized) {
      setActiveChat('expert');
    }
  };

  // Funzione per forzare il refresh
  const forceRefresh = async () => {
    console.log('🔄 Force refresh triggered');
    if (currentDbConversation?.id) {
      setIsInitialized(false);
      setMessages([]);
      setIsConnected(false);
      
      // Restart initialization
      setTimeout(() => {
        loadExistingMessages(currentDbConversation.id);
        setIsInitialized(true);
      }, 1000);
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

  // Debug log dello stato
  useEffect(() => {
    console.log('📊 useUserChatRealtime - Stato corrente:', {
      userId,
      activeChat,
      messagesCount: messages.length,
      currentConversationId: currentDbConversation?.id,
      isConnected,
      isSending,
      isInitialized,
      connectionRetries,
      lastMessageLoad: lastMessageLoad?.toISOString(),
      messages
    });
  }, [userId, activeChat, messages, currentDbConversation, isConnected, isSending, isInitialized, connectionRetries, lastMessageLoad]);

  return {
    activeChat,
    setActiveChat,
    messages,
    isSending,
    isConnected,
    handleSendMessage,
    startChatWithExpert,
    currentConversationId: currentDbConversation?.id || null,
    forceRefresh,
    connectionRetries,
    lastMessageLoad
  };
};
