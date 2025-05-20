
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { preprocessImageForPlantDetection, validateImageForAnalysis, resizeImageForOptimalDetection } from "./image-utils";
import { fileToBase64WithoutPrefix } from "./plant-id-service";

/**
 * Invia un'immagine alla Supabase Edge Function per l'analisi delle malattie delle piante
 * Utilizza un approccio combinato con API PlantSnap, Flora Incognita, PlantNet-inspired,
 * TRY Plant Trait Database, New Plant Diseases Dataset, OLID I, EPPO Global Database e Plant.id API
 * 
 * @param imageFile Il file immagine della pianta da analizzare
 * @returns Il risultato dell'analisi dai modelli di elaborazione immagini
 */
export const analyzePlantImage = async (imageFile: File) => {
  try {
    // Convalida e pre-elabora l'immagine
    const isValid = await validateImageForAnalysis(imageFile);
    if (!isValid) {
      toast.error("L'immagine non è adatta per l'analisi. Usa una foto di pianta più chiara.");
      return null;
    }

    // Applica pre-elaborazione per migliorare il rilevamento della pianta
    const processedImage = await preprocessImageForPlantDetection(imageFile);
    
    // Ridimensiona l'immagine alle dimensioni ottimali per i modelli ML
    const optimizedImage = await resizeImageForOptimalDetection(processedImage);
    
    const formData = new FormData();
    formData.append('image', optimizedImage);
    formData.append('optimized', 'true'); // Flag per indicare l'immagine ottimizzata
    
    // Converti l'immagine in base64 per l'API Plant.id
    const imageBase64 = await fileToBase64WithoutPrefix(optimizedImage);
    formData.append('imageBase64', imageBase64);

    toast.info("Analisi dell'immagine in corso...", {
      duration: 3000,
    });

    // Chiama la Supabase Edge Function con meccanismo di retry
    let attempts = 0;
    const maxAttempts = 4; // Aumentato da 3 a 4 per una maggiore possibilità di successo
    let data, error;
    
    while (attempts < maxAttempts) {
      try {
        attempts++;
        console.log(`Tentativo di analisi pianta ${attempts}/${maxAttempts}...`);
        
        // Aggiungi un piccolo ritardo tra i tentativi per dare più tempo al backend
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
        
        // Log della risposta per il debug
        console.log('Plant analysis response:', data);
        
        // Se è riuscito o ha ottenuto dati con errore, interrompi
        if (!error || data) break;
        
        // Attendi prima di riprovare (backoff esponenziale)
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
    
    // Gestisci diversi esiti dell'analisi
    if (data.isValidPlantImage === false) {
      toast.error("L'immagine caricata non sembra contenere una pianta. Prova con un'altra immagine.", {
        duration: 5000,
      });
    } else if (!data.isReliable) {
      toast.warning("I risultati dell'analisi hanno bassa confidenza. Considera di caricare un'immagine più chiara per risultati migliori.", {
        duration: 5000,
      });
    } else if (data.eppoRegulatedConcern) {
      // Avviso speciale EPPO per parassiti e malattie regolamentate
      toast.error(`ALLERTA: Possibile rilevamento di ${data.eppoRegulatedConcern.name}, un parassita/malattia regolamentato. Si prega di segnalarlo alle autorità fitosanitarie locali.`, {
        duration: 8000,
      });
    } else {
      toast.success("Analisi della pianta completata!", {
        duration: 3000,
      });
    }
    
    // Anche se i dati non sono ideali, restituiscili in modo che l'interfaccia possa mostrare qualcosa
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
    
    // Restituisci dati di fallback per evitare che l'interfaccia si blocchi
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
