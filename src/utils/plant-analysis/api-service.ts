
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { preprocessImageForPlantDetection, validateImageForAnalysis, resizeImageForOptimalDetection } from "./image-utils";

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
    // Validate and preprocess the image
    const isValid = await validateImageForAnalysis(imageFile);
    if (!isValid) {
      toast.error("L'immagine non è adatta per l'analisi. Usa una foto di pianta più chiara.");
      return null;
    }

    // Apply preprocessing to improve plant detection - we have to pass the File object here
    const optimizedImageFile = await preprocessImageForPlantDetection(imageFile);
    
    // Resize image to optimal dimensions for ML models - we have to pass the File object here
    const finalImageFile = await resizeImageForOptimalDetection(optimizedImageFile);
    
    const formData = new FormData();
    formData.append('image', finalImageFile);
    formData.append('optimized', 'true'); // Flag to indicate optimized image

    toast.info("Analisi dell'immagine in corso...", {
      duration: 3000,
    });

    // Call the Supabase Edge Function with retry mechanism
    let attempts = 0;
    const maxAttempts = 4; // Increased from 3 to 4 for better chance of success
    let data, error;
    
    while (attempts < maxAttempts) {
      try {
        attempts++;
        console.log(`Tentativo di analisi pianta ${attempts}/${maxAttempts}...`);
        
        // Add a small delay between retries to give the backend more time
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
          toast.info(`Nuovo tentativo di analisi (tentativo ${attempts + 1}/${maxAttempts})...`);
        }
      } catch (retryError) {
        console.error(`Errore al tentativo ${attempts}:`, retryError);
        if (attempts === maxAttempts) {
          error = { message: (retryError as Error).message };
        }
      }
    }

    if (error) {
      console.error('Errore nella chiamata alla funzione analyze-plant:', error);
      toast.error(`Errore di analisi: ${error.message || 'Errore sconosciuto'}`);
      return null;
    }

    console.log('Risultato analisi pianta:', data);
    
    // Handle different analysis outcomes
    if (data.isValidPlantImage === false) {
      toast.error("L'immagine caricata non sembra contenere una pianta. Prova con un'altra immagine.", {
        duration: 5000,
      });
    } else if (!data.isReliable) {
      toast.warning("I risultati dell'analisi hanno bassa confidenza. Considera di caricare un'immagine più chiara per risultati migliori.", {
        duration: 5000,
      });
    } else if (data.eppoRegulatedConcern) {
      // Special EPPO alert for regulated pests and diseases
      toast.error(`ALLERTA: Possibile rilevamento di ${data.eppoRegulatedConcern.name}, un parassita/malattia regolamentato. Si prega di segnalarlo alle autorità fitosanitarie locali.`, {
        duration: 8000,
      });
    } else {
      toast.success("Analisi della pianta completata!", {
        duration: 3000,
      });
    }
    
    // Even if the data is not ideal, return it so the UI can display something
    return data || {
      label: "Pianta non identificata",
      score: 0.4,
      healthy: true,
      plantPart: "whole plant",
      dataSource: "Analisi di emergenza"
    };
  } catch (err) {
    console.error('Eccezione durante l\'analisi della pianta:', err);
    toast.error(`Errore di analisi: ${(err as Error).message || 'Errore sconosciuto'}`);
    
    // Return fallback data to prevent UI from breaking
    return {
      label: "Errore di analisi",
      score: 0.2,
      healthy: null,
      plantPart: "whole plant",
      dataSource: "Fallback di emergenza",
      error: (err as Error).message
    };
  }
};
