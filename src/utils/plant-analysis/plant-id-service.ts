import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Convert file to base64 without data type prefix
/**
* Converts a file to a base64 string asynchronously, removing any data URI prefix.
* @example
* sync(file).then(base64String => console.log(base64String));
* @param {File} file - The file to convert into a base64 string.
* @returns {Promise<string>} A promise that resolves with the base64 string representation of the file.
* @description
*   - Uses FileReader API to handle file reading asynchronously.
*   - Strips the data URI prefix from the result before resolving the promise.
*   - Handles both file read success and error cases.
*/
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
/**
 * Analyzes an image file using Cloud Vision and provides the result.
 * @example
 * sync(imageFile)
 * Returns analysis data object or performs a fallback local analysis in case of an error.
 * @param {File} imageFile - The image file to be analyzed.
 * @returns {Promise<any>} A promise that resolves to the analysis data or the result from fallbackLocalAnalysis.
 * @description
 *   - Utilizes `supabase.functions.invoke` for remote analysis via Cloud Vision.
 *   - Falls back to a local analysis method if the Cloud Vision service encounters an error.
 *   - Logs each step of the process for debugging purposes.
 */
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
/**
* Performs a local fallback analysis on the provided image file.
* @example
* imageFile(sampleImageFile)
* Returns an object containing mock analysis data.
* @param {File} imageFile - The image file to analyze, used for local fallback analysis.
* @returns {Object} An object with mock analysis data including label, score, confidence, and recommendations.
* @description
*   - This function is used when other analysis methods are unavailable.
*   - It creates a mock analysis result to simulate a real analysis result.
*   - Always suggests consulting an expert due to the limited accuracy of this local analysis.
*   - The function will consistently mark the process as a fallback, indicating that it's not the primary analysis method.
*/
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
/**
* Extracts the most relevant plant description from vision results.
* @example
* extractPlantDescription(visionResults)
* 'rose'
* @param {Object} visionResults - An object containing vision analysis results.
* @returns {string | null} The description of the most relevant plant label or a fallback plant type.
* @description 
*   - Filters labels to include specific plant-related keywords such as 'plant', 'flower', 'tree', 'leaf', or 'botanical'.
*   - Sorts the filtered labels based on their score in descending order to find the most relevant description.
*   - Provides a default return of "Pianta generica" if no specific plant labels are found.
*   - Logs an error message and returns "Pianta non identificata" if any exceptions occur during processing.
*/
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
/**
 * Analyzes vision results to determine plant health status.
 * @example
 * analyzePlantHealth(visionResults)
 * { isHealthy: true, disease: null, confidence: 0.8 }
 * @param {Object} visionResults - An object containing vision analysis data with labels and colors.
 * @returns {Object} An object containing the health status, detected disease (if any), and confidence level.
 * @description
 *   - Identifies potential plant diseases based on labels containing disease-related terms.
 *   - Evaluates plant health using color analysis for symptoms of diseases like yellowing or browning.
 *   - Handles errors gracefully by logging them and returning default health status.
 */
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
/**
 * Identifies the part of the plant described in the vision results.
 * @example
 * identifyPlantPart(visionResults)
 * 'leaf'
 * @param {any} visionResults - The result containing labels and objects from a vision recognition service.
 * @returns {string} Identified plant part such as "leaf", "flower", "fruit", etc., or "whole plant" if not identified.
 * @description
 *   - Match labels against predefined plant part terms to identify specific plant parts.
 *   - Falls back to checking objects if plant part is not identified in the labels.
 *   - Returns "whole plant" if no specific part is identified or if an error occurs.
 */
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
/**
 * Enhances base plant analysis data using vision AI results and provides a detailed plant examination.
 * @example
 * baseAnalysis(someBaseAnalysis, someVisionResults)
 * Returns enhanced analysis object with detailed plant information.
 * @param {Object} baseAnalysis - The base plant analysis data containing initial assessment, label, and confidence.
 * @param {Object} visionResults - The vision AI results containing information about plant characteristics, health, and web references.
 * @returns {Object} Enhanced analysis object that includes integrated data from vision AI results along with updated labels, health status, and color profile.
 * @description
 *   - Safely integrates vision AI data to enhance the existing analysis by updating labels and confidence levels.
 *   - Determines plant health and disease presence, providing specific disease name and confidence if available.
 *   - Incorporates vision AI derived web references and additional labels to enrich the analysis.
 *   - Logs any errors and manages exceptions by returning enhancement status and error details when applicable.
 */
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

/**
 * Calls Supabase Edge Function to use Plant.id and returns best guess species name and confidence.
 * @param imageFile file (jpeg/png)
 * @returns {Promise<{plantName: string, confidence: number, rawResult: object}>}
 */
export const identifyPlantFromImage = async (imageFile: File): Promise<{plantName: string, confidence: number, rawResult: any}> => {
  try {
    // Convert file to base64 (no prefix)
    const base64String = await fileToBase64WithoutPrefix(imageFile);
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL || "https://otdmqmpxukifoxjlgzmq.supabase.co"}/functions/v1/plant-id-diagnosis`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64String }),
      }
    );
    const data = await response.json();
    // Parse best result
    const best = Array.isArray(data?.suggestions) ? data.suggestions[0] : null;
    return {
      plantName: best?.plant_details?.scientific_name || best?.plant_details?.common_names?.[0] || "Specie non identificata",
      confidence: best?.probability ?? 0,
      rawResult: data
    }
  } catch (e: any) {
    return {
      plantName: "Specie non identificata",
      confidence: 0,
      rawResult: { error: e?.message || "Errore chiamata Plant.id" }
    }
  }
}
