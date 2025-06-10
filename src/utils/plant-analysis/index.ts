
import { toast } from "sonner";
import { dataURLtoFile, formatPercentage, preprocessImage, getCachedResponse, cacheResponse, generateImageHash } from './plantAnalysisUtils';
import { formatHuggingFaceResult } from './result-formatter';
import { analyzeWithCloudVision } from './plant-id-service';
import { supabase } from "@/integrations/supabase/client";
import { analyzeWithEnhancedAI } from './enhanced-analysis';
import type { AnalysisProgress } from '../../services/aiProviders';

// Export the utilities for use in other files
export { formatHuggingFaceResult, dataURLtoFile, formatPercentage };

// Plant analysis system with computer vision integration
/**
 * Conducts an enhanced computer vision plant analysis on an image file.
 * @example
 * sync(imageFile, plantInfo)
 * { stage: 'analyzing', confidence: 0.85, ...}
 * @param {File} imageFile - Image file of the plant to be analyzed.
 * @param {any} plantInfo - (Optional) Additional information about the plant to enhance analysis.
 * @returns {object|null} Returns analysis result with confidence or null if analysis fails.
 * @description
 *   - The analysis requires a minimum confidence level of 50%.
 *   - Displays different toast messages based on the accuracy level obtained.
 *   - Analysis progress is logged with a callback function.
 *   - Handles errors and displays an error message to the user if analysis fails.
 */
export const analyzePlant = async (imageFile: File, plantInfo: any = null) => {
  try {
    // Dismiss any existing toasts
    toast.dismiss();
    
    console.log("🔍 Starting computer vision plant analysis...");
    toast.info("Avvio analisi con computer vision...", { duration: 3000 });
    
    // Enhanced AI analysis with computer vision - 50% minimum accuracy requirement
    const progressCallback = (progress: AnalysisProgress) => {
      console.log(`${progress.stage}: ${progress.percentage}% - ${progress.message}`);
      
      if (progress.percentage < 100) {
        toast.info(`${progress.message} (${progress.percentage}%)`, { duration: 2000 });
      }
    };
    
    const enhancedResult = await analyzeWithEnhancedAI(imageFile, plantInfo, progressCallback);
    
    // Verify minimum accuracy requirement (lowered to 50% for computer vision)
    if (!enhancedResult || enhancedResult.confidence < 0.5) {
      const accuracy = enhancedResult?.confidence ? Math.round(enhancedResult.confidence * 100) : 0;
      throw new Error(`Accuratezza insufficiente: ${accuracy}%. Richiesta accuratezza minima: 50% con computer vision`);
    }
    
    console.log("✅ Computer vision analysis completed successfully:", enhancedResult);
    const accuracyPercent = Math.round(enhancedResult.confidence * 100);
    
    if (enhancedResult.confidence >= 0.8) {
      toast.success(`Analisi computer vision completata con ${accuracyPercent}% di accuratezza`, { duration: 3000 });
    } else if (enhancedResult.confidence >= 0.6) {
      toast.success(`Analisi completata con ${accuracyPercent}% di accuratezza. Buona affidabilità.`, { duration: 4000 });
    } else {
      toast.success(`Analisi completata con ${accuracyPercent}% di accuratezza. Computer vision attiva.`, { duration: 4000 });
    }
    
    return enhancedResult;
    
  } catch (error) {
    console.error("❌ Computer vision plant analysis failed:", error);
    toast.error(`Analisi fallita: ${error.message}`, {
      description: "Prova con un'immagine più chiara o consulta direttamente l'esperto",
      duration: 6000
    });
    
    // Return null to indicate failure
    return null;
  }
};
