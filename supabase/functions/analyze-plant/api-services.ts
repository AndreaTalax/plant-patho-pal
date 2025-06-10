
// Function to simulate or call Flora Incognita API
/**
 * Analyzes a plant image using the Flora Incognita API and returns the species information.
 * @example
 * analyzeWithFloraIncognita(imageArrayBuffer, floraIncognitaKey)
 * { species: "Rose", genus: "Rosa", family: "Rosaceae", score: 0.95, source: "Flora Incognita API" }
 * @param {ArrayBuffer} imageArrayBuffer - The ArrayBuffer representation of the plant image to be analyzed.
 * @param {string | null} floraIncognitaKey - The API key for accessing Flora Incognita services, or null to use simulation.
 * @returns {Promise<any>} A promise that resolves to the analyzed results including species, genus, family, score, and source information.
 * @description
 *   - Returns simulated analysis results if the Flora Incognita API key is not provided or if an API error occurs.
 *   - Converts image data from ArrayBuffer to base64 format before sending to the API.
 *   - Uses a timeout mechanism of 10 seconds for the API request to prevent indefinite waiting.
 */
export async function analyzeWithFloraIncognita(imageArrayBuffer: ArrayBuffer, floraIncognitaKey: string | null): Promise<any> {
  try {
    if (!floraIncognitaKey) {
      console.log("Flora Incognita API key not provided. Using simulation.");
      return simulateFloraIncognitaResult();
    }
    
    // Convert ArrayBuffer to base64
    const base64 = btoa(String.fromCharCode(...new Uint8Array(imageArrayBuffer)));
    
    const response = await fetch('https://api.flora-incognita.org/v1/identify', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${floraIncognitaKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        image: `data:image/jpeg;base64,${base64}`
      }),
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });
    
    if (!response.ok) {
      console.error("Flora Incognita API error:", await response.text());
      return simulateFloraIncognitaResult();
    }
    
    const data = await response.json();
    return {
      species: data.species || "Unknown species",
      genus: data.genus || "Unknown genus",
      family: data.family || "Unknown family",
      score: data.score || 0.75,
      source: "Flora Incognita API"
    };
  } catch (err) {
    console.error("Error in Flora Incognita analysis:", err.message);
    return simulateFloraIncognitaResult();
  }
}

// Simulate PlantSnap results when API is not available or fails
/**
 * Simulates the result of identifying a plant species using Flora Incognita.
 * @example
 * simulateFloraIncognitaResult()
 * { species: "Rosa canina", genus: "Rosa", family: "Rosaceae", score: 0.87, source: "Flora Incognita Simulation" }
 * @returns {Object} Returns a simulated identification result consisting of species, genus, family, score, and source.
 * @description
 *   - The function randomly selects one of the predefined mock results.
 *   - Adds a source to indicate the result is a simulation.
 *   - Uses a randomizing method to mimic real-world identification variance.
 */
function simulateFloraIncognitaResult() {
  const mockResults = [
    {
      species: "Rosa canina",
      genus: "Rosa",
      family: "Rosaceae",
      score: 0.87,
    },
    {
      species: "Taraxacum officinale",
      genus: "Taraxacum",
      family: "Asteraceae",
      score: 0.92,
    },
    {
      species: "Bellis perennis",
      genus: "Bellis",
      family: "Asteraceae",
      score: 0.85,
    },
    {
      species: "Trifolium pratense",
      genus: "Trifolium",
      family: "Fabaceae",
      score: 0.79,
    }
  ];
  
  const result = mockResults[Math.floor(Math.random() * mockResults.length)];
  return {
    ...result,
    source: "Flora Incognita Simulation"
  };
}

// Function to simulate or call PlantSnap API
/**
 * Analyze a plant image using the PlantSnap API, or simulate the result if an API key is not provided.
 * @example
 * analyzeWithPlantSnap(imageArrayBuffer, 'yourPlantSnapAPIKey')
 * Returns an object containing species, genus, family, score, source, and details.
 * @param {ArrayBuffer} imageArrayBuffer - ArrayBuffer representation of the plant image to be analyzed.
 * @param {string | null} plantSnapKey - The API key for PlantSnap, or null for simulation mode.
 * @returns {Promise<any>} A promise resolving to an analysis result object.
 * @description
 *   - Converts the image ArrayBuffer to a base64 string for API communication.
 *   - Sends a POST request to the PlantSnap API endpoint with a 10-second timeout.
 *   - The simulation mode is used when the PlantSnap API key is unavailable, providing mocked results.
 */
export async function analyzeWithPlantSnap(imageArrayBuffer: ArrayBuffer, plantSnapKey: string | null): Promise<any> {
  try {
    if (!plantSnapKey) {
      console.log("PlantSnap API key not provided. Using simulation.");
      return simulatePlantSnapResult();
    }
    
    // Convert ArrayBuffer to base64
    const base64 = btoa(String.fromCharCode(...new Uint8Array(imageArrayBuffer)));
    
    const response = await fetch('https://api.plantsnap.com/v2/identify', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${plantSnapKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        images: [`data:image/jpeg;base64,${base64}`],
        latitude: 0,
        longitude: 0,
        plant_details: true
      }),
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });
    
    if (!response.ok) {
      console.error("PlantSnap API error:", await response.text());
      return simulatePlantSnapResult();
    }
    
    const data = await response.json();
    
    if (!data.results || data.results.length === 0) {
      return simulatePlantSnapResult();
    }
    
    const bestMatch = data.results[0];
    return {
      species: bestMatch.name || "Unknown species",
      genus: bestMatch.taxonomy?.genus || "Unknown genus",
      family: bestMatch.taxonomy?.family || "Unknown family",
      score: bestMatch.probability || 0.8,
      source: "PlantSnap API",
      details: bestMatch.details || {}
    };
  } catch (err) {
    console.error("Error in PlantSnap analysis:", err.message);
    return simulatePlantSnapResult();
  }
}

// Simulate PlantSnap results when API is not available or fails
/**
 * Simulate a plant identification result from a mock data set.
 * @example
 * simulatePlantSnapResult()
 * {
 *   species: "Helianthus annuus",
 *   genus: "Helianthus",
 *   family: "Asteraceae",
 *   score: 0.91,
 *   details: {
 *     common_names: ["Sunflower", "Common Sunflower"],
 *     edible: true,
 *     toxic: false
 *   },
 *   source: "PlantSnap Simulation"
 * }
 * @returns {Object} An object containing information about the identified plant species.
 * @description
 *   - Randomly selects a plant's information from predefined mock data.
 *   - Includes additional source information indicating that the result is simulated.
 */
function simulatePlantSnapResult() {
  const mockResults = [
    {
      species: "Helianthus annuus",
      genus: "Helianthus",
      family: "Asteraceae",
      score: 0.91,
      details: {
        common_names: ["Sunflower", "Common Sunflower"],
        edible: true,
        toxic: false
      }
    },
    {
      species: "Lavandula angustifolia",
      genus: "Lavandula",
      family: "Lamiaceae",
      score: 0.88,
      details: {
        common_names: ["English Lavender", "Common Lavender"],
        edible: false,
        toxic: false
      }
    },
    {
      species: "Prunus avium",
      genus: "Prunus",
      family: "Rosaceae",
      score: 0.84,
      details: {
        common_names: ["Sweet Cherry", "Wild Cherry"],
        edible: true,
        toxic: false
      }
    }
  ];
  
  const result = mockResults[Math.floor(Math.random() * mockResults.length)];
  return {
    ...result,
    source: "PlantSnap Simulation"
  };
}
