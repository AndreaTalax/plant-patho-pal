
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { preprocessImageForPlantDetection, validateImageForAnalysis, resizeImageForOptimalDetection } from "./image-utils";
import { fileToBase64WithoutPrefix, fallbackLocalAnalysis } from "./plant-id-service";

/**
 * Invia un'immagine alla Supabase Edge Function per l'analisi delle malattie delle piante
 * Utilizza un approccio combinato con API PlantSnap, Flora Incognita, PlantNet-inspired,
 * TRY Plant Trait Database, New Plant Diseases Dataset, OLID I, EPPO Global Database e Plant.id API
 * 
 * @param imageFile Il file immagine della pianta da analizzare
 * @returns Il risultato dell'analisi normalizzato in un formato standard
 */
export const analyzePlantImage = async (imageFile: File) => {
  try {
    // Dismiss any existing toasts to prevent stuck notifications
    toast.dismiss();
    
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
    const maxAttempts = 2; // Reduce attempts to respond faster on failures
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

    // If edge function failed completely, use fallback local analysis
    if (error || !data) {
      console.error('Errore nella chiamata alla funzione analyze-plant:', error);
      toast.warning("Analisi remota non disponibile. Utilizzando riconoscimento locale.", {
        duration: 4000,
      });
      
      // Use fallback local analysis
      return fallbackLocalAnalysis(imageFile);
    }

    console.log('Risultato analisi pianta:', data);
    
    // Verifica se i dati hanno la nuova struttura standardizzata
    if (!data.label || !data.plantPart) {
      toast.warning("Formato dei dati non completamente standardizzato. Usando dati grezzi.", {
        duration: 3000,
      });
    }
    
    // Gestisci diversi esiti dell'analisi
    if (data.isValidPlantImage === false) {
      toast.error("L'immagine caricata non sembra contenere una pianta. Prova con un'altra immagine.", {
        duration: 5000,
      });
    } else if (data.score < 0.5 && !data.isReliable) {
      toast.warning("I risultati dell'analisi hanno bassa confidenza. Considera di caricare un'immagine più chiara per risultati migliori.", {
        duration: 5000,
      });
    } else if (data.eppoRegulatedConcern) {
      // Avviso speciale EPPO per parassiti e malattie regolamentate
      toast.error(`ALLERTA: Possibile rilevamento di ${data.eppoRegulatedConcern.name}, un parassita/malattia regolamentato. Si prega di segnalarlo alle autorità fitosanitarie locali.`, {
        duration: 8000,
      });
    } else if (data.healthy === false && data.disease) {
      toast.warning(`Rilevato problema: ${data.disease.name} (${Math.round(data.disease.confidence * 100)}% confidenza)`, {
        duration: 5000,
      });
    } else {
      toast.success("Analisi della pianta completata!", {
        duration: 3000,
      });
    }
    
    // Ritorna i dati normalizzati
    return data;
  } catch (err) {
    console.error('Eccezione durante l\'analisi della pianta:', err);
    toast.error(`Errore di analisi: ${(err as Error).message || 'Errore sconosciuto'}`);
    
    // Restituisci dati di fallback per evitare che l'interfaccia si blocchi
    return fallbackLocalAnalysis(imageFile);
  }
};

/**
 * Invia un'immagine e le informazioni della pianta direttamente al fitopatologo
 * Utilizza il servizio di notifica esperto di Supabase
 */
export const sendPlantInfoToExpert = async (imageFile: File, plantInfo: any, userId: string) => {
  try {
    toast.dismiss(); // Dismiss any existing toasts
    
    if (!imageFile) {
      toast.error("È necessaria un'immagine della pianta per inviare la richiesta");
      return false;
    }
    
    if (!userId) {
      toast.error("È necessario effettuare l'accesso per inviare la richiesta");
      return false;
    }
    
    // Convert image to base64
    const reader = new FileReader();
    const imageUrl = await new Promise<string>((resolve) => {
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(imageFile);
    });
    
    toast.info("Invio della richiesta in corso...", {
      duration: 3000,
    });
    
    // Prima, crea un record di consultazione
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
      console.error("Errore nella creazione della consultazione:", consultationError);
      toast.error("Errore nell'invio della richiesta", {
        duration: 4000,
      });
      return false;
    }
    
    // Invia notifica all'esperto (usando edge function)
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
        console.error("Errore nella notifica all'esperto:", notifyError);
        toast.error("Errore nella notifica all'esperto", { 
          duration: 3000 
        });
        return false;
      }
      
      toast.success("Richiesta inviata con successo!", {
        description: "Il fitopatologo risponderà al più presto nella chat",
        duration: 4000,
      });
      
      // Force refresh of chat to show new message
      window.dispatchEvent(new Event('refreshChat'));
      
      return true;
    }
    
    return false;
  } catch (err) {
    console.error('Errore nell\'invio della richiesta al fitopatologo:', err);
    toast.error(`Errore: ${(err as Error).message || 'Errore sconosciuto'}`);
    return false;
  }
};
