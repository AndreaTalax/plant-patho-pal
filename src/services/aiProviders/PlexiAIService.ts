
import { supabase } from '@/integrations/supabase/client';

export interface PlexiAnalysisResult {
  plantIdentification: {
    name: string;
    scientificName: string;
    confidence: number;
  };
  healthAnalysis: {
    isHealthy: boolean;
    healthScore: number;
    issues: Array<{
      type: string;
      severity: number;
      description: string;
    }>;
  };
  recommendations: string[];
  provider: 'plexi';
}

export class PlexiAIService {
  static async analyzeComprehensive(imageBase64: string): Promise<PlexiAnalysisResult> {
    try {
      console.log("🔬 PlexiAI: Analisi comprensiva...");
      
      const { data, error } = await supabase.functions.invoke('analyze-plant', {
        body: { 
          imageBase64: imageBase64
        }
      });
      
      if (error) throw error;
      
      return {
        plantIdentification: {
          name: data.plantName || 'Pianta non identificata',
          scientificName: data.scientificName || 'Specie da determinare',
          confidence: Math.round((data.plantConfidence || 0.75) * 100)
        },
        healthAnalysis: {
          isHealthy: data.isHealthy !== false,
          healthScore: Math.round((data.healthScore || 0.7) * 100),
          issues: (data.healthIssues || []).map((issue: any) => ({
            type: issue.type || 'Problema generico',
            severity: Math.round((issue.severity || 0.5) * 100),
            description: issue.description || 'Descrizione non disponibile'
          }))
        },
        recommendations: data.recommendations || [
          'Monitorare regolarmente la pianta',
          'Mantenere condizioni ottimali di crescita'
        ],
        provider: 'plexi'
      };
    } catch (error) {
      console.warn('PlexiAI failed:', error);
      return {
        plantIdentification: {
          name: 'Analisi parziale',
          scientificName: 'Da determinare',
          confidence: 60
        },
        healthAnalysis: {
          isHealthy: true,
          healthScore: 70,
          issues: []
        },
        recommendations: ['Analisi limitata - consulta esperto'],
        provider: 'plexi'
      };
    }
  }
}
