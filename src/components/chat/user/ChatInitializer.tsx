
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
    const sendInitialData = async () => {
      // Condizioni per l'invio dei dati - ottimizzate
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
        console.log('[CHAT-INIT] 🚀 Invio rapido dati di consultazione...');
        
        // Verifica veloce se i dati sono già stati inviati
        const alreadySent = await ConsultationDataService.isConsultationDataSent(currentConversationId);
        
        if (alreadySent) {
          console.log('[CHAT-INIT] ✅ Dati già presenti, skip invio');
          setAutoDataSent(true);
          setIsProcessing(false);
          return;
        }

        // Prepara i dati utente
        const userData = {
          firstName: userProfile.first_name || userProfile.firstName || 'Non specificato',
          lastName: userProfile.last_name || userProfile.lastName || 'Non specificato',
          email: userProfile.email || 'Non specificato',
          birthDate: userProfile.birth_date || userProfile.birthDate || 'Non specificata',
          birthPlace: userProfile.birth_place || userProfile.birthPlace || 'Non specificato'
        };

        // Prepara i dati della pianta
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

        console.log('[CHAT-INIT] 📤 Invio dati ottimizzato...');

        // Invio ottimizzato dei dati
        const success = await ConsultationDataService.sendInitialConsultationData(
          currentConversationId,
          plantData,
          userData,
          plantInfo?.useAI || false
        );

        if (success) {
          setAutoDataSent(true);
          toast.success('✅ Dati inviati automaticamente!', {
            description: `Marco Nigro ha ricevuto i tuoi dati${plantData.imageUrl ? ' e la foto' : ''}`,
            duration: 4000,
          });
          console.log('[CHAT-INIT] ✅ Invio completato con successo');
        } else {
          console.error('[CHAT-INIT] ❌ Invio fallito');
          toast.error('❌ Errore nell\'invio automatico dei dati');
        }

      } catch (error) {
        console.error('[CHAT-INIT] ❌ ERRORE:', error);
        toast.error('❌ Errore nell\'invio automatico dei dati');
      } finally {
        setIsProcessing(false);
      }
    };

    // Avvia l'invio immediato se necessario
    if (activeChat === 'expert' && currentConversationId && userProfile && !autoDataSent && !isProcessing) {
      console.log('[CHAT-INIT] 🕐 Avvio invio automatico immediato...');
      const timer = setTimeout(sendInitialData, 500); // Ridotto a 500ms
      return () => clearTimeout(timer);
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
