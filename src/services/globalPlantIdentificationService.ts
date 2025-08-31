
import { supabase } from '@/integrations/supabase/client';

export interface GlobalPlantIdentification {
  name: string;
  scientificName: string;
  confidence: number;
  source: string;
  family?: string;
  genus?: string;
}

export interface GlobalDiseaseDetection {
  name: string;
  confidence: number;
  symptoms: string[];
  treatments: string[];
  cause: string;
  source: string;
}

export interface GlobalIdentificationResult {
  plantIdentification: GlobalPlantIdentification[];
  diseases: GlobalDiseaseDetection[];
  eppoInfo?: {
    plants: any[];
    pests: any[];
    diseases: any[];
  };
  success: boolean;
}

export class GlobalPlantIdentificationService {
  /**
   * Identifica pianta usando tutte le API disponibili
   */
  static async identifyPlantGlobally(imageBase64: string): Promise<GlobalIdentificationResult> {
    try {
      console.log('🚀 Avvio identificazione globale...');
      
      const { data, error } = await supabase.functions.invoke('global-plant-identification', {
        body: { imageBase64 }
      });

      if (error) {
        console.error('❌ Errore identificazione globale:', error);
        throw error;
      }

      if (!data || !data.success) {
        throw new Error('Identificazione non riuscita');
      }

      console.log('✅ Identificazione globale completata:', {
        plants: data.plantIdentification?.length || 0,
        diseases: data.diseases?.length || 0
      });

      return {
        plantIdentification: data.plantIdentification || [],
        diseases: data.diseases || [],
        eppoInfo: data.eppoInfo,
        success: data.success
      };
    } catch (error) {
      console.error('❌ Errore servizio identificazione globale:', error);
      throw error;
    }
  }

  /**
   * Ottieni il miglior risultato di identificazione
   */
  static getBestPlantIdentification(identifications: GlobalPlantIdentification[]): GlobalPlantIdentification | null {
    if (!identifications || identifications.length === 0) return null;
    
    // Ordina per confidenza decrescente
    const sorted = [...identifications].sort((a, b) => b.confidence - a.confidence);
    return sorted[0];
  }

  /**
   * Ottieni le malattie più probabili
   */
  static getTopDiseases(diseases: GlobalDiseaseDetection[], limit: number = 5): GlobalDiseaseDetection[] {
    if (!diseases || diseases.length === 0) return [];
    
    // Ordina per confidenza decrescente e prendi i primi N
    return [...diseases]
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, limit);
  }

  /**
   * Formatta i risultati per la visualizzazione
   */
  static formatResultsForDisplay(result: GlobalIdentificationResult) {
    const bestPlant = this.getBestPlantIdentification(result.plantIdentification);
    const topDiseases = this.getTopDiseases(result.diseases, 3);

    return {
      plantName: bestPlant?.name || 'Pianta non identificata',
      scientificName: bestPlant?.scientificName || '',
      confidence: bestPlant?.confidence || 0,
      sources: [...new Set(result.plantIdentification.map(p => p.source))],
      hasMultipleSources: result.plantIdentification.length > 1,
      diseases: topDiseases,
      hasEppoInfo: !!result.eppoInfo && (
        (result.eppoInfo.plants?.length > 0) ||
        (result.eppoInfo.pests?.length > 0) ||
        (result.eppoInfo.diseases?.length > 0)
      ),
      totalSources: result.plantIdentification.length + result.diseases.length
    };
  }
}
