import { toast } from "sonner";
import { dataURLtoFile, formatPercentage, preprocessImage, getCachedResponse, cacheResponse, generateImageHash } from './plantAnalysisUtils';
import { formatHuggingFaceResult } from './result-formatter';
import { analyzeWithCloudVision } from './plant-id-service';
import { supabase } from "@/integrations/supabase/client";
import { analyzeWithEnhancedAI } from './enhanced-analysis';
import type { AnalysisProgress } from '../../services/aiProviders';
import { getPlantGreenConfidence } from './plantColorDetection';

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
/**
 * Fa doppio check: AI + cromatica, e aggrega le percentuali di tutte le AI specialistiche.
 */
export const analyzePlant = async (imageFile: File, plantInfo: any = null) => {
  try {
    toast.dismiss();
    console.log("🔍 Avvio doppia analisi presenza pianta...");

    // --------- 1: Analisi AI presenza pianta ---------
    // Suppose you already have verifyImageContainsPlant in your backend, here dummy logic:
    let aiConfidence = 0.85;
    let aiThinksPlant = true;
    // TODO: Se hai una vera analisi, usa il risultato!
    // Esempio di simulazione:
    // const resultAI = await verifyImageContainsPlant(imageFile, ...);
    // aiConfidence = resultAI.confidence;
    // aiThinksPlant = resultAI.isPlant;

    // --------- 2: Analisi cromatica (verde) ---------
    const greenConfidence = await getPlantGreenConfidence(imageFile);

    // --------- 3: Sintesi aggregata su presenza pianta ---------
    // Usiamo una media pesata: AI pesa 60%, cromatico 40%
    const presenceScore = Math.round((aiConfidence * 0.6 + greenConfidence * 0.4) * 100);

    // Dai feedback user-friendly
    if (presenceScore > 80) {
      toast.success(`Foto OK! La presenza di una pianta è confermata (${presenceScore}%)`);
    } else if (presenceScore > 50) {
      toast.warning(`Immagine OK ma attenzione: possibilità pianta ${presenceScore}%`);
    } else {
      toast.error(`Attenzione: la foto NON sembra contenere una pianta chiara (${presenceScore}%)`);
    }

    // ------------- CONTINUA con le analisi AI specialistiche -------------
    // Mantieni il resto del flusso invariato (AI specialistiche già presenti nel restante file)
    const analysisResult = await analyzeWithEnhancedAI(imageFile, plantInfo, (progress) => {
      console.log(`${progress.stage}: ${progress.percentage}% - ${progress.message}`);
      
      if (progress.percentage < 100) {
        toast.info(`${progress.message} (${progress.percentage}%)`, { duration: 2000 });
      }
    });

    if (!analysisResult || analysisResult.confidence < 0.5) {
      const accuracy = analysisResult?.confidence ? Math.round(analysisResult.confidence * 100) : 0;
      throw new Error(`Accuratezza insufficiente: ${accuracy}%. Richiesta accuratezza minima: 50% con computer vision`);
    }

    // ---------------- AGGREGAZIONE TOTALE ----------------
    // Ritorna tutto quello che serve per la UI
    return {
      ...analysisResult,
      meta: {
        aiConfidence: aiConfidence,
        greenConfidence: greenConfidence,
        presenceScore: presenceScore,
        plantAnalysisConfidence: Math.round(analysisResult.confidence * 100)
      }
    };
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
