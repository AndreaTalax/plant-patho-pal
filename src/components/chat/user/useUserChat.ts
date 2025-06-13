
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase, EXPERT_ID } from '@/integrations/supabase/client';
import { Message, DatabaseConversation } from '../types';
import { usePlantInfo } from '@/context/PlantInfoContext';
import { useAuth } from '@/context/AuthContext';
import { ConsultationDataService } from '@/services/chat/consultationDataService';
import {
  findOrCreateConversation,
  loadMessages,
  convertToUIMessage,
  sendMessage as sendMessageService
} from '../chatService';

/**
 * Initializes and manages the user chat with an expert, handling message interaction and real-time updates.
 */
export const useUserChat = (userId: string) => {
  const { plantInfo } = usePlantInfo();
  const { userProfile } = useAuth();
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentDbConversation, setCurrentDbConversation] = useState<DatabaseConversation | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [initialDataSent, setInitialDataSent] = useState(false);
  
  // Initialize chat when component mounts or userId changes
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
          
          // Verifica se i dati di consultazione sono già stati inviati
          const dataSent = await ConsultationDataService.isConsultationDataSent(conversation.id);
          setInitialDataSent(dataSent);
        }
        
      } catch (error) {
        console.error("❌ Error initializing expert chat:", error);
      }
    };
    
    initializeExpertChat();
  }, [userId]);

  // Nuovo useEffect per gestire l'invio automatico dei dati in chat quando tutti i dati sono pronti
  useEffect(() => {
    if (currentDbConversation?.id && plantInfo?.infoComplete && userProfile && !initialDataSent && messages.length > 0) {
      console.log('All data ready, sending initial consultation data...');
      sendInitialConsultationData();
    }
  }, [currentDbConversation?.id, plantInfo?.infoComplete, userProfile, initialDataSent, messages.length]);

  const sendInitialConsultationData = async () => {
    if (!currentDbConversation?.id || !plantInfo || !userProfile || initialDataSent) {
      console.log('Cannot send initial data:', { 
        conversationId: !!currentDbConversation?.id, 
        plantInfo: !!plantInfo, 
        userProfile: !!userProfile, 
        initialDataSent 
      });
      return;
    }

    try {
      console.log('Sending initial consultation data...');
      setInitialDataSent(true);

      // Prepara i dati della pianta dal contesto
      const plantData = {
        symptoms: plantInfo.symptoms,
        wateringFrequency: plantInfo.wateringFrequency,
        sunExposure: plantInfo.lightExposure,
        additionalNotes: plantInfo.additionalNotes,
        imageUrl: plantInfo.uploadedImageUrl,
        aiDiagnosis: (plantInfo as any).aiDiagnosis
      };

      // Prepara i dati dell'utente dal profilo
      const userData = {
        firstName: userProfile.first_name,
        lastName: userProfile.last_name,
        birthDate: userProfile.birth_date,
        birthPlace: userProfile.birth_place
      };

      // Invia i dati usando il servizio
      const success = await ConsultationDataService.sendInitialConsultationData(
        currentDbConversation.id,
        plantData,
        userData,
        plantInfo.useAI || false
      );

      if (!success) {
        console.error('Failed to send initial consultation data');
        toast.error('Errore nell\'invio dei dati iniziali');
        setInitialDataSent(false);
        return;
      }

      console.log('Initial consultation data sent successfully');
      toast.success('Dati della consultazione inviati automaticamente!');

    } catch (error) {
      console.error('Error in sendInitialConsultationData:', error);
      setInitialDataSent(false);
      toast.error('Errore nell\'invio dei dati di consultazione');
    }
  };
  
  // Enhanced realtime subscription for messages
  useEffect(() => {
    if (!currentDbConversation?.id) return;
    
    console.log("🔔 Setting up realtime subscription for conversation:", currentDbConversation.id);
    
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
          console.log('📨 New message received via subscription:', payload);
          const newMsg = payload.new;
          
          const formattedMessage = convertToUIMessage(newMsg as any);
          
          setMessages(prev => {
            // Check if message already exists to avoid duplicates
            const exists = prev.find(msg => msg.id === formattedMessage.id);
            if (exists) {
              console.log("⚠️ Message already exists, skipping:", formattedMessage.id);
              return prev;
            }
            
            console.log("✅ Adding new message to chat:", formattedMessage.id);
            return [...prev, formattedMessage];
          });
          
          // Show toast notification for new expert messages
          if (formattedMessage.sender === 'expert') {
            toast.info("Nuova risposta dal fitopatologo!", {
              description: "Controlla la chat per leggere la risposta",
              duration: 4000
            });
          }
        }
      )
      .subscribe();
      
    console.log("✅ Subscribed to messages channel:", `messages-channel-${currentDbConversation.id}`);
    
    return () => {
      if (messagesSubscription) {
        supabase.removeChannel(messagesSubscription);
        console.log("🔌 Unsubscribed from messages channel");
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
      console.log("⚠️ Already sending a message, ignoring new send request");
      return;
    }

    try {
      setIsSending(true);
      console.log("📤 Sending message:", text);

      let conversation = currentDbConversation;
      if (!conversation) {
        console.log("🔄 No conversation found, creating new one...");
        conversation = await findOrCreateConversation(userId);
        if (!conversation) {
          toast.error("Impossibile creare la conversazione");
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

      // Send message to backend
      const success = await sendMessageService(
        conversation.id,
        userId,
        EXPERT_ID,
        text
      );

      if (!success) {
        // Remove temp message if sending failed
        setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
        toast.error("Errore nell'invio del messaggio");
        return;
      }

      console.log("✅ Message sent successfully");
      
    } catch (error) {
      console.error("❌ Error in handleSendMessage:", error);
      toast.error("Errore nell'invio del messaggio");
      
      // Remove temp message on error
      setMessages(prev => prev.filter(msg => msg.id.startsWith('temp-')));
    } finally {
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
