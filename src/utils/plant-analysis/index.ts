
import { toast } from "sonner";
import { dataURLtoFile, formatPercentage, preprocessImage, getCachedResponse, cacheResponse, generateImageHash } from './plantAnalysisUtils';
import { formatHuggingFaceResult } from './result-formatter';
import { analyzeWithCloudVision } from './plant-id-service';
import { supabase } from "@/integrations/supabase/client";
import { analyzeWithEnhancedAI } from './enhanced-analysis';
import type { AnalysisProgress } from '../../services/aiProviders';

// Export the utilities for use in other files
export { formatHuggingFaceResult, dataURLtoFile, formatPercentage };

// Plant analysis system with flexible accuracy requirements
export const analyzePlant = async (imageFile: File, plantInfo: any = null) => {
  try {
    // Dismiss any existing toasts
    toast.dismiss();
    
    console.log("Starting plant analysis with flexible accuracy...");
    toast.info("Avvio analisi pianta...", { duration: 3000 });
    
    // Enhanced AI analysis with 60% minimum accuracy requirement
    const progressCallback = (progress: AnalysisProgress) => {
      console.log(`${progress.stage}: ${progress.percentage}% - ${progress.message}`);
      
      if (progress.percentage < 100) {
        toast.info(`${progress.message} (${progress.percentage}%)`, { duration: 2000 });
      }
    };
    
    const enhancedResult = await analyzeWithEnhancedAI(imageFile, plantInfo, progressCallback);
    
    // Verify minimum accuracy requirement (now 60% instead of 90%)
    if (!enhancedResult || enhancedResult.confidence < 0.6) {
      const accuracy = enhancedResult?.confidence ? Math.round(enhancedResult.confidence * 100) : 0;
      throw new Error(`Accuratezza insufficiente: ${accuracy}%. Richiesta accuratezza minima: 60%`);
    }
    
    console.log("Analysis completed successfully:", enhancedResult);
    const accuracyPercent = Math.round(enhancedResult.confidence * 100);
    
    if (enhancedResult.confidence >= 0.8) {
      toast.success(`Analisi completata con ${accuracyPercent}% di accuratezza`, { duration: 3000 });
    } else {
      toast.success(`Analisi completata con ${accuracyPercent}% di accuratezza. Consulenza esperta raccomandata per maggiore certezza.`, { duration: 4000 });
    }
    
    return enhancedResult;
    
  } catch (error) {
    console.error("Plant analysis failed:", error);
    toast.error(`Analisi fallita: ${error.message}`, {
      description: "Prova con un'immagine più chiara o consulta direttamente l'esperto",
      duration: 6000
    });
    
    // Return null to indicate failure
    return null;
  }
};
