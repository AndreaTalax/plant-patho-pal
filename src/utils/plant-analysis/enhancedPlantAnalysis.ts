
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PlantAnalysisResult {
  success: boolean;
  plantName?: string;
  scientificName?: string;
  confidence?: number;
  isHealthy?: boolean;
  diseases?: string[];
  recommendations?: string[];
  error?: string;
  analysisDetails?: {
    source: string;
    verificationPassed: boolean;
    qualityCheck: boolean;
  };
}

/**
 * Esegue un'analisi migliorata delle piante con verifica rigorosa
 */
export const performEnhancedPlantAnalysis = async (
  imageFile: File,
  plantInfo?: any
): Promise<PlantAnalysisResult> => {
  try {
    console.log("🌿 Avvio analisi migliorata della pianta...");
    
    // Verifica dimensioni del file
    if (imageFile.size > 10 * 1024 * 1024) {
      return {
        success: false,
        error: "Immagine troppo grande. Dimensione massima: 10MB"
      };
    }

    // Converti l'immagine in base64
    const base64Image = await fileToBase64(imageFile);
    
    console.log("📤 Invio richiesta di analisi al server...");
    
    // Chiama la funzione edge per l'analisi
    const { data, error } = await supabase.functions.invoke('plant-diagnosis', {
      body: {
        image: base64Image,
        plantInfo: plantInfo || {},
        analysisType: 'comprehensive'
      }
    });

    if (error) {
      console.error("❌ Errore nella funzione di analisi:", error);
      return {
        success: false,
        error: error.message || "Errore nell'analisi della pianta"
      };
    }

    if (!data || !data.success) {
      console.error("❌ Analisi fallita:", data?.error);
      return {
        success: false,
        error: data?.error || "Analisi fallita"
      };
    }

    console.log("✅ Analisi completata con successo:", data);

    return {
      success: true,
      plantName: data.plantName || "Pianta non identificata",
      scientificName: data.scientificName || "",
      confidence: data.confidence || 0,
      isHealthy: data.isHealthy !== false, // Default true se non specificato
      diseases: data.diseases || [],
      recommendations: data.recommendations || [],
      analysisDetails: {
        source: "Enhanced Plant Analysis API",
        verificationPassed: data.verificationPassed !== false,
        qualityCheck: data.qualityCheck !== false
      }
    };

  } catch (error) {
    console.error("❌ Errore nell'analisi migliorata:", error);
    return {
      success: false,
      error: error.message || "Errore durante l'analisi"
    };
  }
};

/**
 * Converte un file in base64
 */
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Rimuovi il prefisso data:image/...;base64,
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = () => reject(new Error("Errore nella lettura del file"));
    reader.readAsDataURL(file);
  });
};
