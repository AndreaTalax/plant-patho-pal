
import { corsHeaders } from "../_shared/cors.ts";

/**
 * Analyzes a plant image with the FloraIncognita API
 * @param imageArrayBuffer The plant image as an ArrayBuffer
 * @param apiKey The FloraIncognita API key
 * @returns The analysis result or null if failed
 */
export async function analyzeWithFloraIncognita(imageArrayBuffer: ArrayBuffer, apiKey: string) {
  try {
    // Create a blob from the ArrayBuffer
    const blob = new Blob([imageArrayBuffer]);
    
    // Create a FormData object and append the image
    const formData = new FormData();
    formData.append('image', blob, 'plant.jpg');
    
    // Call the FloraIncognita API (simulation for now)
    console.log("Calling FloraIncognita API (simulated)");
    
    // Return a simulated result
    return {
      species: "Solanum lycopersicum",
      family: "Solanaceae",
      score: 0.86,
      commonName: "Tomato"
    };
  } catch (error) {
    console.error("FloraIncognita API error:", error);
    return null;
  }
}

/**
 * Analyzes a plant image with the PlantSnap API
 * @param imageArrayBuffer The plant image as an ArrayBuffer
 * @param apiKey The PlantSnap API key
 * @returns The analysis result or null if failed
 */
export async function analyzeWithPlantSnap(imageArrayBuffer: ArrayBuffer, apiKey: string) {
  try {
    // Create a blob from the ArrayBuffer
    const blob = new Blob([imageArrayBuffer]);
    
    // Create a FormData object and append the image
    const formData = new FormData();
    formData.append('image', blob, 'plant.jpg');
    
    // Call the PlantSnap API (simulation for now)
    console.log("Calling PlantSnap API (simulated)");
    
    // Return a simulated result
    return {
      species: "Solanum lycopersicum",
      family: "Solanaceae",
      score: 0.88,
      details: {
        common_names: ["Tomato", "Pomodoro"],
        taxonomy: {
          genus: "Solanum",
          species: "lycopersicum"
        }
      }
    };
  } catch (error) {
    console.error("PlantSnap API error:", error);
    return null;
  }
}

/**
 * Analyzes a plant image with PlantNet API
 * @param imageArrayBuffer The plant image as an ArrayBuffer
 * @returns The analysis result or null if failed
 */
export async function analyzeWithPlantNet(imageArrayBuffer: ArrayBuffer) {
  try {
    // PlantNet API endpoint
    console.log("Calling PlantNet API (simulated)");
    
    // Return a simulated result
    return {
      species: "Solanum lycopersicum",
      score: 0.92,
      commonName: "Tomato",
      gbifScore: 0.91,
      isPlant: true
    };
  } catch (error) {
    console.error("PlantNet API error:", error);
    return null;
  }
}

/**
 * Analyzes a plant image with KindWise Plant Health API
 * @param imageArrayBuffer The plant image as an ArrayBuffer
 * @param apiKey The KindWise API key
 * @returns The analysis result or null if failed
 */
export async function analyzeWithKindWise(imageArrayBuffer: ArrayBuffer, apiKey: string) {
  try {
    console.log("Calling KindWise Plant Health API (simulated)");
    
    // Create a blob from the ArrayBuffer
    const blob = new Blob([imageArrayBuffer]);
    
    // Create a FormData object and append the image
    const formData = new FormData();
    formData.append('image', blob, 'plant.jpg');
    
    // Simulate a random disease or healthy plant
    const isHealthy = Math.random() > 0.35;
    
    // Plant diseases for simulation
    const diseases = [
      "Powdery Mildew",
      "Early Blight",
      "Late Blight",
      "Leaf Spot",
      "Rust",
      "Anthracnose",
      "Bacterial Spot",
      "Downy Mildew"
    ];
    
    // Plant parts
    const plantParts = ["leaf", "stem", "whole plant", "flower", "fruit"];
    
    // Generate a random disease if not healthy
    const disease = isHealthy ? null : diseases[Math.floor(Math.random() * diseases.length)];
    
    // Generate a random plant name
    const plantNames = [
      "Tomato",
      "Basil",
      "Rose",
      "Pepper",
      "Monstera",
      "Pothos",
      "Orchid",
      "Cucumber",
      "Lettuce"
    ];
    
    const plantName = plantNames[Math.floor(Math.random() * plantNames.length)];
    
    // Generate random treatment recommendations
    const treatments = [
      "Remove affected leaves",
      "Apply fungicide",
      "Improve air circulation",
      "Reduce humidity",
      "Apply neem oil",
      "Adjust watering schedule",
      "Apply copper spray",
      "Treat with horticultural soap"
    ];
    
    // Select 2-4 random treatments
    const selectedTreatments = treatments
      .sort(() => 0.5 - Math.random())
      .slice(0, Math.floor(Math.random() * 3) + 2);
    
    // Return a formatted result similar to KindWise API response
    return {
      success: true,
      plantName,
      plantPart: plantParts[Math.floor(Math.random() * plantParts.length)],
      disease,
      confidence: disease ? 0.7 + Math.random() * 0.25 : 0.9 + Math.random() * 0.09,
      healthy: isHealthy,
      details: {
        severity: disease ? "moderate" : "none",
        treatments: disease ? selectedTreatments : ["No treatment needed"],
        affectedArea: disease ? Math.floor(Math.random() * 50) + 10 : 0,
        progression: disease ? "early" : "none",
        nutrients: {
          nitrogen: "adequate",
          phosphorus: "adequate",
          potassium: "adequate"
        }
      },
      color: disease ? (Math.random() > 0.5 ? "yellow" : "brown") : "green",
      pattern: disease ? (Math.random() > 0.5 ? "spots" : "wilting") : "normal"
    };
  } catch (error) {
    console.error("KindWise API error:", error);
    return null;
  }
}
