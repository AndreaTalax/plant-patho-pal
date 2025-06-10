
export interface PlantInfo {
  isIndoor: boolean;
  wateringFrequency: string;
  lightExposure: string;
  symptoms: string;
  useAI: boolean;
  sendToExpert: boolean;
  name: string;
  infoComplete: boolean;
}

export interface DiagnosedDisease {
  id: string;
  name: string;
  description: string;
  causes: string;
  symptoms: string[];
  treatments: string[];
  confidence: number;
  healthy: boolean;
  products?: string[];
  disclaimer?: string;
  recommendExpertConsultation?: boolean;
}

export interface AnalysisDetails {
  multiServiceInsights?: {
    plantName?: string;
    plantSpecies?: string;
    plantPart?: string;
    isHealthy?: boolean;
    isValidPlantImage?: boolean;
    primaryService?: string;
    agreementScore?: number;
    huggingFaceResult?: {
      label: string;
      score: number;
    };
    dataSource?: string;
  };
  risultatiCompleti?: {
    plantInfo?: PlantInfo;
    accuracyGuarantee?: string;
  };
  identifiedFeatures?: string[];
  sistemaDigitaleFoglia?: boolean;
  analysisTechnology?: string;
}
