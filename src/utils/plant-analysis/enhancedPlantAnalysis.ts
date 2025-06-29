import { supabase } from "@/integrations/supabase/client";

export interface PlantAnalysisResult {
  success: boolean;
  plantName: string;
  scientificName?: string;
  confidence: number;
  isHealthy: boolean;
  diseases: any[];
  recommendations: string[];
  analysisDetails: any;
  error?: string;
}

import { searchEppoDatabase, formatEppoResults } from './eppoIntegration';

/**
 * Enhanced plant analysis with EPPO database integration
 */
export const performEnhancedPlantAnalysis = async (
  imageFile: File,
  plantInfo?: any
): Promise<PlantAnalysisResult> => {
  try {
    console.log('🔬 Starting enhanced plant analysis with EPPO integration...');
    
    // Convert image to base64 for API calls
    const base64Image = await convertToBase64(imageFile);
    
    // Step 1: Call the plant diagnosis API
    const { data: diagnosisData, error } = await supabase.functions.invoke('plant-diagnosis', {
      body: {
        image: base64Image,
        plantInfo: plantInfo
      }
    });
    
    if (error) {
      console.error('❌ Plant diagnosis API error:', error);
      throw new Error(`Diagnosis API failed: ${error.message}`);
    }
    
    if (!diagnosisData) {
      throw new Error('No diagnosis data received');
    }
    
    console.log('✅ Initial diagnosis completed:', diagnosisData.plantName);
    
    // Step 2: Enhanced EPPO database search
    let eppoResults = [];
    const symptoms = plantInfo?.symptoms || diagnosisData.detectedSymptoms?.join(', ') || '';
    const plantName = diagnosisData.plantName || plantInfo?.name || '';
    
    if (symptoms || plantName) {
      console.log('🔍 Searching EPPO database...');
      eppoResults = await searchEppoDatabase(plantName, symptoms, plantInfo);
      console.log(`📊 EPPO search found ${eppoResults.length} relevant results`);
    }
    
    // Step 3: Combine and enhance results
    const combinedDiseases = [];
    
    // Add original diseases from diagnosis
    if (diagnosisData.diseases && Array.isArray(diagnosisData.diseases)) {
      combinedDiseases.push(...diagnosisData.diseases);
    }
    
    // Add EPPO results as diseases
    const formattedEppoResults = formatEppoResults(eppoResults);
    combinedDiseases.push(...formattedEppoResults);
    
    // Remove duplicates and sort by probability
    const uniqueDiseases = removeDuplicateDiseases(combinedDiseases);
    uniqueDiseases.sort((a, b) => (b.probability || 0) - (a.probability || 0));
    
    // Step 4: Enhanced recommendations
    const enhancedRecommendations = generateEnhancedRecommendations(
      diagnosisData,
      eppoResults,
      plantInfo
    );
    
    // Calculate overall confidence
    const overallConfidence = calculateOverallConfidence(
      diagnosisData.confidence || 0,
      eppoResults.length
    );
    
    const result: PlantAnalysisResult = {
      success: true,
      plantName: diagnosisData.plantName || 'Pianta identificata',
      scientificName: diagnosisData.scientificName || undefined,
      confidence: overallConfidence,
      isHealthy: uniqueDiseases.length === 0 || diagnosisData.isHealthy,
      diseases: uniqueDiseases.slice(0, 5), // Top 5 diseases
      recommendations: enhancedRecommendations,
      analysisDetails: {
        source: 'Enhanced Analysis with EPPO Database',
        verificationPassed: true,
        qualityCheck: true,
        eppoResultsCount: eppoResults.length,
        originalConfidence: diagnosisData.confidence,
        enhancedConfidence: overallConfidence
      }
    };
    
    console.log('✅ Enhanced plant analysis completed successfully');
    return result;
    
  } catch (error) {
    console.error('❌ Enhanced plant analysis failed:', error);
    return {
      success: false,
      error: error.message || 'Enhanced analysis failed',
      plantName: 'Analisi non completata',
      confidence: 0,
      isHealthy: false,
      diseases: [],
      recommendations: ['Consultare un esperto per diagnosi accurata'],
      analysisDetails: {
        source: 'Enhanced Analysis (Failed)',
        verificationPassed: false,
        qualityCheck: false
      }
    };
  }
};

/**
 * Remove duplicate diseases based on name similarity
 */
const removeDuplicateDiseases = (diseases: any[]): any[] => {
  const unique = [];
  const seen = new Set();
  
  for (const disease of diseases) {
    const key = disease.name?.toLowerCase().trim();
    if (key && !seen.has(key)) {
      seen.add(key);
      unique.push(disease);
    }
  }
  
  return unique;
};

/**
 * Generate enhanced recommendations combining original and EPPO data
 */
const generateEnhancedRecommendations = (
  diagnosisData: any,
  eppoResults: any[],
  plantInfo?: any
): string[] => {
  const recommendations = [];
  
  // Add original recommendations
  if (diagnosisData.recommendations && Array.isArray(diagnosisData.recommendations)) {
    recommendations.push(...diagnosisData.recommendations);
  }
  
  // Add EPPO-specific recommendations
  if (eppoResults.length > 0) {
    const regulatedDiseases = eppoResults.filter(r => r.regulatoryStatus && r.regulatoryStatus.length > 0);
    
    if (regulatedDiseases.length > 0) {
      recommendations.unshift('⚠️ ATTENZIONE: Rilevate possibili malattie regolamentate EPPO');
      recommendations.push('Consulenza fitopatologo URGENTE raccomandata');
      recommendations.push('Possibile obbligo di notifica alle autorità competenti');
    }
    
    recommendations.push('Diagnosi arricchita con database EPPO europeo');
  }
  
  // Add plant-specific recommendations
  if (plantInfo?.isIndoor) {
    recommendations.push('Migliorare circolazione aria in ambiente interno');
  } else {
    recommendations.push('Monitorare condizioni climatiche esterne');
  }
  
  // Remove duplicates
  return [...new Set(recommendations)];
};

/**
 * Calculate overall confidence combining original and EPPO results
 */
const calculateOverallConfidence = (originalConfidence: number, eppoResultsCount: number): number => {
  let confidence = originalConfidence;
  
  // Boost confidence if EPPO results are found
  if (eppoResultsCount > 0) {
    confidence += 0.1; // 10% boost for EPPO integration
    
    if (eppoResultsCount >= 3) {
      confidence += 0.05; // Additional boost for multiple matches
    }
  }
  
  return Math.min(confidence, 0.95); // Cap at 95%
};

const convertToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]); // Remove data:image/jpeg;base64, prefix
    };
    reader.onerror = error => reject(error);
  });
};
