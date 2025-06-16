
import { toast } from "sonner";
import { performEnhancedPlantAnalysis } from './enhancedPlantAnalysis';

// Export delle utility per compatibilità
export { formatHuggingFaceResult } from './result-formatter';
export { dataURLtoFile, formatPercentage } from './plantAnalysisUtils';

/**
 * Analisi delle piante con verifica rigorosa che l'immagine contenga effettivamente una pianta
 */
export const analyzePlant = async (imageFile: File, plantInfo: any = null) => {
  try {
    toast.dismiss();
    console.log("🔍 Avvio analisi rigorosa delle piante...");

    // Usa il nuovo sistema di analisi che include tutte le verifiche
    const result = await performEnhancedPlantAnalysis(imageFile, plantInfo);
    
    if (!result.success) {
      console.error("❌ Analisi fallita:", result.error);
      return null; // Ritorna null per indicare fallimento
    }
    
    // Converti il risultato nel formato atteso dal resto dell'applicazione
    return {
      plantName: result.plantName,
      scientificName: result.scientificName,
      confidence: result.confidence,
      healthy: result.isHealthy,
      isHealthy: result.isHealthy,
      diseases: result.diseases || [],
      recommendations: result.recommendations || [],
      label: result.plantName,
      analysisDetails: {
        source: result.analysisDetails?.source || 'Enhanced Plant Analysis',
        verificationPassed: result.analysisDetails?.verificationPassed,
        qualityCheck: result.analysisDetails?.qualityCheck
      },
      meta: {
        plantAnalysisConfidence: Math.round((result.confidence || 0) * 100),
        verificationPassed: result.analysisDetails?.verificationPassed || false,
        realApiUsed: true
      }
    };
  } catch (error) {
    console.error("❌ Errore durante l'analisi:", error);
    toast.error(`Analisi fallita: ${error.message}`, {
      description: "Verifica che l'immagine contenga una pianta chiara e riprova",
      duration: 6000
    });
    
    return null;
  }
};
