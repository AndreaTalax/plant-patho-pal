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
   * Identifica pianta usando servizi AI reali invece di fallback
   */
  static async identifyPlantGlobally(imageBase64: string): Promise<GlobalIdentificationResult> {
    try {
      console.log('🌿 Avvio identificazione con AI reali...');
      
      // Prima prova con Plant.ID per identificazione accurata
      const { data: plantIdData, error: plantIdError } = await supabase.functions.invoke('plant-id-diagnosis', {
        body: { imageBase64 }
      });

      if (!plantIdError && plantIdData?.success) {
        console.log('✅ Plant.ID completato con successo');
        
        // Prova anche diagnosi malattie con AI specializzati
        const { data: diseaseData, error: diseaseError } = await supabase.functions.invoke('plant-diagnosis', {
          body: { imageBase64 }
        });

        let diseases = [];
        if (!diseaseError && diseaseData?.diseases) {
          diseases = diseaseData.diseases.map((disease: any) => ({
            name: disease.name || disease.disease,
            confidence: disease.confidence || disease.probability * 100,
            symptoms: disease.symptoms || [],
            treatments: disease.treatments || disease.treatment || [],
            cause: disease.description || disease.cause || 'Causa da determinare',
            source: 'Plant.ID Disease Detection'
          }));
        }

        return {
          plantIdentification: [{
            name: plantIdData.plantName,
            scientificName: plantIdData.scientificName,
            confidence: plantIdData.confidence,
            source: 'Plant.ID',
            family: plantIdData.plantDetails?.family,
            genus: plantIdData.plantDetails?.genus
          }],
          diseases: diseases,
          success: true,
          isFallback: false
        };
      }

      // Fallback con PlantNet se Plant.ID fallisce
      console.log('🔄 Tentativo con PlantNet...');
      const { data: plantNetData, error: plantNetError } = await supabase.functions.invoke('plantnet-identification', {
        body: { imageBase64 }
      });

      if (!plantNetError && plantNetData?.results?.length > 0) {
        console.log('✅ PlantNet completato con successo');
        
        const bestMatch = plantNetData.results[0];
        return {
          plantIdentification: [{
            name: bestMatch.species?.commonNames?.[0] || bestMatch.species?.scientificNameWithoutAuthor,
            scientificName: bestMatch.species?.scientificNameWithoutAuthor || '',
            confidence: (bestMatch.score || 0.5) * 100,
            source: 'PlantNet',
            family: bestMatch.species?.family?.scientificNameWithoutAuthor,
            genus: bestMatch.species?.genus?.scientificNameWithoutAuthor
          }],
          diseases: [],
          success: true,
          isFallback: false
        };
      }

      // Solo se tutto fallisce, usa il sistema veloce come ultima risorsa
      console.log('🔄 Ultima risorsa: sistema veloce...');
      const { data: fastData, error: fastError } = await supabase.functions.invoke('unified-plant-diagnosis', {
        body: { imageBase64 }
      });

      if (!fastError && fastData?.success) {
        const diagnosis = fastData.diagnosis;
        return {
          plantIdentification: [{
            name: diagnosis.plantIdentification.name,
            scientificName: diagnosis.plantIdentification.scientificName,
            confidence: diagnosis.plantIdentification.confidence,
            source: 'AI Backup',
            family: diagnosis.plantIdentification.family
          }],
          diseases: diagnosis.healthAnalysis.issues.map((issue: any) => ({
            name: issue.name,
            confidence: issue.confidence,
            symptoms: issue.symptoms || [],
            treatments: issue.treatment || [],
            cause: issue.description,
            source: 'AI Health Analysis'
          })),
          success: true,
          isFallback: true,
          fallbackMessage: 'Identificazione tramite AI di backup'
        };
      }

      // Se proprio tutto fallisce, errore chiaro invece di suggerimenti casuali
      throw new Error('Tutti i servizi AI sono temporaneamente non disponibili');

    } catch (error) {
      console.error('❌ Errore servizio identificazione:', error);
      return {
        plantIdentification: [],
        diseases: [],
        success: false,
        isFallback: true,
        fallbackMessage: 'Errore nei servizi AI. Riprova tra qualche minuto o usa un\'immagine più chiara.'
      };
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
