
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PlantAnalysisResult {
  plantName: string;
  scientificName: string;
  confidence: number;
  isHealthy: boolean;
  diseases?: Array<{
    name: string;
    probability: number;
    description: string;
    treatment: string;
  }>;
  suggestions?: Array<{
    plantName: string;
    probability: number;
    similarImages: string[];
  }>;
}

export class RealPlantAnalysisService {
  static async analyzePlantWithRealAPIs(
    imageData: string,
    plantInfo?: any
  ): Promise<PlantAnalysisResult> {
    try {
      console.log('🔍 Starting real plant analysis with multiple APIs...');
      toast.info('Analyzing plant with real AI services...', { duration: 3000 });

      // Call our enhanced plant diagnosis function
      const { data, error } = await supabase.functions.invoke('plant-diagnosis', {
        body: {
          imageData,
          plantInfo,
          useRealAPIs: true
        }
      });

      if (error) {
        console.error('Plant diagnosis error:', error);
        throw new Error(`Analysis failed: ${error.message}`);
      }

      if (!data || !data.success) {
        throw new Error('No valid analysis results received');
      }

      const result: PlantAnalysisResult = {
        plantName: data.analysisDetails?.multiServiceInsights?.plantName || 'Unknown Plant',
        scientificName: data.analysisDetails?.multiServiceInsights?.plantSpecies || '',
        confidence: data.confidence || 0,
        isHealthy: data.healthy || false,
        diseases: data.analysisDetails?.diseases || [],
        suggestions: data.analysisDetails?.plantIdResult?.suggestions || []
      };

      console.log('✅ Real plant analysis completed:', result);
      toast.success(`Plant analyzed successfully with ${Math.round(result.confidence * 100)}% confidence`, { duration: 4000 });

      return result;
    } catch (error) {
      console.error('❌ Real plant analysis failed:', error);
      toast.error(`Analysis failed: ${error.message}`);
      throw error;
    }
  }

  static async saveAnalysisToDatabase(
    userId: string,
    imageUrl: string,
    analysis: PlantAnalysisResult,
    plantInfo?: any
  ) {
    try {
      const { data, error } = await supabase
        .from('diagnoses')
        .insert({
          user_id: userId,
          plant_type: analysis.plantName,
          plant_variety: analysis.scientificName,
          symptoms: plantInfo?.symptoms || 'Analyzed via image upload',
          image_url: imageUrl,
          diagnosis_result: {
            ...analysis,
            timestamp: new Date().toISOString(),
            apiSources: ['Plant.id', 'Hugging Face', 'EPPO Database']
          },
          status: 'completed'
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving analysis:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Failed to save analysis to database:', error);
      throw error;
    }
  }
}
