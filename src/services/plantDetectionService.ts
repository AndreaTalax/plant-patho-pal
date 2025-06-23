
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
    
    const detectionResults = await Promise.allSettled([
      this.detectWithHuggingFace(imageData),
      this.detectWithPlantVerification(imageData),
      this.performColorAnalysis(imageData)
    ]);
    
    const aiServices: PlantDetectionResult['aiServices'] = [];
    let maxConfidence = 0;
    let isPlantDetected = false;
    const detectedElements: string[] = [];
    
    // Elabora risultati HuggingFace
    if (detectionResults[0].status === 'fulfilled') {
      const hfResult = detectionResults[0].value;
      aiServices.push(hfResult);
      if (hfResult.confidence > maxConfidence) {
        maxConfidence = hfResult.confidence;
        isPlantDetected = hfResult.result;
      }
      if (hfResult.elements) {
        detectedElements.push(...hfResult.elements);
      }
    }
    
    // Elabora risultati Plant Verification
    if (detectionResults[1].status === 'fulfilled') {
      const pvResult = detectionResults[1].value;
      aiServices.push(pvResult);
      if (pvResult.confidence > maxConfidence) {
        maxConfidence = pvResult.confidence;
        isPlantDetected = pvResult.result;
      }
      if (pvResult.elements) {
        detectedElements.push(...pvResult.elements);
      }
    }
    
    // Analisi colore come fallback
    const colorAnalysis = detectionResults[2].status === 'fulfilled' 
      ? detectionResults[2].value 
      : { dominantColors: [], greenPercentage: 0 };
    
    // Se nessun AI ha dato risultati, usa analisi colore
    if (aiServices.length === 0 || maxConfidence < 0.3) {
      if (colorAnalysis.greenPercentage > 40) {
        isPlantDetected = true;
        maxConfidence = Math.min(0.6, colorAnalysis.greenPercentage / 100 + 0.1);
        detectedElements.push('Predominanza colori verdi');
        aiServices.push({
          serviceName: 'Color Analysis',
          result: true,
          confidence: maxConfidence,
          elements: ['Verde dominante']
        });
      }
    }
    
    // Genera messaggio finale
    let message = '';
    if (isPlantDetected && maxConfidence > 0.7) {
      message = `Pianta rilevata con alta confidenza (${Math.round(maxConfidence * 100)}%)`;
    } else if (isPlantDetected && maxConfidence > 0.4) {
      message = `Probabile presenza di pianta (${Math.round(maxConfidence * 100)}%)`;
    } else if (isPlantDetected) {
      message = `Possibile pianta rilevata con bassa confidenza (${Math.round(maxConfidence * 100)}%)`;
    } else {
      message = 'Nessuna pianta rilevata nell\'immagine';
    }
    
    return {
      isPlant: isPlantDetected,
      confidence: Math.round(maxConfidence * 100),
      detectedElements: [...new Set(detectedElements)],
      colorAnalysis,
      aiServices,
      message
    };
  }
  
  private static async detectWithHuggingFace(imageData: string) {
    try {
      const { data, error } = await supabase.functions.invoke('plant-verification', {
        body: { image: imageData, service: 'huggingface' }
      });
      
      if (error) throw error;
      
      return {
        serviceName: 'HuggingFace Plant Classifier',
        result: data.isPlant || false,
        confidence: data.confidence || 0,
        elements: data.detectedElements || []
      };
    } catch (error) {
      console.warn('HuggingFace detection failed:', error);
      return {
        serviceName: 'HuggingFace Plant Classifier',
        result: false,
        confidence: 0,
        elements: []
      };
    }
  }
  
  private static async detectWithPlantVerification(imageData: string) {
    try {
      const { data, error } = await supabase.functions.invoke('plant-verification', {
        body: { image: imageData, service: 'plant-verification' }
      });
      
      if (error) throw error;
      
      return {
        serviceName: 'Plant Verification Service',
        result: data.isPlant || false,
        confidence: data.confidence || 0,
        elements: data.detectedPlantParts || []
      };
    } catch (error) {
      console.warn('Plant verification failed:', error);
      return {
        serviceName: 'Plant Verification Service',
        result: false,
        confidence: 0,
        elements: []
      };
    }
  }
  
  private static async performColorAnalysis(imageData: string) {
    try {
      // Crea un canvas temporaneo per analizzare i colori
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context not available');
      
      return new Promise<{ dominantColors: string[]; greenPercentage: number }>((resolve) => {
        const img = new Image();
        img.onload = () => {
          canvas.width = 100; // Riduci per performance
          canvas.height = 100;
          ctx.drawImage(img, 0, 0, 100, 100);
          
          const imageData = ctx.getImageData(0, 0, 100, 100);
          const pixels = imageData.data;
          
          let greenPixels = 0;
          let totalPixels = pixels.length / 4;
          const colorCounts: { [key: string]: number } = {};
          
          for (let i = 0; i < pixels.length; i += 4) {
            const r = pixels[i];
            const g = pixels[i + 1];
            const b = pixels[i + 2];
            
            // Conta pixel verdi (G > R e G > B con margine)
            if (g > r + 20 && g > b + 10 && g > 80) {
              greenPixels++;
            }
            
            // Conta colori dominanti
            const colorKey = `${Math.floor(r/50)*50},${Math.floor(g/50)*50},${Math.floor(b/50)*50}`;
            colorCounts[colorKey] = (colorCounts[colorKey] || 0) + 1;
          }
          
          const greenPercentage = (greenPixels / totalPixels) * 100;
          const dominantColors = Object.entries(colorCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3)
            .map(([color]) => color);
          
          resolve({ dominantColors, greenPercentage });
        };
        img.src = `data:image/jpeg;base64,${imageData}`;
      });
    } catch (error) {
      console.warn('Color analysis failed:', error);
      return { dominantColors: [], greenPercentage: 0 };
    }
  }
}
