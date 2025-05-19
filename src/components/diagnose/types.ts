

export interface PlantInfoFormValues {
  isIndoor: boolean;
  wateringFrequency: number;
  lightExposure: string;
  symptoms?: string;
  useAI?: boolean;
}

export interface AnalysisDetails {
  plantName?: string;
  plantSpecies?: string;
  thermalMap?: string;
  aiServices?: any[];
  identifiedFeatures?: string[];
  alternativeDiagnoses?: Array<{disease: string, probability: number}>;
  recommendedAdditionalTests?: string[];
  multiServiceInsights?: {
    plantName?: string;
    plantSpecies?: string;
    plantPart?: string;
    isHealthy?: boolean;
    primaryService?: string;
    agreementScore?: number;
    isValidPlantImage?: boolean;
    dataSource?: string;
    huggingFaceResult?: {
      label: string;
      score: number;
    };
    leafAnalysis?: {
      leafColor?: string;
      patternDetected?: string;
      diseaseConfidence?: number;
      healthStatus?: string;
      leafType?: string;
      details?: {
        symptomDescription?: string;
        symptomCategory?: string;
      };
    };
    advancedLeafAnalysis?: boolean;
    leafDiagnosticCapabilities?: string[];
  };
}

export interface DiagnosedDisease {
  id: string;
  name: string;
  description: string;
  causes: string;
  confidence: number;
  treatments: string[];
  products: string[];
  resources: string[];
  analysisDetails?: AnalysisDetails;
  symptoms?: string[]; // This property is needed for plantDiseases.ts
}
