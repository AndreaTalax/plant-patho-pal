
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

export interface AnalysisDetails {
  identifiedFeatures: string[];
  alternativeDiagnoses: {
    disease: string;
    probability: number;
  }[];
  recommendedAdditionalTests?: string[];
  thermalMap?: string;
  leafVerification?: {
    isLeaf: boolean;
    leafPercentage?: number;
    boundingBox?: {x: number, y: number, width: number, height: number};
  };
  plantVerification?: {
    isPlant: boolean;
    confidence: number;
    plantSpecies?: string;
    aiServices?: {
      serviceName: string;
      result: boolean;
      confidence: number;
      notes?: string;
    }[];
  };
  multiServiceInsights?: {
    agreementScore: number;
    primaryService: string;
    plantSpecies?: string;
    diseaseMatchScore?: number;
    diagnosisTimestamp?: string;
    apiVersions?: Record<string, string>;
    huggingFaceResult?: {
      label: string;
      score: number;
      allPredictions?: Array<{
        label: string;
        score: number;
      }>;
    };
  };
  plantixInsights?: {
    plantType?: string;
    severity: 'mild' | 'moderate' | 'severe' | 'unknown';
    progressStage: 'early' | 'developing' | 'advanced' | 'unknown';
    spreadRisk: 'low' | 'medium' | 'high';
    environmentalFactors: string[];
    estimatedOnsetTime?: string;
    reliability?: string;
  };
}
