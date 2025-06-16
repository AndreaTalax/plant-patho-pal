
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Servizio per diagnosi reale delle piante usando API specializzate
 */
export class RealPlantDiagnosisService {
  
  /**
   * Identifica una pianta usando Plant.id API
   */
  static async identifyPlantWithPlantId(imageBase64: string): Promise<{
    success: boolean;
    plantName?: string;
    scientificName?: string;
    confidence?: number;
    commonNames?: string[];
    error?: string;
  }> {
    try {
      console.log('🌱 Identificazione pianta con Plant.id...');
      
      const { data, error } = await supabase.functions.invoke('plant-id-diagnosis', {
        body: { imageBase64 }
      });
      
      if (error) {
        console.error('❌ Errore Plant.id:', error);
        return { success: false, error: error.message };
      }
      
      if (data && data.suggestions && data.suggestions.length > 0) {
        const topSuggestion = data.suggestions[0];
        const confidence = topSuggestion.probability || 0;
        
        // Verifica che la confidenza sia sufficientemente alta
        if (confidence < 0.3) {
          return { 
            success: false, 
            error: `Confidenza troppo bassa (${Math.round(confidence * 100)}%). L'immagine potrebbe non essere chiara o non contenere una pianta riconoscibile.` 
          };
        }
        
        return {
          success: true,
          plantName: topSuggestion.plant_name,
          scientificName: topSuggestion.plant_details?.scientific_name,
          confidence,
          commonNames: topSuggestion.plant_details?.common_names || []
        };
      }
      
      return { success: false, error: 'Nessuna pianta identificata dall\'API' };
      
    } catch (error) {
      console.error('❌ Errore identificazione pianta:', error);
      return { success: false, error: 'Servizio di identificazione non disponibile' };
    }
  }
  
  /**
   * Diagnosi malattie usando Plant.id health assessment
   */
  static async diagnosePlantHealth(imageBase64: string, plantName?: string): Promise<{
    success: boolean;
    isHealthy?: boolean;
    diseases?: Array<{
      name: string;
      probability: number;
      description: string;
      treatment: string;
    }>;
    error?: string;
  }> {
    try {
      console.log('🏥 Diagnosi salute pianta...');
      
      const { data, error } = await supabase.functions.invoke('plant-diagnosis', {
        body: { 
          image: imageBase64,
          plantInfo: { name: plantName }
        }
      });
      
      if (error) {
        console.error('❌ Errore diagnosi:', error);
        return { success: false, error: error.message };
      }
      
      if (data) {
        // Verifica che ci siano risultati di diagnosi reali
        const hasRealDiagnosis = data.analysisDetails && 
          !data.analysisDetails.fallback && 
          data.confidence > 0.4;
        
        if (!hasRealDiagnosis) {
          return { 
            success: false, 
            error: 'Impossibile ottenere una diagnosi affidabile. Prova con un\'immagine più chiara o consulta un esperto.' 
          };
        }
        
        return {
          success: true,
          isHealthy: data.isHealthy,
          diseases: data.diseases || []
        };
      }
      
      return { success: false, error: 'Nessun risultato di diagnosi disponibile' };
      
    } catch (error) {
      console.error('❌ Errore diagnosi salute:', error);
      return { success: false, error: 'Servizio di diagnosi non disponibile' };
    }
  }
}
