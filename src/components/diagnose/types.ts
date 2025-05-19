
export interface DiagnosedDisease {
  id: string;
  name: string;
  description: string;
  causes: string;
  symptoms: string[];
  treatments: string[];
  products?: string[];
  confidence: number;
  healthy?: boolean;
  resources?: string[];
}

export interface PlantInfo {
  isIndoor: boolean;
  wateringFrequency: string;
  lightExposure: string;
  symptoms: string;
  useAI?: boolean;
  name?: string;
}

export interface DiagnosisResultProps {
  imageSrc: string;
  plantInfo: PlantInfo;
  analysisData: DiagnosedDisease | null;
  isAnalyzing: boolean;
  onStartNewAnalysis: () => void;
  onChatWithExpert?: () => void;
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
    leafAnalysis?: {
      leafColor: string;
      patternDetected?: string;
      diseaseConfidence?: number;
      healthStatus: string;
      leafType?: string;
      details?: {
        symptomDescription?: string;
        symptomCategory?: string;
      }
    };
    advancedLeafAnalysis?: boolean;
    dataSource?: string;
    leafDiagnosticCapabilities?: string[];
  };
  identifiedFeatures?: string[];
  alternativeDiagnoses?: {
    disease: string;
    probability: number;
  }[];
  sistemaDigitaleFoglia?: boolean;
  thermalMap?: string;
  recommendedProducts?: any[];
  analysisTechnology?: string;
  recommendedAdditionalTests?: string[];
}
