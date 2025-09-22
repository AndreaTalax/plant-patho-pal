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
  // Plant Health Assessment da Plant.ID
  healthAssessment?: {
    isHealthy: boolean;
    overallScore: number;
    diseases: Array<{
      name: string;
      confidence: number;
      symptoms: string[];
      treatments: string[];
      cause: string;
      source: string;
      severity: 'low' | 'medium' | 'high';
    }>;
    issues: any[];
  };
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

      // Chiama l'API di diagnosi completa Plant.ID (con health assessment)
      const { data, error } = await supabase.functions.invoke('real-plant-diagnosis', {
        body: { 
          imageBase64: imageBase64
        }
      });

      if (error) {
        console.error('Errore diagnosi Plant.ID:', error);
        toast.error('Errore nell\'identificazione e diagnosi della pianta');
        return null;
      }

      // Processa i risultati dalla diagnosi completa
      console.log('🌿 Real Plant Diagnosis response:', data);

      if (!data?.plantIdentification || data.plantIdentification.length === 0) {
        toast.warning('Nessuna identificazione trovata per questa immagine');
        return null;
      }

      // Prendi la migliore identificazione
      const bestIdentification = data.plantIdentification[0];
      
      // Costruisci l'health assessment dai risultati
      const healthAssessment = data.healthAnalysis ? {
        isHealthy: data.healthAnalysis.isHealthy,
        overallScore: data.healthAnalysis.overallScore || 0,
        diseases: data.diseases || [],
        issues: data.healthAnalysis.issues || []
      } : undefined;

      const result: PlantIdentificationResult = {
        plantName: bestIdentification.name || 'Pianta non identificata',
        scientificName: bestIdentification.scientificName || 'Specie sconosciuta',
        confidence: Math.round(bestIdentification.confidence || 70),
        commonNames: [], // Sarà popolato se disponibile nei dati
        probability: Math.round(bestIdentification.confidence || 70),
        familyName: bestIdentification.family,
        description: undefined, // Verrà integrato da Plantarium/GBIF
        images: [], // Sarà popolato se disponibile
        healthAssessment: healthAssessment
      };

      console.log('🌿 Processed plant result:', {
        plantName: result.plantName,
        isHealthy: result.healthAssessment?.isHealthy,
        diseaseCount: result.healthAssessment?.diseases?.length || 0
      });

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