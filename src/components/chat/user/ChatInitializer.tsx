
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

  useEffect(() => {
    const sendInitialData = async () => {
      // Condizioni per l'invio dei dati - SEMPRE quando c'è una chat attiva
      if (
        !activeChat ||
        activeChat !== 'expert' ||
        !currentConversationId ||
        !userProfile ||
        autoDataSent
      ) {
        console.log('[CHAT-INIT] Condizioni non soddisfatte o dati già inviati');
        return;
      }

      try {
        console.log('[CHAT-INIT] 🚀 Avvio invio automatico dati di consultazione...');
        
        // Prepara sempre i dati utente completi
        const userData = {
          firstName: userProfile.first_name || userProfile.firstName || 'Non specificato',
          lastName: userProfile.last_name || userProfile.lastName || 'Non specificato',
          email: userProfile.email || 'Non specificato',
          birthDate: userProfile.birth_date || userProfile.birthDate || 'Non specificata',
          birthPlace: userProfile.birth_place || userProfile.birthPlace || 'Non specificato'
        };

        // Prepara sempre i dati della pianta (anche se parziali)
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

        console.log('[CHAT-INIT] 📤 Invio dati completi:', { userData, plantData });

        // FORZA l'invio automatico dei dati completi
        const success = await ConsultationDataService.sendInitialConsultationData(
          currentConversationId,
          plantData,
          userData,
          plantInfo?.useAI || false
        );

        if (success) {
          setAutoDataSent(true);
          toast.success('Dati personali e della pianta inviati automaticamente!', {
            description: `Marco Nigro ha ricevuto: dati personali${plantData.imageUrl ? ', informazioni pianta e foto' : ' e informazioni pianta'}`,
            duration: 5000,
          });
          console.log('[CHAT-INIT] ✅ Dati inviati con successo');
        } else {
          console.error('[CHAT-INIT] ❌ Invio fallito');
          toast.error('Errore invio automatico dati');
        }

      } catch (error) {
        console.error('[CHAT-INIT] ❌ Errore:', error);
        toast.error('Errore nell\'invio automatico dei dati');
      }
    };

    // Avvia l'invio con un breve delay per permettere il caricamento
    if (activeChat === 'expert' && currentConversationId && userProfile && !autoDataSent) {
      console.log('[CHAT-INIT] 🕐 Programmazione invio automatico...');
      const timer = setTimeout(sendInitialData, 1500);
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

  return null; // Componente solo logico
};
