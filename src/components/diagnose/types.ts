
export interface PlantInfoFormValues {
  isIndoor: boolean;
  wateringFrequency: number;
  lightExposure: string;
  symptoms?: string;
  useAI?: boolean;
}

export interface DiagnosedDisease {
  id: string;
  name: string;
  confidence: number;
  description: string;
  treatment: string[];
  products: string[];
  causes: string[];
  treatments: string[];
  resources: { title: string; url: string }[];
  analysisDetails?: AnalysisDetails; // Add analysisDetails to DiagnosedDisease
}

export interface AnalysisDetails {
  plantName: string;
  plantSpecies: string;
  identifiedFeatures: string[];
  alternativeDiagnoses: Array<{ disease: string; probability: number }>;
  recommendedAdditionalTests: string[];
  multiServiceInsights: {
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
    sistemaDigitaleFogliaVersion?: string;
  };
  thermalMap?: string | null;
  aiServices?: Array<{
    name: string;
    result: boolean;
    confidence: number;
  }>;
  plantVerification?: {
    isPlant: boolean;
    confidence: number;
    aiServices?: Array<{
      serviceName: string;
      result: boolean;
      confidence: number;
    }>;
  };
  eppoRegulatedConcern?: any | null;
}
