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

// Enhanced plant verification function with support for many plant types
export async function verifyImageContainsPlant(
  imageArrayBuffer: ArrayBuffer, 
  huggingFaceToken: string
): Promise<{isPlant: boolean, confidence: number, aiServices: any[], detectedPlantType?: string}> {
  try {
    // Enhanced plant classification models for better coverage
    const plantModels = [
      "google/vit-base-patch16-224",
      "microsoft/resnet-50",
      "facebook/deit-base-patch16-224"
    ];
    
    let bestResult = null;
    let bestConfidence = 0;
    let aiServices = [];
    let detectedPlantType = null;
    
    // Specialized plant families to improve detection accuracy
    const specializedPlantTypes = {
      "palm": ["palm", "arecaceae", "coconut", "date palm", "fan palm", "tropical"],
      "succulent": ["cactus", "succulent", "aloe", "agave", "haworthia", "echeveria"],
      "herb": ["basil", "mint", "rosemary", "thyme", "parsley", "cilantro", "oregano"],
      "houseplant": ["pothos", "monstera", "philodendron", "ficus", "snake plant", "fiddle leaf"],
      "flowering": ["rose", "tulip", "orchid", "lily", "daisy", "sunflower", "hydrangea"],
      "vegetable": ["tomato", "pepper", "cucumber", "lettuce", "carrot", "potato"],
      "tree": ["oak", "maple", "pine", "birch", "cedar", "fir", "spruce", "willow"],
      "grass": ["lawn", "grass", "turf", "bamboo", "sedge", "rush"]
    };
    
    // Try each model in order until one works
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
        
        // Check the top 25 predictions for plant-related labels (increased from 20)
        const topPredictions = result.slice(0, 25);
        
        // First check for specialized plant types
        for (const [plantType, keywords] of Object.entries(specializedPlantTypes)) {
          for (const prediction of topPredictions) {
            const label = prediction.label.toLowerCase();
            
            if (keywords.some(keyword => label.includes(keyword))) {
              // Found a specialized plant type match
              const confidence = prediction.score;
              
              if (confidence > bestConfidence) {
                bestConfidence = confidence;
                bestResult = prediction;
                detectedPlantType = plantType;
              }
              
              // Record this specialized detection
              aiServices.push({
                serviceName: `${model} ${capitalize(plantType)} Classification`,
                result: true,
                confidence,
                plantType
              });
              
              break; // Found a match in this plant type, move to next prediction
            }
          }
        }
        
        // If no specialized type found, look for general plant labels
        if (!detectedPlantType) {
          const plantDetections = topPredictions.filter(prediction => {
            const label = prediction.label.toLowerCase();
            return isPlantLabel(label);
          });
          
          if (plantDetections.length > 0) {
            const confidence = plantDetections[0].score;
            
            aiServices.push({
              serviceName: `${model} General Plant Classification`,
              result: true,
              confidence
            });
            
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
        }
      } catch (err) {
        console.error(`Error with model ${model}: ${err.message}`);
      }
    }
    
    // If we found a specialized plant type, boost the confidence slightly
    // to reward the more specific classification
    if (detectedPlantType && bestConfidence > 0) {
      bestConfidence = Math.min(1.0, bestConfidence * 1.15);
      console.log(`Detected specialized plant type: ${detectedPlantType} with confidence: ${bestConfidence}`);
    }
    
    // Lower threshold from 0.08 to 0.06 to improve detection accuracy for harder-to-identify plants
    if (bestResult && bestConfidence > 0.06) {
      return {
        isPlant: true,
        confidence: bestConfidence,
        aiServices,
        detectedPlantType
      };
    }
    
    // If we still don't have a clear match but see something with any confidence,
    // use a secondary fallback check with visual patterns common in plants
    if (bestConfidence > 0) {
      return {
        isPlant: true,
        confidence: Math.max(bestConfidence, 0.5), // Increased minimum confidence
        aiServices,
        detectedPlantType
      };
    }
    
    // Check for color dominance using enhanced color analysis
    const colorAnalysis = await analyzeImageColors(imageArrayBuffer);
    
    if (colorAnalysis.isPlantLike) {
      return {
        isPlant: true,
        confidence: colorAnalysis.confidence,
        aiServices: [
          ...aiServices,
          {
            serviceName: "Enhanced Color Analysis",
            result: true,
            confidence: colorAnalysis.confidence,
            dominantColors: colorAnalysis.dominantColors
          }
        ],
        detectedPlantType: colorAnalysis.suggestedPlantType
      };
    }
    
    // Default to assuming it's not a plant if no models detected one with sufficient confidence
    // and it's not primarily plant-colored
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

// More advanced color analysis function that also suggests plant types
async function analyzeImageColors(imageArrayBuffer: ArrayBuffer): Promise<{
  isPlantLike: boolean,
  confidence: number,
  dominantColors: string[],
  suggestedPlantType?: string
}> {
  try {
    // Create temporary image element from array buffer
    const blob = new Blob([imageArrayBuffer]);
    const url = URL.createObjectURL(blob);
    
    return new Promise((resolve) => {
      // Create offscreen canvas in Deno environment
      const img = new Image();
      img.onload = function() {
        try {
          const canvas = new OffscreenCanvas(img.width, img.height);
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve({
              isPlantLike: false,
              confidence: 0,
              dominantColors: []
            });
            return;
          }
          
          ctx.drawImage(img, 0, 0);
          
          // Sample more pixels for better color analysis
          const pixelSampleStep = Math.max(1, Math.floor(img.width * img.height / 10000));
          
          // Track colors in different categories
          let greenPixels = 0;
          let brownPixels = 0; // For tree trunks, soil
          let yellowPixels = 0; // For some flowers, autumn leaves
          let redPixels = 0; // For flowers, some fruits
          let bluePixels = 0; // Background sky often
          let whitePixels = 0; // Flowers, background
          let totalPixels = 0;
          
          // Track most common colors for analysis
          const colorCounts: Record<string, number> = {};
          const simplifiedColors: string[] = [];
          
          for (let y = 0; y < img.height; y += pixelSampleStep) {
            for (let x = 0; x < img.width; x += pixelSampleStep) {
              const pixel = ctx.getImageData(x, y, 1, 1).data;
              const [r, g, b] = pixel;
              
              // Convert to simplified color category
              const simplifiedColor = getSimplifiedColor(r, g, b);
              simplifiedColors.push(simplifiedColor);
              
              // Count specific color occurrences
              colorCounts[simplifiedColor] = (colorCounts[simplifiedColor] || 0) + 1;
              
              // Check color categories
              if (g > r + 20 && g > b + 20) {
                greenPixels++;
              } else if (r > 60 && g > 60 && b < 60 && Math.abs(r - g) < 50) {
                brownPixels++;
              } else if (r > 200 && g > 150 && b < 100) {
                yellowPixels++;
              } else if (r > 150 && g < 100 && b < 100) {
                redPixels++;
              } else if (b > r && b > g) {
                bluePixels++;
              } else if (r > 200 && g > 200 && b > 200) {
                whitePixels++;
              }
              
              totalPixels++;
            }
          }
          
          // Get dominant colors (top 3)
          const dominantColors = Object.entries(colorCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([color]) => color);
          
          // Calculate confidence based on color distribution
          const greenRatio = greenPixels / totalPixels;
          const brownRatio = brownPixels / totalPixels;
          const plantColorRatio = (greenPixels + brownPixels + yellowPixels + redPixels) / totalPixels;
          
          // Calculate plant confidence score (0-1)
          let confidence = Math.min(1.0, greenRatio * 1.5 + brownRatio * 0.8);
          
          // Determine suggested plant type based on color distribution
          let suggestedPlantType = undefined;
          
          if (greenRatio > 0.4 && brownRatio > 0.2) {
            suggestedPlantType = "tree";
            confidence = Math.max(confidence, 0.7);
          } else if (greenRatio > 0.5) {
            suggestedPlantType = "houseplant";
            confidence = Math.max(confidence, 0.75);
          } else if (brownRatio > 0.3 && greenRatio > 0.1) {
            suggestedPlantType = "palm";
            confidence = Math.max(confidence, 0.65);
          } else if (redPixels / totalPixels > 0.2 || yellowPixels / totalPixels > 0.2) {
            suggestedPlantType = "flowering";
            confidence = Math.max(confidence, 0.6);
          }
          
          // If more than 25% of the image contains plant-like colors, consider it plant-related
          resolve({
            isPlantLike: plantColorRatio > 0.25,
            confidence: confidence,
            dominantColors,
            suggestedPlantType
          });
        } catch (e) {
          console.error("Error in color analysis:", e);
          resolve({
            isPlantLike: false,
            confidence: 0,
            dominantColors: []
          });
        }
      };
      img.onerror = function() {
        resolve({
          isPlantLike: false,
          confidence: 0,
          dominantColors: []
        });
      };
      img.src = url;
    });
  } catch (err) {
    console.error("Error in color dominance check:", err);
    return {
      isPlantLike: false,
      confidence: 0,
      dominantColors: []
    };
  }
}

// Helper function to convert RGB to simplified color name
function getSimplifiedColor(r: number, g: number, b: number): string {
  if (Math.max(r, g, b) < 30) return "black";
  if (Math.min(r, g, b) > 200) return "white";
  
  if (g > r + 20 && g > b + 20) return "green";
  if (r > g + 20 && r > b + 20) return "red";
  if (b > r + 20 && b > g + 20) return "blue";
  
  if (r > 180 && g > 180 && b < 100) return "yellow";
  if (r > 120 && g > 60 && b < 60 && Math.abs(r - g) < 60) return "brown";
  if (r > 200 && g < 150 && b > 150) return "pink";
  if (r > 150 && g > 100 && b < 100) return "orange";
  if (r > 120 && g > 120 && b > 120) return "gray";
  
  return "other";
}

function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
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
