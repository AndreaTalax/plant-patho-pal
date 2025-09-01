
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { usePlantInfo } from '@/context/PlantInfoContext';
import { useAutoPlantDataSync } from '@/hooks/useAutoPlantDataSync';
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
  const [hasShownInitialSync, setHasShownInitialSync] = useState(false);

  // Usa il nuovo hook per la sincronizzazione automatica
  useAutoPlantDataSync({
    enabled: !!(user?.id && plantInfo.infoComplete),
    onSyncComplete: (success) => {
      if (success) {
        onDataSynced?.();
        
        // Mostra toast solo per la prima sincronizzazione
        if (!hasShownInitialSync) {
          toast.success('Dati della pianta sincronizzati automaticamente!', {
            description: 'L\'esperto può ora vedere tutte le informazioni e l\'immagine',
            duration: 4000
          });
          setHasShownInitialSync(true);
        }
      } else if (!hasShownInitialSync) {
        toast.error('Errore nella sincronizzazione automatica dei dati');
      }
    }
  });

  // Ascolta eventi di sincronizzazione forzata
  useEffect(() => {
    const handleForcedSync = () => {
      console.log('🔄 Forced plant data sync requested');
      setHasShownInitialSync(false); // Reset per mostrare il toast
    };

    window.addEventListener('forcePlantDataSync', handleForcedSync);
    
    return () => {
      window.removeEventListener('forcePlantDataSync', handleForcedSync);
    };
  }, []);

  // Questo componente non renderizza nulla, gestisce solo la logica
  return null;
};
