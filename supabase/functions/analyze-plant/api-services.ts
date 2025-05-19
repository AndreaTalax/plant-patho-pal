
// Function to simulate or call Flora Incognita API
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
