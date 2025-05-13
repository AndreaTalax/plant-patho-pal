
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
    leafPercentage: number;
    boundingBox?: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  };
  plantVerification?: {
    isPlant: boolean;
    confidence: number;
    aiServices?: {
      serviceName: string;
      result: boolean;
      confidence: number;
    }[];
  };
  multiServiceInsights?: {
    agreementScore: number;
    primaryService: string;
    plantSpecies?: string;
    huggingFaceResult?: {
      label: string;
      score: number;
    };
  };
}
