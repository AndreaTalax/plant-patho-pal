
import { toast } from "sonner";
import { analyzePlantImage, formatHuggingFaceResult, dataURLtoFile, formatPercentage } from './plantAnalysisUtils';
import { analyzeWithCloudVision, fallbackLocalAnalysis } from './plant-id-service';

// Export the utilities for use in other files
export { analyzePlantImage, formatHuggingFaceResult, dataURLtoFile, formatPercentage };

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
