
// Interfacce per le diverse AI
export interface PlantIdentificationResult {
  plantName: string;
  scientificName: string;
  confidence: number;
  habitat?: string;
  careInstructions?: string[];
  commonDiseases?: string[];
  provider: 'rougen' | 'plant-diseases' | 'plexi';
}

export interface DiseaseDetectionResult {
  disease: string;
  confidence: number;
  symptoms: string[];
  treatments: string[];
  severity: 'low' | 'medium' | 'high';
  provider: string;
}

export interface AnalysisProgress {
  stage: string;
  percentage: number;
  message: string;
}

export interface CombinedAnalysisResult {
  plantIdentification: PlantIdentificationResult[];
  diseaseDetection: DiseaseDetectionResult[];
  consensus: {
    mostLikelyPlant: PlantIdentificationResult;
    mostLikelyDisease?: DiseaseDetectionResult;
    confidenceScore: number;
  };
}

// Rougen AI Service - per identificazione piante
export class RougenAIService {
  private static readonly API_URL = 'https://api.rougen.ai/v1/plant-identify';
  
  static async identifyPlant(imageData: string): Promise<PlantIdentificationResult> {
    try {
      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: imageData,
          include_habitat: true,
          include_care: true
        })
      });

      if (!response.ok) {
        throw new Error(`Rougen AI API error: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        plantName: data.plant_name || 'Unknown Plant',
        scientificName: data.scientific_name || '',
        confidence: data.confidence || 0.5,
        habitat: data.habitat,
        careInstructions: data.care_instructions || [],
        commonDiseases: data.common_diseases || [],
        provider: 'rougen'
      };
    } catch (error) {
      console.error('RougenAI identification failed:', error);
      // Fallback result
      return {
        plantName: 'Identificazione non riuscita',
        scientificName: '',
        confidence: 0,
        provider: 'rougen'
      };
    }
  }
}

// Plant Diseases AI Service - per rilevamento malattie
export class PlantDiseasesAIService {
  private static readonly API_URL = 'https://api.plantdiseases.ai/v1/detect';
  
  static async detectDisease(imageData: string): Promise<DiseaseDetectionResult> {
    try {
      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: imageData,
          detailed_analysis: true
        })
      });

      if (!response.ok) {
        throw new Error(`Plant Diseases AI API error: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        disease: data.disease_name || 'Nessuna malattia rilevata',
        confidence: data.confidence || 0.5,
        symptoms: data.symptoms || [],
        treatments: data.treatments || [],
        severity: data.severity || 'low',
        provider: 'plant-diseases'
      };
    } catch (error) {
      console.error('Plant Diseases AI detection failed:', error);
      // Fallback result
      return {
        disease: 'Analisi non riuscita',
        confidence: 0,
        symptoms: [],
        treatments: [],
        severity: 'low',
        provider: 'plant-diseases'
      };
    }
  }
}

// Plexi AI Service - analisi completa
export class PlexiAIService {
  private static readonly API_URL = 'https://api.plexi.ai/v1/analyze';
  
  static async analyzePlant(imageData: string): Promise<PlantIdentificationResult & { diseaseInfo?: DiseaseDetectionResult }> {
    try {
      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: imageData,
          analysis_type: 'complete',
          include_diseases: true
        })
      });

      if (!response.ok) {
        throw new Error(`Plexi AI API error: ${response.status}`);
      }

      const data = await response.json();
      
      const result: PlantIdentificationResult & { diseaseInfo?: DiseaseDetectionResult } = {
        plantName: data.plant_identification?.name || 'Unknown Plant',
        scientificName: data.plant_identification?.scientific_name || '',
        confidence: data.plant_identification?.confidence || 0.5,
        habitat: data.plant_identification?.habitat,
        careInstructions: data.care_instructions || [],
        commonDiseases: data.common_diseases || [],
        provider: 'plexi'
      };

      if (data.disease_detection) {
        result.diseaseInfo = {
          disease: data.disease_detection.name || 'Nessuna malattia rilevata',
          confidence: data.disease_detection.confidence || 0.5,
          symptoms: data.disease_detection.symptoms || [],
          treatments: data.disease_detection.treatments || [],
          severity: data.disease_detection.severity || 'low',
          provider: 'plexi'
        };
      }

      return result;
    } catch (error) {
      console.error('Plexi AI analysis failed:', error);
      // Fallback result
      return {
        plantName: 'Analisi non riuscita',
        scientificName: '',
        confidence: 0,
        provider: 'plexi'
      };
    }
  }
}
