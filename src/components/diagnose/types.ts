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
  
  // Add the new standardized properties
  label?: string;
  plantPart?: string;
  disease?: {
    name: string;
    confidence: number;
    description?: string;
    treatment?: {
      biological?: string[];
      chemical?: string[];
      prevention?: string[];
    };
  };
  score?: number;
  eppoRegulatedConcern?: {
    name: string;
    code?: string;
    type?: string;
    regulatoryStatus?: string;
    warningLevel?: string;
  } | null;
}

export interface PlantInfo {
  isIndoor: boolean;
  wateringFrequency: string;
  lightExposure: string;
  symptoms: string;
  useAI?: boolean;
  name?: string;
  infoComplete?: boolean;
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
  risultatiCompleti?: {
    plantIdResult?: {
      plantName?: string;
      scientificName?: string;
      commonNames?: string[];
      confidence?: number;
      isHealthy?: boolean;
      diseases?: any[];
      taxonomy?: {
        family?: string;
        genus?: string;
        kingdom?: string;
      };
      wikiDescription?: string;
      similarImages?: any[];
      edibleParts?: string[];
    };
    plexiAIResult?: any;
    rougenAIResult?: any;
    plantDiseasesAIResult?: any;
    plantInfo?: PlantInfo; // Plant info is a valid property here
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
  // New fields for enhanced analysis
  careInstructions?: {
    watering?: string;
    light?: string;
    soil?: string;
    fertilizer?: string;
    pruning?: string;
    temperature?: string;
    humidity?: string;
    repotting?: string;
    propagation?: string;
  };
  habitat?: string;
  aiServicesUsed?: string[];
  privacyInfo?: {
    dataRetention?: string;
    dataUsage?: string;
    privacyPolicy?: string;
  };
}

// Update the component props interfaces for the components we're passing data to
export interface PlantInfoCardProps {
  plantInfo: PlantInfo;
  analysisDetails: AnalysisDetails | null;
  standardizedData?: DiagnosedDisease | null;
}

export interface EppoDataPanelProps {
  analysisDetails: any;
  userInput?: string;
  eppoData?: any;
}

export interface AiServicesDataProps {
  analysisDetails: any;
  isAnalyzing: boolean;
  plantSymptoms?: string;
  standardizedData?: DiagnosedDisease | null;
}
