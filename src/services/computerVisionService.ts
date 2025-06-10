
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
  /**
   * Performs a complete computer vision analysis on the provided image file.
   * @example
   * analyzeImageWithVision(imageFile)
   * VisionAnalysisResult containing combined data from multiple AI services.
   * @param {File} imageFile - The image file to be analyzed.
   * @returns {Promise<VisionAnalysisResult>} A promise that resolves with the result of the image analysis.
   * @description
   *   - Converts the provided image file into base64 format to be compatible with Plant.id API.
   *   - Utilizes Promise.allSettled to run multiple AI services in parallel and handle their results.
   *   - Combines results from different vision analysis services into a single coherent result.
   *   - Logs important statuses for debugging purposes.
   */
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
  /**
   * Analyzes images using Cloud Vision and returns the result data.
   * @example
   * analyzeWithCloudVision(formData)
   * { analyzeResult: {...} }
   * @param {FormData} formData - The FormData object containing image data to be analyzed.
   * @returns {Promise<any>} Returns the result of the Cloud Vision analysis if successful, otherwise null.
   * @description
   *   - The function appends 'type=all' to the form data for a complete analysis.
   *   - Utilizes Supabase's function invocation for interaction with Cloud Vision.
   *   - Catches and logs any errors encountered during the invocation process.
   */
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
  /**
  * Analyzes a plant image using external plant services and returns the result.
  * @example
  * analyzeWithPlantServices('data:image/jpeg;base64,...')
  * { plantName: 'Rose', description: 'A type of flowering shrub.' }
  * @param {string} imageBase64 - Base64 representation of the plant image to be analyzed.
  * @returns {Promise<any>} Analysis result from plant services if successful; otherwise, returns null.
  * @description
  *   - Utilizes Supabase's serverless function to perform the image analysis.
  *   - Converts the base64 image string into a Blob for API compatibility.
  *   - Logs any errors encountered during the process to the console.
  */
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
  /**
   * Combines analysis results from vision data and plant data into a comprehensive result.
   * @example
   * combineAnalysisResults(visionDataSample, plantDataSample, "image01.png")
   * {
   *   plantIdentification: {...},
   *   healthAssessment: {...},
   *   visualFeatures: {...},
   *   confidence: 0.85,
   *   dataSource: "Computer Vision + AI Services"
   * }
   * @param {any} visionData - The vision analysis data retrieved from AI services.
   * @param {any} plantData - The plant analysis data obtained from the database.
   * @param {string} imageName - The name of the image being analyzed.
   * @returns {VisionAnalysisResult} An object containing combined analysis data including identification, health assessment, and confidence levels.
   * @description
   *   - Integrates data from computer vision and AI services to enhance plant identification and health assessment.
   *   - Utilizes internal extraction methods to derive necessary visual features.
   *   - Logs the process of combining results for transparency and debugging purposes.
   */
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
  /**
  * Extracts the best available plant identification result from provided vision and plant data.
  * @example
  * extractPlantIdentification(visionData, plantData)
  * { plantName: "Rose", confidence: 0.85, scientificName: "Rosa", commonNames: ["Rose"], family: "Rosaceae" }
  * @param {any} visionData - Vision data containing potential plant information and confidence scores.
  * @param {any} plantData - Data containing plant identification results with associated confidence scores.
  * @returns {Object} Contains the plantName, confidence, scientificName, commonNames, and family.
  * @description
  *   - Prioritizes Plant.id results with confidence above 0.7.
  *   - Uses generic plantData if Plant.id results are not available or have lower confidence.
  *   - Uses Cloud Vision data as further confirmation when available.
  *   - Default return assigns a generic plant identification with low confidence.
  */
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
  /**
   * Extracts health assessment data from vision and plant information.
   * @example
   * extractHealthAssessment(visionData, plantData)
   * { isHealthy: true, diseases: [], overallHealthScore: 0.8 }
   * @param {any} visionData - Contains labels detected from a visual analysis.
   * @param {any} plantData - Contains information about plant diseases from identification results.
   * @returns {{isHealthy: boolean, diseases: any[], overallHealthScore: number}} Returns an object encompassing health status, identified diseases, and overall health score.
   * @description
   *   - It identifies diseases from plant data with a probability higher than 0.3.
   *   - Diseases identified via visual analysis are noted if their confidence is greater than 0.5.
   *   - Overall health score is adjusted based on the severity of found diseases.
   *   - Diseases are sorted by confidence in descending order within the return object.
   */
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
  /**
   * Extracts visual features from given vision and plant data.
   * @example
   * extractVisualFeatures(visionData, plantData)
   * {
   *   plantPart: "leaf",
   *   colors: ["#34ebba", "#00ff1e", "#unknown"],
   *   symptoms: ["yellow", "wilted"],
   *   leafCondition: "problematica"
   * }
   * @param {any} visionData - Data from visual recognition API containing labels and colors.
   * @param {any} plantData - Additional plant data containing plant parts.
   * @returns {object} Extracted features including plant parts, colors, symptoms, and leaf condition.
   * @description
   *   - Chooses the plant part based either on provided plant data or recognized labels, prioritizing plant data.
   *   - Identifies up to three dominant colors from the vision data hex codes.
   *   - Detects visual symptoms by searching for specific keywords within recognized labels.
   *   - Determines leaf condition based on identified symptoms and a confidence check from vision data.
   */
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
  /**
  * Detects diseases from given labels based on predefined patterns.
  * @example
  * detectDiseaseFromLabels([{description: 'yellowing leaf', score: 0.9}, {description: 'brown spots', score: 0.8}])
  * Returns an array of detected diseases with symptoms, treatment, confidence, and severity level.
  * @param {any[]} labels - An array of label objects, each containing a description and a confidence score.
  * @returns {any[]} An array of objects representing detected diseases with their symptoms, average confidence score, treatment recommendations, and severity level.
  * @description
  *   - The function matches label descriptions with keywords from predefined disease patterns.
  *   - For each pattern matched, the function calculates the average confidence score from the labels.
  *   - It identifies diseases and returns relevant information including symptoms, treatment, and severity.
  */
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
  /**
   * Extracts a list of treatments from a disease object.
   * @example
   * extractTreatmentFromDisease({ treatment: { biological: ['Treatment1', 'Treatment2'], chemical: ['Treatment3'] } })
   * ['Treatment1', 'Treatment2', 'Treatment3']
   * @param {any} disease - The disease object containing treatment information.
   * @returns {string[]} An array of treatments extracted from the disease object. If no treatments are found, returns an array with 'Consulenza specialistica raccomandata'.
   * @description
   *   - Prioritizes biological and chemical treatments, extracting up to two entries from each category.
   *   - Adds prevention treatments similarly if available.
   */
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
