
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PlantAnalysisResult {
  plantName: string;
  scientificName?: string;
  confidence: number;
  isHealthy: boolean;
  diseases: Array<{
    name: string;
    probability: number;
    description?: string;
    treatment?: string;
  }>;
  recommendations: string[];
  analysisDetails: {
    plantId?: any;
    huggingFace?: any;
    eppo?: any;
  };
}

export class RealPlantAnalysisService {
  static async analyzePlantWithRealAPIs(
    imageDataUrl: string,
    plantInfo: any
  ): Promise<PlantAnalysisResult> {
    try {
      console.log('🔍 Starting real plant analysis...');
      
      // Convert data URL to blob for API calls
      const response = await fetch(imageDataUrl);
      const blob = await response.blob();
      
      // Convert blob to base64 for API calls
      const base64 = await this.blobToBase64(blob);
      
      // Call the plant diagnosis edge function
      const { data, error } = await supabase.functions.invoke('plant-diagnosis', {
        body: {
          image: base64,
          plantInfo: plantInfo
        }
      });
      
      if (error) {
        console.error('Edge function error:', error);
        throw new Error('Analysis service temporarily unavailable');
      }
      
      console.log('✅ Analysis completed successfully');
      return data;
      
    } catch (error) {
      console.error('❌ Analysis failed:', error);
      
      // Return fallback analysis
      return {
        plantName: plantInfo.name || 'Unknown Plant',
        confidence: 0.5,
        isHealthy: false,
        diseases: [{
          name: 'Unable to analyze',
          probability: 0.5,
          description: 'Analysis service temporarily unavailable'
        }],
        recommendations: ['Please consult with our expert for detailed analysis'],
        analysisDetails: {}
      };
    }
  }

  static async saveAnalysisToDatabase(
    userId: string,
    imageUrl: string,
    analysis: PlantAnalysisResult,
    plantInfo: any
  ): Promise<void> {
    try {
      console.log('💾 Saving analysis to database...');
      
      const diagnosisData = {
        user_id: userId,
        plant_type: analysis.plantName,
        plant_variety: analysis.scientificName,
        symptoms: plantInfo.symptoms || 'AI analysis performed',
        image_url: imageUrl,
        status: 'completed',
        diagnosis_result: {
          confidence: analysis.confidence,
          isHealthy: analysis.isHealthy,
          diseases: analysis.diseases,
          recommendations: analysis.recommendations,
          analysisDetails: analysis.analysisDetails
        }
      };
      
      const { data, error } = await supabase
        .from('diagnoses')
        .insert(diagnosisData)
        .select()
        .single();
      
      if (error) {
        console.error('Database save error:', error);
        throw new Error('Failed to save analysis');
      }
      
      console.log('✅ Analysis saved to database:', data.id);
      
    } catch (error) {
      console.error('❌ Failed to save analysis:', error);
      toast.error('Failed to save analysis to database');
    }
  }

  private static blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}
