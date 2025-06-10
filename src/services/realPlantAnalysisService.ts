
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
  };
}

export class RealPlantAnalysisService {
  /**
   * Analyzes plant health using real APIs.
   * @example
   * analyzePlantWithRealAPIs('data:image/jpeg;base64,...', { name: 'Rose' })
   * Returns a PlantAnalysisResult object with plant health details.
   * @param {string} imageDataUrl - Base64 encoded plant image data URL.
   * @param {any} plantInfo - Information about the plant such as name and other metadata.
   * @returns {Promise<PlantAnalysisResult>} A promise that resolves to a PlantAnalysisResult object containing plant health analysis details.
   * @description
   *   - Converts the image data URL to base64 format for API processing.
   *   - Invokes an edge function using Supabase to analyze plant health.
   *   - Handles API errors and provides a fallback analysis result in case of failures.
   */
  static async analyzePlantWithRealAPIs(
    imageDataUrl: string,
    plantInfo: any
  ): Promise<PlantAnalysisResult> {
    try {
      console.log('🔍 Starting real plant analysis...');
      console.log('📷 Image data URL length:', imageDataUrl.length);
      console.log('🌿 Plant info:', plantInfo);
      
      // Convert data URL to base64 for API calls
      const base64 = imageDataUrl.includes(',') ? imageDataUrl.split(',')[1] : imageDataUrl;
      
      if (!base64 || base64.length === 0) {
        throw new Error('Invalid image data - no base64 content found');
      }
      
      console.log('📸 Base64 data length:', base64.length);
      
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
      
      console.log('✅ Analysis completed successfully:', data);
      return data;
      
    } catch (error) {
      console.error('❌ Analysis failed:', error);
      
      // Return fallback analysis
      return {
        plantName: plantInfo?.name || 'Unknown Plant',
        confidence: 0.5,
        isHealthy: false,
        diseases: [{
          name: 'Unable to analyze',
          probability: 0.5,
          description: 'Analysis service temporarily unavailable. Please consult with our expert for detailed analysis.',
          treatment: 'Consult with phytopathologist expert'
        }],
        recommendations: ['Please consult with our expert for detailed analysis'],
        analysisDetails: {}
      };
    }
  }

  /**
  * Saves plant analysis results to the database after validating user authentication.
  * @example
  * saveAnalysisToDatabase("user123", "http://example.com/image.jpg", analysisResult, plantInfo)
  * // No return value, function updates database if successful
  * @param {string} userId - The ID of the user saving the analysis.
  * @param {string} imageUrl - URL of the image related to the analysis.
  * @param {PlantAnalysisResult} analysis - The result of the plant analysis containing various data points.
  * @param {any} plantInfo - Additional plant information, including symptoms.
  * @returns {Promise<void>} No return value, operates asynchronously.
  * @description
  *   - Ensures the user is authenticated before saving the analysis.
  *   - Handles row-level security errors related to database permissions.
  *   - Provides feedback through console logs and toast notifications on success or failure.
  *   - Inserts the diagnosis data into the 'diagnoses' table and selects the inserted row.
  */
  static async saveAnalysisToDatabase(
    userId: string,
    imageUrl: string,
    analysis: PlantAnalysisResult,
    plantInfo: any
  ): Promise<void> {
    try {
      console.log('💾 Saving analysis to database...');
      console.log('👤 User ID:', userId);
      console.log('📸 Image URL:', imageUrl);
      console.log('🔬 Analysis:', analysis);
      
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
      
      const diagnosisData = {
        user_id: userId,
        plant_type: analysis.plantName,
        plant_variety: analysis.scientificName,
        symptoms: plantInfo?.symptoms || 'AI analysis performed',
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
      
      console.log('📝 Diagnosis data to insert:', diagnosisData);
      
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
        
        throw new Error('Failed to save analysis');
      }
      
      console.log('✅ Analysis saved to database:', data.id);
      showSuccessToast('Analysis saved successfully');
      
    } catch (error) {
      console.error('❌ Failed to save analysis:', error);
      showErrorToast({
        title: 'Save Failed',
        description: 'Failed to save analysis to database'
      });
    }
  }
}
