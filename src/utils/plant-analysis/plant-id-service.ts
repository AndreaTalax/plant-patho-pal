
/**
 * Plant.id API service for plant identification and disease detection
 * API documentation: https://documenter.getpostman.com/view/24599534/2s93z5A4v2
 */

/**
 * Analyzes an image using Plant.id API
 * @param imageBase64 Base64 encoded image string (without the data:image/jpeg;base64, prefix)
 * @param plantIdApiKey API key for Plant.id
 * @returns API response with plant identification results
 */
export const identifyPlantWithPlantId = async (
  imageBase64: string,
  plantIdApiKey: string | null
): Promise<any> => {
  try {
    if (!plantIdApiKey) {
      console.log("Plant.id API key not provided. Skipping identification.");
      return null;
    }

    const data = {
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

    const response = await fetch("https://api.plant.id/v2/identify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Api-Key": plantIdApiKey
      },
      body: JSON.stringify(data),
      signal: AbortSignal.timeout(15000), // 15 second timeout
    });

    if (!response.ok) {
      console.error("Plant.id API error:", await response.text());
      return null;
    }

    return await response.json();
  } catch (err) {
    console.error("Error in Plant.id identification:", err.message);
    return null;
  }
};

/**
 * Analyzes an image for plant health issues using Plant.id API
 * @param imageBase64 Base64 encoded image string (without the data:image/jpeg;base64, prefix)
 * @param plantIdApiKey API key for Plant.id
 * @returns API response with health assessment results
 */
export const analyzeHealthWithPlantId = async (
  imageBase64: string,
  plantIdApiKey: string | null
): Promise<any> => {
  try {
    if (!plantIdApiKey) {
      console.log("Plant.id API key not provided. Skipping health analysis.");
      return null;
    }

    const data = {
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

    const response = await fetch("https://api.plant.id/v2/health_assessment", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Api-Key": plantIdApiKey
      },
      body: JSON.stringify(data),
      signal: AbortSignal.timeout(15000), // 15 second timeout
    });

    if (!response.ok) {
      console.error("Plant.id health API error:", await response.text());
      return null;
    }

    return await response.json();
  } catch (err) {
    console.error("Error in Plant.id health analysis:", err.message);
    return null;
  }
};

/**
 * Formats the Plant.id API response into a standardized format
 * @param identifyResponse Response from the identification API
 * @param healthResponse Response from the health assessment API
 * @returns Standardized plant analysis result
 */
export const formatPlantIdResult = (identifyResponse: any, healthResponse: any): any => {
  if (!identifyResponse && !healthResponse) {
    return null;
  }

  const result: any = {
    source: "Plant.id API",
    confidence: 0,
    isReliable: false
  };

  // Process identification data
  if (identifyResponse && identifyResponse.suggestions && identifyResponse.suggestions.length > 0) {
    const bestMatch = identifyResponse.suggestions[0];
    result.plantName = bestMatch.plant_name;
    result.scientificName = bestMatch.plant_details?.scientific_name || bestMatch.plant_name;
    result.commonNames = bestMatch.plant_details?.common_names || [];
    result.confidence = bestMatch.probability;
    result.isReliable = bestMatch.probability > 0.7;
    result.taxonomy = bestMatch.plant_details?.taxonomy || {};
    result.wikiDescription = bestMatch.plant_details?.wiki_description?.value || "";
    result.similarImages = bestMatch.similar_images || [];
    result.edibleParts = bestMatch.plant_details?.edible_parts || [];
  }

  // Process health assessment data
  if (healthResponse && healthResponse.health_assessment && healthResponse.health_assessment.diseases) {
    const diseases = healthResponse.health_assessment.diseases;
    const isHealthy = diseases.length === 0 || 
      (diseases.length === 1 && diseases[0].name.toLowerCase().includes("healthy"));

    result.isHealthy = isHealthy;
    result.diseases = diseases.map((disease: any) => ({
      name: disease.name,
      probability: disease.probability,
      description: disease.disease_details?.description || "",
      treatment: disease.disease_details?.treatment || {
        biological: [],
        chemical: [],
        prevention: []
      },
      classification: disease.disease_details?.classification || {}
    }));

    // Update reliability based on disease probability if a disease is detected
    if (!isHealthy && diseases[0].probability > 0.7) {
      result.isReliable = true;
    }
  } else {
    result.isHealthy = true;
    result.diseases = [];
  }

  return result;
};

/**
 * Converts a file to base64 string (without the prefix)
 * @param file The file to convert
 * @returns A Promise that resolves to the base64 string
 */
export const fileToBase64WithoutPrefix = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64String = reader.result as string;
      // Remove the data:image/jpeg;base64, prefix
      const base64WithoutPrefix = base64String.split(',')[1];
      resolve(base64WithoutPrefix);
    };
    reader.onerror = error => reject(error);
  });
};
