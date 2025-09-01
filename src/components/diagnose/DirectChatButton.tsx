
import React from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';
import { usePlantInfo } from '@/context/PlantInfoContext';
import { PlantDataSyncService } from '@/services/chat/plantDataSyncService';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { NavigationUtils } from '@/utils/navigationUtils';

interface DirectChatButtonProps {
  uploadedImage?: string | File | null;
  isDisabled?: boolean;
}

export const DirectChatButton: React.FC<DirectChatButtonProps> = ({
  uploadedImage,
  isDisabled = false
}) => {
  const { plantInfo, setPlantInfo } = usePlantInfo();
  const { user, userProfile } = useAuth();
  const [isSending, setIsSending] = React.useState(false);

  const handleDirectChat = async () => {
    console.log('🚀 Avvio chat diretta con fitopatologo...');
    
    try {
      if (!user || !userProfile) {
        toast.error('Devi essere autenticato per usare la chat');
        return;
      }

      if (!plantInfo.infoComplete) {
        toast.warning('Completa prima le informazioni sulla pianta');
        return;
      }

      setIsSending(true);

      // Prepara i dati della pianta per la chat diretta
      const updatedPlantInfo = {
        ...plantInfo,
        uploadedImageUrl: typeof uploadedImage === 'string' ? uploadedImage : plantInfo.uploadedImageUrl,
        sendToExpert: true,
        useAI: false, // Non usa AI, va direttamente all'esperto
        infoComplete: true
      };

      // Aggiorna il context
      setPlantInfo(updatedPlantInfo);

      // Prepara il file dell'immagine se disponibile
      let imageFile: File | undefined;
      if (uploadedImage && typeof uploadedImage !== 'string') {
        imageFile = uploadedImage;
      } else if (typeof uploadedImage === 'string' && uploadedImage.startsWith('blob:')) {
        // Converte il blob URL in File
        try {
          const response = await fetch(uploadedImage);
          const blob = await response.blob();
          imageFile = new File([blob], `plant-consultation-${Date.now()}.jpg`, { type: 'image/jpeg' });
        } catch (error) {
          console.warn('Could not convert blob to file:', error);
        }
      }

      // Sincronizza automaticamente i dati con la chat
      const syncResult = await PlantDataSyncService.syncPlantDataToChat(
        user.id, 
        updatedPlantInfo, 
        updatedPlantInfo.uploadedImageUrl,
        imageFile
      );

      if (syncResult.success) {
        console.log('✅ Dati sincronizzati con successo per chat diretta');
        toast.success('✅ Collegamento con il fitopatologo!', {
          description: 'I tuoi dati sono stati inviati automaticamente al Dr. Marco Nigro'
        });
        
        // Reindirizza alla chat
        NavigationUtils.redirectToChat();
      } else {
        toast.error('Errore nell\'invio automatico dei dati');
        // Reindirizza comunque alla chat
        NavigationUtils.redirectToChat();
      }
      
    } catch (error) {
      console.error('❌ Error in handleDirectChat:', error);
      toast.error('Errore nel collegamento alla chat');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Button
      onClick={handleDirectChat}
      disabled={isDisabled || isSending || !plantInfo.infoComplete}
      className="bg-drplant-green hover:bg-drplant-green/90 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 w-full"
    >
      <MessageCircle className="w-5 h-5" />
      {isSending ? 'Collegamento in corso...' : 'Vai alla Chat con Fitopatologo'}
    </Button>
  );
};

export default DirectChatButton;
