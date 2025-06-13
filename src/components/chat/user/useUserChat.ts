
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
  const [dataSyncChecked, setDataSyncChecked] = useState(false);
  
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
        }

        // Check if consultation data was already sent AFTER loading messages
        const dataSent = await ConsultationDataService.isConsultationDataSent(conversation.id);
        console.log("📊 Consultation data already sent:", dataSent);
        setInitialDataSent(dataSent);
        setDataSyncChecked(true);
        
      } catch (error) {
        console.error("❌ Error initializing expert chat:", error);
      }
    };
    
    initializeExpertChat();
  }, [userId]);

  // Send initial consultation data automatically when all conditions are met
  useEffect(() => {
    if (!currentDbConversation?.id || 
        !plantInfo?.infoComplete || 
        !userProfile || 
        !dataSyncChecked ||
        initialDataSent) {
      return;
    }

    console.log('📋 All data ready, sending initial consultation data automatically...');
    sendInitialConsultationData();
  }, [currentDbConversation?.id, plantInfo?.infoComplete, userProfile, dataSyncChecked, initialDataSent]);

  // Enhanced function to send initial consultation data automatically
  const sendInitialConsultationData = async () => {
    if (!currentDbConversation?.id || !plantInfo || !userProfile || initialDataSent) {
      console.log('❌ Cannot send initial data:', { 
        conversationId: !!currentDbConversation?.id, 
        plantInfo: !!plantInfo, 
        userProfile: !!userProfile, 
        initialDataSent 
      });
      return;
    }

    try {
      console.log('📤 Sending initial consultation data automatically...');
      
      // Set this immediately to prevent multiple calls
      setInitialDataSent(true);

      // Prepare comprehensive plant data from context
      const plantData = {
        symptoms: plantInfo.symptoms || 'Nessun sintomo specificato',
        wateringFrequency: plantInfo.wateringFrequency || 'Non specificata',
        sunExposure: plantInfo.lightExposure || 'Non specificata',
        environment: plantInfo.isIndoor ? 'Interno' : 'Esterno',
        plantName: plantInfo.name || 'Pianta non identificata',
        imageUrl: plantInfo.uploadedImageUrl,
        aiDiagnosis: (plantInfo as any).aiDiagnosis,
        useAI: plantInfo.useAI,
        sendToExpert: plantInfo.sendToExpert
      };

      // Prepare comprehensive user data from profile
      const userData = {
        firstName: userProfile.first_name || '',
        lastName: userProfile.last_name || '',
        email: userProfile.email || '',
        birthDate: userProfile.birth_date || 'Non specificata',
        birthPlace: userProfile.birth_place || 'Non specificato'
      };

      console.log('📊 Sending data:', { plantData, userData });

      // Send comprehensive data using the service
      const success = await ConsultationDataService.sendInitialConsultationData(
        currentDbConversation.id,
        plantData,
        userData,
        plantInfo.useAI || false
      );

      if (!success) {
        console.error('❌ Failed to send initial consultation data');
        setInitialDataSent(false);
        toast.error('Errore nell\'invio automatico dei dati');
        return;
      }

      console.log('✅ Initial consultation data sent successfully');
      toast.success('Dati inviati automaticamente all\'esperto!', {
        description: 'Marco Nigro ha ricevuto tutte le informazioni sulla tua pianta'
      });

    } catch (error) {
      console.error('❌ Error in sendInitialConsultationData:', error);
      setInitialDataSent(false);
      toast.error('Errore nell\'invio automatico all\'esperto');
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
          
          // Show toast notification for new expert messages only if not auto-sent
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
    sendInitialConsultationData, // Expose this function for manual calls if needed
  };
};
