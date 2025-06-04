
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface VisionAnalysisResult {
  plantIdentification: {
    plantName: string;
    scientificName?: string;
    confidence: number;
    commonNames?: string[];
    family?: string;
  };
  healthAssessment: {
    isHealthy: boolean;
    diseases: Array<{
      name: string;
      confidence: number;
      description: string;
      treatment: string[];
      severity: 'low' | 'medium' | 'high';
    }>;
    overallHealthScore: number;
  };
  visualFeatures: {
    plantPart: string;
    colors: string[];
    symptoms: string[];
    leafCondition?: string;
  };
  confidence: number;
  dataSource: string;
}

export class ComputerVisionService {
  // Analisi completa usando computer vision
  static async analyzeImageWithVision(imageFile: File): Promise<VisionAnalysisResult> {
    try {
      console.log("🔍 Starting computer vision analysis...");
      
      // 1. Preparazione immagine
      const formData = new FormData();
      formData.append('image', imageFile);
      
      // Convert to base64 for Plant.id API
      const imageBase64 = await this.fileToBase64(imageFile);
      formData.append('imageBase64', imageBase64);
      
      // 2. Chiamata parallela ai servizi AI
      const [cloudVisionResult, plantAnalysisResult] = await Promise.allSettled([
        this.analyzeWithCloudVision(formData),
        this.analyzeWithPlantServices(imageBase64)
      ]);
      
      // 3. Elaborazione risultati
      const visionData = cloudVisionResult.status === 'fulfilled' ? cloudVisionResult.value : null;
      const plantData = plantAnalysisResult.status === 'fulfilled' ? plantAnalysisResult.value : null;
      
      // 4. Combinazione risultati
      return this.combineAnalysisResults(visionData, plantData, imageFile.name);
      
    } catch (error) {
      console.error("❌ Computer vision analysis failed:", error);
      throw new Error(`Analisi computer vision fallita: ${error.message}`);
    }
  }
  
  // Analisi con Google Cloud Vision
  private static async analyzeWithCloudVision(formData: FormData): Promise<any> {
    try {
      formData.append('type', 'all'); // Analisi completa
      
      const { data, error } = await supabase.functions.invoke('analyze-with-cloud-vision', {
        body: formData
      });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Cloud Vision error:", error);
      return null;
    }
  }
  
  // Analisi con servizi specializzati per piante
  private static async analyzeWithPlantServices(imageBase64: string): Promise<any> {
    try {
      const formData = new FormData();
      const blob = this.base64ToBlob(imageBase64);
      formData.append('image', blob, 'plant.jpg');
      formData.append('imageBase64', imageBase64);
      
      const { data, error } = await supabase.functions.invoke('analyze-plant', {
        body: formData
      });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Plant services error:", error);
      return null;
    }
  }
  
  // Combinazione intelligente dei risultati
  private static combineAnalysisResults(
    visionData: any, 
    plantData: any, 
    imageName: string
  ): VisionAnalysisResult {
    console.log("🧠 Combining analysis results...", { visionData, plantData });
    
    // Identificazione pianta
    const plantIdentification = this.extractPlantIdentification(visionData, plantData);
    
    // Valutazione salute
    const healthAssessment = this.extractHealthAssessment(visionData, plantData);
    
    // Caratteristiche visive
    const visualFeatures = this.extractVisualFeatures(visionData, plantData);
    
    // Calcolo confidenza complessiva
    const confidence = this.calculateOverallConfidence(plantIdentification, healthAssessment);
    
    return {
      plantIdentification,
      healthAssessment,
      visualFeatures,
      confidence,
      dataSource: "Computer Vision + AI Services"
    };
  }
  
  // Estrazione identificazione pianta
  private static extractPlantIdentification(visionData: any, plantData: any) {
    let bestResult = {
      plantName: "Pianta non identificata",
      confidence: 0.3,
      scientificName: "",
      commonNames: [],
      family: ""
    };
    
    // Priorità ai risultati Plant.id se disponibili
    if (plantData?.plantIdResults && plantData.plantIdResults.confidence > 0.7) {
      bestResult = {
        plantName: plantData.plantIdResults.plantName || plantData.plantIdResults.scientificName,
        scientificName: plantData.plantIdResults.scientificName,
        confidence: plantData.plantIdResults.confidence,
        commonNames: plantData.plantIdResults.commonNames || [],
        family: plantData.plantIdResults.taxonomy?.family || ""
      };
    }
    // Fallback su risultati generali
    else if (plantData?.label && plantData.confidence > bestResult.confidence) {
      bestResult = {
        plantName: plantData.label,
        confidence: plantData.confidence,
        scientificName: plantData.plantName || "",
        commonNames: [],
        family: ""
      };
    }
    // Uso Cloud Vision come ulteriore conferma
    else if (visionData?.isPlant && visionData.plantDetails?.confidence > bestResult.confidence) {
      bestResult = {
        plantName: visionData.plantDetails.type,
        confidence: visionData.plantDetails.confidence,
        scientificName: "",
        commonNames: [],
        family: ""
      };
    }
    
    return bestResult;
  }
  
  // Estrazione valutazione salute
  private static extractHealthAssessment(visionData: any, plantData: any) {
    const diseases: any[] = [];
    let isHealthy = true;
    let overallHealthScore = 0.8;
    
    // Analisi Plant.id per malattie
    if (plantData?.plantIdResults?.diseases && plantData.plantIdResults.diseases.length > 0) {
      plantData.plantIdResults.diseases.forEach((disease: any) => {
        if (disease.probability > 0.3) {
          isHealthy = false;
          diseases.push({
            name: disease.name,
            confidence: disease.probability,
            description: disease.description || "Malattia identificata tramite AI",
            treatment: this.extractTreatmentFromDisease(disease),
            severity: this.calculateSeverity(disease.probability)
          });
        }
      });
    }
    
    // Analisi visiva per sintomi
    if (visionData?.labels) {
      const diseaseIndicators = this.detectDiseaseFromLabels(visionData.labels);
      diseaseIndicators.forEach(indicator => {
        if (!diseases.find(d => d.name.includes(indicator.symptom))) {
          diseases.push({
            name: `Possibile ${indicator.symptom}`,
            confidence: indicator.confidence,
            description: `Sintomo rilevato tramite analisi visiva`,
            treatment: indicator.treatment,
            severity: indicator.severity
          });
          if (indicator.confidence > 0.5) isHealthy = false;
        }
      });
    }
    
    // Calcolo punteggio salute
    if (diseases.length > 0) {
      const avgSeverity = diseases.reduce((sum, d) => {
        const severityScore = d.severity === 'high' ? 0.3 : d.severity === 'medium' ? 0.6 : 0.8;
        return sum + severityScore;
      }, 0) / diseases.length;
      overallHealthScore = Math.max(0.1, avgSeverity);
    }
    
    return {
      isHealthy,
      diseases: diseases.sort((a, b) => b.confidence - a.confidence),
      overallHealthScore
    };
  }
  
  // Estrazione caratteristiche visive
  private static extractVisualFeatures(visionData: any, plantData: any) {
    const features = {
      plantPart: "whole plant",
      colors: [] as string[],
      symptoms: [] as string[],
      leafCondition: "normale"
    };
    
    // Determina parte della pianta
    if (plantData?.plantPart) {
      features.plantPart = plantData.plantPart;
    } else if (visionData?.labels) {
      const partLabels = visionData.labels.filter((label: any) => 
        ['leaf', 'flower', 'fruit', 'stem', 'root'].some(part => 
          label.description.toLowerCase().includes(part)
        )
      );
      if (partLabels.length > 0) {
        features.plantPart = partLabels[0].description.toLowerCase();
      }
    }
    
    // Estrai colori dominanti
    if (visionData?.colors) {
      features.colors = visionData.colors
        .slice(0, 3)
        .map((color: any) => color.hex || '#unknown');
    }
    
    // Identifica sintomi visivi
    if (visionData?.labels) {
      const symptomLabels = visionData.labels.filter((label: any) => {
        const desc = label.description.toLowerCase();
        return ['spot', 'yellow', 'brown', 'dry', 'wilted', 'diseased'].some(symptom => 
          desc.includes(symptom)
        );
      });
      features.symptoms = symptomLabels.map((label: any) => label.description);
    }
    
    // Condizione foglie
    if (features.symptoms.length > 0) {
      features.leafCondition = "problematica";
    } else if (visionData?.isPlant && visionData.confidence > 0.8) {
      features.leafCondition = "buona";
    }
    
    return features;
  }
  
  // Calcolo confidenza complessiva
  private static calculateOverallConfidence(plantId: any, health: any): number {
    const idConfidence = plantId.confidence || 0.3;
    const healthConfidence = health.overallHealthScore || 0.5;
    
    // Peso maggiore all'identificazione
    return Math.round((idConfidence * 0.7 + healthConfidence * 0.3) * 100) / 100;
  }
  
  // Utility: rileva malattie da etichette visive
  private static detectDiseaseFromLabels(labels: any[]): any[] {
    const diseasePatterns = [
      {
        keywords: ['spot', 'spotted', 'macchia'],
        symptom: 'macchie fogliari',
        treatment: ['Fungicida fogliare', 'Rimozione foglie colpite'],
        severity: 'medium' as const
      },
      {
        keywords: ['yellow', 'yellowing', 'giallo'],
        symptom: 'ingiallimento',
        treatment: ['Controllo irrigazione', 'Fertilizzante'],
        severity: 'low' as const
      },
      {
        keywords: ['brown', 'browning', 'marrone'],
        symptom: 'imbrunimento',
        treatment: ['Riduzione irrigazione', 'Fungicida'],
        severity: 'medium' as const
      },
      {
        keywords: ['wilted', 'wilt', 'appassito'],
        symptom: 'appassimento',
        treatment: ['Controllo radicale', 'Irrigazione corretta'],
        severity: 'high' as const
      }
    ];
    
    const detected: any[] = [];
    
    diseasePatterns.forEach(pattern => {
      const matchingLabels = labels.filter(label =>
        pattern.keywords.some(keyword =>
          label.description.toLowerCase().includes(keyword)
        )
      );
      
      if (matchingLabels.length > 0) {
        const avgConfidence = matchingLabels.reduce((sum, label) => 
          sum + label.score, 0) / matchingLabels.length;
        
        detected.push({
          symptom: pattern.symptom,
          confidence: avgConfidence,
          treatment: pattern.treatment,
          severity: pattern.severity
        });
      }
    });
    
    return detected;
  }
  
  // Utility: estrai trattamento da malattia Plant.id
  private static extractTreatmentFromDisease(disease: any): string[] {
    const treatments: string[] = [];
    
    if (disease.treatment) {
      if (disease.treatment.biological) {
        treatments.push(...disease.treatment.biological.slice(0, 2));
      }
      if (disease.treatment.chemical) {
        treatments.push(...disease.treatment.chemical.slice(0, 2));
      }
      if (disease.treatment.prevention) {
        treatments.push(...disease.treatment.prevention.slice(0, 2));
      }
    }
    
    return treatments.length > 0 ? treatments : ['Consulenza specialistica raccomandata'];
  }
  
  // Utility: calcola severità
  private static calculateSeverity(probability: number): 'low' | 'medium' | 'high' {
    if (probability > 0.8) return 'high';
    if (probability > 0.5) return 'medium';
    return 'low';
  }
  
  // Utility: converti file in base64
  private static fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = reader.result as string;
        resolve(base64.split(',')[1]); // Rimuovi prefix data:image/...
      };
      reader.onerror = reject;
    });
  }
  
  // Utility: converti base64 in blob
  private static base64ToBlob(base64: string): Blob {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: 'image/jpeg' });
  }
}
