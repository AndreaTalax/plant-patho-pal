
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

  useEffect(() => {
    const sendInitialDataFast = async () => {
      // Condizioni ottimizzate per velocità
      if (
        !activeChat ||
        activeChat !== 'expert' ||
        !currentConversationId ||
        !userProfile ||
        autoDataSent ||
        isProcessing
      ) {
        return;
      }

      setIsProcessing(true);

      try {
        console.log('[CHAT-INIT] ⚡ Invio ULTRA-rapido dati...');
        
        // Verifica super-veloce se già inviati (ridotto timeout)
        const alreadySent = await Promise.race([
          ConsultationDataService.isConsultationDataSent(currentConversationId),
          new Promise(resolve => setTimeout(() => resolve(false), 800)) // Max 800ms
        ]);
        
        if (alreadySent) {
          console.log('[CHAT-INIT] ✅ Skip - Dati già presenti');
          setAutoDataSent(true);
          setIsProcessing(false);
          return;
        }

        // Preparazione dati ultra-veloce
        const userData = {
          firstName: userProfile.first_name || userProfile.firstName || 'Non specificato',
          lastName: userProfile.last_name || userProfile.lastName || 'Non specificato',
          email: userProfile.email || 'Non specificato',
          birthDate: userProfile.birth_date || userProfile.birthDate || 'Non specificata',
          birthPlace: userProfile.birth_place || userProfile.birthPlace || 'Non specificato'
        };

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

        console.log('[CHAT-INIT] ⚡ Invio parallelo ULTRA-ottimizzato...');

        // Invio ULTRA-ottimizzato (timeout ridotto)
        const sendPromise = ConsultationDataService.sendInitialConsultationData(
          currentConversationId,
          plantData,
          userData,
          plantInfo?.useAI || false
        );

        const success = await Promise.race([
          sendPromise,
          new Promise((resolve) => setTimeout(() => resolve(false), 3000)) // Max 3s
        ]);

        if (success) {
          setAutoDataSent(true);
          toast.success('⚡ Dati inviati!', {
            description: `Dati ${plantData.imageUrl ? 'e foto ' : ''}inviati a Marco Nigro`,
            duration: 2000, // Ridotto
          });
          console.log('[CHAT-INIT] ⚡ Invio ULTRA-veloce completato');
        } else {
          console.warn('[CHAT-INIT] ⚠️ Invio timeout o fallito');
          // Non mostrare errore per non bloccare l'utente
        }

      } catch (error) {
        console.error('[CHAT-INIT] ❌ ERRORE:', error);
        // Errore silenzioso per non bloccare la chat
      } finally {
        setIsProcessing(false);
      }
    };

    // Avvio IMMEDIATO se tutte le condizioni sono OK
    if (activeChat === 'expert' && currentConversationId && userProfile && !autoDataSent && !isProcessing) {
      console.log('[CHAT-INIT] ⚡ Avvio IMMEDIATO invio automatico...');
      // Ridotto a 100ms per massima velocità
      const ultraFastTimer = setTimeout(sendInitialDataFast, 100);
      return () => clearTimeout(ultraFastTimer);
    }
  }, [
    activeChat,
    currentConversationId,
    userProfile,
    autoDataSent,
    setAutoDataSent,
    plantInfo,
    isProcessing
  ]);

  return null; // Componente solo logico
};
