
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
  const { userProfile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const sendInitialData = async () => {
      // Condizioni più permissive per l'invio dei dati
      if (
        !activeChat ||
        activeChat !== 'expert' ||
        !currentConversationId ||
        !userProfile ||
        autoDataSent
      ) {
        console.log('[AUTO-DATA 🚫] Condizioni non soddisfatte:', {
          activeChat,
          currentConversationId: !!currentConversationId,
          userProfile: !!userProfile,
          autoDataSent
        });
        return;
      }

      try {
        console.log('[AUTO-DATA ✉️] Controllo invio dati automatico...');
        const alreadySent = await ConsultationDataService.isConsultationDataSent(currentConversationId);

        if (alreadySent) {
          console.log('[AUTO-DATA ✅] Dati già inviati, nessuna azione necessaria');
          setAutoDataSent(true);
          return;
        }

        // Costruisci i dati della pianta anche se parziali
        const plantData = {
          symptoms: plantInfo?.symptoms || 'Sintomi da specificare',
          wateringFrequency: plantInfo?.wateringFrequency || 'Frequenza da specificare',
          sunExposure: plantInfo?.lightExposure || 'Esposizione da specificare',
          environment: plantInfo?.isIndoor ? 'Interno' : 'Esterno',
          plantName: plantInfo?.name || 'Pianta da identificare',
          imageUrl: plantInfo?.uploadedImageUrl,
          aiDiagnosis: (plantInfo as any)?.aiDiagnosis,
          useAI: plantInfo?.useAI,
          sendToExpert: plantInfo?.sendToExpert
        };

        const userData = {
          firstName: userProfile.first_name || userProfile.firstName || "Non specificato",
          lastName: userProfile.last_name || userProfile.lastName || "Non specificato",
          email: userProfile.email || "Non specificato",
          birthDate: userProfile.birth_date || userProfile.birthDate || "Non specificata",
          birthPlace: userProfile.birth_place || userProfile.birthPlace || "Non specificato"
        };

        console.log('[AUTO-DATA 📤] Invio Dati:', { 
          plantData: { ...plantData, hasImage: !!plantData.imageUrl },
          userData
        });

        const success = await ConsultationDataService.sendInitialConsultationData(
          currentConversationId,
          plantData,
          userData,
          plantInfo?.useAI || false
        );

        setAutoDataSent(true);

        if (success) {
          toast({
            title: 'Dati inviati automaticamente all\'esperto!',
            description: 'Marco Nigro ha ricevuto tutte le informazioni disponibili e la foto della tua pianta',
            duration: 4000,
          });
        } else {
          toast({
            title: 'Attenzione: dati automatici non inviati, riprova tra poco.',
            description: 'Potresti dover inserire manualmente le informazioni nella chat',
            duration: 4000,
            variant: 'destructive'
          });
        }

      } catch (error) {
        setAutoDataSent(false);
        console.error('[AUTO-DATA ❌]', error);
        toast({
          title: 'Errore nell\'invio automatico dei dati',
          description: 'Inserisci manualmente le informazioni nella chat',
          duration: 4000,
          variant: 'destructive'
        });
      }
    };

    if (
      activeChat === 'expert' &&
      currentConversationId &&
      userProfile
    ) {
      const timer = setTimeout(sendInitialData, 1200);
      return () => clearTimeout(timer);
    }
  }, [
    activeChat,
    currentConversationId,
    userProfile,
    autoDataSent,
    setAutoDataSent,
    toast,
    plantInfo // Aggiungiamo plantInfo alle dipendenze
  ]);

  return null; // This is a logic-only component
};
