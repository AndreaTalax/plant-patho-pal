
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Sends an image to the Supabase Edge Function for plant disease analysis
 * @param imageFile The plant image file to analyze
 * @returns The analysis result from HuggingFace or error
 */
export const analyzePlantImage = async (imageFile: File) => {
  try {
    const formData = new FormData();
    formData.append('image', imageFile);

    // Call the Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('analyze-plant', {
      body: formData,
    });

    if (error) {
      console.error('Error calling analyze-plant function:', error);
      toast.error(`Errore nell'analisi: ${error.message || 'Errore sconosciuto'}`);
      return null;
    }

    console.log('Plant analysis result:', data);
    return data;
  } catch (err) {
    console.error('Exception during plant analysis:', err);
    toast.error(`Errore nell'analisi: ${(err as Error).message || 'Errore sconosciuto'}`);
    return null;
  }
};

/**
 * Transforms the HuggingFace result into a format compatible with our app's model
 * @param huggingFaceResult The raw result from HuggingFace
 * @returns Analysis details formatted for our application
 */
export const formatHuggingFaceResult = (huggingFaceResult: any) => {
  if (!huggingFaceResult || !huggingFaceResult.label) {
    return null;
  }

  // Here you can extract the primary prediction and format additional data
  const mainPrediction = {
    label: huggingFaceResult.label,
    score: huggingFaceResult.score || 0
  };

  // Format all predictions for alternative diagnoses
  const alternativeDiagnoses = huggingFaceResult.allPredictions
    ? huggingFaceResult.allPredictions
        .slice(1) // Skip the main prediction which is already used
        .map((pred: any) => ({
          disease: pred.label,
          probability: pred.score
        }))
    : [];

  // Create a formatted analysis details object
  return {
    multiServiceInsights: {
      huggingFaceResult: mainPrediction,
      agreementScore: Math.round(mainPrediction.score * 100),
      primaryService: 'HuggingFace',
    },
    identifiedFeatures: [
      `Foglie con segni di ${mainPrediction.label}`,
      'Patterns riconosciuti dal modello di intelligenza artificiale'
    ],
    alternativeDiagnoses: alternativeDiagnoses
  };
};
