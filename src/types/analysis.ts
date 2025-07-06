
export interface CombinedAnalysisResult {
  plantIdentification: any[];
  diseaseDetection: any[];
  consensus: {
    mostLikelyPlant: any;
    mostLikelyDisease?: any;
    overallConfidence: number;
    finalConfidence: number;
    agreementScore: number;
    bestProvider: string;
    providersUsed: string[];
    weightedScores?: Array<{
      provider: string;
      confidence: number;
      weightedScore: number;
    }>;
  };
  eppoData?: {
    plantMatch?: any;
    diseaseMatches?: any[];
    recommendations?: {
      diseases: any[];
      pests: any[];
      careAdvice: string[];
    };
  };  
  analysisMetadata?: {
    timestamp: string;
    totalProcessingTime: number;
    aiProvidersUsed: string[];
    confidenceScore: number;
  };
}
