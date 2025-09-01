
import React from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle, Save, Repeat } from 'lucide-react';
import { usePlantInfo } from '@/context/PlantInfoContext';
import { usePlantDiagnosis } from '@/hooks/usePlantDiagnosis';
import { PlantDataSyncService } from '@/services/chat/plantDataSyncService';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { NavigationUtils } from '@/utils/navigationUtils';

interface ActionButtonsProps {
  onRetry: () => void;
  isRetrying: boolean;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  onRetry,
  isRetrying
}) => {
  const { plantInfo, setPlantInfo } = usePlantInfo();
  const { saveDiagnosis, isSaving, uploadedImage, fullResults, diagnosisResult } = usePlantDiagnosis();
  const { user, userProfile } = useAuth();

  const handleGoToChat = async () => {
    console.log('🚀 Starting comprehensive chat with expert...');
    
    try {
      if (!user || !userProfile) {
        toast.error('Devi essere autenticato per usare la chat');
        return;
      }

      // Prepara i dati della pianta con l'analisi AI completa
      const updatedPlantInfo = {
        ...plantInfo,
        name: fullResults?.consensus?.mostLikelyPlant?.plantName || plantInfo.name || 'Pianta non identificata',
        uploadedImageUrl: typeof uploadedImage === 'string' ? uploadedImage : plantInfo.uploadedImageUrl,
        aiDiagnosis: fullResults,
        useAI: true,
        sendToExpert: true,
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
          imageFile = new File([blob], `plant-${Date.now()}.jpg`, { type: 'image/jpeg' });
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
        console.log('✅ Dati e immagine sincronizzati con successo alla chat');
        toast.success('Dati e immagine inviati automaticamente all\'esperto!', {
          description: 'Tutte le informazioni sono state trasmesse'
        });
        
        // Use the navigation utility to redirect to chat
        NavigationUtils.redirectToChat();
      } else {
        toast.error('Errore nell\'invio automatico dei dati');
        // Redirect to chat anyway
        NavigationUtils.redirectToChat();
      }
      
    } catch (error) {
      console.error('❌ Error in handleGoToChat:', error);
      toast.error('Errore nel reindirizzamento alla chat');
    }
  };

  const handleSaveDiagnosis = async () => {
    try {
      // Verifica che ci siano risultati da salvare
      if (!fullResults || !diagnosisResult) {
        toast.error('Nessuna diagnosi da salvare. Esegui prima una diagnosi.');
        return;
      }

      if (!uploadedImage) {
        toast.error('Nessuna immagine da salvare. Carica prima un\'immagine.');
        return;
      }

      console.log('💾 Salvando diagnosi con dati completi...', {
        hasResults: !!fullResults,
        hasDiagnosis: !!diagnosisResult,
        hasImage: !!uploadedImage
      });

      await saveDiagnosis();
    } catch (error) {
      console.error('Error saving diagnosis:', error);
      toast.error('Errore nel salvare la diagnosi');
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
      <Button
        onClick={handleGoToChat}
        className="bg-drplant-green hover:bg-drplant-green/90 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2"
      >
        <MessageCircle className="w-4 h-4" />
        Vai alla Chat
      </Button>
      
      <Button
        onClick={handleSaveDiagnosis}
        disabled={isSaving || !fullResults || !diagnosisResult}
        variant="outline"
        className="px-6 py-2 rounded-lg font-medium flex items-center gap-2"
      >
        <Save className="w-4 h-4" />
        {isSaving ? 'Salvando...' : 'Salva Diagnosi'}
      </Button>
      
      <Button
        onClick={onRetry}
        disabled={isRetrying}
        variant="outline"
        className="px-6 py-2 rounded-lg font-medium flex items-center gap-2"
      >
        <Repeat className="w-4 h-4" />
        {isRetrying ? 'Rianalizzando...' : 'Rianalizza'}
      </Button>
    </div>
  );
};

export default ActionButtons;
