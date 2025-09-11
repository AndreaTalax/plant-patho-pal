import { supabase } from '@/integrations/supabase/client';
import { FallbackSuggestionsService } from './fallbackSuggestionsService';

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
  isFallback?: boolean;
  fallbackMessage?: string;
}

export class GlobalPlantIdentificationService {
  /**
   * Identifica pianta usando il sistema ultra-veloce
   */
  static async identifyPlantGlobally(imageBase64: string): Promise<GlobalIdentificationResult> {
    try {
      console.log('⚡ Avvio identificazione ultra-veloce...');
      
      // Prima prova con il sistema ultra-veloce
      const { data: fastData, error: fastError } = await supabase.functions.invoke('unified-plant-diagnosis', {
        body: { imageBase64 }
      });

      if (!fastError && fastData?.success) {
        console.log('✅ Identificazione veloce completata in', fastData.processingTime);
        
        // Converte il risultato del sistema veloce nel formato atteso
        const diagnosis = fastData.diagnosis;
        return {
          plantIdentification: [{
            name: diagnosis.plantIdentification.name,
            scientificName: diagnosis.plantIdentification.scientificName,
            confidence: diagnosis.plantIdentification.confidence,
            source: 'Ultra-Fast AI',
            family: diagnosis.plantIdentification.family
          }],
          diseases: diagnosis.healthAnalysis.issues.map((issue: any) => ({
            name: issue.name,
            confidence: issue.confidence,
            symptoms: issue.symptoms || [],
            treatments: issue.treatment || [],
            cause: issue.description,
            source: 'Fast Analysis'
          })),
          success: true,
          isFallback: false
        };
      }

      // Fallback rapido se il sistema veloce fallisce
      console.log('🔄 Fallback veloce...');
      return await this.generateEnhancedFallback();

    } catch (error) {
      console.error('❌ Errore servizio identificazione:', error);
      console.log('🔄 Utilizzando sistema di fallback...');
      return await this.generateEnhancedFallback();
    }
  }

  /**
   * Genera un risultato di fallback migliorato con suggerimenti utili
   */
  private static async generateEnhancedFallback(): Promise<GlobalIdentificationResult> {
    const fallbackData = await FallbackSuggestionsService.generateFallbackSuggestions('pianta');
    
    return {
      plantIdentification: fallbackData.plantIdentification.map(plant => ({
        name: plant.plantName,
        scientificName: plant.scientificName,
        confidence: plant.confidence,
        source: 'Suggerimento Sistema',
        family: undefined,
        genus: undefined
      })),
      diseases: fallbackData.diseaseDetection.map(disease => ({
        name: disease.disease,
        confidence: disease.confidence,
        symptoms: disease.symptoms,
        treatments: disease.treatments,
        cause: disease.additionalInfo.cause,
        source: 'Diagnosi Generale'
      })),
      success: true, // Considera il fallback come successo
      isFallback: true,
      fallbackMessage: fallbackData.fallbackMessage
    };
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
