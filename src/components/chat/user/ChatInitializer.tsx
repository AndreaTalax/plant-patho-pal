
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
  const [forceAttempts, setForceAttempts] = useState(0);

  useEffect(() => {
    const sendInitialData = async () => {
      // Condizioni per l'invio dei dati - SEMPRE quando c'è una chat attiva
      if (
        !activeChat ||
        activeChat !== 'expert' ||
        !currentConversationId ||
        !userProfile
      ) {
        console.log('[CHAT-INIT] ❌ Condizioni base non soddisfatte');
        return;
      }

      // Se dati già inviati e non dobbiamo forzare, skip
      if (autoDataSent && forceAttempts === 0) {
        console.log('[CHAT-INIT] ✅ Dati già inviati');
        return;
      }

      try {
        console.log('[CHAT-INIT] 🚀 FORZA invio automatico dati di consultazione...');
        
        // Prepara SEMPRE i dati utente completi
        const userData = {
          firstName: userProfile.first_name || userProfile.firstName || 'Non specificato',
          lastName: userProfile.last_name || userProfile.lastName || 'Non specificato',
          email: userProfile.email || 'Non specificato',
          birthDate: userProfile.birth_date || userProfile.birthDate || 'Non specificata',
          birthPlace: userProfile.birth_place || userProfile.birthPlace || 'Non specificato'
        };

        // Prepara SEMPRE i dati della pianta (anche se parziali)
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

        console.log('[CHAT-INIT] 📤 FORZA invio dati completi:', { userData, plantData, forceAttempts });

        // Verifica se i dati sono già stati inviati (solo se non stiamo forzando)
        if (forceAttempts === 0) {
          const alreadySent = await ConsultationDataService.isConsultationDataSent(currentConversationId);
          if (alreadySent) {
            console.log('[CHAT-INIT] ⚠️ Dati già presenti, ma forzeremo comunque l\'invio');
          }
        }

        // FORZA l'invio automatico dei dati completi SEMPRE
        const success = await ConsultationDataService.sendInitialConsultationData(
          currentConversationId,
          plantData,
          userData,
          plantInfo?.useAI || false
        );

        if (success) {
          setAutoDataSent(true);
          setForceAttempts(0); // Reset tentativi
          toast.success('✅ Dati personali e della pianta inviati automaticamente!', {
            description: `Marco Nigro ha ricevuto: dati personali completi${plantData.imageUrl ? ', informazioni pianta e foto' : ' e informazioni pianta'}`,
            duration: 6000,
          });
          console.log('[CHAT-INIT] ✅ SUCCESSO: Dati inviati con successo');
        } else {
          console.error('[CHAT-INIT] ❌ ERRORE: Invio fallito');
          
          // Retry automatico fino a 2 volte
          if (forceAttempts < 2) {
            setTimeout(() => {
              console.log('[CHAT-INIT] 🔄 Tentativo automatico di retry...');
              setForceAttempts(prev => prev + 1);
            }, 3000);
          } else {
            toast.error('❌ Errore nell\'invio automatico dei dati dopo 3 tentativi');
            setForceAttempts(0);
          }
        }

      } catch (error) {
        console.error('[CHAT-INIT] ❌ EXCEPTION:', error);
        
        // Retry automatico su eccezione
        if (forceAttempts < 2) {
          setTimeout(() => {
            console.log('[CHAT-INIT] 🔄 Retry dopo eccezione...');
            setForceAttempts(prev => prev + 1);
          }, 3000);
        } else {
          toast.error('❌ Errore nell\'invio automatico dei dati');
          setForceAttempts(0);
        }
      }
    };

    // Avvia l'invio con un breve delay per permettere il caricamento
    if (activeChat === 'expert' && currentConversationId && userProfile) {
      console.log('[CHAT-INIT] 🕐 Programmazione invio automatico forzato...');
      const timer = setTimeout(sendInitialData, 2000); // Delay più lungo per sicurezza
      return () => clearTimeout(timer);
    }
  }, [
    activeChat,
    currentConversationId,
    userProfile,
    autoDataSent,
    setAutoDataSent,
    plantInfo,
    forceAttempts
  ]);

  return null; // Componente solo logico
};
