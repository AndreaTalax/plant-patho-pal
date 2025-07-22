import { supabase } from '@/integrations/supabase/client';
import { showErrorToast, showSuccessToast } from '@/components/ui/error-toast';

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
    source?: string;
    fallback?: boolean;
    reason?: string;
    timestamp?: string;
    imageSize?: number;
    suggestions?: string[];
  };
}

export class RealPlantAnalysisService {
  /**
   * Analyzes plant health using real APIs with improved error handling.
   */
  static async analyzePlantWithRealAPIs(
    imageDataUrl: string,
    plantInfo: any
  ): Promise<PlantAnalysisResult> {
    try {
      console.log('🔍 Starting enhanced plant analysis...');
      console.log('📷 Image data URL length:', imageDataUrl.length);
      console.log('🌿 Plant info:', plantInfo);
      
      // Convert data URL to base64 for API calls
      const base64 = imageDataUrl.includes(',') ? imageDataUrl.split(',')[1] : imageDataUrl;
      
      if (!base64 || base64.length === 0) {
        throw new Error('Invalid image data - no base64 content found');
      }
      
      console.log('📸 Base64 data length:', base64.length);
      
      // Validate image size (max 10MB base64)
      if (base64.length > 13421772) { // ~10MB in base64
        throw new Error('Image too large - please use a smaller image (max 10MB)');
      }
      
      // Call the comprehensive plant diagnosis edge function
      const { data, error } = await supabase.functions.invoke('comprehensive-plant-diagnosis', {
        body: {
          imageBase64: base64
        }
      });
      
      if (error) {
        console.error('Edge function error:', error);
        throw new Error(`Analysis service error: ${error.message || 'Service temporarily unavailable'}`);
      }
      
      if (!data) {
        throw new Error('No analysis data received from service');
      }
      
      // Handle plant validation error
      if (data.error === 'NOT_A_PLANT') {
        console.warn('❌ Image validation failed - not a plant');
        return {
          plantName: data.plantName,
          scientificName: data.scientificName,
          confidence: 0,
          isHealthy: false,
          diseases: data.diseases,
          recommendations: data.recommendations,
          analysisDetails: data.analysisDetails
        };
      }
      
      // Transform comprehensive diagnosis result to expected format
      const transformedResult = {
        plantName: data.plantIdentification?.name || 'Pianta sconosciuta',
        scientificName: data.plantIdentification?.scientificName || 'Species unknown',
        confidence: data.confidence || 0,
        isHealthy: data.healthAssessment?.isHealthy !== false,
        diseases: data.healthAssessment?.diseases || [],
        recommendations: data.recommendations || [],
        analysisDetails: {
          ...data.metadata,
          plantId: data.plantIdentification,
          sources: data.sources,
          source: 'Comprehensive AI Analysis',
          fallback: false,
          timestamp: new Date().toISOString()
        }
      };
      
      console.log('✅ Enhanced analysis completed successfully:', transformedResult);
      
      // Provide user feedback based on confidence
      const confidencePercent = Math.round(transformedResult.confidence * 100);
      if (transformedResult.confidence >= 0.8) {
        console.log(`🎯 High confidence analysis: ${confidencePercent}%`);
      } else if (transformedResult.confidence >= 0.6) {
        console.log(`✅ Good confidence analysis: ${confidencePercent}%`);
      } else if (transformedResult.confidence >= 0.4) {
        console.log(`⚠️ Moderate confidence analysis: ${confidencePercent}%`);
      } else {
        console.log(`❌ Low confidence analysis: ${confidencePercent}%`);
      }
      
      return transformedResult;
      
    } catch (error) {
      console.error('❌ Analysis failed:', error);
      
      // Return enhanced fallback analysis with more helpful information
      const fallbackResult: PlantAnalysisResult = {
        plantName: plantInfo?.name || 'Pianta non identificata',
        scientificName: 'Identificazione non riuscita',
        confidence: 0.25,
        isHealthy: false,
        diseases: [{
          name: 'Analisi non completata',
          probability: 0.4,
          description: `Impossibile completare l'analisi automatica. ${error.message}. La nostra AI potrebbe non riconoscere questa specie o l'immagine potrebbe non essere ottimale per l'analisi.`,
          treatment: 'Consulenza con fitopatologo esperto raccomandata per identificazione accurata'
        }],
        recommendations: [
          'Riprova con un\'immagine più chiara e ben illuminata',
          'Assicurati che la pianta occupi la maggior parte dell\'inquadratura',
          'Evita sfondi confusi o riflessi',
          'Per risultati ottimali, consulta direttamente il nostro esperto fitopatologo'
        ],
        analysisDetails: {
          fallback: true,
          reason: error.message,
          timestamp: new Date().toISOString(),
          suggestions: [
            'Immagine più nitida',
            'Migliore illuminazione',
            'Inquadratura più vicina alla pianta',
            'Consulenza esperta'
          ]
        }
      };
      
      return fallbackResult;
    }
  }

  /**
   * Saves plant analysis results to the database with enhanced validation.
   */
  static async saveAnalysisToDatabase(
    userId: string,
    imageUrl: string,
    analysis: PlantAnalysisResult,
    plantInfo: any
  ): Promise<void> {
    try {
      console.log('💾 Saving enhanced analysis to database...');
      console.log('👤 User ID:', userId);
      console.log('📸 Image URL:', imageUrl);
      console.log('🔬 Analysis confidence:', analysis.confidence);
      
      // Check authentication first
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || user.id !== userId) {
        console.error('❌ Authentication failed or user mismatch');
        showErrorToast({
          title: 'Authentication Error',
          description: 'Please ensure you are logged in to save analysis'
        });
        return;
      }
      
      // Enhanced diagnosis data with better categorization
      const diagnosisData = {
        user_id: userId,
        plant_type: analysis.plantName,
        plant_variety: analysis.scientificName,
        symptoms: plantInfo?.symptoms || (analysis.isHealthy ? 'Nessun sintomo rilevato' : 'Possibili problemi rilevati dall\'AI'),
        image_url: imageUrl,
        status: 'completed',
        diagnosis_result: {
          confidence: analysis.confidence,
          confidenceLevel: analysis.confidence >= 0.8 ? 'high' : 
                          analysis.confidence >= 0.6 ? 'good' : 
                          analysis.confidence >= 0.4 ? 'moderate' : 'low',
          isHealthy: analysis.isHealthy,
          diseases: analysis.diseases,
          recommendations: analysis.recommendations,
          analysisDetails: analysis.analysisDetails,
          plantInfo: {
            environment: plantInfo?.isIndoor ? 'Interno' : 'Esterno',
            watering: plantInfo?.wateringFrequency,
            lightExposure: plantInfo?.lightExposure,
            symptoms: plantInfo?.symptoms
          },
          metadata: {
            analysisDate: new Date().toISOString(),
            apiSource: analysis.analysisDetails?.source || 'Enhanced AI Analysis',
            isFallback: analysis.analysisDetails?.fallback || false
          }
        }
      };
      
      console.log('📝 Enhanced diagnosis data to insert:', {
        ...diagnosisData,
        diagnosis_result: { ...diagnosisData.diagnosis_result, analysisDetails: '[OBJECT]' }
      });
      
      const { data, error } = await supabase
        .from('diagnoses')
        .insert(diagnosisData)
        .select()
        .single();
      
      if (error) {
        console.error('Database save error:', error);
        
        if (error.message.includes('row-level security')) {
          console.error('❌ RLS Error: User not authenticated or missing permissions');
          showErrorToast({
            title: 'Permission Denied',
            description: 'Please ensure you are logged in to save diagnosis'
          });
          return;
        }
        
        throw new Error(`Failed to save analysis: ${error.message}`);
      }
      
      console.log('✅ Enhanced analysis saved to database:', data.id);
      
      // Show appropriate success message based on confidence
      const confidencePercent = Math.round(analysis.confidence * 100);
      if (analysis.confidence >= 0.7) {
        showSuccessToast(`Analysis saved successfully (${confidencePercent}% confidence)`);
      } else {
        showSuccessToast(`Analysis saved - expert consultation recommended (${confidencePercent}% confidence)`);
      }
      
    } catch (error) {
      console.error('❌ Failed to save enhanced analysis:', error);
      showErrorToast({
        title: 'Save Failed',
        description: `Failed to save analysis: ${error.message}`
      });
    }
  }
}
