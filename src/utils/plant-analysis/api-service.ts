
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { preprocessImageForPlantDetection, validateImageForAnalysis, resizeImageForOptimalDetection } from "./image-utils";
import { fileToBase64WithoutPrefix, fallbackLocalAnalysis } from "./plant-id-service";

/**
 * Send an image to the Supabase Edge Function for plant disease analysis
 * Uses a combined approach with PlantSnap, Flora Incognita, PlantNet-inspired,
 * TRY Plant Trait Database, New Plant Diseases Dataset, OLID I, EPPO Global Database and Plant.id API
 * 
 * @param imageFile The plant image file to analyze
 * @returns The analysis result normalized in a standard format
 */
export const analyzePlantImage = async (imageFile: File) => {
  try {
    // Dismiss any existing toasts to prevent stuck notifications
    toast.dismiss();
    
    // Validate and pre-process the image
    const isValid = await validateImageForAnalysis(imageFile);
    if (!isValid) {
      toast.error("The image is not suitable for analysis. Use a clearer plant photo.", {
        duration: 3000
      });
      return null;
    }

    // Apply pre-processing to improve plant detection
    const processedImage = await preprocessImageForPlantDetection(imageFile);
    
    // Resize the image to optimal dimensions for ML models
    const optimizedImage = await resizeImageForOptimalDetection(processedImage);
    
    const formData = new FormData();
    formData.append('image', optimizedImage);
    formData.append('optimized', 'true'); // Flag to indicate the image is optimized
    
    // Convert the image to base64 for Plant.id API
    const imageBase64 = await fileToBase64WithoutPrefix(optimizedImage);
    formData.append('imageBase64', imageBase64);

    toast.info("Analyzing image...", {
      duration: 3000,
    });

    // Call the Supabase Edge Function with retry mechanism
    let attempts = 0;
    const maxAttempts = 2; // Reduce attempts to respond faster on failures
    let data, error;
    
    while (attempts < maxAttempts) {
      try {
        attempts++;
        console.log(`Plant analysis attempt ${attempts}/${maxAttempts}...`);
        
        // Add a small delay between attempts to give the backend more time
        if (attempts > 1) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
        }
        
        const response = await supabase.functions.invoke('analyze-plant', {
          body: formData,
          headers: {
            'Accept': 'application/json',
          },
        });
        
        data = response.data;
        error = response.error;
        
        // Log the response for debugging
        console.log('Plant analysis response:', data);
        
        // If successful or got data with error, break
        if (!error || data) break;
        
        // Wait before retrying (exponential backoff)
        if (attempts < maxAttempts) {
          toast.info(`Retrying analysis (attempt ${attempts + 1}/${maxAttempts})...`);
        }
      } catch (retryError) {
        console.error(`Error at attempt ${attempts}:`, retryError);
        if (attempts === maxAttempts) {
          error = { message: (retryError as Error).message };
        }
      }
    }

    // If edge function failed completely, use fallback local analysis
    if (error || !data) {
      console.error('Error calling analyze-plant function:', error);
      toast.warning("Remote analysis unavailable. Using local recognition.", {
        duration: 4000,
      });
      
      // Use fallback local analysis
      return fallbackLocalAnalysis(imageFile);
    }

    console.log('Plant analysis result:', data);
    
    // Verify if the data has the new standardized structure
    if (!data.label || !data.plantPart) {
      toast.warning("Data format not fully standardized. Using raw data.", {
        duration: 3000,
      });
    }
    
    // Handle different analysis outcomes
    if (data.isValidPlantImage === false) {
      toast.error("The uploaded image doesn't seem to contain a plant. Try another image.", {
        duration: 5000,
      });
    } else if (data.score < 0.5 && !data.isReliable) {
      toast.warning("Analysis results have low confidence. Consider uploading a clearer image for better results.", {
        duration: 5000,
      });
    } else if (data.eppoRegulatedConcern) {
      // Special EPPO warning for regulated pests and diseases
      toast.error(`ALERT: Possible detection of ${data.eppoRegulatedConcern.name}, a regulated pest/disease. Please report to local phytosanitary authorities.`, {
        duration: 8000,
      });
    } else if (data.healthy === false && data.disease) {
      toast.warning(`Detected issue: ${data.disease.name} (${Math.round(data.disease.confidence * 100)}% confidence)`, {
        duration: 5000,
      });
    } else {
      toast.success("Plant analysis completed!", {
        duration: 3000,
      });
    }
    
    // Return the normalized data
    return data;
  } catch (err) {
    console.error('Exception during plant analysis:', err);
    toast.error(`Analysis error: ${(err as Error).message || 'Unknown error'}`);
    
    // Return fallback data to avoid interface blocking
    return fallbackLocalAnalysis(imageFile);
  }
};

/**
 * Send an image and plant information directly to the phytopathologist
 * Uses the Supabase expert notification service
 */
export const sendPlantInfoToExpert = async (imageFile: File | null, plantInfo: any, userId: string) => {
  try {
    toast.dismiss(); // Dismiss any existing toasts
    
    if (!imageFile) {
      toast.error("A plant image is required to send the request");
      return false;
    }
    
    if (!userId) {
      toast.error("You must be logged in to send the request");
      return false;
    }

    // Get current session to ensure user is logged in
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (!session || sessionError) {
      console.error("User not logged in or session error:", sessionError);
      toast.error("Please log in to contact the phytopathologist");
      return false;
    }
    
    // Convert image to base64
    const reader = new FileReader();
    const imageUrl = await new Promise<string>((resolve) => {
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(imageFile);
    });
    
    toast.info("Sending request...", {
      duration: 3000,
    });
    
    // First, create a consultation record
    const { data: consultationData, error: consultationError } = await supabase
      .from('expert_consultations')
      .insert({
        user_id: userId,
        symptoms: plantInfo.symptoms,
        image_url: imageUrl,
        plant_info: {
          isIndoor: plantInfo.isIndoor,
          wateringFrequency: plantInfo.wateringFrequency,
          lightExposure: plantInfo.lightExposure
        },
        status: 'pending'
      })
      .select();
      
    if (consultationError) {
      console.error("Error creating consultation:", consultationError);
      toast.error("Error sending request", {
        duration: 4000,
      });
      return false;
    }
    
    // Notify the expert (using edge function)
    const consultationId = consultationData?.[0]?.id;
    if (consultationId) {
      const { data: notifyData, error: notifyError } = await supabase.functions.invoke('notify-expert', {
        body: { 
          consultationId,
          userId,
          imageUrl,
          symptoms: plantInfo.symptoms,
          plantInfo: {
            isIndoor: plantInfo.isIndoor,
            wateringFrequency: plantInfo.wateringFrequency,
            lightExposure: plantInfo.lightExposure,
          },
          diagnosisResult: plantInfo.diagnosisResult, // Pass AI diagnosis result if available
          useAI: plantInfo.useAI || false // Indicate if AI was used
        }
      });
      
      if (notifyError) {
        console.error("Error notifying expert:", notifyError);
        toast.error("Error notifying the expert", { 
          duration: 3000 
        });
        return false;
      }
      
      toast.success("Request sent successfully!", {
        description: "The phytopathologist will respond in the chat soon",
        duration: 4000,
      });
      
      // Force refresh of chat to show new message
      window.dispatchEvent(new Event('refreshChat'));
      
      return true;
    }
    
    return false;
  } catch (err) {
    console.error('Error sending request to phytopathologist:', err);
    toast.error(`Error: ${(err as Error).message || 'Unknown error'}`);
    return false;
  }
};
