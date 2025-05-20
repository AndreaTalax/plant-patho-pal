
import axios from 'axios';

// Rimuove il prefisso "data:image/jpeg;base64," dall'immagine base64
export const fileToBase64WithoutPrefix = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64String = reader.result as string;
      // Rimuovi il prefisso data:image/jpeg;base64, (o simili)
      const base64WithoutPrefix = base64String.substring(base64String.indexOf(',') + 1);
      resolve(base64WithoutPrefix);
    };
    reader.onerror = (error) => reject(error);
  });
};

/**
 * Analizza un'immagine utilizzando il servizio Plant.id API
 * @param imageBase64 Immagine in formato base64 senza prefisso
 * @returns Risultato dell'analisi di Plant.id
 */
export const analyzePlantWithPlantId = async (imageBase64: string, apiKey: string): Promise<any> => {
  try {
    const data = {
      api_key: apiKey,
      images: [imageBase64],
      modifiers: ["crops_fast", "similar_images"],
      plant_language: "it",
      plant_details: [
        "common_names",
        "url",
        "wiki_description",
        "taxonomy",
        "synonyms",
        "edible_parts"
      ]
    };

    const response = await axios.post('https://api.plant.id/v2/identify', data);
    
    if (response.data && response.data.suggestions && response.data.suggestions.length > 0) {
      const plantIdentification = response.data.suggestions[0];
      
      return {
        plantName: plantIdentification.plant_name,
        commonNames: plantIdentification.plant_details?.common_names || [],
        confidence: plantIdentification.probability,
        wikiDescription: plantIdentification.plant_details?.wiki_description?.value || "",
        taxonomy: plantIdentification.plant_details?.taxonomy || {},
        similarImages: plantIdentification.similar_images || []
      };
    }
    
    return null;
  } catch (error) {
    console.error('Errore nell\'analisi con Plant.id:', error);
    return null;
  }
};

/**
 * Analizza lo stato di salute di una pianta utilizzando Plant.id Health Assessment API
 * @param imageBase64 Immagine in formato base64 senza prefisso
 * @returns Risultato dell'analisi di salute della pianta
 */
export const analyzePlantHealthWithPlantId = async (imageBase64: string, apiKey: string): Promise<any> => {
  try {
    const data = {
      api_key: apiKey,
      images: [imageBase64],
      modifiers: ["crops_fast"],
      language: "it",
      disease_details: [
        "common_names",
        "description",
        "treatment",
        "classification"
      ]
    };

    const response = await axios.post('https://api.plant.id/v2/health_assessment', data);
    
    if (response.data && response.data.health_assessment) {
      const healthAssessment = response.data.health_assessment;
      const diseases = healthAssessment.diseases || [];
      
      const isHealthy = diseases.length === 0 || 
        (diseases.length === 1 && diseases[0].name.toLowerCase().includes("healthy"));
      
      return {
        isHealthy,
        diseases: diseases.map((disease: any) => ({
          name: disease.name,
          probability: disease.probability,
          description: disease.disease_details?.description || "",
          treatment: disease.disease_details?.treatment || {},
          classification: disease.disease_details?.classification || {}
        }))
      };
    }
    
    return { isHealthy: true, diseases: [] };
  } catch (error) {
    console.error('Errore nell\'analisi della salute con Plant.id:', error);
    return { isHealthy: true, diseases: [] };
  }
};
