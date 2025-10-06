import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { usePlantInfo } from '@/context/PlantInfoContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { DatabaseMessage } from '@/services/chat/types';
import { MARCO_NIGRO_ID } from '@/components/phytopathologist';
import { ConversationService } from '@/services/chat/conversationService';
import { MessageService } from '@/services/chat/messageService';
import { ConsultationDataService } from '@/services/chat/consultationDataService';

// Hook aggiornato per chat realtime
export const useUserChatRealtime = (userId: string) => {
  const { plantInfo } = usePlantInfo();
  const { user, userProfile } = useAuth();
  const [activeChat, setActiveChat] = useState<any>(null);
  const [messages, setMessages] = useState<DatabaseMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [initializationError, setInitializationError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [initialDataSent, setInitialDataSent] = useState(false);
  const [dataSyncChecked, setDataSyncChecked] = useState(false);

  // Avvia chat con l'esperto (SENZA gestire la sottoscrizione realtime qui)
  const startChatWithExpert = useCallback(async () => {
    if (isInitializing) return;

    try {
      setIsInitializing(true);
      setInitializationError(null);

      if (!userId || !MARCO_NIGRO_ID) throw new Error('ID utente o esperto mancanti');

      // Trova o crea conversazione
      const conversation = await ConversationService.findOrCreateConversation(userId);
      if (!conversation) throw new Error('Impossibile creare o trovare la conversazione');

      setActiveChat(conversation);
      setCurrentConversationId(conversation.id);

      // Carica messaggi iniziali
      const existingMessages = await MessageService.loadMessages(conversation.id);
      setMessages(existingMessages || []);

      console.log('✅ Chat inizializzata con successo:', conversation.id);

    } catch (error: any) {
      console.error('Errore inizializzazione chat:', error);
      setInitializationError(error?.message || 'Errore sconosciuto');
    } finally {
      setIsInitializing(false);
    }
  }, [userId, isInitializing]);

  // Gestione sottoscrizione realtime - separata e gestita correttamente
  useEffect(() => {
    if (!currentConversationId) {
      setIsConnected(false);
      return;
    }

    console.log('🔌 Setting up realtime subscription for conversation:', currentConversationId);

    const channelName = `conversation_${currentConversationId}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${currentConversationId}`
        },
        (payload) => {
          console.log('📨 New message received via realtime:', payload.new);
          const newMessage = payload.new as DatabaseMessage;
          setMessages(prev => {
            if (prev.some(msg => msg.id === newMessage.id)) {
              console.log('ℹ️ Message already exists, skipping');
              return prev;
            }
            return [...prev, newMessage];
          });
        }
      )
      .subscribe(status => {
        console.log('🔌 Realtime status:', status);
        setIsConnected(status === 'SUBSCRIBED');
        
        if (status === 'CHANNEL_ERROR') {
          console.error('❌ Channel error detected');
          // Non tentare riconnessione automatica per evitare loop
        }
      });

    // Cleanup quando cambia conversazione o componente si smonta
    return () => {
      console.log('🔌 Cleaning up realtime subscription for:', currentConversationId);
      supabase.removeChannel(channel);
      setIsConnected(false);
    };
  }, [currentConversationId]);

  // Invia messaggio
  const handleSendMessage = useCallback(async (text: string, imageUrl?: string) => {
    if (!activeChat || !currentConversationId || isSending) return;
    if (!text?.trim() && !imageUrl) {
      toast.error('Il messaggio non può essere vuoto');
      return;
    }

    setIsSending(true);
    try {
      await MessageService.sendMessage(
        currentConversationId,
        userId,
        text || '📸 Immagine allegata',
        imageUrl
      );

      // Fallback: ricarica messaggi dopo invio
      const refreshedMessages = await MessageService.loadMessages(currentConversationId);
      setMessages(refreshedMessages || []);
    } catch (error) {
      console.error('Errore invio messaggio:', error);
      toast.error('Errore nell\'invio del messaggio');
    } finally {
      setIsSending(false);
    }
  }, [activeChat, currentConversationId, userId, isSending]);

  // Reset chat
  const resetChat = useCallback(() => {
    setActiveChat(null);
    setMessages([]);
    setCurrentConversationId(null);
    setIsConnected(false);
    setInitializationError(null);
    setIsInitializing(false);
  }, []);

  // Debug: log ogni cambiamento dei messaggi
  useEffect(() => {
    console.log('💬 Messages updated:', messages.map(m => m.text || m.content));
  }, [messages]);

  // Check if consultation data was already sent AFTER loading messages
  useEffect(() => {
    if (!currentConversationId || dataSyncChecked) return;

    const checkConsultationDataSent = async () => {
      try {
        const dataSent = await ConsultationDataService.isConsultationDataSent(currentConversationId);
        console.log("📊 Consultation data already sent:", dataSent);
        setInitialDataSent(dataSent);
        setDataSyncChecked(true);
      } catch (error) {
        console.error("❌ Error checking consultation data status:", error);
        setDataSyncChecked(true);
      }
    };

    checkConsultationDataSent();
  }, [currentConversationId, dataSyncChecked]);

  // Send initial consultation data automatically when all conditions are met  
  useEffect(() => {
    console.log('🔍 DEBUG: useEffect for consultation data triggered');
    console.log('🔍 Checking conditions for sending consultation data:', {
      conversationId: !!currentConversationId,
      plantInfoExists: !!plantInfo,
      plantInfoComplete: plantInfo?.infoComplete,
      userProfile: !!userProfile,
      dataSyncChecked,
      initialDataSent,
      plantInfo: plantInfo ? {
        name: plantInfo.name,
        symptoms: plantInfo.symptoms,
        uploadedImageUrl: !!plantInfo.uploadedImageUrl
      } : null
    });

    // Simplified conditions for testing
    if (!currentConversationId) {
      console.log('❌ Missing conversationId');
      return;
    }

    if (!userProfile) {
      console.log('❌ Missing userProfile');
      return;
    }

    if (!dataSyncChecked) {
      console.log('❌ Data sync not checked yet');
      return;
    }

    if (initialDataSent) {
      console.log('❌ Initial data already sent');
      return;
    }

    // For now, skip plantInfo check to test if that's the issue
    console.log('✅ All basic conditions met, attempting to send consultation data...');
    console.log('📋 All data ready, sending initial consultation data automatically...');
    sendInitialConsultationData();
  }, [currentConversationId, plantInfo, userProfile, dataSyncChecked, initialDataSent]);

  // Enhanced function to send initial consultation data automatically
  const sendInitialConsultationData = async () => {
    if (!currentConversationId || !plantInfo || !userProfile || initialDataSent) {
      console.log('❌ Cannot send initial data:', { 
        conversationId: !!currentConversationId, 
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
        sendToExpert: plantInfo.sendToExpert,
        diagnosisResult: plantInfo.diagnosisResult // Include diagnosis result for PDF
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
        currentConversationId,
        plantData,
        userData,
        plantInfo.useAI || false,
        plantInfo.diagnosisResult || null // Pass diagnosis result to generate PDF with AI results
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

  return {
    activeChat,
    messages,
    isSending,
    isConnected,
    handleSendMessage,
    startChatWithExpert,
    currentConversationId,
    initializationError,
    resetChat,
    isInitializing
  };
};
