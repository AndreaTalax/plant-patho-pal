import { supabase } from '@/integrations/supabase/client';

export interface PlantDetectionResult {
  isPlant: boolean;
  confidence: number;
  detectedElements: string[];
  colorAnalysis: {
    dominantColors: string[];
    greenPercentage: number;
  };
  aiServices: {
    serviceName: string;
    result: boolean;
    confidence: number;
    elements?: string[];
  }[];
  message: string;
}

export class PlantDetectionService {

  static async detectPlantInImage(imageData: string): Promise<PlantDetectionResult> {
    console.log("🔍 Avvio rilevamento pianta nell'immagine...");
    console.log("📷 Formato immagine:", imageData.substring(0, 50) + "...");

    const detectionResults = await Promise.allSettled([
      this.detectWithHuggingFace(imageData),
      this.detectWithPlantVerification(imageData),
      this.detectWithPlantNet(imageData), // <-- aggiunta PlantNet
      this.performColorAnalysis(imageData)
    ]);

    console.log("📊 Risultati rilevamento:", detectionResults.map(r =>
      r.status === 'fulfilled' ? 'success' : `error: ${r.reason?.message || 'unknown'}`
    ));

    const aiServices: PlantDetectionResult['aiServices'] = [];
    let maxConfidence = 0;
    let isPlantDetected = false;
    const detectedElements: string[] = [];

    // Elabora risultati HuggingFace
    if (detectionResults[0].status === 'fulfilled') {
      const hfResult = detectionResults[0].value;
      aiServices.push({
        serviceName: 'HuggingFace',
        result: hfResult.isPlant,
        confidence: hfResult.confidence,
        elements: hfResult.detectedElements
      });
      if (hfResult.confidence > maxConfidence) {
        maxConfidence = hfResult.confidence;
        isPlantDetected = hfResult.isPlant;
      }
      detectedElements.push(...hfResult.detectedElements);
    }

    // Elabora risultati PlantVerification
    if (detectionResults[1].status === 'fulfilled') {
      const pvResult = detectionResults[1].value;
      aiServices.push({
        serviceName: 'PlantVerification',
        result: pvResult.isPlant,
        confidence: pvResult.confidence
      });
      if (pvResult.confidence > maxConfidence) {
        maxConfidence = pvResult.confidence;
        isPlantDetected = pvResult.isPlant;
      }
    }

    // Elabora risultati PlantNet
    if (detectionResults[2].status === 'fulfilled') {
      const pnResult = detectionResults[2].value;
      aiServices.push({
        serviceName: 'PlantNet',
        result: pnResult.isPlant,
        confidence: pnResult.confidence
      });
      if (pnResult.confidence > maxConfidence) {
        maxConfidence = pnResult.confidence;
        isPlantDetected = pnResult.isPlant;
      }
    }

    // Elabora analisi colori
    let colorAnalysis = {
      dominantColors: ['#008000'],
      greenPercentage: 0
    };
    
    if (detectionResults[3].status === 'fulfilled') {
      colorAnalysis = detectionResults[3].value;
      if (colorAnalysis.greenPercentage > 0.3) {
        isPlantDetected = true;
        maxConfidence = Math.max(maxConfidence, 0.7);
      }
    }

    const finalResult: PlantDetectionResult = {
      isPlant: isPlantDetected,
      confidence: maxConfidence,
      detectedElements: [...new Set(detectedElements)],
      colorAnalysis,
      aiServices,
      message: isPlantDetected 
        ? `Pianta rilevata con confidenza ${(maxConfidence * 100).toFixed(1)}%`
        : 'Nessuna pianta rilevata nell\'immagine'
    };

    console.log("✅ Risultato finale rilevamento:", finalResult);
    return finalResult;
  }

  private static async detectWithHuggingFace(imageData: string): Promise<{isPlant: boolean, confidence: number, detectedElements: string[]}> {
    try {
      console.log("🤗 Avvio rilevamento HuggingFace...");
      
      // Simula il rilevamento HuggingFace per ora
      return {
        isPlant: true,
        confidence: 0.8,
        detectedElements: ['leaf', 'plant']
      };
    } catch (error) {
      console.error("❌ Errore HuggingFace:", error);
      return {
        isPlant: false,
        confidence: 0,
        detectedElements: []
      };
    }
  }

  private static async detectWithPlantVerification(imageData: string): Promise<{isPlant: boolean, confidence: number}> {
    try {
      console.log("🌿 Avvio verifica pianta...");
      
      // Simula la verifica delle piante
      return {
        isPlant: true,
        confidence: 0.7
      };
    } catch (error) {
      console.error("❌ Errore verifica pianta:", error);
      return {
        isPlant: false,
        confidence: 0
      };
    }
  }

  private static async detectWithPlantNet(imageData: string): Promise<{isPlant: boolean, confidence: number}> {
    try {
      console.log("🌐 Avvio rilevamento PlantNet...");
      
      // Simula il rilevamento PlantNet
      return {
        isPlant: true,
        confidence: 0.75
      };
    } catch (error) {
      console.error("❌ Errore PlantNet:", error);
      return {
        isPlant: false,
        confidence: 0
      };
    }
  }

  private static async performColorAnalysis(imageData: string): Promise<{dominantColors: string[], greenPercentage: number}> {
    try {
      console.log("🎨 Avvio analisi colori...");
      
      // Simula l'analisi dei colori
      return {
        dominantColors: ['#228B22', '#32CD32', '#006400'],
        greenPercentage: 0.6
      };
    } catch (error) {
      console.error("❌ Errore analisi colori:", error);
      return {
        dominantColors: [],
        greenPercentage: 0
      };
    }
  }
}
