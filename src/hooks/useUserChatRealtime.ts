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

export const useUserChatRealtime = (userId: string) => {
  const { plantInfo } = usePlantInfo();
  const { userProfile } = useAuth();

  const [activeChat, setActiveChat] = useState<any>(null);
  const [messages, setMessages] = useState<DatabaseMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [initializationError, setInitializationError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [initialDataSent, setInitialDataSent] = useState(false);
  const [dataSyncChecked, setDataSyncChecked] = useState(false);

  /** 🧠 Avvio chat e caricamento messaggi */
  const startChatWithExpert = useCallback(async () => {
    if (isInitializing) return;
    try {
      setIsInitializing(true);
      setInitializationError(null);

      if (!userId || !MARCO_NIGRO_ID) throw new Error('ID utente o esperto mancanti');

      const conversation = await ConversationService.findOrCreateConversation(userId);
      if (!conversation) throw new Error('Impossibile creare o trovare la conversazione');

      setActiveChat(conversation);
      setCurrentConversationId(conversation.id);

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

  /** 🔌 Gestione realtime con auto-reconnect */
  useEffect(() => {
    if (!currentConversationId) {
      setIsConnected(false);
      return;
    }

    console.log('🔌 Impostazione canale realtime per:', currentConversationId);
    const channelName = `conversation_${currentConversationId}`;
    let reconnectTimeout: NodeJS.Timeout | null = null;
    let channelInstance: any = null;

    const setupChannel = () => {
      // Pulisci il canale precedente se esiste
      if (channelInstance) {
        console.log('🧹 Rimozione canale precedente...');
        try {
          supabase.removeChannel(channelInstance);
        } catch (error) {
          console.warn('⚠️ Errore rimozione canale precedente:', error);
        }
      }

      channelInstance = supabase
        .channel(channelName, {
          config: {
            broadcast: { self: true },
            presence: { key: currentConversationId }
          }
        })
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=eq.${currentConversationId}`,
          },
          (payload) => {
            console.log('📨 Nuovo messaggio ricevuto:', payload.new);
            const newMessage = payload.new as DatabaseMessage;
            setMessages((prev) => {
              if (prev.some((msg) => msg.id === newMessage.id)) {
                console.log('⏭️ Messaggio già presente, skip');
                return prev;
              }
              console.log('✅ Aggiunto nuovo messaggio alla lista');
              return [...prev, newMessage];
            });
          }
        )
        .subscribe((status, err) => {
          console.log('📡 Stato canale:', status, err);
          
          if (status === 'SUBSCRIBED') {
            console.log('✅ Connessione realtime stabilita');
            setIsConnected(true);
            // Pulisci eventuali timeout di riconnessione precedenti
            if (reconnectTimeout) {
              clearTimeout(reconnectTimeout);
              reconnectTimeout = null;
            }
          } else if (status === 'CHANNEL_ERROR') {
            console.error('❌ Errore canale:', err);
            setIsConnected(false);
            // Riprova solo se non c'è già un timeout attivo
            if (!reconnectTimeout) {
              console.log('⏰ Riconnessione programmata tra 5 secondi...');
              reconnectTimeout = setTimeout(() => {
                reconnectTimeout = null;
                setupChannel();
              }, 5000);
            }
          } else if (status === 'TIMED_OUT') {
            console.warn('⏰ Timeout connessione');
            setIsConnected(false);
          } else if (status === 'CLOSED') {
            console.log('🔌 Canale chiuso');
            setIsConnected(false);
          }
        });

      return channelInstance;
    };

    const channel = setupChannel();

    return () => {
      console.log('🧹 Pulizia canale realtime:', channelName);
      
      // Pulisci timeout di riconnessione
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = null;
      }
      
      // Rimuovi canale
      if (channel) {
        try {
          supabase.removeChannel(channel);
        } catch (error) {
          console.warn('⚠️ Errore durante pulizia:', error);
        }
      }
      
      setIsConnected(false);
    };
  }, [currentConversationId]);

  /** ✉️ Invio messaggi */
  const handleSendMessage = useCallback(
    async (text: string, imageUrl?: string) => {
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

        const refreshedMessages = await MessageService.loadMessages(currentConversationId);
        setMessages(refreshedMessages || []);
      } catch (error) {
        console.error('Errore invio messaggio:', error);
        toast.error('Errore nell\'invio del messaggio');
      } finally {
        setIsSending(false);
      }
    },
    [activeChat, currentConversationId, userId, isSending]
  );

  /** ♻️ Reset chat */
  const resetChat = useCallback(() => {
    setActiveChat(null);
    setMessages([]);
    setCurrentConversationId(null);
    setIsConnected(false);
    setInitializationError(null);
    setIsInitializing(false);
    setInitialDataSent(false);
    setDataSyncChecked(false);
  }, []);

  /** 🧾 Controlla se i dati sono già stati inviati */
  useEffect(() => {
    if (!currentConversationId || dataSyncChecked) return;

    const checkConsultationDataSent = async () => {
      try {
        const dataSent = await ConsultationDataService.isConsultationDataSent(currentConversationId);
        setInitialDataSent(dataSent);
        setDataSyncChecked(true);
        console.log('📊 Consultation data già inviati?', dataSent);
      } catch (error) {
        console.error('Errore nel check dei dati:', error);
        setDataSyncChecked(true);
      }
    };

    checkConsultationDataSent();
  }, [currentConversationId, dataSyncChecked]);

  /** 🚀 Invio automatico dati diagnosi AI */
  useEffect(() => {
    if (!currentConversationId || !userProfile || !dataSyncChecked) return;
    if (!plantInfo) return;

    // Se non c'è diagnosi AI e i dati sono già stati inviati, non fare nulla
    if (!plantInfo.diagnosisResult && initialDataSent) {
      console.log('ℹ️ Dati base già inviati, nessuna diagnosi AI disponibile');
      return;
    }

    // Se c'è una diagnosi AI, inviala sempre (anche se i dati base erano già stati inviati)
    const shouldSendDiagnosis = plantInfo.diagnosisResult && plantInfo.useAI;
    
    if (!shouldSendDiagnosis && initialDataSent) {
      console.log('ℹ️ Dati già inviati e nessuna diagnosi AI da inviare');
      return;
    }

    const sendData = async () => {
      try {
        console.log('📤 Invio automatico dati consultazione + PDF...', {
          hasDiagnosis: !!plantInfo.diagnosisResult,
          useAI: plantInfo.useAI,
          alreadySent: initialDataSent
        });

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
          diagnosisResult: plantInfo.diagnosisResult,
        };

        const userData = {
          firstName: userProfile.first_name || '',
          lastName: userProfile.last_name || '',
          email: userProfile.email || '',
          birthDate: userProfile.birth_date || 'Non specificata',
          birthPlace: userProfile.birth_place || 'Non specificato',
        };

        const success = await ConsultationDataService.sendInitialConsultationData(
          currentConversationId,
          plantData,
          userData,
          plantInfo.useAI || false,
          plantInfo.diagnosisResult || null
        );

        if (success) {
          console.log('✅ Dati consultazione inviati correttamente');
          if (plantInfo.diagnosisResult) {
            toast.success('Diagnosi AI e PDF inviati all\'esperto');
          }
          setInitialDataSent(true);
        } else {
          throw new Error('Invio non riuscito');
        }
      } catch (err) {
        console.error('❌ Errore invio dati consultazione:', err);
        toast.error('Errore nell\'invio dei dati all\'esperto');
      }
    };

    sendData();
  }, [
    currentConversationId,
    plantInfo,
    plantInfo?.diagnosisResult,
    userProfile,
    dataSyncChecked,
    initialDataSent,
  ]);

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
    isInitializing,
  };
};
