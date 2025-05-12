
import { supabase } from '@/integrations/supabase/client';

/**
 * Sends an image to the plant diagnosis service for analysis
 * @param imageFile The image file to analyze
 * @returns The diagnosis result
 */
export const analyzePlantImage = async (imageFile: File) => {
  try {
    // Create a FormData object to send the image
    const formData = new FormData();
    formData.append('file', imageFile);

    // Call the Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('plant-diagnosis', {
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (error) {
      console.error('Error calling plant-diagnosis function:', error);
      throw new Error(`Error analyzing image: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Error in analyzePlantImage:', error);
    throw error;
  }
};

// Type definition for the diagnosis result
export interface PlantDiagnosisResult {
  plant: string;
  disease: string;
  probability: number;
  suggestions: string[];
  error?: string;
}
