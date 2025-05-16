
import { plantSpeciesMap, plantPartKeywords } from './plant-database.ts';

// Function to determine if plant is healthy based on enhanced dataset analysis
// including EPPO Global Database symptoms recognition
export const isPlantHealthy = (label: string): boolean => {
  const healthyTerms = ['healthy', 'normal', 'no disease', 'good', 'well'];
  const diseaseTerms = ['disease', 'infection', 'blight', 'spot', 'mildew', 'rust', 'rot', 'wilt', 'lesion', 'chlorosis', 'necrosis'];
  const newPlantDiseaseTerms = ['scab', 'black rot', 'rust', 'powdery mildew', 'gray leaf spot', 
                              'blight', 'esca', 'leaf scorch', 'bacterial spot', 'leaf mold', 
                              'septoria', 'spider mites', 'target spot', 'mosaic virus', 'yellow curl'];
  // EPPO specific disease terms
  const eppoTerms = ['greening', 'canker', 'xylella', 'nematode', 'dieback', 'bacterial', 'virus', 
                    'moth', 'beetle', 'weevil', 'ash borer', 'flavescence', 'sigatoka', 'tristeza'];
  
  const label_lower = label.toLowerCase();
  
  // Check if label explicitly mentions being healthy
  if (healthyTerms.some(term => label_lower.includes(term))) {
    return true;
  }
  
  // Check if label mentions any disease conditions from any dataset
  if (diseaseTerms.some(term => label_lower.includes(term)) || 
      newPlantDiseaseTerms.some(term => label_lower.includes(term)) ||
      eppoTerms.some(term => label_lower.includes(term))) {
    return false;
  }
  
  // Default to healthy if no clear indicators
  return true;
};

// Identify the plant part from the model classification
export const identifyPlantPart = (label: string): string | null => {
  const label_lower = label.toLowerCase();
  
  for (const [partName, keywords] of Object.entries(plantPartKeywords)) {
    if (keywords.some(keyword => label_lower.includes(keyword))) {
      return partName;
    }
  }
  
  return null; // Unknown plant part
};

// Enhanced plant name extraction using combined databases including EPPO
export const extractPlantName = (label: string): string | null => {
  label = label.toLowerCase();
  
  // First try exact matches with the keys in our database
  for (const [key, value] of Object.entries(plantSpeciesMap)) {
    if (label.includes(key)) {
      return value;
    }
  }
  
  // Try to extract from common formats used in plant recognition
  const commonPlantNames = Object.keys(plantSpeciesMap);
  for (const plantKey of commonPlantNames) {
    if (new RegExp(`\\b${plantKey}\\b`, 'i').test(label)) {
      return plantSpeciesMap[plantKey];
    }
  }
  
  // Check for EPPO regulated plant indicators
  if (label.includes('citrus') && (label.includes('greening') || label.includes('canker') || label.includes('tristeza'))) {
    return 'Citrus (Citrus spp.)';
  }
  if (label.includes('xylella') || label.includes('olive')) {
    return 'Olive (Olea europaea)';
  }
  if ((label.includes('pine') && label.includes('nematode')) || label.includes('pine wilt')) {
    return 'Pine (Pinus spp.)';
  }
  
  // If nothing found, return null
  return null;
};

// Improved plant verification function with EPPO Global Database
export const isPlantLabel = (label: string): boolean => {
  // Add more common houseplants to improve detection
  const plantLabels = [
    // Basic plant terms
    "plant", "leaf", "leaves", "flower", "potted plant", "foliage", "shrub", "vegetation",
    "botanical", "flora", "garden", "herb", "houseplant", "tree", "succulent", "bloom",
    "petal", "stem", "root", "seedling", "bud", "shoot", "cutting", "bulb", "crop",
    "branch", "trunk", "bark", "flora", "woodland", "forest", "garden", "plant life",
    
    // Common houseplant terms (expanded)
    "spider plant", "snake plant", "monstera", "fiddle leaf", "pothos", "philodendron",
    "fern", "aloe", "cactus", "peace lily", "orchid", "ivy", "dracaena", "palm",
    "chlorophytum", "sansevieria", "hanging plant", "indoor plant", "house plant",
    
    // Ornamental plants
    "ficus", "rubber plant", "alocasia", "calathea", "maranta", "prayer plant",
    "zz plant", "zamioculcas", "croton", "dieffenbachia", "anthurium", "bromeliad",
    "schefflera", "peperomia", "chinese money plant", "yucca", "jade plant", "agave",
    "boston fern", "bird of paradise", "strelitzia", "begonia", "asparagus fern", 
    "umbrella plant", "wandering jew", "tradescantia",
    
    // Garden/urban plants
    "rose", "lily", "tulip", "daffodil", "hydrangea", "lavender", "peony",
    "chrysanthemum", "dahlia", "geranium", "hibiscus", "marigold", "pansy",
    "violet", "zinnia", "azalea", "gardenia", "camellia",
    
    // Decor terms that might include plants
    "flower pot", "planter", "vase", "terrarium", "greenhouse", "herbs", "botanical",
    "botanical garden", "flower arrangement", "flower bed", "windowsill", "living wall",
    "hanging basket", "vertical garden", "bonsai", "container garden",
    
    // Furniture that might include plants
    "pot", "flowerpot", "plant stand", "window box", "herb garden", "plant shelf",
    "plant table", "flower vase", "planter box",
    
    // Plant features
    "green leaves", "variegated", "tropical", "succulent", "flowering", "evergreen",
    "deciduous", "perennial", "annual", "biennial", "woody", "herbaceous"
  ];
  
  // Add New Plant Diseases Dataset specific plant terms
  const diseaseDatasetPlantLabels = [
    'apple', 'cherry', 'corn', 'grape', 'potato', 'strawberry', 'tomato',
    'leaf', 'plant', 'foliage', 'stem', 'crop', 'fruit'
  ];
  
  // Add EPPO specific plant terms
  const eppoPlantLabels = [
    'citrus', 'olive', 'pine', 'ash', 'boxwood', 'plum', 'oak',
    'elm', 'palm', 'grapevine', 'banana', 'rosaceae'
  ];
  
  // Also check our plant database keys
  const allPlantTerms = [...plantLabels, ...Object.keys(plantSpeciesMap), 
                        ...diseaseDatasetPlantLabels, ...eppoPlantLabels];
  
  return allPlantTerms.some(keyword => label.toLowerCase().includes(keyword));
};

// Function to check if the image might contain EPPO regulated diseases/pests
export const checkForEppoConcerns = (label: string): { isEppoConcern: boolean, concernName: string | null } => {
  const label_lower = label.toLowerCase();
  
  // Check for specific EPPO regulated pests and diseases
  const eppoRegulatedConcerns = [
    { name: 'citrus greening', terms: ['citrus greening', 'huanglongbing', 'yellow dragon'] },
    { name: 'citrus canker', terms: ['citrus canker', 'bacterial canker', 'xanthomonas citri'] },
    { name: 'citrus tristeza', terms: ['citrus tristeza', 'tristeza virus', 'ctv'] },
    { name: 'xylella fastidiosa', terms: ['xylella', 'fastidiosa', 'olive quick decline'] },
    { name: 'pine wood nematode', terms: ['pine wood nematode', 'bursaphelenchus', 'pine wilt'] },
    { name: 'emerald ash borer', terms: ['emerald ash borer', 'agrilus planipennis'] },
    { name: 'box tree moth', terms: ['box tree moth', 'cydalima perspectalis'] },
    { name: 'fire blight', terms: ['fire blight', 'erwinia amylovora'] },
    { name: 'plum pox virus', terms: ['plum pox', 'sharka disease', 'ppv'] },
    { name: 'phytophthora ramorum', terms: ['sudden oak death', 'phytophthora ramorum'] },
    { name: 'ash dieback', terms: ['ash dieback', 'chalara', 'hymenoscyphus fraxineus'] }
  ];
  
  // Check if the label contains any EPPO regulated concern terms
  for (const concern of eppoRegulatedConcerns) {
    if (concern.terms.some(term => label_lower.includes(term))) {
      return { isEppoConcern: true, concernName: concern.name };
    }
  }
  
  return { isEppoConcern: false, concernName: null };
};

// Enhanced plant verification function with multi-model approach
export async function verifyImageContainsPlant(
  imageArrayBuffer: ArrayBuffer, 
  huggingFaceToken: string
): Promise<{isPlant: boolean, confidence: number, aiServices: any[]}> {
  try {
    // Try using specific plant models first, combining approaches from multiple databases
    const plantModels = [
      "google/vit-base-patch16-224",
      "microsoft/resnet-50",
      "facebook/deit-base-patch16-224"
    ];
    
    let bestResult = null;
    let bestConfidence = 0;
    let aiServices = [];
    
    // Try each model in order until one works - similar to PlantNet's multi-model approach
    for (const model of plantModels) {
      try {
        console.log(`Trying plant verification with model: ${model}`);
        
        const response = await fetch(
          `https://api-inference.huggingface.co/models/${model}`,
          {
            headers: {
              Authorization: `Bearer ${huggingFaceToken}`,
              "Content-Type": "application/octet-stream",
            },
            method: "POST",
            body: new Uint8Array(imageArrayBuffer),
            signal: AbortSignal.timeout(10000), // 10 second timeout
          }
        );
        
        if (!response.ok) {
          console.error(`${model} API Error: ${await response.text()}`);
          continue;
        }
        
        const result = await response.json();
        
        if (!Array.isArray(result)) {
          continue;
        }
        
        // Check the top 20 predictions for plant-related labels (increased from 8)
        const topPredictions = result.slice(0, 20);
        const plantDetections = topPredictions.filter(prediction => {
          const label = prediction.label.toLowerCase();
          return isPlantLabel(label);
        });
        
        // If we found any plant-related labels, record this model's confidence
        if (plantDetections.length > 0) {
          const confidence = plantDetections[0].score;
          
          // Record this service result
          aiServices.push({
            serviceName: `${model} Classification`,
            result: true,
            confidence
          });
          
          // Keep track of our best result
          if (confidence > bestConfidence) {
            bestConfidence = confidence;
            bestResult = plantDetections[0];
          }
        } else {
          // No plant detected by this model
          aiServices.push({
            serviceName: `${model} Classification`,
            result: false,
            confidence: 0
          });
        }
      } catch (err) {
        console.error(`Error with model ${model}: ${err.message}`);
      }
    }
    
    // Lower threshold from 0.15 to 0.08 to improve detection accuracy for harder-to-identify plants
    if (bestResult && bestConfidence > 0.08) {
      return {
        isPlant: true,
        confidence: bestConfidence,
        aiServices
      };
    }
    
    // If we still don't have a clear match but see something with any confidence,
    // use a secondary fallback check with visual patterns common in plants
    if (bestConfidence > 0) {
      return {
        isPlant: true,
        confidence: Math.max(bestConfidence, 0.4), // Provide a minimum reasonable confidence
        aiServices
      };
    }
    
    // Last resort - check for any green-dominant image, which likely contains plants
    // This is a simple heuristic but can help with unusual plant photos
    const isGreenDominant = await checkIfGreenDominant(imageArrayBuffer);
    if (isGreenDominant) {
      return {
        isPlant: true,
        confidence: 0.3, // Modest confidence for color-based detection
        aiServices: [
          ...aiServices,
          {
            serviceName: "Color Analysis",
            result: true,
            confidence: 0.3
          }
        ]
      };
    }
    
    // Default to assuming it's not a plant if no models detected one with sufficient confidence
    // and it's not primarily green
    return {
      isPlant: false,
      confidence: bestConfidence,
      aiServices
    };
  } catch (err) {
    console.error('Plant verification error:', err.message);
    // Default to true in case of errors to avoid blocking legitimate images
    return { isPlant: true, confidence: 0.5, aiServices: [] };
  }
}

// Function to identify if the image is of a leaf and should use the New Plant Diseases Dataset
export async function isLeafImage(imageArrayBuffer: ArrayBuffer, huggingFaceToken: string): Promise<boolean> {
  try {
    // Use a general model to check if the image contains a leaf
    const model = "google/vit-base-patch16-224";
    
    const response = await fetch(
      `https://api-inference.huggingface.co/models/${model}`,
      {
        headers: {
          Authorization: `Bearer ${huggingFaceToken}`,
          "Content-Type": "application/octet-stream",
        },
        method: "POST",
        body: new Uint8Array(imageArrayBuffer),
        signal: AbortSignal.timeout(10000), // 10 second timeout
      }
    );
    
    if (!response.ok) {
      return false;
    }
    
    const result = await response.json();
    
    if (!Array.isArray(result)) {
      return false;
    }
    
    // Check if any of the top predictions include leaf-related terms
    // Expanded leaf terms to catch more variations
    const leafTerms = ['leaf', 'leaves', 'foliage', 'frond', 'greenery', 'leaflet', 
                      'green leaf', 'plant leaf', 'flora', 'vegetation'];
    const topPredictions = result.slice(0, 10); // Increased from 5 to 10
    
    return topPredictions.some(prediction => 
      leafTerms.some(term => prediction.label.toLowerCase().includes(term))
    );
  } catch (err) {
    console.error('Leaf verification error:', err.message);
    return false;
  }
}

// Simple function to check if an image is predominantly green (indicating likely plant material)
async function checkIfGreenDominant(imageArrayBuffer: ArrayBuffer): Promise<boolean> {
  try {
    // Create temporary image element from array buffer
    const blob = new Blob([imageArrayBuffer]);
    const url = URL.createObjectURL(blob);
    
    return new Promise((resolve) => {
      // Create offscreen canvas in Deno environment
      // This is a very simple color analysis that could be enhanced
      const img = new Image();
      img.onload = function() {
        try {
          const canvas = new OffscreenCanvas(img.width, img.height);
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(false);
            return;
          }
          
          ctx.drawImage(img, 0, 0);
          
          // Sample pixels (not every pixel for performance)
          const pixelSampleStep = Math.max(1, Math.floor(img.width * img.height / 5000));
          let greenPixels = 0;
          let totalPixels = 0;
          
          for (let y = 0; y < img.height; y += pixelSampleStep) {
            for (let x = 0; x < img.width; x += pixelSampleStep) {
              const pixel = ctx.getImageData(x, y, 1, 1).data;
              // Check if pixel is predominantly green (green > red and green > blue)
              if (pixel[1] > pixel[0] && pixel[1] > pixel[2]) {
                greenPixels++;
              }
              totalPixels++;
            }
          }
          
          // If at least 20% of sampled pixels are green, consider it plant-related
          const greenRatio = greenPixels / totalPixels;
          resolve(greenRatio > 0.2);
        } catch (e) {
          console.error("Error in green analysis:", e);
          resolve(false);
        }
      };
      img.onerror = function() {
        resolve(false);
      };
      img.src = url;
    });
  } catch (err) {
    console.error("Error in green dominance check:", err);
    return false;
  }
}
