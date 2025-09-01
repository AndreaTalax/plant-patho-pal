
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { usePlantInfo } from '@/context/PlantInfoContext';
import { PlantDataSyncService } from '@/services/chat/plantDataSyncService';
import { toast } from 'sonner';

interface ChatDataManagerProps {
  onDataSynced?: () => void;
}

/**
 * Gestisce la sincronizzazione automatica dei dati della pianta con la chat
 */
export const ChatDataManager = ({ onDataSynced }: ChatDataManagerProps) => {
  const { user } = useAuth();
  const { plantInfo } = usePlantInfo();
  const [syncing, setSyncing] = useState(false);
  const [synced, setSynced] = useState(false);

  useEffect(() => {
    const syncPlantData = async () => {
      if (!user?.id || !plantInfo.infoComplete || syncing || synced) {
        return;
      }

      console.log('🔄 Checking if plant data needs to be synced...');
      
      try {
        setSyncing(true);

        // Verifica se i dati sono già stati sincronizzati
        const alreadySynced = await PlantDataSyncService.isPlantDataSynced(user.id);
        
        if (alreadySynced) {
          console.log('✅ Plant data already synced');
          setSynced(true);
          onDataSynced?.();
          return;
        }

        // Sincronizza i dati della pianta
        const imageUrl = plantInfo.uploadedImageUrl || null;
        const success = await PlantDataSyncService.syncPlantDataToChat(
          user.id, 
          plantInfo, 
          imageUrl
        );

        if (success) {
          setSynced(true);
          onDataSynced?.();
          toast.success('Dati della pianta sincronizzati automaticamente!', {
            description: 'L\'esperto può ora vedere le informazioni inserite'
          });
        }

      } catch (error) {
        console.error('Error syncing plant data:', error);
        toast.error('Errore nella sincronizzazione dei dati');
      } finally {
        setSyncing(false);
      }
    };

    // Delay per permettere al componente di caricare completamente
    const timer = setTimeout(syncPlantData, 1000);
    
    return () => clearTimeout(timer);
  }, [user?.id, plantInfo.infoComplete, plantInfo.uploadedImageUrl, syncing, synced, onDataSynced]);

  // Questo componente non renderizza nulla, gestisce solo la logica
  return null;
};
