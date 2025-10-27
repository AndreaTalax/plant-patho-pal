import { useState, useEffect, useRef } from 'react';
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

  const initializingRef = useRef(false);
  const loadingMessagesRef = useRef(false);
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const rateLimitRef = useRef<Map<string, number>>(new Map());

  // 🔹 Rate limiting
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

  // 🔹 Carica messaggi esistenti
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
      console.log('📚 Loading existing messages for conversation:', conversationId, 'retry:', retryCount);

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 10000);
      });

      const messagesPromise = loadMessages(conversationId);
      const messagesData = await Promise.race([messagesPromise, timeoutPromise]) as any;

      console.log('📬 Raw messages loaded:', messagesData);

      if (messagesData && messagesData.length > 0) {
        // ✅ Mostra anche messaggi solo PDF o immagine
        const validMessages = messagesData.filter(msg =>
          msg.content || msg.text || msg.image_url || msg.pdf_path
        );

        const convertedMessages = validMessages.map(msg => {
          const converted = convertToUIMessage(msg);
          if (!converted.text && msg.pdf_path) {
            converted.text = "📄 Documento allegato";
            converted.pdf_path = msg.pdf_path;
          }
          if (!converted.text && msg.image_url) {
            converted.text = "📸 Immagine allegata";
          }
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

      if (retryCount < 2) {
        const delay = Math.pow(2, retryCount) * 2000;
        console.log(`🔄 Retrying message load in ${delay}ms...`);
        setTimeout(() => loadExistingMessages(conversationId, retryCount + 1), delay);
        return false;
      }

      setMessages([{
        id: 'welcome-error',
        sender: 'expert' as const,
        text: '👋 Ciao! Sono Marco, il fitopatologo. Come posso aiutarti con le tue piante?',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
      setLastMessageLoad(new Date());
      return false;
    } finally {
      loadingMessagesRef.current = false;
    }
  };

  // 🔹 Inizializza chat utente ↔ esperto
  useEffect(() => {
    if (!userId || isInitialized || initializingRef.current) return;

    const initializeExpertChat = async () => {
      if (initializingRef.current) return;

      if (!canMakeRequest(`init-chat-${userId}`, 3000)) return;

      initializingRef.current = true;

      try {
        console.log("🔄 Initializing expert chat for user:", userId);
        setConnectionRetries(0);

        if (connectionTimeoutRef.current) clearTimeout(connectionTimeoutRef.current);

        const initTimeout = setTimeout(() => {
          console.error('⏰ Initialization timeout');
          initializingRef.current = false;
          setConnectionRetries(prev => prev + 1);
        }, 15000);

        const { data: conversationList, error } = await supabase
          .from('conversations')
          .select('*')
          .eq('user_id', userId)
          .eq('expert_id', EXPERT_ID)
          .order('updated_at', { ascending: false })
          .limit(1);

        clearTimeout(initTimeout);

        if (error) throw new Error("Errore nel caricamento della conversazione");

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

          if (createError) throw new Error("Errore nella creazione della conversazione");
          conversation = newConversation;
        } else if (conversation.status !== 'active') {
          console.log('🔄 Reactivating archived conversation:', conversation.id);
          const { data: reactivated } = await supabase
            .from('conversations')
            .update({ status: 'active', updated_at: new Date().toISOString() })
            .eq('id', conversation.id)
            .select()
            .single();
          conversation = reactivated;
        }

        setCurrentDbConversation(conversation);
        setActiveChat('expert');
        await loadExistingMessages(conversation.id);

        setIsInitialized(true);
        toast.success("Chat collegata con successo!");
      } catch (error) {
        console.error("❌ Error initializing expert chat:", error);
        toast.error("Errore nell'inizializzazione della chat.");
      } finally {
        initializingRef.current = false;
      }
    };

    initializeExpertChat();
  }, [userId, isInitialized]);

  // 🔹 Realtime subscription
  useEffect(() => {
    if (!currentDbConversation?.id || !isInitialized) return;

    console.log('🔄 Setting up realtime subscription for conversation:', currentDbConversation.id);

    if (subscription) {
      try {
        subscription.unsubscribe();
        supabase.removeChannel(subscription);
      } catch (error) {
        console.warn('⚠️ Error cleaning up old subscription:', error);
      }
    }

    if (!canMakeRequest(`setup-subscription-${currentDbConversation.id}`, 5000)) return;

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

            // ✅ Gestisce PDF e immagini
            if (!newMsg.content && !newMsg.text && !newMsg.image_url && !newMsg.pdf_path) return;

            const formattedMessage = convertToUIMessage(newMsg as any);
            if (!formattedMessage.text && newMsg.pdf_path) {
              formattedMessage.text = "📄 Documento allegato";
              formattedMessage.pdf_path = newMsg.pdf_path;
            }
            if (!formattedMessage.text && newMsg.image_url) {
              formattedMessage.text = "📸 Immagine allegata";
            }

            setMessages(prev => {
              const exists = prev.some(msg => msg.id === formattedMessage.id);
              if (exists) return prev;

              const withoutTemp = prev.filter(msg =>
                !(msg.id.startsWith('temp-') &&
                  msg.text.trim() === formattedMessage.text.trim() &&
                  msg.sender === formattedMessage.sender)
              );

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
  }, [currentDbConversation?.id, isInitialized]);

  // 🔹 Fallback polling
  useEffect(() => {
    if (!isConnected && currentDbConversation?.id && isInitialized) {
      console.log('🔄 Setting up fallback message polling...');
      const interval = setInterval(async () => {
        if (canMakeRequest(`fallback-poll-${currentDbConversation.id}`, 15000)) {
          console.log('🔄 Polling for new messages (fallback)...');
          await loadExistingMessages(currentDbConversation.id);
        }
      }, 20000);
      return () => clearInterval(interval);
    }
  }, [isConnected, currentDbConversation?.id, isInitialized]);

  // 🔹 Invio messaggio
  const handleSendMessage = async (text: string, imageUrl?: string) => {
    if ((!text.trim() && !imageUrl)) {
      toast.error("Il messaggio non può essere vuoto");
      return;
    }

    if (isSending) return;

    if (!currentDbConversation?.id) {
      toast.error("Chat non disponibile");
      return;
    }

    if (!canMakeRequest(`send-message-${currentDbConversation.id}`, 1000)) {
      toast.warning("Invia i messaggi più lentamente");
      return;
    }

    setIsSending(true);

    const tempMessage: Message = {
      id: `temp-${Date.now()}-${Math.random()}`,
      sender: 'user',
      text: text || (imageUrl ? "📸 Immagine allegata" : ""),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      ...(imageUrl ? { image_url: imageUrl } : {})
    };

    setMessages(prev => [...prev, tempMessage]);

    try {
      const result = await sendMessageService(
        currentDbConversation.id,
        userId,
        EXPERT_ID,
        text || "📸 Immagine allegata",
        imageUrl
      );

      if (!result) {
        setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
        toast.error("Errore nell'invio del messaggio");
        return;
      }

      setTimeout(() => {
        if (canMakeRequest(`reload-after-send-${currentDbConversation.id}`, 3000)) {
          loadExistingMessages(currentDbConversation.id);
        }
      }, 2000);
    } catch (error) {
      console.error('❌ Error sending message:', error);
      setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
      toast.error("Errore nell'invio del messaggio");
    } finally {
      setIsSending(false);
    }
  };

  // 🔹 Refresh completo
  const forceRefresh = async () => {
    if (!canMakeRequest('force-refresh', 10000)) {
      toast.warning("Aspetta prima di aggiornare di nuovo");
      return;
    }

    initializingRef.current = false;
    loadingMessagesRef.current = false;
    if (connectionTimeoutRef.current) clearTimeout(connectionTimeoutRef.current);
    rateLimitRef.current.clear();

    setIsInitialized(false);
    setMessages([]);
    setIsConnected(false);
    setCurrentDbConversation(null);
    setActiveChat(null);
    setConnectionRetries(0);
  };

  // 🔹 Cleanup finale
  useEffect(() => {
    return () => {
      if (subscription) {
        try {
          subscription.unsubscribe();
          supabase.removeChannel(subscription);
        } catch {}
      }
      if (connectionTimeoutRef.current) clearTimeout(connectionTimeoutRef.current);
    };
  }, [subscription]);

  return {
    activeChat,
    setActiveChat,
    messages,
    isSending,
    isConnected,
    handleSendMessage,
    currentConversationId: currentDbConversation?.id || null,
    forceRefresh,
    connectionRetries,
    lastMessageLoad
  };
};
