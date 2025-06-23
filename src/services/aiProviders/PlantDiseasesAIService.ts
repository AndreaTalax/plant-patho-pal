
import { supabase } from '@/integrations/supabase/client';

export interface PlantDiseaseResult {
  diseaseName: string;
  confidence: number;
  severity: 'low' | 'medium' | 'high';
  symptoms: string[];
  treatment: string[];
  provider: 'plant-diseases-ai';
  isHealthy: boolean;
}

export class PlantDiseasesAIService {
  static async detectDiseases(imageBase64: string): Promise<PlantDiseaseResult[]> {
    try {
      console.log("🦠 PlantDiseasesAI: Rilevamento malattie...");
      
      const { data, error } = await supabase.functions.invoke('analyze-plant-diseases', {
        body: { 
          image: imageBase64,
          detailed: true
        }
      });
      
      if (error) throw error;
      
      if (data.isHealthy) {
        return [{
          diseaseName: 'Pianta Sana',
          confidence: Math.round((data.healthConfidence || 0.8) * 100),
          severity: 'low',
          symptoms: ['Nessun sintomo rilevato'],
          treatment: ['Mantenere cure standard'],
          provider: 'plant-diseases-ai',
          isHealthy: true
        }];
      }
      
      return (data.diseases || []).map((disease: any) => ({
        diseaseName: disease.name || 'Malattia non specificata',
        confidence: Math.round((disease.confidence || 0.6) * 100),
        severity: disease.severity || 'medium',
        symptoms: disease.symptoms || ['Sintomi da determinare'],
        treatment: disease.treatment || ['Consulta esperto'],
        provider: 'plant-diseases-ai' as const,
        isHealthy: false
      }));
      
    } catch (error) {
      console.warn('PlantDiseasesAI failed:', error);
      return [{
        diseaseName: 'Analisi limitata',
        confidence: 50,
        severity: 'medium',
        symptoms: ['Richiede analisi manuale'],
        treatment: ['Consulenza esperta raccomandata'],
        provider: 'plant-diseases-ai',
        isHealthy: false
      }];
    }
  }
}
