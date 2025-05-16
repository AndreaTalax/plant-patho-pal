
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Sends an image to the Supabase Edge Function for plant disease analysis
 * Using a combined approach with PlantSnap and Flora Incognita APIs alongside
 * the PlantNet-inspired approach, TRY Plant Trait Database, New Plant Diseases Dataset,
 * OLID I, and EPPO Global Database
 * @param imageFile The plant image file to analyze
 * @returns The analysis result from the image processing models
 */
export const analyzePlantImage = async (imageFile: File) => {
  try {
    const formData = new FormData();
    formData.append('image', imageFile);

    toast.info("Analyzing your plant image...", {
      duration: 3000,
    });

    // Call the Supabase Edge Function with retry mechanism
    let attempts = 0;
    const maxAttempts = 3;
    let data, error;
    
    while (attempts < maxAttempts) {
      try {
        attempts++;
        const response = await supabase.functions.invoke('analyze-plant', {
          body: formData,
        });
        
        data = response.data;
        error = response.error;
        
        // If successful or got data with error, break
        if (!error || data) break;
        
        // Wait before retrying (exponential backoff)
        if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
          toast.info(`Retrying analysis (attempt ${attempts + 1}/${maxAttempts})...`);
        }
      } catch (retryError) {
        console.error(`Attempt ${attempts} error:`, retryError);
        if (attempts === maxAttempts) {
          error = { message: (retryError as Error).message };
        }
      }
    }

    if (error) {
      console.error('Error calling analyze-plant function:', error);
      toast.error(`Analysis error: ${error.message || 'Unknown error'}`);
      return null;
    }

    console.log('Plant analysis result:', data);
    
    // If the image validation failed, show a specific message
    if (data.isValidPlantImage === false) {
      toast.error("The uploaded image does not appear to contain a plant. Please try with a different image.", {
        duration: 5000,
      });
    } else if (!data.isReliable) {
      toast.warning("The analysis results have low confidence. Consider uploading a clearer image for better results.", {
        duration: 5000,
      });
    } else if (data.eppoRegulatedConcern) {
      // Special EPPO alert for regulated pests and diseases
      toast.error(`ALERT: Possible detection of ${data.eppoRegulatedConcern.name}, a regulated pest/disease. Please report to local plant protection authorities.`, {
        duration: 8000,
      });
    } else {
      toast.success("Plant analysis complete!", {
        duration: 3000,
      });
    }
    
    return data;
  } catch (err) {
    console.error('Exception during plant analysis:', err);
    toast.error(`Analysis error: ${(err as Error).message || 'Unknown error'}`);
    return null;
  }
};
