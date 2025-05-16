
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { preprocessImageForPlantDetection, validateImageForAnalysis, resizeImageForOptimalDetection } from "./image-utils";

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
    // Validate and preprocess the image
    const isValid = await validateImageForAnalysis(imageFile);
    if (!isValid) {
      toast.error("Image is not suitable for analysis. Please use a clearer plant image.");
      return null;
    }

    // Apply preprocessing to improve plant detection
    const processedImage = await preprocessImageForPlantDetection(imageFile);
    
    // Resize image to optimal dimensions for ML models
    const optimizedImage = await resizeImageForOptimalDetection(processedImage);
    
    const formData = new FormData();
    formData.append('image', optimizedImage);
    formData.append('optimized', 'true'); // Flag to indicate optimized image

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
        console.log(`Plant analysis attempt ${attempts}/${maxAttempts}...`);
        
        const response = await supabase.functions.invoke('analyze-plant', {
          body: formData,
          headers: {
            'Accept': 'application/json',
          },
        });
        
        data = response.data;
        error = response.error;
        
        // Log the response for debugging
        console.log('Plant analysis response:', data);
        
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
    
    // Handle different analysis outcomes
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
