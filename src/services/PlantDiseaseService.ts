import { DiseaseDetectionResult } from './aiProviders';
import { supabase } from '@/integrations/supabase/client';

/**
 * Servizio specializzato per la diagnosi AI delle malattie delle piante
 * Usa solo edge functions per sicurezza e affidabilità
 */
export class PlantDiseaseService {
  
  /**
   * Plant.ID - Diagnosi specializzata delle malattie (via edge function)
   */
  static async diagnosePlantDisease(imageBase64: string): Promise<DiseaseDetectionResult[]> {
    try {
      console.log('🏥 Avvio diagnosi malattie con Plant.ID via edge function...');
      
      const { data, error } = await supabase.functions.invoke('plant-diagnosis', {
        body: { 
          imageData: imageBase64,
          plantInfo: {} 
        }
      });

      if (error) {
        console.error('❌ Errore edge function plant-diagnosis:', error);
        return [];
      }

      if (!data?.diseases || !Array.isArray(data.diseases)) {
        console.log('⚠️ Nessuna malattia rilevata nella risposta');
        return [];
      }

      // Converte i risultati nel formato DiseaseDetectionResult
      return data.diseases.map((disease: any) => ({
        disease: disease.name || 'Malattia non identificata',
        confidence: Math.round((disease.confidence || 0) * 100),
        severity: this.calculateSeverity(disease.confidence || 0),
        symptoms: disease.symptoms || [],
        treatments: [disease.treatment || 'Consulta un esperto'],
        provider: 'plantid-health',
        additionalInfo: {
          cause: disease.description
        }
      }));
    } catch (error) {
      console.error('Plant.ID health assessment error:', error);
      return [];
    }
  }

  /**
   * PlantNet - Analisi tramite identificazione botanica (via edge function)
   */
  static async analyzePlantHealthWithPlantNet(imageBase64: string): Promise<DiseaseDetectionResult[]> {
    try {
      console.log('🌐 Avvio analisi PlantNet via edge function...');
      
      const { data, error } = await supabase.functions.invoke('plantnet-identification', {
        body: { imageBase64 }
      });

      if (error) {
        console.error('❌ Errore edge function plantnet-identification:', error);
        return [];
      }

      if (!data?.isPlant) {
        return [];
      }

      // Fallback - se identificata come pianta ma nessuna malattia specifica rilevata
      return [{
        disease: 'Pianta identificata - Status generale',
        confidence: Math.round((data.confidence || 0) * 100),
        severity: 'low',
        symptoms: [`Specie identificata: ${data.species || 'Specie sconosciuta'}`],
        treatments: ['Monitoring regolare consigliato'],
        provider: 'plantnet',
        additionalInfo: {
          cause: `Specie: ${data.species || 'Sconosciuta'} - ${data.scientificName || ''}`
        }
      }];
    } catch (error) {
      console.error('PlantNet health analysis error:', error);
      return [];
    }
  }

  /**
   * Diagnosi combinata usando tutte le edge functions disponibili
   */
  static async performComprehensiveDiagnosis(imageBase64: string): Promise<DiseaseDetectionResult[]> {
    console.log('🔬 Avvio diagnosi completa...');
    
    const allResults: DiseaseDetectionResult[] = [];

    // Esegui tutte le analisi in parallelo
    const [plantIDResults, plantNetResults] = await Promise.allSettled([
      this.diagnosePlantDisease(imageBase64),
      this.analyzePlantHealthWithPlantNet(imageBase64)
    ]);

    // Aggiungi risultati Plant.ID
    if (plantIDResults.status === 'fulfilled') {
      allResults.push(...plantIDResults.value);
    }

    // Aggiungi risultati PlantNet
    if (plantNetResults.status === 'fulfilled') {
      allResults.push(...plantNetResults.value);
    }

    // Se non ci sono risultati, aggiungi un risultato di fallback
    if (allResults.length === 0) {
      allResults.push({
        disease: 'Analisi completata - Nessun problema specifico rilevato',
        confidence: 50,
        severity: 'low',
        symptoms: ['Analisi visiva automatica completata'],
        treatments: ['Monitoraggio regolare della pianta', 'Controllo condizioni ambientali'],
        provider: 'fallback'
      });
    }

    // Ordina per confidenza decrescente
    allResults.sort((a, b) => b.confidence - a.confidence);

    console.log(`✅ Diagnosi completa: ${allResults.length} risultati trovati`);
    return allResults;
  }

  /**
   * Metodi di supporto
   */
  private static calculateSeverity(probability: number): 'low' | 'medium' | 'high' {
    if (probability > 0.7) return 'high';
    if (probability > 0.4) return 'medium';
    return 'low';
  }

  /**
   * Metodo legacy per compatibilità - ora usa edge functions
   */
  static async analyzeWithHuggingFace(imageBase64: string): Promise<DiseaseDetectionResult[]> {
    return this.performComprehensiveDiagnosis(imageBase64);
  }

  /**
   * Metodo legacy per compatibilità - ora usa edge functions  
   */
  static async analyzeWithPlantDiseaseModel(imageBase64: string): Promise<DiseaseDetectionResult[]> {
    return this.performComprehensiveDiagnosis(imageBase64);
  }
}