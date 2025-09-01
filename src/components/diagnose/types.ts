export interface PlantInfo {
  isIndoor: boolean;
  wateringFrequency: string;
  lightExposure: string;
  symptoms: string;
  useAI: boolean;
  sendToExpert: boolean;
  name: string;
  infoComplete: boolean;
  uploadedFile?: File | null;
  uploadedImageUrl?: string | null;
  aiDiagnosis?: any;
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
  resources?: string[];
  label?: string;
  disease?: {
    name: string;
  };
}

export interface AnalysisDetails {
  multiServiceInsights?: {
    plantName?: string;
    plantSpecies?: string;
    plantPart?: string;
    family?: string;
    isHealthy?: boolean;
    isValidPlantImage?: boolean;
    primaryService?: string;
    agreementScore?: number;
    huggingFaceResult?: {
      label: string;
      score: number;
    };
    dataSource?: string;
    eppoPlantIdentification?: {
      eppoCode: string;
      preferredName: string;
      scientificName?: string;
      otherNames?: string[];
      taxonomy?: any;
      source: string;
    };
    eppoDiseasesFound?: number;
  };
  risultatiCompleti?: {
    plantInfo?: PlantInfo;
    accuracyGuarantee?: string;
    plantIdResult?: any;
    detectedDiseases?: any[];
    eppoPathogens?: any[];
  };
  identifiedFeatures?: string[];
  sistemaDigitaleFoglia?: boolean;
  analysisTechnology?: string;
  alternativeDiagnoses?: string[];
  recommendedAdditionalTests?: string[];
  // EPPO integration properties
  eppoResultsCount?: number;
  originalConfidence?: number;
  enhancedConfidence?: number;
  eppoData?: {
    plantMatch?: any;
    diseaseMatches?: any[];
    recommendations?: {
      diseases: any[];
      pests: any[];
      careAdvice: string[];
    };
  };
}
