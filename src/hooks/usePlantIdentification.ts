import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

export interface PlantIdentificationResult {
  plantName: string;
  scientificName: string;
  confidence: number;
  commonNames: string[];
  probability: number;
  familyName?: string;
  description?: string;
  images?: string[];
}

export interface PlantIdentificationUsage {
  identifications_used: number;
  free_identifications_limit: number;
  has_premium_plan: boolean;
}

const FREE_IDENTIFICATIONS_LIMIT = 3;

export const usePlantIdentification = () => {
  const [isIdentifying, setIsIdentifying] = useState(false);
  const [identificationResult, setIdentificationResult] = useState<PlantIdentificationResult | null>(null);
  const [usage, setUsage] = useState<PlantIdentificationUsage>({
    identifications_used: 0,
    free_identifications_limit: FREE_IDENTIFICATIONS_LIMIT,
    has_premium_plan: false
  });
  const { user } = useAuth();

  // Carica l'uso corrente delle identificazioni
  const loadIdentificationUsage = async () => {
    if (!user?.id) return;

    try {
      // Verifica se l'utente ha un piano premium
      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_plan')
        .eq('id', user.id)
        .single();

      const hasPremium = profile?.subscription_plan === 'premium' || 
                        profile?.subscription_plan === 'business' ||
                        profile?.subscription_plan === 'professional';

      // Per ora impostiamo un valore fisso, poi useremo la tabella reale
      setUsage({
        identifications_used: 0, // Sarà implementato dopo
        free_identifications_limit: FREE_IDENTIFICATIONS_LIMIT,
        has_premium_plan: hasPremium
      });
    } catch (error) {
      console.error('Errore nel caricamento uso identificazioni:', error);
    }
  };

  // Verifica se l'utente può usare l'identificazione
  const canUseIdentification = () => {
    return usage.has_premium_plan || usage.identifications_used < usage.free_identifications_limit;
  };

  // Incrementa il contatore delle identificazioni usate
  const incrementIdentificationUsage = async () => {
    if (!user?.id) return;

    try {
      // Per ora incrementiamo solo il valore locale
      setUsage(prev => ({
        ...prev,
        identifications_used: prev.identifications_used + 1
      }));
      
      console.log('Identificazione incrementata localmente');
    } catch (error) {
      console.error('Errore nell\'incremento uso identificazioni:', error);
    }
  };

  // Identifica la pianta tramite Plant.ID
  const identifyPlant = async (imageFile: File): Promise<PlantIdentificationResult | null> => {
    if (!user?.id) {
      toast.error('Devi essere autenticato per utilizzare questa funzionalità');
      return null;
    }

    if (!canUseIdentification()) {
      toast.error(`Hai esaurito le ${FREE_IDENTIFICATIONS_LIMIT} identificazioni gratuite. Abbonati per continuare!`);
      return null;
    }

    setIsIdentifying(true);
    
    try {
      // Converti l'immagine in base64
      const reader = new FileReader();
      const imageBase64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          if (reader.result) {
            const base64 = reader.result.toString().split(',')[1];
            resolve(base64);
          } else {
            reject(new Error('Errore nella lettura del file'));
          }
        };
        reader.onerror = () => reject(new Error('Errore nella lettura del file'));
        reader.readAsDataURL(imageFile);
      });

      // Usa il servizio con fallback PlantNet integrato
      console.log('🌿 Avvio identificazione con Plant.ID e fallback PlantNet...');
      const { data, error } = await supabase.functions.invoke('global-plant-identification', {
        body: { 
          imageBase64: `data:image/jpeg;base64,${imageBase64}`
        }
      });

      if (error || !data?.success) {
        console.error('Errore identificazione:', error);
        
        // Messaggio più specifico basato sul tipo di errore
        const errorMessage = data?.fallbackMessage || 'Errore nell\'identificazione della pianta';
        toast.error(errorMessage);
        return null;
      }

      // Processa i risultati dal servizio globale
      const bestPlant = data.plantIdentification?.[0];
      if (!bestPlant) {
        toast.warning('Nessuna identificazione trovata per questa immagine');
        return null;
      }

      const result: PlantIdentificationResult = {
        plantName: bestPlant.name || 'Pianta non identificata',
        scientificName: bestPlant.scientificName || 'Specie sconosciuta',
        confidence: Math.round(bestPlant.confidence || 50),
        commonNames: [],
        probability: Math.round(bestPlant.confidence || 50),
        familyName: bestPlant.family,
        description: data.gbifInfo?.vernacularName || undefined,
        images: []
      };

      // Mostra da quale fonte proviene l'identificazione
      const sourceMessage = bestPlant.source === 'PlantNet' 
        ? 'Identificata con PlantNet (fallback)'
        : `Identificata con ${bestPlant.source}`;
      
      console.log(`✅ ${sourceMessage}`);

      setIdentificationResult(result);
      
      // Incrementa l'uso solo se l'identificazione è riuscita
      await incrementIdentificationUsage();
      
      toast.success('Pianta identificata con successo!');
      return result;

    } catch (error) {
      console.error('Errore nell\'identificazione della pianta:', error);
      toast.error('Errore nell\'identificazione della pianta');
      return null;
    } finally {
      setIsIdentifying(false);
    }
  };

  // Resetta i risultati
  const resetIdentification = () => {
    setIdentificationResult(null);
  };

  // Ottieni le identificazioni rimanenti
  const getRemainingIdentifications = () => {
    if (usage.has_premium_plan) return 'illimitate';
    return Math.max(0, usage.free_identifications_limit - usage.identifications_used);
  };

  return {
    isIdentifying,
    identificationResult,
    usage,
    canUseIdentification,
    identifyPlant,
    resetIdentification,
    loadIdentificationUsage,
    getRemainingIdentifications
  };
};