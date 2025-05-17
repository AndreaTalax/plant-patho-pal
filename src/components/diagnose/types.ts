
export interface DiagnosedDisease {
  id: string;
  name: string;
  description: string;
  causes: string;
  treatments: string[];
  products: string[];
  confidence: number;
  resources: string[];
}

export interface DiagnosisResultProps {
  imageSrc: string;
  plantInfo: any;
  analysisData: any;
  isAnalyzing: boolean;
  onStartNewAnalysis: () => void;
}

export interface LeafAnalysisResult {
  leafArea?: number | null;
  leafColor?: string | null;
  patternDetected?: string | null;
  diseaseConfidence?: number;
  healthStatus?: 'healthy' | 'diseased' | 'stressed' | 'unknown';
  leafType?: string | null;
  details?: Record<string, any>;
}

export interface MultiServiceInsights {
  huggingFaceResult?: {
    label: string;
    score: number;
  };
  agreementScore?: number;
  primaryService?: string;
  plantSpecies?: string;
  plantName?: string;
  plantPart?: string;
  isHealthy?: boolean;
  isValidPlantImage?: boolean;
  isReliable?: boolean;
  dataSource?: string;
  detectedPlantType?: string | null;
  eppoRegulated?: any;
  floraIncognitaMatch?: any;
  plantSnapMatch?: any;
  leafAnalysis?: LeafAnalysisResult;
  advancedLeafAnalysis?: boolean;
  leafDiagnosticCapabilities?: string[];
}

export interface AnalysisDetails {
  multiServiceInsights?: MultiServiceInsights;
  identifiedFeatures?: string[];
  alternativeDiagnoses?: Array<{
    disease: string;
    probability: number;
  }>;
  leafVerification?: {
    isLeaf: boolean;
    partName: string | null;
    confidence: number | null;
    boundingBox: any | null;
  };
  plantVerification?: {
    isPlant: boolean;
    detectedPlantType?: string | null;
    aiServices?: Array<{
      serviceName: string;
      result: boolean;
      confidence: number;
    }>;
    dataSource?: string;
  };
  plantixInsights?: {
    severity: string;
    progressStage: string;
    spreadRisk: string;
    environmentalFactors: string[];
    reliability: string;
    confidenceNote: string;
  };
  eppoData?: {
    regulationStatus: string;
    reportAdvised: boolean;
    warningLevel: string;
    infoLink: string;
  } | null;
  sistemaDigitaleFoglia?: boolean;
  analysisTechnology?: string;
  recommendedAdditionalTests?: string[];
  recommendedProducts?: Array<{
    id?: string;
    name: string;
    description?: string;
    price?: number;
    rating?: number;
    image?: string;
  }>;
  symptoms?: string;
}

export interface UserProfile {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  birthDate: string;
  birthPlace: string;
  hasCompletedProfile?: boolean;
  subscriptionPlan?: string; // Changed from 'free' | 'premium' to string to accept any value from the database
  phone?: string;
  address?: string;
}

export interface SubscriptionPlan {
  type: 'free' | 'premium';
  features: string[];
  aiDiagnosisEnabled: boolean;
}
