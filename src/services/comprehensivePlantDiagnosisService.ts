import { supabase } from '@/integrations/supabase/client';

export interface ComprehensivePlantDiagnosis {
  plantIdentification: {
    name: string;
    scientificName: string;
    confidence: number;
    commonNames: string[];
    family?: string;
    genus?: string;
    source: string;
  };
  healthAssessment: {
    isHealthy: boolean;
    overallHealthScore: number;
    diseases: Array<{
      name: string;
      probability: number;
      description: string;
      treatment: any;
      source: string;
    }>;
    pests: Array<{
      name: string;
      probability: number;
      description: string;
      treatment: string;
      source: string;
    }>;
  };
  recommendations: string[];
  sources: string[];
  confidence: number;
  metadata: {
    analysisTime: number;
    imageQuality: string;
    apiResponsesReceived: string[];
  };
}

export interface PlantAnalysisProgress {
  step: string;
  progress: number;
  message: string;
}

async function convertImageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result);
    };
    reader.onerror = () => reject(new Error('Failed to convert image to base64'));
    reader.readAsDataURL(file);
  });
}

export const comprehensivePlantDiagnosisService = {
  async diagnosePlant(
    imageFile: File, 
    onProgress?: (progress: PlantAnalysisProgress) => void
  ): Promise<ComprehensivePlantDiagnosis> {
    try {
      console.log('🔬 Starting comprehensive plant diagnosis...');
      
      const updateProgress = (step: string, progress: number, message: string) => {
        onProgress?.({ step, progress, message });
      };

      updateProgress('preparation', 10, 'Preparazione immagine...');
      
      // Convert image to base64
      const imageBase64 = await convertImageToBase64(imageFile);
      
      updateProgress('uploading', 20, 'Invio immagine per l\'analisi...');
      
      console.log('📡 Calling comprehensive plant diagnosis function...');
      
      updateProgress('analysis', 30, 'Analisi in corso con Plant.id...');
      
      // Simulate progress updates for user experience
      setTimeout(() => updateProgress('analysis', 45, 'Identificazione con PlantNet...'), 1000);
      setTimeout(() => updateProgress('analysis', 60, 'Ricerca nel database EPPO...'), 2000);
      setTimeout(() => updateProgress('analysis', 75, 'Analisi con Hugging Face...'), 3000);
      setTimeout(() => updateProgress('analysis', 90, 'Consolidamento risultati...'), 4000);
      
      // Call the comprehensive diagnosis function
      const { data, error } = await supabase.functions.invoke('comprehensive-plant-diagnosis', {
        body: {
          imageBase64: imageBase64
        }
      });

      if (error) {
        console.error('❌ Comprehensive diagnosis error:', error);
        
        // Fallback to original analyze-plant function if available
        console.log('🔄 Falling back to original analysis...');
        
        try {
          const fallbackResponse = await supabase.functions.invoke('analyze-plant', {
            body: {
              imageBase64: imageBase64
            }
          });

          if (fallbackResponse.error) {
            throw new Error(`Fallback analysis failed: ${fallbackResponse.error.message}`);
          }

          const fallbackData = fallbackResponse.data;
          
          if (!fallbackData.isValidPlantImage) {
            throw new Error(fallbackData.plantVerification?.message || 'Immagine non valida - nessuna pianta rilevata');
          }

          // Convert fallback result to comprehensive format
          const result = fallbackData.analysisResult || fallbackData;
          
          updateProgress('complete', 100, 'Analisi completata (modalità fallback)');
          
          return {
            plantIdentification: {
              name: result.plantName || result.scientificName || 'Specie sconosciuta',
              scientificName: result.scientificName || result.plantName || 'Unknown species',
              confidence: result.confidence || 0.5,
              commonNames: result.commonNames || [],
              family: result.family || '',
              genus: result.genus || '',
              source: 'Fallback Analysis'
            },
            healthAssessment: {
              isHealthy: result.isHealthy !== false,
              overallHealthScore: result.isHealthy ? 0.9 : 0.5,
              diseases: (result.diseases || []).map((disease: any) => ({
                name: typeof disease === 'string' ? disease : disease.name || 'Malattia sconosciuta',
                probability: typeof disease === 'object' ? disease.probability || 0.7 : 0.7,
                description: typeof disease === 'object' ? disease.description || '' : '',
                treatment: typeof disease === 'object' ? disease.treatment || {} : {},
                source: 'Fallback'
              })),
              pests: []
            },
            recommendations: result.recommendations || ['Consultare un esperto per maggiori informazioni'],
            sources: ['Fallback Analysis'],
            confidence: result.confidence || 0.5,
            metadata: {
              analysisTime: Date.now(),
              imageQuality: 'Unknown',
              apiResponsesReceived: ['Fallback']
            }
          };

        } catch (fallbackError) {
          console.error('❌ Fallback analysis also failed:', fallbackError);
          throw new Error(`Analisi fallita: ${error.message}. Fallback: ${fallbackError.message}`);
        }
      }

      console.log('✅ Comprehensive diagnosis completed:', data);

      updateProgress('complete', 100, 'Diagnosi completata con successo!');

      // Process the comprehensive diagnosis response
      if (data.error) {
        throw new Error(data.error);
      }

      // Return the data as-is since it should already be in the correct format
      return data as ComprehensivePlantDiagnosis;

    } catch (error) {
      console.error('❌ Comprehensive plant diagnosis failed:', error);
      
      // Update progress to show error
      onProgress?.({
        step: 'error',
        progress: 0,
        message: `Errore: ${error.message}`
      });
      
      throw error;
    }
  },

  // Helper method to get a summary of the diagnosis
  getDiagnosisSummary(diagnosis: ComprehensivePlantDiagnosis): string {
    const plant = diagnosis.plantIdentification;
    const health = diagnosis.healthAssessment;
    
    let summary = `Pianta identificata: ${plant.name}`;
    
    if (plant.confidence > 0) {
      summary += ` (Confidenza: ${Math.round(plant.confidence * 100)}%)`;
    }
    
    if (health.isHealthy) {
      summary += `\nStato di salute: Sana (Score: ${Math.round(health.overallHealthScore * 100)}%)`;
    } else {
      summary += `\nStato di salute: Problemi rilevati (Score: ${Math.round(health.overallHealthScore * 100)}%)`;
      
      if (health.diseases.length > 0) {
        summary += `\nMalattie: ${health.diseases.length} rilevate`;
      }
      
      if (health.pests.length > 0) {
        summary += `\nParassiti: ${health.pests.length} rilevati`;
      }
    }
    
    if (diagnosis.sources.length > 0) {
      summary += `\nFonti: ${diagnosis.sources.join(', ')}`;
    }
    
    return summary;
  },

  // Helper method to get the best treatment recommendations
  getTreatmentRecommendations(diagnosis: ComprehensivePlantDiagnosis): string[] {
    const recommendations = [...diagnosis.recommendations];
    
    // Add specific treatment recommendations for diseases
    diagnosis.healthAssessment.diseases.forEach(disease => {
      if (disease.treatment && typeof disease.treatment === 'object') {
        if (disease.treatment.biological && disease.treatment.biological.length > 0) {
          recommendations.push(`Per ${disease.name}: Trattamento biologico - ${disease.treatment.biological.join(', ')}`);
        }
        if (disease.treatment.chemical && disease.treatment.chemical.length > 0) {
          recommendations.push(`Per ${disease.name}: Trattamento chimico - ${disease.treatment.chemical.join(', ')}`);
        }
        if (disease.treatment.prevention && disease.treatment.prevention.length > 0) {
          recommendations.push(`Prevenzione ${disease.name}: ${disease.treatment.prevention.join(', ')}`);
        }
      }
    });
    
    // Add pest treatment recommendations
    diagnosis.healthAssessment.pests.forEach(pest => {
      if (pest.treatment) {
        recommendations.push(`Per ${pest.name}: ${pest.treatment}`);
      }
    });
    
    return recommendations;
  }
};