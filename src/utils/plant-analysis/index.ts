
import { toast } from "sonner";
import { dataURLtoFile, formatPercentage } from './plantAnalysisUtils';
import { formatHuggingFaceResult } from './result-formatter';
import { analyzeWithCloudVision, fallbackLocalAnalysis } from './plant-id-service';

// Export the utilities for use in other files
export { formatHuggingFaceResult, dataURLtoFile, formatPercentage };

// Main analysis function that connects to Plexi AI via Supabase Edge Function
export const analyzePlant = async (imageFile: File, plantInfo: any = null) => {
  try {
    // Inform the user that we're analyzing the image
    toast.info("Analisi dell'immagine con Plexi AI in corso...", {
      duration: 3000,
      dismissible: true,
    });
    
    // First try to use the Supabase Edge Function for full analysis
    console.log("Trying remote Plexi AI analysis through Supabase Edge Function...");
    const remoteResult = await analyzePlantImage(imageFile);
    
    if (remoteResult) {
      console.log("Remote Plexi AI analysis successful", remoteResult);
      
      // Add plant info context to the result if available
      if (plantInfo) {
        remoteResult.plantInfoContext = plantInfo;
      }
      
      return remoteResult;
    } else {
      console.log("Remote Plexi AI analysis failed, trying cloud vision API...");
      toast.warning("Analisi remota Plexi AI non disponibile. Tentativo con servizio alternativo...", {
        duration: 3000
      });
      
      // Try the secondary Cloud Vision API as fallback
      const cloudVisionResult = await analyzeWithCloudVision(imageFile);
      if (cloudVisionResult) {
        console.log("Cloud Vision analysis successful", cloudVisionResult);
        
        // Add plant info context to the result if available
        if (plantInfo) {
          cloudVisionResult.plantInfoContext = plantInfo;
        }
        
        return cloudVisionResult;
      } else {
        // If all remote services fail, use local analysis
        console.log("All remote analyses failed, using local analysis");
        toast.error("Analisi remote non disponibili. Utilizzo analisi locale.", {
          duration: 5000
        });
        
        const localResult = fallbackLocalAnalysis(imageFile);
        
        // Add plant info context to the result
        if (plantInfo) {
          localResult.plantInfoContext = plantInfo;
        }
        
        return localResult;
      }
    }
  } catch (error) {
    console.error("Error during plant analysis:", error);
    toast.error("Errore durante l'analisi della pianta: " + (error as Error).message, {
      duration: 5000
    });
    
    // Return null if everything fails
    return null;
  }
};

// Add missing analyzePlantImage function
export const analyzePlantImage = async (imageFile: File) => {
  try {
    // Dismiss any existing toasts to prevent stuck notifications
    toast.dismiss();
    
    const formData = new FormData();
    formData.append('image', imageFile);

    toast.info("Analyzing your plant image...", {
      duration: 3000,
      dismissible: true,
    });

    // Call the Supabase Edge Function with retry mechanism
    let attempts = 0;
    const maxAttempts = 3;
    let data, error;
    
    while (attempts < maxAttempts) {
      try {
        attempts++;
        const { data: responseData, error: responseError } = await supabase.functions.invoke('analyze-plant', {
          body: formData,
        });
        
        data = responseData;
        error = responseError;
        
        // If successful or got data with error, break
        if (!error || data) break;
        
        // Wait before retrying (exponential backoff)
        if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
          toast.info(`Retrying analysis (attempt ${attempts + 1}/${maxAttempts})...`, {
            dismissible: true
          });
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
      toast.error(`Analysis error: ${error.message || 'Unknown error'}`, {
        duration: 5000,
        dismissible: true
      });
      return null;
    }

    console.log('Plant analysis result:', data);
    
    // If the image validation failed, show a specific message
    if (data.isValidPlantImage === false) {
      toast.error("The uploaded image does not appear to contain a plant. Please try with a different image.", {
        duration: 5000,
        dismissible: true
      });
    } else if (!data.isReliable) {
      toast.warning("The analysis results have low confidence. Consider uploading a clearer image for better results.", {
        duration: 5000,
        dismissible: true
      });
    } else if (data.eppoRegulatedConcern) {
      // Special EPPO alert for regulated pests and diseases
      toast.error(`ALERT: Possible detection of ${data.eppoRegulatedConcern.name}, a regulated pest/disease. Please report to local plant protection authorities.`, {
        duration: 8000,
        dismissible: true
      });
    } else {
      toast.success("Plant analysis complete!", {
        duration: 3000,
        dismissible: true
      });
    }
    
    return data;
  } catch (err) {
    console.error('Exception during plant analysis:', err);
    toast.error(`Analysis error: ${(err as Error).message || 'Unknown error'}`, {
      duration: 5000,
      dismissible: true
    });
    return null;
  }
};

// Fix the missing supabase import
import { supabase } from "@/integrations/supabase/client";
