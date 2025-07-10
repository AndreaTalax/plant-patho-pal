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
      aiServices
