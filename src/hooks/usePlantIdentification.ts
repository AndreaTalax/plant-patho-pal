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
      // Uso supabase.rpc per chiamare una funzione che gestisce la logica
      const { data, error } = await supabase.rpc('get_user_identification_usage', {
        p_user_id: user.id
      });

      if (error) {
        console.error('Errore nel caricamento uso identificazioni:', error);
        return;
      }

      setUsage({
        identifications_used: data?.identifications_used || 0,
        free_identifications_limit: FREE_IDENTIFICATIONS_LIMIT,
        has_premium_plan: data?.has_premium_plan || false
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
      const { error } = await supabase.rpc('increment_identification_usage', {
        p_user_id: user.id
      });

      if (error) {
        console.error('Errore nell\'incremento uso identificazioni:', error);
        return;
      }

      setUsage(prev => ({
        ...prev,
        identifications_used: prev.identifications_used + 1
      }));
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

      // Chiama l'API Plant.ID tramite Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('plant-id-diagnosis', {
        body: { 
          imageBase64: imageBase64
        }
      });

      if (error) {
        console.error('Errore identificazione Plant.ID:', error);
        toast.error('Errore nell\'identificazione della pianta');
        return null;
      }

      // Processa i risultati
      const topSuggestion = data.suggestions?.[0];
      if (!topSuggestion) {
        toast.warning('Nessuna identificazione trovata per questa immagine');
        return null;
      }

      const result: PlantIdentificationResult = {
        plantName: topSuggestion.plant_name || 'Pianta non identificata',
        scientificName: topSuggestion.plant_details?.scientific_name || 'Specie sconosciuta',
        confidence: Math.round((topSuggestion.probability || 0.7) * 100),
        commonNames: topSuggestion.plant_details?.common_names || [],
        probability: Math.round((topSuggestion.probability || 0.7) * 100),
        familyName: topSuggestion.plant_details?.taxonomy?.family,
        description: topSuggestion.plant_details?.wiki_description?.value,
        images: topSuggestion.similar_images?.map((img: any) => img.url) || []
      };

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