
import { toast } from "sonner";
import { dataURLtoFile, formatPercentage, preprocessImage, getCachedResponse, cacheResponse, generateImageHash } from './plantAnalysisUtils';
import { formatHuggingFaceResult } from './result-formatter';
import { analyzeWithCloudVision, fallbackLocalAnalysis } from './plant-id-service';
import { supabase } from "@/integrations/supabase/client";

// Export the utilities for use in other files
export { formatHuggingFaceResult, dataURLtoFile, formatPercentage };

// Multi-AI services plant analysis system
// Main analysis function that connects to multiple plant identification APIs
export const analyzePlant = async (imageFile: File, plantInfo: any = null) => {
  try {
    // Dismiss any existing toasts to prevent stuck notifications
    toast.dismiss();
    
    // Step 1: Preprocess the image to improve quality
    toast.info("Ottimizzazione dell'immagine...", { duration: 2000 });
    const processedImage = await preprocessImage(imageFile);
    
    // Step 2: Generate hash for caching
    const imageHash = await generateImageHash(processedImage);
    const cacheKey = `plant-analysis-${imageHash}`;
    
    // Check cache first
    const cachedResult = getCachedResponse(cacheKey);
    if (cachedResult) {
      console.log("Using cached analysis result");
      
      // Add plant info context to the cached result
      if (plantInfo) {
        cachedResult.plantInfoContext = plantInfo;
      }
      
      toast.success("Analisi completata (dalla cache)", { duration: 2000 });
      return cachedResult;
    }
    
    // Step 3: Parallel analysis with multiple AI services
    toast.info("Analisi dell'immagine con PlexiAI e servizi partner...", { duration: 3000 });
    
    try {
      // Primary analysis through Supabase Edge Function
      console.log("Calling Plexi AI through Supabase Edge Function...");
      const plexiResult = await analyzeWithPlexiAI(processedImage, plantInfo);
      
      if (plexiResult) {
        console.log("Plexi AI analysis successful", plexiResult);
        
        // Cache the successful result
        cacheResponse(cacheKey, plexiResult);
        
        return plexiResult;
      }
    } catch (plexiError) {
      console.error("Plexi AI analysis failed:", plexiError);
      toast.warning("Analisi primaria non riuscita, provo servizi alternativi...", { duration: 3000 });
    }
    
    // Step 4: If Plexi AI fails, try RougeN AI and Plant Diseases AI Detector in parallel
    try {
      const [rougenResult, plantDiseasesResult] = await Promise.allSettled([
        analyzeWithRougenAI(processedImage),
        analyzeWithPlantDiseasesAI(processedImage)
      ]);
      
      // Combine results from multiple services
      const combinedResult = combineAnalysisResults(
        rougenResult.status === 'fulfilled' ? rougenResult.value : null,
        plantDiseasesResult.status === 'fulfilled' ? plantDiseasesResult.value : null,
        plantInfo
      );
      
      if (combinedResult) {
        console.log("Combined analysis successful", combinedResult);
        
        // Cache the successful result
        cacheResponse(cacheKey, combinedResult);
        
        return combinedResult;
      }
    } catch (error) {
      console.error("All external services failed:", error);
    }
    
    // Step 5: If all remote services fail, use Cloud Vision as another fallback
    toast.warning("Servizi principali non disponibili. Tentativo con Vision...", { duration: 3000 });
    
    try {
      const cloudVisionResult = await analyzeWithCloudVision(processedImage);
      if (cloudVisionResult) {
        console.log("Cloud Vision analysis successful", cloudVisionResult);
        
        // Add plant info context to the result if available
        if (plantInfo) {
          cloudVisionResult.plantInfoContext = plantInfo;
        }
        
        // Cache the successful result
        cacheResponse(cacheKey, cloudVisionResult);
        
        return cloudVisionResult;
      }
    } catch (cloudError) {
      console.error("Cloud Vision failed:", cloudError);
    }
    
    // Step 6: If all remote services fail, use local analysis as last resort
    console.log("All remote analyses failed, using local analysis");
    toast.error("Tutti i servizi remoti non disponibili. Utilizzo analisi locale.", { duration: 5000 });
    
    const localResult = fallbackLocalAnalysis(processedImage);
    
    // Add plant info context to the result
    if (plantInfo) {
      localResult.plantInfoContext = plantInfo;
    }
    
    return localResult;
    
  } catch (error) {
    console.error("Error during plant analysis:", error);
    toast.error("Errore durante l'analisi della pianta: " + (error as Error).message, { duration: 5000 });
    
    // Return null if everything fails
    return null;
  }
};

// Function to analyze using Plexi AI
const analyzeWithPlexiAI = async (imageFile: File, plantInfo: any = null) => {
  try {
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('optimized', 'true'); // Flag to indicate the image is optimized

    // If we have plant info, add it to the formData
    if (plantInfo) {
      formData.append('plantInfo', JSON.stringify(plantInfo));
    }
    
    // Call the Supabase Edge Function with retry mechanism
    let attempts = 0;
    const maxAttempts = 2; // Limit retries to respond faster
    let data, error;
    
    while (attempts < maxAttempts) {
      try {
        attempts++;
        console.log(`PlexiAI analysis attempt ${attempts}/${maxAttempts}...`);
        
        // Add a small delay between attempts to give the backend more time
        if (attempts > 1) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
        }
        
        const response = await supabase.functions.invoke('analyze-plant', {
          body: formData
        });
        
        data = response.data;
        error = response.error;
        
        // If successful or got data with error, break
        if (!error || data) break;
        
        toast.info(`Nuovo tentativo analisi (${attempts + 1}/${maxAttempts})...`, {
          duration: 2000
        });
      } catch (retryError) {
        console.error(`Error at attempt ${attempts}:`, retryError);
        if (attempts === maxAttempts) {
          error = retryError;
        }
      }
    }

    if (error || !data) {
      console.error('Error calling analyze-plant function:', error);
      throw new Error(`Plexi AI analysis failed: ${error?.message || 'Unknown error'}`);
    }
    
    // Process the result
    return processPlexiAIResult(data, plantInfo);
    
  } catch (err) {
    console.error('Exception during PlexiAI analysis:', err);
    throw err;
  }
};

// Function to analyze using RougeN AI
const analyzeWithRougenAI = async (imageFile: File) => {
  try {
    // Convert the image to base64
    const imageBase64 = await fileToBase64(imageFile);
    
    const response = await supabase.functions.invoke('analyze-with-rougen', {
      body: { imageBase64 }
    });
    
    if (response.error) {
      console.error('RougeN AI analysis error:', response.error);
      return null;
    }
    
    return processRougenResult(response.data);
    
  } catch (error) {
    console.error('Error in RougeN AI analysis:', error);
    return null;
  }
};

// Function to analyze using Plant Diseases AI
const analyzeWithPlantDiseasesAI = async (imageFile: File) => {
  try {
    // Convert the image to base64
    const imageBase64 = await fileToBase64(imageFile);
    
    const response = await supabase.functions.invoke('analyze-plant-diseases', {
      body: { imageBase64 }
    });
    
    if (response.error) {
      console.error('Plant Diseases AI analysis error:', response.error);
      return null;
    }
    
    return processDiseaseResult(response.data);
    
  } catch (error) {
    console.error('Error in Plant Diseases AI analysis:', error);
    return null;
  }
};

// Process results from Plexi AI
const processPlexiAIResult = (data: any, plantInfo: any) => {
  // Check for proper data structure
  if (!data.label) {
    console.warn('Plexi AI result missing essential fields');
    return null;
  }
  
  // Return the processed results in standardized format
  return {
    ...data,
    plantInfoContext: plantInfo,
    source: 'PlexiAI'
  };
};

// Process results from RougeN AI
const processRougenResult = (data: any) => {
  if (!data) return null;
  
  return {
    label: data.plantName || data.name || 'Unknown Plant',
    plantPart: data.plantPart || 'whole plant',
    healthy: data.isHealthy !== undefined ? data.isHealthy : true,
    disease: data.disease,
    score: data.confidence || data.score || 0.7,
    source: 'RougenAI',
    careInstructions: data.care || {},
    habitat: data.habitat || 'Information not available'
  };
};

// Process results from Plant Diseases AI
const processDiseaseResult = (data: any) => {
  if (!data) return null;
  
  return {
    label: data.plantName || 'Unknown Plant',
    plantPart: data.plantPart || 'leaf',
    healthy: data.isHealthy !== undefined ? data.isHealthy : false,
    disease: {
      name: data.diseaseName || 'Unknown Disease',
      confidence: data.confidence || 0.7,
      treatment: data.treatment || {}
    },
    score: data.confidence || 0.7,
    source: 'Plant Diseases AI'
  };
};

// Combine results from multiple services
const combineAnalysisResults = (rougenResult: any, plantDiseasesResult: any, plantInfo: any) => {
  // If both are null, return null
  if (!rougenResult && !plantDiseasesResult) {
    return null;
  }
  
  // If only one service provided results, use that
  if (!rougenResult) return { ...plantDiseasesResult, plantInfoContext: plantInfo };
  if (!plantDiseasesResult) return { ...rougenResult, plantInfoContext: plantInfo };
  
  // When both services provide results, we need to merge them
  // Generally, trust RougeN AI for plant identification and Plant Diseases AI for disease detection
  const combined = {
    // Basic identification - prefer RougeN for this
    label: rougenResult.label,
    plantPart: rougenResult.plantPart || plantDiseasesResult.plantPart,
    score: Math.max(rougenResult.score || 0, plantDiseasesResult.score || 0),
    
    // Health status - trust Plant Diseases AI more for disease detection
    healthy: plantDiseasesResult.healthy,
    disease: plantDiseasesResult.disease,
    
    // Additional information from RougeN
    habitat: rougenResult.habitat,
    careInstructions: rougenResult.careInstructions,
    
    // Metadata
    plantInfoContext: plantInfo,
    multiServiceAnalysis: true,
    sources: ['RougenAI', 'Plant Diseases AI']
  };
  
  return combined;
};

// Convert file to base64
const fileToBase64 = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64 = reader.result as string;
      // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
      resolve(base64.split(',')[1]);
    };
    reader.onerror = error => reject(error);
  });
};
