
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
  multiServiceInsights?: {
    huggingFaceResult?: {
      label: string;
      score: number;
    };
    agreementScore?: number;
    primaryService?: string;
    plantSpecies?: string;
  };
  alternativeDiagnoses: {
    disease: string;
    probability: number;
  }[];
  recommendedAdditionalTests?: string[];
  thermalMap?: string;
  leafVerification?: {
    isLeaf: boolean;
    leafPercentage?: number;
    boundingBox?: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  };
  plantVerification?: {
    isPlant: boolean;
    aiServices?: {
      serviceName: string;
      result: boolean;
      confidence: number;
    }[];
  };
  plantixInsights?: {
    severity?: string;
    progressStage?: string;
    spreadRisk?: string;
    environmentalFactors?: string[];
    reliability?: string;
    confidenceNote?: string;
  };
}
