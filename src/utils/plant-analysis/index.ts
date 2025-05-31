
import { toast } from "sonner";
import { dataURLtoFile, formatPercentage, preprocessImage, getCachedResponse, cacheResponse, generateImageHash } from './plantAnalysisUtils';
import { formatHuggingFaceResult } from './result-formatter';
import { analyzeWithCloudVision } from './plant-id-service';
import { supabase } from "@/integrations/supabase/client";
import { analyzeWithEnhancedAI } from './enhanced-analysis';
import type { AnalysisProgress } from '../../services/aiProviders';

// Export the utilities for use in other files
export { formatHuggingFaceResult, dataURLtoFile, formatPercentage };

// High-accuracy plant analysis system - NO FALLBACKS
export const analyzePlant = async (imageFile: File, plantInfo: any = null) => {
  try {
    // Dismiss any existing toasts
    toast.dismiss();
    
    console.log("Starting high-accuracy plant analysis...");
    toast.info("Avvio analisi ad alta precisione...", { duration: 3000 });
    
    // Enhanced AI analysis with 90% accuracy requirement
    const progressCallback = (progress: AnalysisProgress) => {
      console.log(`${progress.stage}: ${progress.percentage}% - ${progress.message}`);
      
      if (progress.percentage < 100) {
        toast.info(`${progress.message} (${progress.percentage}%)`, { duration: 2000 });
      }
    };
    
    const enhancedResult = await analyzeWithEnhancedAI(imageFile, plantInfo, progressCallback);
    
    // Verify minimum accuracy requirement
    if (!enhancedResult || enhancedResult.confidence < 0.9) {
      const accuracy = enhancedResult?.confidence ? Math.round(enhancedResult.confidence * 100) : 0;
      throw new Error(`Accuratezza insufficiente: ${accuracy}%. Richiesta accuratezza minima: 90%`);
    }
    
    console.log("High-accuracy analysis completed:", enhancedResult);
    toast.success(`Analisi completata con ${Math.round(enhancedResult.confidence * 100)}% di accuratezza`, { duration: 3000 });
    
    return enhancedResult;
    
  } catch (error) {
    console.error("High-accuracy plant analysis failed:", error);
    toast.error(`Analisi fallita: ${error.message}`, {
      description: "Prova con un'immagine più chiara, ben illuminata e a fuoco",
      duration: 6000
    });
    
    // NO FALLBACKS - return null to indicate failure
    return null;
  }
};

// Remove all fallback analysis functions - only high-accuracy analysis allowed
