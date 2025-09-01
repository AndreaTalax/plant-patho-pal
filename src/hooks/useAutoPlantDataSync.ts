
import { useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { usePlantInfo } from '@/context/PlantInfoContext';
import { PlantDataSyncService } from '@/services/chat/plantDataSyncService';
import { toast } from 'sonner';

interface UseAutoPlantDataSyncOptions {
  enabled?: boolean;
  onSyncComplete?: (success: boolean) => void;
}

/**
 * Hook per la sincronizzazione automatica dei dati della pianta
 */
export const useAutoPlantDataSync = (options: UseAutoPlantDataSyncOptions = {}) => {
  const { enabled = true, onSyncComplete } = options;
  const { user } = useAuth();
  const { plantInfo } = usePlantInfo();
  const lastSyncRef = useRef<string>('');
  const syncTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!enabled || !user?.id || !plantInfo.infoComplete) {
      return;
    }

    // Crea una chiave univoca basata sui dati della pianta per evitare sync duplicati
    const syncKey = JSON.stringify({
      name: plantInfo.name,
      isIndoor: plantInfo.isIndoor,
      wateringFrequency: plantInfo.wateringFrequency,
      lightExposure: plantInfo.lightExposure,
      symptoms: plantInfo.symptoms,
      uploadedImageUrl: plantInfo.uploadedImageUrl,
      hasAiDiagnosis: !!plantInfo.aiDiagnosis
    });

    // Se i dati non sono cambiati, non fare nulla
    if (syncKey === lastSyncRef.current) {
      return;
    }

    // Debounce la sincronizzazione per evitare troppe chiamate
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    syncTimeoutRef.current = setTimeout(async () => {
      try {
        console.log('🔄 Auto-syncing plant data due to changes...');
        
        const result = await PlantDataSyncService.forceSyncPlantData(
          user.id,
          plantInfo,
          plantInfo.uploadedImageUrl || undefined,
          plantInfo.uploadedFile || undefined
        );

        if (result.success) {
          lastSyncRef.current = syncKey;
          console.log('✅ Auto-sync completed successfully');
          onSyncComplete?.(true);
        } else {
          console.error('❌ Auto-sync failed');
          onSyncComplete?.(false);
        }
      } catch (error) {
        console.error('❌ Error in auto-sync:', error);
        onSyncComplete?.(false);
      }
    }, 1000); // Debounce di 1 secondo

    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [enabled, user?.id, plantInfo, onSyncComplete]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, []);
};
