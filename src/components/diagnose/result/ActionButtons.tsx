
import React from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle, Save, Repeat } from 'lucide-react';
import { usePlantInfo } from '@/context/PlantInfoContext';
import { usePlantDiagnosis } from '@/hooks/usePlantDiagnosis';
import { toast } from 'sonner';

interface ActionButtonsProps {
  onRetry: () => void;
  isRetrying: boolean;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  onRetry,
  isRetrying
}) => {
  const { plantInfo, setPlantInfo } = usePlantInfo();
  const { saveDiagnosis, isSaving, uploadedImage } = usePlantDiagnosis();

  const handleGoToChat = async () => {
    console.log('🚀 Starting comprehensive chat with expert...');
    
    try {
      // Assicurati che l'immagine sia sempre inclusa nel plantInfo
      const finalImageUrl = plantInfo.uploadedImageUrl || uploadedImage;
      
      if (finalImageUrl && finalImageUrl !== plantInfo.uploadedImageUrl) {
        console.log('📸 Updating plantInfo with image:', finalImageUrl);
        setPlantInfo({
          ...plantInfo,
          uploadedImageUrl: finalImageUrl
        });
      }

      // Marca che i dati devono essere inviati all'esperto
      setPlantInfo({
        ...plantInfo,
        uploadedImageUrl: finalImageUrl,
        sendToExpert: true,
        infoComplete: true
      });

      console.log('📤 Sending comprehensive consultation data...', {
        plantInfo: { ...plantInfo, uploadedImageUrl: finalImageUrl },
        sendToExpert: true
      });

      // Usa window.location per un redirect più affidabile
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.set('tab', 'chat');
      window.location.href = currentUrl.toString();
      
      toast.success('Reindirizzamento alla chat con l\'esperto...');
      
    } catch (error) {
      console.error('❌ Error in handleGoToChat:', error);
      toast.error('Errore nel reindirizzamento alla chat');
    }
  };

  const handleSaveDiagnosis = async () => {
    try {
      await saveDiagnosis();
    } catch (error) {
      console.error('Error saving diagnosis:', error);
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
        disabled={isSaving}
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

// Add default export
export default ActionButtons;
