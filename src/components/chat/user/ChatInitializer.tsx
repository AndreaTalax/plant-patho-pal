
import { useEffect, useState } from 'react';
import { ConsultationDataService } from '@/services/chat/consultationDataService';
import { usePlantInfo } from '@/context/PlantInfoContext';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

interface ChatInitializerProps {
  activeChat: string | null;
  currentConversationId: string | null;
  autoDataSent: boolean;
  setAutoDataSent: (value: boolean) => void;
}

export const ChatInitializer: React.FC<ChatInitializerProps> = ({
  activeChat,
  currentConversationId,
  autoDataSent,
  setAutoDataSent
}) => {
  const { plantInfo } = usePlantInfo();
  const { userProfile } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // INVIO AUTOMATICO GARANTITO dei dati di consultazione
  useEffect(() => {
    const sendDataGuaranteed = async () => {
      // Condizioni per l'invio automatico
      if (
        !activeChat ||
        !currentConversationId ||
        !userProfile ||
        autoDataSent ||
        isProcessing
      ) {
        return;
      }

      console.log('🚀 [CHAT-INIT] Avvio invio automatico dati consultazione...');
      setIsProcessing(true);

      try {
        // Verifica prima se i dati sono già stati inviati
        const alreadySent = await ConsultationDataService.isConsultationDataSent(currentConversationId);
        if (alreadySent) {
          console.log('✅ [CHAT-INIT] Dati già inviati precedentemente');
          setAutoDataSent(true);
          setIsProcessing(false);
          return;
        }

        // Preparazione dati completi dell'utente
        const userData = {
          firstName: userProfile.first_name || userProfile.firstName || 'Non specificato',
          lastName: userProfile.last_name || userProfile.lastName || 'Non specificato',
          email: userProfile.email || 'Non specificato',
          birthDate: userProfile.birth_date || userProfile.birthDate || 'Non specificata',
          birthPlace: userProfile.birth_place || userProfile.birthPlace || 'Non specificato'
        };

        // Preparazione dati della pianta
        const plantData = {
          symptoms: plantInfo?.symptoms || 'Da descrivere durante la consulenza',
          wateringFrequency: plantInfo?.wateringFrequency || 'Da specificare',
          sunExposure: plantInfo?.lightExposure || 'Da specificare',
          environment: plantInfo?.isIndoor !== undefined ? (plantInfo.isIndoor ? 'Interno' : 'Esterno') : 'Da specificare',
          plantName: plantInfo?.name || 'Specie da identificare',
          imageUrl: plantInfo?.uploadedImageUrl,
          aiDiagnosis: (plantInfo as any)?.aiDiagnosis,
          useAI: plantInfo?.useAI || false,
          sendToExpert: plantInfo?.sendToExpert || false
        };

        console.log('[CHAT-INIT] 📦 Dati preparati per invio:', { 
          userData: userData.email, 
          plantData: plantData.plantName,
          hasImage: !!plantData.imageUrl 
        });

        // INVIO CON RETRY AUTOMATICO
        let success = false;
        let attempts = 0;
        const maxAttempts = 3;

        while (!success && attempts < maxAttempts) {
          attempts++;
          console.log(`[CHAT-INIT] 📤 Tentativo invio ${attempts}/${maxAttempts}`);
          
          try {
            success = await ConsultationDataService.sendInitialConsultationData(
              currentConversationId,
              plantData,
              userData,
              plantInfo?.useAI || false,
              (plantData as any)?.diagnosisResult || null
            );

            if (success) {
              console.log('[CHAT-INIT] ✅ INVIO COMPLETATO CON SUCCESSO');
              setAutoDataSent(true);
              setRetryCount(0);
              
              toast.success('✅ Dati inviati automaticamente all\'esperto!', {
                description: `Informazioni ${plantData.imageUrl ? 'e foto ' : ''}inviate a Marco Nigro`,
                duration: 3000,
              });
              break;
            }
          } catch (error) {
            console.error(`[CHAT-INIT] ❌ Tentativo ${attempts} fallito:`, error);
          }

          // Attesa prima del prossimo tentativo
          if (!success && attempts < maxAttempts) {
            const delay = Math.min(1000 * attempts, 3000);
            console.log(`[CHAT-INIT] ⏳ Attendo ${delay}ms prima del prossimo tentativo...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }

        if (!success) {
          console.warn('[CHAT-INIT] ⚠️ Tutti i tentativi falliti, salvo per invio differito');
          setRetryCount(prev => prev + 1);
          
          // Salva dati per invio differito (localStorage come fallback)
          try {
            localStorage.setItem('pendingChatData', JSON.stringify({
              conversationId: currentConversationId,
              plantData,
              userData,
              timestamp: Date.now()
            }));
            console.log('[CHAT-INIT] 💾 Dati salvati per invio differito');
            
            toast.info('📝 Dati salvati per invio differito', {
              description: 'Verranno inviati quando la connessione si ristabilirà',
              duration: 4000,
            });
          } catch (storageError) {
            console.error('[CHAT-INIT] ❌ Errore salvataggio offline:', storageError);
          }
        }

      } catch (error) {
        console.error('[CHAT-INIT] ❌ ERRORE CRITICO:', error);
        setRetryCount(prev => prev + 1);
      } finally {
        setIsProcessing(false);
      }
    };

    // Avvio immediato quando le condizioni sono soddisfatte
    if (activeChat && currentConversationId && userProfile && !autoDataSent && !isProcessing) {
      console.log('[CHAT-INIT] 🎯 Condizioni soddisfatte - avvio invio automatico...');
      // Piccolo delay per assicurare che la chat sia completamente inizializzata
      const timer = setTimeout(sendDataGuaranteed, 500);
      return () => clearTimeout(timer);
    }
  }, [
    activeChat,
    currentConversationId,
    userProfile,
    autoDataSent,
    setAutoDataSent,
    plantInfo,
    isProcessing,
    retryCount
  ]);

  // Controllo dati salvati offline per invio differito
  useEffect(() => {
    const checkPendingData = async () => {
      if (!currentConversationId || autoDataSent || isProcessing) return;

      try {
        const pendingDataStr = localStorage.getItem('pendingChatData');
        if (!pendingDataStr) return;

        const pendingData = JSON.parse(pendingDataStr);
        
        // Controlla se i dati sono recenti (ultimi 10 minuti)
        const isRecent = (Date.now() - pendingData.timestamp) < 10 * 60 * 1000;
        
        if (isRecent && pendingData.conversationId === currentConversationId) {
          console.log('[CHAT-INIT] 🔄 Tentativo invio dati offline salvati...');
          
          const success = await ConsultationDataService.sendInitialConsultationData(
            pendingData.conversationId,
            pendingData.plantData,
            pendingData.userData,
            pendingData.plantData.useAI || false,
            pendingData.plantData.diagnosisResult || null
          );

          if (success) {
            localStorage.removeItem('pendingChatData');
            setAutoDataSent(true);
            toast.success('✅ Dati offline inviati!', {
              description: 'I dati salvati sono stati inviati con successo',
              duration: 3000,
            });
          }
        } else {
          // Rimuovi dati obsoleti
          localStorage.removeItem('pendingChatData');
        }
      } catch (error) {
        console.error('[CHAT-INIT] ❌ Errore controllo dati offline:', error);
      }
    };

    // Controlla ogni 30 secondi per dati offline
    const interval = setInterval(checkPendingData, 30000);
    
    // Controllo immediato
    checkPendingData();

    return () => clearInterval(interval);
  }, [currentConversationId, autoDataSent, isProcessing, setAutoDataSent]);

  return null; // Componente solo logico
};
