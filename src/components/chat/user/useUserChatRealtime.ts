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
        
        // Get or create conversation with expert
        const conversation = await findOrCreateConversation(userId);
        if (!conversation) {
          console.error("❌ Could not start conversation with expert");
          return;
        }
        
        console.log("✅ Found/created conversation:", conversation.id);
        setCurrentDbConversation(conversation);
        setActiveChat('expert'); // Always set expert as active chat
        
        // Load messages
        const messagesData = await loadMessages(conversation.id);
        console.log("📬 Loaded messages:", messagesData.length);
        
        // Convert to UI format
        const messagesForConversation = messagesData.map(msg => convertToUIMessage(msg));
        
        if (!messagesForConversation || messagesForConversation.length === 0) {
          // Add welcome message if no messages exist
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

  // Enhanced realtime subscription for messages with deduplication
  useEffect(() => {
    if (!currentDbConversation?.id) return;
    
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
          const newMsg = payload.new;
          const formattedMessage = convertToUIMessage(newMsg as any);

          setMessages(prev => {
            // Controlla se il messaggio reale corrisponde a uno temporaneo: rimuovi il temporaneo
            const tempIdx = prev.findIndex(
              msg => msg.id.startsWith('temp-') &&
                msg.text.trim() === formattedMessage.text.trim() &&
                msg.sender === formattedMessage.sender
            );
            let filtered = [...prev];
            if (tempIdx !== -1) {
              filtered.splice(tempIdx, 1);
            }
            // Aggiungi il messaggio reale SOLO se non esiste già (confronta id reale)
            const exists = filtered.find(msg => msg.id === formattedMessage.id);
            if (exists) {
              return filtered;
            }
            return [...filtered, formattedMessage];
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
      .subscribe();
    setIsConnected(true);

    return () => {
      if (messagesSubscription) {
        supabase.removeChannel(messagesSubscription);
      }
    };
  }, [currentDbConversation?.id]);
  
  // Send message function - properly async
  const handleSendMessage = async (text: string) => {
    if (!text.trim()) {
      toast.error("Il messaggio non può essere vuoto");
      return;
    }

    if (isSending) {
      return;
    }

    try {
      setIsSending(true);

      let conversation = currentDbConversation;
      if (!conversation) {
        conversation = await findOrCreateConversation(userId);
        if (!conversation) {
          toast.error("Impossibile creare la conversazione");
          return;
        }
        setCurrentDbConversation(conversation);
      }

      // Messaggio TEMPORANEO
      const tempMessage: Message = {
        id: `temp-${Date.now()}`,
        sender: 'user',
        text: text,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, tempMessage]);

      // Send message to backend
      const success = await sendMessageService(
        conversation.id,
        userId,
        EXPERT_ID,
        text
      );

      if (!success) {
        // Rimuovi messaggio temp se invio fallito
        setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
        toast.error("Errore nell'invio del messaggio");
        return;
      }

      // Quando il messaggio arriverà via realtime, il temp verrà eliminato (vedi sopra)
      
    } catch (error) {
      setMessages(prev => prev.filter(msg => !msg.id.startsWith('temp-')));
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
