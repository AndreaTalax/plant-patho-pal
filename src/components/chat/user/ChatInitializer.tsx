
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
      if (
        !activeChat ||
        activeChat !== 'expert' ||
        !currentConversationId ||
        !plantInfo?.infoComplete ||
        !userProfile ||
        autoDataSent
      ) {
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

        const plantData = {
          symptoms: plantInfo.symptoms || 'Nessun sintomo specificato',
          wateringFrequency: plantInfo.wateringFrequency || 'Non specificata',
          sunExposure: plantInfo.lightExposure || 'Non specificata',
          environment: plantInfo.isIndoor ? 'Interno' : 'Esterno',
          plantName: plantInfo.name || 'Pianta non identificata',
          imageUrl: plantInfo.uploadedImageUrl,
          aiDiagnosis: (plantInfo as any).aiDiagnosis,
          useAI: plantInfo.useAI,
          sendToExpert: plantInfo.sendToExpert
        };

        const userData = {
          firstName: userProfile.first_name || userProfile.firstName || "",
          lastName: userProfile.last_name || userProfile.lastName || "",
          email: userProfile.email || "",
          birthDate: userProfile.birth_date || userProfile.birthDate || "",
          birthPlace: userProfile.birth_place || userProfile.birthPlace || ""
        };

        console.log('[AUTO-DATA 📤] Invio Dati:', { ...plantData, hasImage: !!plantData.imageUrl });

        const success = await ConsultationDataService.sendInitialConsultationData(
          currentConversationId,
          plantData,
          userData,
          plantInfo.useAI || false
        );

        setAutoDataSent(true);

        if (success) {
          toast({
            title: 'Dati e foto inviati automaticamente all\'esperto!',
            description: 'Marco Nigro ha ricevuto tutte le informazioni e la foto della tua pianta',
            duration: 4000,
          });
        } else {
          toast({
            title: 'Attenzione: dati automatici non inviati, riprova tra poco.',
            description: '',
            duration: 4000,
            variant: 'destructive'
          });
        }

      } catch (error) {
        setAutoDataSent(false);
        console.error('[AUTO-DATA ❌]', error);
        toast({
          title: 'Errore nell\'invio automatico dei dati',
          description: '',
          duration: 4000,
          variant: 'destructive'
        });
      }
    };

    if (
      activeChat === 'expert' &&
      currentConversationId &&
      plantInfo?.infoComplete &&
      userProfile
    ) {
      const timer = setTimeout(sendInitialData, 1200);
      return () => clearTimeout(timer);
    }
  }, [
    activeChat,
    currentConversationId,
    plantInfo?.infoComplete,
    plantInfo?.uploadedImageUrl,
    userProfile,
    autoDataSent,
    setAutoDataSent,
    toast
  ]);

  return null; // This is a logic-only component
};
