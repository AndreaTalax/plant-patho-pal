
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
      console.log("🤗 Tentativo HuggingFace...");
      
      // Verifica che l'immagine sia in formato base64 corretto
      if (!imageData.startsWith('data:image/')) {
        console.warn("⚠️ Immagine non in formato data URL, convertendo...");
        imageData = `data:image/jpeg;base64,${imageData}`;
      }
      
      // Usa direttamente l'API HuggingFace per plant classification
      const response = await fetch('https://api-inference.huggingface.co/models/google/vit-base-patch16-224', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer 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',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inputs: imageData
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ HuggingFace error:", response.status, errorText);
        throw new Error(`HuggingFace API error: ${response.status} - ${errorText}`);
      }
      
      const results = await response.json();
      console.log("🤗 HuggingFace risultati:", results);
      
      // Cerca indicatori di piante nei risultati
      let isPlant = false;
      let confidence = 0;
      const elements: string[] = [];
      
      if (Array.isArray(results)) {
        results.forEach(result => {
          const label = result.label?.toLowerCase() || '';
          const score = result.score || 0;
          
          // Keywords che indicano elementi vegetali
          const plantKeywords = ['plant', 'leaf', 'flower', 'tree', 'grass', 'vegetation', 'botanical', 'green'];
          
          if (plantKeywords.some(keyword => label.includes(keyword))) {
            isPlant = true;
            confidence = Math.max(confidence, score);
            elements.push(result.label);
          }
        });
      }
      
      return {
        serviceName: 'HuggingFace Plant Classifier',
        result: isPlant,
        confidence: confidence,
        elements: elements
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
      console.log("🌱 Tentativo Plant.ID...");
      
      // Assicurati che l'immagine sia solo il base64 senza prefix per Plant.ID
      let base64Data = imageData;
      if (imageData.startsWith('data:image/')) {
        base64Data = imageData.split(',')[1];
      }
      
      // Usa Plant.ID API v2 (v3 non funziona correttamente)
      const response = await fetch('https://api.plant.id/v2/identify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Api-Key': '6d4146706e385077db06e57b76fd967d10b4cb2ce23070580160ebb069da8420'
        },
        body: JSON.stringify({
          images: [base64Data],
          modifiers: ["crops_fast", "similar_images"],
          plant_details: ["common_names", "url", "name_authority"],
          plant_language: "it"
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Plant.ID error:", response.status, errorText);
        throw new Error(`Plant.ID API error: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log("🌱 Plant.ID risultati:", data);
      
      let isPlant = false;
      let confidence = 0;
      const elements: string[] = [];
      
      if (data.suggestions && data.suggestions.length > 0) {
        const topSuggestion = data.suggestions[0];
        isPlant = true;
        confidence = topSuggestion.probability || 0;
        elements.push(topSuggestion.plant_name || 'Pianta identificata');
        
        if (topSuggestion.plant_details?.common_names) {
          elements.push(...topSuggestion.plant_details.common_names.slice(0, 2));
        }
      }
      
      return {
        serviceName: 'Plant Verification Service',
        result: isPlant,
        confidence: confidence,
        elements: elements
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
