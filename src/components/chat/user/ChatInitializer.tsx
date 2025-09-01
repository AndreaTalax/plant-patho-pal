
import { useEffect, useState, useRef } from 'react';
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
  const attemptedRef = useRef(false);

  // INVIO AUTOMATICO GARANTITO dei dati di consultazione - UNA SOLA VOLTA
  useEffect(() => {
    const sendDataOnce = async () => {
      // Verifica condizioni e previeni tentativi multipli
      if (
        !activeChat ||
        !currentConversationId ||
        !userProfile ||
        autoDataSent ||
        isProcessing ||
        attemptedRef.current
      ) {
        return;
      }

      console.log('🚀 [CHAT-INIT] Avvio invio automatico dati consultazione...');
      
      // Marca come tentato per evitare loop
      attemptedRef.current = true;
      setIsProcessing(true);

      try {
        // Verifica prima se i dati sono già stati inviati
        const alreadySent = await ConsultationDataService.isConsultationDataSent(currentConversationId);
        if (alreadySent) {
          console.log('✅ [CHAT-INIT] Dati già inviati precedentemente');
          setAutoDataSent(true);
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

        // Usa il nuovo servizio edge function
        const success = await ConsultationDataService.sendInitialConsultationData(
          currentConversationId,
          plantData,
          userData,
          plantInfo?.useAI || false
        );

        if (success) {
          console.log('[CHAT-INIT] ✅ INVIO COMPLETATO CON SUCCESSO');
          setAutoDataSent(true);
          
          toast.success('✅ Dati inviati automaticamente all\'esperto!', {
            description: `Informazioni ${plantData.imageUrl ? 'e foto ' : ''}inviate a Marco Nigro`,
            duration: 3000,
          });
        } else {
          throw new Error('Servizio di invio fallito');
        }

      } catch (error) {
        console.error('[CHAT-INIT] ❌ ERRORE:', error);
        
        // Solo un toast di errore, senza retry automatico
        toast.error('❌ Errore invio automatico dati', {
          description: 'I dati non sono stati inviati automaticamente. Puoi inviarli manualmente nella chat.',
          duration: 4000,
        });
      } finally {
        setIsProcessing(false);
      }
    };

    // Esegui solo se non è mai stato tentato
    if (activeChat && currentConversationId && userProfile && !autoDataSent && !attemptedRef.current) {
      console.log('[CHAT-INIT] 🎯 Condizioni soddisfatte - avvio invio automatico...');
      // Delay piccolo per assicurare inizializzazione
      const timer = setTimeout(sendDataOnce, 1000);
      return () => clearTimeout(timer);
    }
  }, [
    activeChat,
    currentConversationId,
    userProfile,
    autoDataSent,
    setAutoDataSent,
    plantInfo
  ]);

  // Reset del tentativo quando cambia conversazione
  useEffect(() => {
    if (currentConversationId) {
      attemptedRef.current = false;
    }
  }, [currentConversationId]);

  return null; // Componente solo logico
};
