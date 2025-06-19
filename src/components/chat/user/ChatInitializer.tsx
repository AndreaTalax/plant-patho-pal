
import { useEffect, useState } from 'react';
import { ConsultationDataService } from '@/services/chat/consultationDataService';
import { usePlantInfo } from '@/context/PlantInfoContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

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
  const { userProfile, updateProfile } = useAuth();
  const { toast } = useToast();

  // Funzione per garantire che i dati utente siano sempre completi nel contesto
  const ensureUserDataInContext = async () => {
    if (!userProfile) return null;

    // Controlla se mancano dati essenziali e li completa se necessario
    const userData = {
      firstName: userProfile.first_name || userProfile.firstName || "Non specificato",
      lastName: userProfile.last_name || userProfile.lastName || "Non specificato", 
      email: userProfile.email || "Non specificato",
      birthDate: userProfile.birth_date || userProfile.birthDate || "Non specificata",
      birthPlace: userProfile.birth_place || userProfile.birthPlace || "Non specificato"
    };

    // Se alcuni dati sono mancanti ma possiamo recuperarli, aggiorniamo il profilo
    if (userProfile.email && (!userProfile.first_name && !userProfile.firstName)) {
      console.log('[CHAT-INIT] 🔄 Aggiornamento dati utente nel contesto...');
      try {
        // Aggiorna solo se abbiamo informazioni da aggiungere
        await updateProfile({
          firstName: userData.firstName,
          lastName: userData.lastName,
          birthDate: userData.birthDate,
          birthPlace: userData.birthPlace
        });
      } catch (error) {
        console.warn('[CHAT-INIT] ⚠️ Impossibile aggiornare il profilo:', error);
      }
    }

    return userData;
  };

  useEffect(() => {
    const sendInitialData = async () => {
      // Condizioni per l'invio dei dati - FORZIAMO L'INVIO AUTOMATICO
      if (
        !activeChat ||
        activeChat !== 'expert' ||
        !currentConversationId ||
        !userProfile
      ) {
        console.log('[CHAT-INIT 🚫] Condizioni non soddisfatte:', {
          activeChat,
          currentConversationId: !!currentConversationId,
          userProfile: !!userProfile
        });
        return;
      }

      // Se i dati sono già stati inviati, non inviarli di nuovo
      if (autoDataSent) {
        console.log('[CHAT-INIT ✅] Dati già inviati, skip');
        return;
      }

      try {
        console.log('[CHAT-INIT ✉️] Avvio invio dati automatico...');
        
        // Assicurati che i dati utente siano completi nel contesto
        const userData = await ensureUserDataInContext();
        
        if (!userData) {
          console.log('[CHAT-INIT ⚠️] Impossibile recuperare dati utente');
          return;
        }

        // Costruisci sempre i dati della pianta, anche se parziali
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

        console.log('[CHAT-INIT 📤] Invio Dati Completi:', { 
          userData: {
            firstName: userData.firstName,
            lastName: userData.lastName,
            email: userData.email,
            hasBirthData: !!(userData.birthDate && userData.birthPlace)
          },
          plantData: { 
            ...plantData, 
            hasImage: !!plantData.imageUrl,
            hasSymptoms: !!plantInfo?.symptoms,
            hasCompleteInfo: !!(plantInfo?.symptoms && plantInfo?.wateringFrequency && plantInfo?.lightExposure)
          }
        });

        // Invia SEMPRE i dati completi (utente + pianta)
        const success = await ConsultationDataService.sendInitialConsultationData(
          currentConversationId,
          plantData,
          userData, // Sempre incluso, anche se lo stesso utente
          plantInfo?.useAI || false
        );

        setAutoDataSent(true);

        if (success) {
          toast({
            title: 'Dati inviati automaticamente all\'esperto!',
            description: `Marco Nigro ha ricevuto i tuoi dati personali${plantData.imageUrl ? ', le informazioni della pianta e la foto' : ' e le informazioni della pianta'}`,
            duration: 5000,
          });
        } else {
          console.warn('[CHAT-INIT ⚠️] Invio dati automatico fallito, ma non bloccante');
          toast({
            title: 'Attenzione: dati automatici non inviati completamente',
            description: 'Alcuni dati potrebbero non essere stati inviati, riprova tra poco',
            duration: 5000,
            variant: 'destructive'
          });
        }

      } catch (error) {
        console.error('[CHAT-INIT ❌]', error);
        toast({
          title: 'Errore nell\'invio automatico dei dati',
          description: 'Inserisci manualmente le informazioni nella chat se necessario',
          duration: 5000,
          variant: 'destructive'
        });
      }
    };

    // Avvia l'invio con un timer per permettere al componente di caricarsi
    if (
      activeChat === 'expert' &&
      currentConversationId &&
      userProfile
    ) {
      console.log('[CHAT-INIT 🚀] Avviando timer per invio automatico dati...');
      const timer = setTimeout(sendInitialData, 2000); // Aumentato a 2 secondi
      return () => clearTimeout(timer);
    }
  }, [
    activeChat,
    currentConversationId,
    userProfile,
    autoDataSent,
    setAutoDataSent,
    toast,
    plantInfo,
    updateProfile
  ]);

  return null; // This is a logic-only component
};
