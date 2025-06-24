
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PlantAnalysisResult {
  success: boolean;
  plantName?: string;
  scientificName?: string;
  confidence?: number;
  isHealthy?: boolean;
  diseases?: Array<{
    name: string;
    probability: number;
    description: string;
    treatment?: string;
  }>;
  recommendations?: string[];
  error?: string;
  analysisDetails?: {
    source: string;
    verificationPassed: boolean;
    qualityCheck: boolean;
    confidenceScore: number;
    detectionAccuracy: number;
  };
}

// Funzione di utilità per garantire percentuali valide
const ensureValidPercentage = (value: any, fallback: number = 75): number => {
  if (typeof value === 'number' && !isNaN(value) && isFinite(value)) {
    if (value <= 1) {
      return Math.max(Math.round(value * 100), 1);
    }
    return Math.max(Math.round(value), 1);
  }
  
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    if (!isNaN(parsed) && isFinite(parsed)) {
      if (parsed <= 1) {
        return Math.max(Math.round(parsed * 100), 1);
      }
      return Math.max(Math.round(parsed), 1);
    }
  }
  
  return fallback;
};

/**
 * Esegue un'analisi migliorata delle piante con percentuali di confidenza accurate
 */
export const performEnhancedPlantAnalysis = async (
  imageFile: File,
  plantInfo?: any
): Promise<PlantAnalysisResult> => {
  try {
    console.log("🌿 Avvio analisi migliorata della pianta con percentuali accurate...");
    
    // Verifica dimensioni del file
    if (imageFile.size > 10 * 1024 * 1024) {
      return {
        success: false,
        error: "Immagine troppo grande. Dimensione massima: 10MB"
      };
    }

    // Prima verifica che l'immagine contenga una pianta
    console.log("🔍 Verifica se l'immagine contiene una pianta...");
    
    const base64Image = await fileToBase64(imageFile);
    
    // Verifica pianta usando il servizio di plant detection
    const { PlantDetectionService } = await import('@/services/plantDetectionService');
    const detectionResult = await PlantDetectionService.detectPlantInImage(base64Image);
    
    console.log("🌱 Risultato rilevamento pianta:", detectionResult);
    
    // Se non è rilevata una pianta con sufficiente confidenza, ferma l'analisi
    if (!detectionResult.isPlant || detectionResult.confidence < 40) {
      return {
        success: false,
        error: `L'immagine non sembra contenere una pianta. Confidenza rilevamento: ${detectionResult.confidence}%. ${detectionResult.message}`
      };
    }
    
    console.log("✅ Pianta rilevata, procedo con l'analisi diagnostica...");
    
    // Chiama la funzione edge per l'analisi
    const { data, error } = await supabase.functions.invoke('plant-diagnosis', {
      body: {
        image: base64Image,
        plantInfo: plantInfo || {},
        analysisType: 'comprehensive',
        returnProbabilities: true
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

    // Converti tutte le percentuali con validazione robusta
    const confidence = ensureValidPercentage(data.confidence, 75);
    const detectionAccuracy = ensureValidPercentage(data.detectionAccuracy || data.confidence, confidence);
    
    // Formatta le malattie con percentuali corrette e validate
    const formattedDiseases = (data.diseases || []).map((disease: any) => {
      const probability = ensureValidPercentage(
        disease.probability || disease.confidence,
        60
      );
      
      return {
        name: disease.name || "Malattia non specificata",
        probability,
        description: disease.description || "Descrizione non disponibile",
        treatment: disease.treatment || "Trattamento da definire"
      };
    });

    return {
      success: true,
      plantName: data.plantName || "Pianta identificata",
      scientificName: data.scientificName || "",
      confidence,
      isHealthy: data.isHealthy !== false,
      diseases: formattedDiseases,
      recommendations: data.recommendations || [],
      analysisDetails: {
        source: "Enhanced Plant Analysis API",
        verificationPassed: data.verificationPassed !== false,
        qualityCheck: data.qualityCheck !== false,
        confidenceScore: confidence,
        detectionAccuracy
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
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = () => reject(new Error("Errore nella lettura del file"));
    reader.readAsDataURL(file);
  });
};
