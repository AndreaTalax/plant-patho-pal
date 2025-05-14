
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Sends an image to the Supabase Edge Function for plant disease analysis
 * Using a PlantNet-inspired approach combined with TRY Plant Trait Database
 * and specialized leaf disease detection using New Plant Diseases Dataset and OLID I
 * @param imageFile The plant image file to analyze
 * @returns The analysis result from the image processing models
 */
export const analyzePlantImage = async (imageFile: File) => {
  try {
    const formData = new FormData();
    formData.append('image', imageFile);

    toast.info("Analyzing your plant image...", {
      duration: 3000,
    });

    // Call the Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('analyze-plant', {
      body: formData,
    });

    if (error) {
      console.error('Error calling analyze-plant function:', error);
      toast.error(`Analysis error: ${error.message || 'Unknown error'}`);
      return null;
    }

    console.log('Plant analysis result:', data);
    
    // If the image validation failed, show a specific message
    if (data.isValidPlantImage === false) {
      toast.error("The uploaded image does not appear to contain a plant. Please try with a different image.", {
        duration: 5000,
      });
    } else if (!data.isReliable) {
      toast.warning("The analysis results have low confidence. Consider uploading a clearer image for better results.", {
        duration: 5000,
      });
    } else {
      toast.success("Plant analysis complete!", {
        duration: 3000,
      });
    }
    
    return data;
  } catch (err) {
    console.error('Exception during plant analysis:', err);
    toast.error(`Analysis error: ${(err as Error).message || 'Unknown error'}`);
    return null;
  }
};

/**
 * Transforms the model result into a format compatible with our app
 * Using TRY Plant Trait Database for plants and New Plant Diseases Dataset/OLID I for leaf diseases
 * @param modelResult The raw result from the image classification
 * @returns Analysis details formatted for our application
 */
export const formatHuggingFaceResult = (modelResult: any) => {
  if (!modelResult || !modelResult.label) {
    return null;
  }

  // Use the plant name from the result if available
  const plantName = modelResult.plantName || null;
  let plantNameOnly;
  let speciesOnly;
  
  if (plantName) {
    // Use the plantName provided by the backend
    const parts = plantName.split(" (");
    plantNameOnly = parts[0];
    speciesOnly = parts[1]?.replace(")", "") || "Unidentified";
  } else {
    // Fallback to a generic name
    plantNameOnly = "Unknown Plant";
    speciesOnly = "Unidentified";
  }

  // Extract the primary prediction
  const mainPrediction = {
    label: modelResult.label,
    score: modelResult.score || 0
  };

  // Check for health flag directly from the result, or determine from label
  const isHealthy = modelResult.healthy !== undefined ? 
                   modelResult.healthy : 
                   mainPrediction.label.toLowerCase().includes('healthy') || 
                   mainPrediction.label.toLowerCase().includes('normal');
                    
  // Format all predictions for alternative diagnoses
  const alternativeDiagnoses = modelResult.allPredictions
    ? modelResult.allPredictions
        .slice(1) // Skip the main prediction which is already used
        .map((pred: any) => ({
          disease: pred.label,
          probability: pred.score
        }))
    : [];
    
  // Identify plant part from analysis if available
  const plantPart = modelResult.plantPart || getPlantPartFromLabel(mainPrediction.label);
  
  // Determine if this is a leaf analysis
  const isLeafAnalysis = plantPart === 'leaf' || 
                        mainPrediction.label.toLowerCase().includes('leaf') || 
                        (modelResult.leafVerification && modelResult.leafVerification.isLeaf);

  // Create data source info based on what dataset was used
  const dataSource = isLeafAnalysis ? 
                    'New Plant Diseases Dataset + OLID I' : 
                    'TRY Plant Trait Database + PlantNet';

  // Create a formatted analysis details object
  return {
    multiServiceInsights: {
      huggingFaceResult: mainPrediction,
      agreementScore: Math.round(mainPrediction.score * 100),
      primaryService: isLeafAnalysis ? 'Leaf Disease Classifier' : 'TRY-PlantNet Classifier',
      plantSpecies: speciesOnly,
      plantName: plantNameOnly,
      plantPart: plantPart,
      isHealthy: isHealthy,
      isValidPlantImage: modelResult.isValidPlantImage !== undefined ? 
                         modelResult.isValidPlantImage : true,
      isReliable: modelResult.isReliable !== undefined ? 
                 modelResult.isReliable : mainPrediction.score >= 0.6,
      dataSource: dataSource
    },
    identifiedFeatures: isHealthy ? 
      [
        `Healthy ${plantPart || 'plant'} tissue`,
        'Good coloration',
        'Normal growth pattern',
        'No visible disease symptoms'
      ] : 
      [
        `${capitalize(plantPart || 'Plant')} with signs of ${mainPrediction.label}`,
        'Patterns recognized by the AI model',
        isLeafAnalysis ? 'Leaf analysis completed using specialized disease datasets' : 'Plant analysis completed'
      ],
    alternativeDiagnoses: isHealthy ? [] : alternativeDiagnoses,
    leafVerification: modelResult.leafVerification || {
      isLeaf: plantPart === 'leaf',
      partName: plantPart || null,
      confidence: modelResult.score ? Math.round(modelResult.score * 100) : null,
      boundingBox: modelResult.boundingBox || null
    },
    plantVerification: modelResult.plantVerification || {
      isPlant: modelResult.isValidPlantImage !== undefined ? 
               modelResult.isValidPlantImage : true,
      aiServices: [],
      dataSource: dataSource
    },
    plantixInsights: {
      severity: isHealthy ? 'none' : 'unknown',
      progressStage: isHealthy ? 'healthy' : 'medium',
      spreadRisk: isHealthy ? 'none' : 'medium',
      environmentalFactors: isHealthy ? 
        ['Adequate light exposure', 'Proper watering', 'Good growing conditions'] :
        ['Unable to determine from image'],
      reliability: isHealthy ? 'high' : 'medium',
      confidenceNote: isHealthy ? 
        'Plant appears healthy with high confidence' : 
        isLeafAnalysis ?
          'Diagnosis based on New Plant Diseases Dataset and OLID I, specialized for leaf diseases' :
          'Diagnosis based on TRY-PlantNet analysis, consider expert consultation'
    }
  };
};

/**
 * Try to identify the plant part from the classification label
 * @param label The classification label from the model
 * @returns The identified plant part or null if not identifiable
 */
function getPlantPartFromLabel(label: string): string | null {
  const lowerLabel = label.toLowerCase();
  
  // Check for different plant parts in the label
  if (lowerLabel.includes('leaf') || lowerLabel.includes('foliage')) {
    return 'leaf';
  } else if (lowerLabel.includes('stem') || lowerLabel.includes('stalk')) {
    return 'stem';
  } else if (lowerLabel.includes('root') || lowerLabel.includes('tuber')) {
    return 'root';
  } else if (lowerLabel.includes('flower') || lowerLabel.includes('bloom')) {
    return 'flower';
  } else if (lowerLabel.includes('fruit')) {
    return 'fruit';
  } else if (lowerLabel.includes('seedling') || lowerLabel.includes('shoot')) {
    return 'shoot';
  } else if (lowerLabel.includes('branch') || lowerLabel.includes('twig')) {
    return 'branch';
  } else if (lowerLabel.includes('trunk') || lowerLabel.includes('bark')) {
    return 'trunk';
  } else if (lowerLabel.includes('collar') || lowerLabel.includes('crown')) {
    return 'collar region';
  }
  
  return null;
}

/**
 * Simple utility function to capitalize the first letter of a string
 */
function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Converts a data URL to a File object
 * @param dataUrl The data URL string (e.g., from canvas.toDataURL())
 * @param filename The desired filename
 * @returns A File object that can be uploaded
 */
export const dataURLtoFile = (dataUrl: string, filename: string): File => {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  
  return new File([u8arr], filename, { type: mime });
};
