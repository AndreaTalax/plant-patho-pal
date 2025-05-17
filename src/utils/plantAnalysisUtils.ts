
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Sends an image to the Supabase Edge Function for plant disease analysis
 * Using a combined approach with PlantSnap and Flora Incognita APIs alongside
 * the PlantNet-inspired approach, TRY Plant Trait Database, New Plant Diseases Dataset,
 * OLID I, and EPPO Global Database
 * @param imageFile The plant image file to analyze
 * @returns The analysis result from the image processing models
 */
export const analyzePlantImage = async (imageFile: File) => {
  try {
    // Dismiss any existing toasts to prevent stuck notifications
    toast.dismiss();
    
    const formData = new FormData();
    formData.append('image', imageFile);

    toast.info("Analyzing your plant image...", {
      duration: 3000,
      dismissible: true, // Make sure toasts are dismissible
    });

    // Call the Supabase Edge Function with retry mechanism
    let attempts = 0;
    const maxAttempts = 3;
    let data, error;
    
    while (attempts < maxAttempts) {
      try {
        attempts++;
        const response = await supabase.functions.invoke('analyze-plant', {
          body: formData,
        });
        
        data = response.data;
        error = response.error;
        
        // If successful or got data with error, break
        if (!error || data) break;
        
        // Wait before retrying (exponential backoff)
        if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
          toast.info(`Retrying analysis (attempt ${attempts + 1}/${maxAttempts})...`, {
            dismissible: true
          });
        }
      } catch (retryError) {
        console.error(`Attempt ${attempts} error:`, retryError);
        if (attempts === maxAttempts) {
          error = { message: (retryError as Error).message };
        }
      }
    }

    if (error) {
      console.error('Error calling analyze-plant function:', error);
      toast.error(`Analysis error: ${error.message || 'Unknown error'}`, {
        duration: 5000,
        dismissible: true
      });
      return null;
    }

    console.log('Plant analysis result:', data);
    
    // If the image validation failed, show a specific message
    if (data.isValidPlantImage === false) {
      toast.error("The uploaded image does not appear to contain a plant. Please try with a different image.", {
        duration: 5000,
        dismissible: true
      });
    } else if (!data.isReliable) {
      toast.warning("The analysis results have low confidence. Consider uploading a clearer image for better results.", {
        duration: 5000,
        dismissible: true
      });
    } else if (data.eppoRegulatedConcern) {
      // Special EPPO alert for regulated pests and diseases
      toast.error(`ALERT: Possible detection of ${data.eppoRegulatedConcern.name}, a regulated pest/disease. Please report to local plant protection authorities.`, {
        duration: 8000,
        dismissible: true
      });
    } else {
      toast.success("Plant analysis complete!", {
        duration: 3000,
        dismissible: true
      });
    }
    
    return data;
  } catch (err) {
    console.error('Exception during plant analysis:', err);
    toast.error(`Analysis error: ${(err as Error).message || 'Unknown error'}`, {
      duration: 5000,
      dismissible: true
    });
    return null;
  }
};

/**
 * Transforms the model result into a format compatible with our app
 * Integrating PlantSnap, Flora Incognita, TRY Plant Trait Database for plants, 
 * New Plant Diseases Dataset/OLID I for leaf diseases, and EPPO Global Database 
 * for regulated pests and diseases
 * @param modelResult The raw result from the image classification
 * @returns Analysis details formatted for our application
 */
export const formatHuggingFaceResult = (modelResult: any) => {
  if (!modelResult || !modelResult.label) {
    return null;
  }

  // Use the plant name from the result if available
  const plantName = modelResult.plantName || null;
  const detectedPlantType = modelResult.detectedPlantType || null;
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
                        (modelResult.leafVerification && modelResult.leafVerification.isLeaf) ||
                        modelResult.isLeafAnalysis === true;

  // Check if this is an EPPO regulated pest/disease
  const isEppoRegulated = modelResult.eppoRegulatedConcern !== undefined && 
                          modelResult.eppoRegulatedConcern !== null;

  // Determine analysis service and data source based on plant type
  let primaryIdentificationService = "";
  let dataSource = "";
  
  // Enhanced service determination - use detected plant type if available
  if (detectedPlantType) {
    switch(detectedPlantType) {
      case 'palm':
        primaryIdentificationService = "Palm Identification Service";
        dataSource = "Palm Species Database";
        break;
      case 'succulent':
        primaryIdentificationService = "Succulent Recognition";
        dataSource = "Global Succulent Database";
        break;
      case 'herb':
        primaryIdentificationService = "Herb Identification";
        dataSource = "Medicinal & Culinary Herb Database";
        break;
      case 'houseplant':
        primaryIdentificationService = "Indoor Plant Classifier";
        dataSource = "Houseplant Collection";
        break;
      case 'flowering':
        primaryIdentificationService = "Flower Recognition";
        dataSource = "Flowering Plant Database";
        break;
      case 'vegetable':
        primaryIdentificationService = "Crop Analysis";
        dataSource = "Agricultural Crop Database";
        break;
      case 'tree':
        primaryIdentificationService = "Tree Identification";
        dataSource = "Global Tree Database";
        break;
      default:
        // Check other services as before
        if (modelResult.floraIncognitaResult && modelResult.floraIncognitaResult.score > (modelResult.score || 0)) {
          primaryIdentificationService = "Flora Incognita";
          dataSource = "Flora Incognita Plant Database";
        } else if (modelResult.plantSnapResult && modelResult.plantSnapResult.score > (modelResult.score || 0)) {
          primaryIdentificationService = "PlantSnap";
          dataSource = "PlantSnap Global Database";
        } else if (isEppoRegulated) {
          primaryIdentificationService = 'EPPO Regulatory Database';
          dataSource = 'EPPO Global Database';
        } else if (isLeafAnalysis) {
          primaryIdentificationService = 'Leaf Disease Classifier';
          dataSource = 'New Plant Diseases Dataset + OLID I';
        } else {
          primaryIdentificationService = 'TRY-PlantNet Classifier';
          dataSource = 'TRY Plant Trait Database + PlantNet';
        }
    }
  } else {
    // Use the original logic if no specific plant type was detected
    if (modelResult.floraIncognitaResult && modelResult.floraIncognitaResult.score > (modelResult.score || 0)) {
      primaryIdentificationService = "Flora Incognita";
      dataSource = "Flora Incognita Plant Database";
    } else if (modelResult.plantSnapResult && modelResult.plantSnapResult.score > (modelResult.score || 0)) {
      primaryIdentificationService = "PlantSnap";
      dataSource = "PlantSnap Global Database";
    } else if (isEppoRegulated) {
      primaryIdentificationService = 'EPPO Regulatory Database';
      dataSource = 'EPPO Global Database';
    } else if (isLeafAnalysis) {
      primaryIdentificationService = 'Leaf Disease Classifier';
      dataSource = 'New Plant Diseases Dataset + OLID I';
    } else {
      primaryIdentificationService = 'TRY-PlantNet Classifier';
      dataSource = 'TRY Plant Trait Database + PlantNet';
    }
  }
  
  // Create a formatted analysis details object
  return {
    multiServiceInsights: {
      huggingFaceResult: mainPrediction,
      agreementScore: Math.round(mainPrediction.score * 100),
      primaryService: primaryIdentificationService,
      plantSpecies: speciesOnly,
      plantName: plantNameOnly,
      plantPart: plantPart,
      isHealthy: isHealthy,
      isValidPlantImage: modelResult.isValidPlantImage !== undefined ? 
                         modelResult.isValidPlantImage : true,
      isReliable: modelResult.isReliable !== undefined ? 
                 modelResult.isReliable : mainPrediction.score >= 0.6,
      dataSource: dataSource,
      detectedPlantType: detectedPlantType, // Add detected plant type
      eppoRegulated: isEppoRegulated ? modelResult.eppoRegulatedConcern : null,
      floraIncognitaMatch: modelResult.floraIncognitaResult || null,
      plantSnapMatch: modelResult.plantSnapResult || null
    },
    identifiedFeatures: isHealthy ? 
      [
        `Healthy ${plantPart || 'plant'} tissue`,
        'Good coloration',
        'Normal growth pattern',
        'No visible disease symptoms'
      ] : isEppoRegulated ?
      [
        `ALERT: Potential ${modelResult.eppoRegulatedConcern.name} detected`,
        'This may be a regulated pest/disease',
        'Consider reporting to plant health authorities',
        'Further laboratory testing advised'
      ] :
      [
        `${capitalize(plantPart || 'Plant')} with signs of ${mainPrediction.label}`,
        'Patterns recognized by the AI model',
        detectedPlantType ? `Identified as ${detectedPlantType} type plant` : null,
        isLeafAnalysis ? 'Leaf analysis completed using specialized disease datasets' : 'Plant analysis completed'
      ].filter(Boolean), // Remove null items
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
      detectedPlantType: detectedPlantType, // Add detected plant type
      aiServices: [
        ...(modelResult.plantVerification?.aiServices || []),
        ...(modelResult.floraIncognitaResult ? [{
          serviceName: 'Flora Incognita',
          result: true,
          confidence: modelResult.floraIncognitaResult.score || 0.8
        }] : []),
        ...(modelResult.plantSnapResult ? [{
          serviceName: 'PlantSnap',
          result: true,
          confidence: modelResult.plantSnapResult.score || 0.8
        }] : [])
      ],
      dataSource: dataSource
    },
    plantixInsights: {
      severity: isEppoRegulated ? 'high' : isHealthy ? 'none' : 'unknown',
      progressStage: isHealthy ? 'healthy' : 'medium',
      spreadRisk: isEppoRegulated ? 'very high' : isHealthy ? 'none' : 'medium',
      environmentalFactors: isHealthy ? 
        ['Adequate light exposure', 'Proper watering', 'Good growing conditions'] :
        ['Unable to determine from image'],
      reliability: isHealthy ? 'high' : 'medium',
      confidenceNote: isEppoRegulated ?
        'Analysis identifies potential regulated pest/disease from EPPO Global Database' :
        isHealthy ? 
        'Plant appears healthy with high confidence' : 
        detectedPlantType ?
          `Diagnosis based on specialized ${detectedPlantType} plant analysis` :
          isLeafAnalysis ?
            'Diagnosis based on New Plant Diseases Dataset and OLID I, specialized for leaf diseases' :
            'Diagnosis based on TRY-PlantNet analysis, consider expert consultation'
    },
    eppoData: isEppoRegulated ? {
      regulationStatus: 'Quarantine pest/disease',
      reportAdvised: true,
      warningLevel: modelResult.eppoRegulatedConcern.warningLevel || 'high',
      infoLink: `https://gd.eppo.int/search?q=${encodeURIComponent(modelResult.eppoRegulatedConcern.name)}`
    } : null
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
