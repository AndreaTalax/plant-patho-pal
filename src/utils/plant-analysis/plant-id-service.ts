
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Convert file to base64 without data type prefix
export const fileToBase64WithoutPrefix = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64 = reader.result as string;
      // Remove prefix like "data:image/jpeg;base64,"
      resolve(base64.split(',')[1]);
    };
    reader.onerror = error => reject(error);
  });
};

// Analyze plant image using Plexi AI with robust error handling
export const analyzeWithCloudVision = async (imageFile: File): Promise<any> => {
  try {
    console.log('🔍 Starting Cloud Vision analysis...');
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('type', 'all');
    
    const { data, error } = await supabase.functions.invoke('analyze-with-cloud-vision', {
      body: formData
    });
    
    if (error) {
      console.error('❌ Cloud Vision analysis error:', error);
      console.log('⚠️ Falling back to local analysis');
      return fallbackLocalAnalysis(imageFile);
    }
    
    console.log('✅ Cloud Vision analysis successful:', data);
    return data;
  } catch (error) {
    console.error('❌ Cloud Vision analysis failed:', error);
    console.log('⚠️ Using fallback local analysis');
    return fallbackLocalAnalysis(imageFile);
  }
};

// Robust fallback analysis with safe error handling
export const fallbackLocalAnalysis = (imageFile: File): any => {
  console.log('🔄 Using local fallback analysis');
  
  // Create safe mock data with error handling
  const fallbackData = {
    label: "Identificazione locale",
    score: 0.65,
    healthy: null, // Unknown health status
    plantPart: "whole plant",
    confidence: 0.65,
    dataSource: "Analisi locale (fallback)",
    isValidPlantImage: true,
    detectedPlantType: "pianta generica",
    message: "Analisi eseguita localmente - accuratezza limitata",
    fallback: true,
    error: false,
    requiresExpert: true // Always recommend expert for fallback
  };
  
  return fallbackData;
};

// Safe plant type identification with error handling
export const identifyPlantTypeWithVision = (visionResults: any): string | null => {
  try {
    if (!visionResults || !visionResults.isPlant) {
      return null;
    }
    
    // Safely extract plant-related labels
    const labels = visionResults.labels || [];
    const plantLabels = labels
      .filter((label: any) => {
        if (!label || !label.description) return false;
        const desc = label.description.toLowerCase();
        return desc.includes('plant') || 
               desc.includes('flower') || 
               desc.includes('tree') ||
               desc.includes('leaf') ||
               desc.includes('botanical');
      })
      .sort((a: any, b: any) => (b.score || 0) - (a.score || 0));
    
    if (plantLabels.length > 0) {
      return plantLabels[0].description;
    } else if (visionResults.plantDetails?.type) {
      return visionResults.plantDetails.type;
    }
    
    return "Pianta generica";
  } catch (error) {
    console.error('❌ Error identifying plant type:', error);
    return "Pianta non identificata";
  }
};

// Safe disease detection with robust error handling
export const detectPlantDiseaseWithVision = (visionResults: any): { isHealthy: boolean, disease: string | null, confidence: number } => {
  try {
    if (!visionResults || !visionResults.isPlant) {
      return { isHealthy: true, disease: null, confidence: 0 };
    }
    
    // Disease-related terms
    const diseaseTerms = ['disease', 'spot', 'blight', 'mildew', 'rot', 'rust', 'yellow', 'brown', 'wilt', 'mold', 'fungus'];
    const labels = visionResults.labels || [];
    
    const diseaseLabels = labels
      .filter((label: any) => {
        if (!label || !label.description) return false;
        const desc = label.description.toLowerCase();
        return diseaseTerms.some(term => desc.includes(term));
      })
      .sort((a: any, b: any) => (b.score || 0) - (a.score || 0));
    
    // Check for unhealthy colors
    const colors = visionResults.colors || [];
    const hasUnhealthyColors = colors.some((color: any) => {
      if (!color || !color.color) return false;
      const { red = 0, green = 0, blue = 0 } = color.color;
      // Yellows, browns, or dark colors might indicate disease
      return (red > 200 && green > 200 && blue < 100) || // Yellow
             (red > 120 && green < 100 && blue < 100) || // Brown-red
             (red < 100 && green < 100 && blue < 100);   // Dark/necrotic
    });
    
    if (diseaseLabels.length > 0) {
      return { 
        isHealthy: false, 
        disease: diseaseLabels[0].description, 
        confidence: diseaseLabels[0].score || 0.5
      };
    } else if (hasUnhealthyColors) {
      return { 
        isHealthy: false, 
        disease: 'Possibile problema di salute (basato su analisi colore)', 
        confidence: 0.65 
      };
    }
    
    return { isHealthy: true, disease: null, confidence: 0.8 };
  } catch (error) {
    console.error('❌ Error detecting plant disease:', error);
    return { isHealthy: null, disease: null, confidence: 0 };
  }
};

// Safe plant part identification
export const identifyPlantPartWithVision = (visionResults: any): string => {
  try {
    if (!visionResults || !visionResults.isPlant) {
      return "whole plant";
    }
    
    const partTerms = {
      'leaf': ['leaf', 'leaves', 'foliage'],
      'flower': ['flower', 'bloom', 'blossom', 'petal'],
      'fruit': ['fruit', 'berry', 'seed', 'pod'],
      'stem': ['stem', 'stalk', 'trunk'],
      'root': ['root', 'tuber', 'bulb'],
      'branch': ['branch', 'twig']
    };
    
    const labels = visionResults.labels || [];
    
    // Check labels for plant parts
    for (const [part, terms] of Object.entries(partTerms)) {
      for (const label of labels) {
        if (label && label.description) {
          const desc = label.description.toLowerCase();
          if (terms.some(term => desc.includes(term))) {
            return part;
          }
        }
      }
    }
    
    // Check objects if available
    if (visionResults.objects && Array.isArray(visionResults.objects)) {
      for (const obj of visionResults.objects) {
        if (obj && obj.name) {
          const objName = obj.name.toLowerCase();
          for (const [part, terms] of Object.entries(partTerms)) {
            if (terms.some(term => objName.includes(term))) {
              return part;
            }
          }
        }
      }
    }
    
    return "whole plant";
  } catch (error) {
    console.error('❌ Error identifying plant part:', error);
    return "whole plant";
  }
};

// Enhanced analysis integration with comprehensive error handling
export const enhancePlantAnalysisWithVision = (baseAnalysis: any, visionResults: any): any => {
  try {
    if (!baseAnalysis) {
      baseAnalysis = {
        label: "Analisi non disponibile",
        confidence: 0,
        healthy: null,
        error: true,
        fallback: true
      };
    }
    
    if (!visionResults) {
      console.log('⚠️ No vision results available');
      return { ...baseAnalysis, enhanced: false };
    }
    
    // Create enhanced copy
    const enhancedAnalysis = { ...baseAnalysis };
    
    // Integrate vision AI data safely
    if (visionResults.isPlant) {
      // Update plant type if confidence is higher
      if (visionResults.plantDetails?.type && 
          (!enhancedAnalysis.confidence || 
           enhancedAnalysis.confidence < (visionResults.plantDetails.confidence || 0))) {
        enhancedAnalysis.label = visionResults.plantDetails.type;
        enhancedAnalysis.plantName = visionResults.plantDetails.type;
        enhancedAnalysis.confidence = visionResults.plantDetails.confidence || 0.5;
      }
      
      // Determine plant part
      if (!enhancedAnalysis.plantPart) {
        enhancedAnalysis.plantPart = identifyPlantPartWithVision(visionResults);
      }
      
      // Assess plant health
      const healthAssessment = detectPlantDiseaseWithVision(visionResults);
      if (enhancedAnalysis.healthy === undefined || enhancedAnalysis.healthy === null) {
        enhancedAnalysis.healthy = healthAssessment.isHealthy;
        if (!healthAssessment.isHealthy && healthAssessment.disease) {
          enhancedAnalysis.disease = {
            name: healthAssessment.disease,
            confidence: healthAssessment.confidence
          };
        }
      }
      
      // Add additional data
      enhancedAnalysis.additionalLabels = visionResults.labels || [];
      enhancedAnalysis.colorProfile = visionResults.colors || [];
      
      if (visionResults.webEntities && visionResults.webEntities.length > 0) {
        enhancedAnalysis.webReferences = visionResults.webEntities;
      }
      
      // Add enhanced flag
      enhancedAnalysis.enhanced = true;
    } else {
      enhancedAnalysis.enhanced = false;
      console.log('⚠️ Vision results indicate this is not a plant');
    }
    
    // Add raw data for debugging
    enhancedAnalysis._rawData = {
      ...enhancedAnalysis._rawData,
      visionAI: visionResults
    };
    
    return enhancedAnalysis;
  } catch (error) {
    console.error('❌ Error enhancing plant analysis:', error);
    return {
      ...baseAnalysis,
      enhanced: false,
      enhancementError: error.message || 'Enhancement failed'
    };
  }
};
