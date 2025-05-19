
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
}
