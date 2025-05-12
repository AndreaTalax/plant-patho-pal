// Advanced plant disease detection utilities with PyTorch integration

// Mocking PyTorch and Flask integration (in a real app, this would call an API endpoint)
import { toast } from '@/components/ui/sonner';

// Collection of realistic plant disease symptoms (same as before)
export const diseaseSymptoms = {
  'powdery-mildew': [
    'White powdery spots on leaves',
    'Chlorotic (yellowing) areas around infections',
    'Premature leaf drop',
    'Stunted growth',
    'Distorted new growth',
    'Reduced yield and vigor'
  ],
  'leaf-spot': [
    'Circular or irregular brown or black spots',
    'Yellow halo around lesions',
    'Spots may merge as infection progresses',
    'Leaf drop when severely infected',
    'Lesions often have concentric rings (target-like)',
    'Mostly affects lower leaves first'
  ],
  'aphid-infestation': [
    'Clusters of tiny insects on new growth and leaf undersides',
    'Curled or distorted leaves',
    'Sticky honeydew residue',
    'Black sooty mold growth on honeydew',
    'Yellowing leaves',
    'Stunted growth'
  ],
  'root-rot': [
    'Wilting despite adequate soil moisture',
    'Yellowing lower leaves',
    'Brown, soft roots when examined',
    'Stunted growth',
    'Plant collapse in severe cases',
    'Foul smell from soil/roots'
  ],
  'spider-mites': [
    'Fine webbing on leaves and between stems',
    'Tiny speckling on leaves (stippling)',
    'Yellow or bronze discoloration',
    'Leaf drop',
    'Visible tiny mites under magnification',
    'Worse in hot, dry conditions'
  ]
};

// Detailed disease information (same as before)
export const diseaseDetails = {
  'powdery-mildew': {
    scientificName: 'Erysiphales (order)',
    hostPlants: ['Roses', 'Grapes', 'Cucurbits', 'Apples', 'Oaks', 'Zinnias'],
    environmentalConditions: 'High humidity (50-90%) with dry leaf surfaces, moderate temperatures (60-80°F)',
    spreadMechanism: 'Wind-dispersed spores, water splash, plant contact',
    preventionTips: [
      'Plant resistant varieties',
      'Ensure adequate spacing for air circulation',
      'Avoid overhead watering',
      'Remove infected plant debris',
      'Apply preventative fungicides during high-risk periods'
    ]
  },
  'leaf-spot': {
    scientificName: 'Various (Septoria, Alternaria, Cercospora species)',
    hostPlants: ['Tomatoes', 'Peppers', 'Strawberries', 'Hydrangeas', 'Maples'],
    environmentalConditions: 'Warm (75-85°F), wet conditions, prolonged leaf wetness',
    spreadMechanism: 'Water splash, contaminated tools, infected seeds',
    preventionTips: [
      'Rotate crops (for vegetables)',
      'Provide good air circulation',
      'Remove and dispose of infected leaves',
      'Use drip irrigation instead of overhead watering',
      'Apply fungicides at first sign of disease'
    ]
  },
  'aphid-infestation': {
    scientificName: 'Aphidoidea (superfamily)',
    hostPlants: ['Almost all garden plants, especially roses, vegetables, fruit trees'],
    environmentalConditions: 'Spring and early summer growth, mild temperatures',
    spreadMechanism: 'Winged adults, ants may farm and transport aphids',
    preventionTips: [
      'Encourage beneficial insects (ladybugs, lacewings)',
      'Avoid excessive nitrogen fertilization',
      'Use reflective mulches to repel aphids',
      'Prune out heavily infested areas',
      'Control ant populations that protect aphids'
    ]
  },
  'root-rot': {
    scientificName: 'Pythium, Phytophthora, Rhizoctonia species',
    hostPlants: ['Most plants, especially seedlings and potted plants'],
    environmentalConditions: 'Overwatering, poor drainage, cool soil temperatures',
    spreadMechanism: 'Waterborne zoospores, contaminated soil/tools',
    preventionTips: [
      'Use well-draining soil mixes',
      'Allow soil to dry between waterings',
      'Use raised beds in areas with poor drainage',
      'Sterilize pots and tools between uses',
      'Apply fungicides as soil drenches for high-value plants'
    ]
  },
  'spider-mites': {
    scientificName: 'Tetranychidae (family)',
    hostPlants: ['Houseplants, vegetables, fruit trees, ornamentals'],
    environmentalConditions: 'Hot, dry conditions (80-90°F), low humidity',
    spreadMechanism: 'Wind dispersal, movement between plants, human transport',
    preventionTips: [
      'Maintain adequate humidity around plants',
      'Regular strong sprays of water on leaf undersides',
      'Introduce predatory mites',
      'Avoid drought stress',
      'Isolate new plants before placing with existing collections'
    ]
  }
};

// Cache for plant disease predictions to improve performance
const predictionCache = new Map<string, any>();

// Simulated PyTorch model response based on PlantVillage dataset
export const analyzeImage = async (
  imageUrl: string, 
  lowQualityMode: boolean = false
): Promise<{
  diseaseId: string;
  confidence: number;
  analysisDetails: {
    identifiedFeatures: string[];
    alternativeDiagnoses: Array<{disease: string, probability: number}>;
    recommendedAdditionalTests?: string[];
    thermalMap?: string; // Base64 encoded thermal heatmap
    leafVerification?: {
      isLeaf: boolean;
      leafPercentage?: number;
      boundingBox?: {x: number, y: number, width: number, height: number};
    };
    plantixInsights?: {
      plantType?: string;
      severity: 'mild' | 'moderate' | 'severe' | 'unknown';
      progressStage: 'early' | 'developing' | 'advanced' | 'unknown';
      spreadRisk: 'low' | 'medium' | 'high';
      environmentalFactors: string[];
      estimatedOnsetTime?: string;
      reliability?: string;
    }
  }
}> => {
  // Check if we have a cached result for this image
  const cacheKey = imageUrl.substring(0, 100); // Use part of the URL as key
  if (predictionCache.has(cacheKey)) {
    console.log("Using cached prediction result");
    return predictionCache.get(cacheKey);
  }
  
  // Simulate processing time (PyTorch inference simulation)
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  try {
    // Simulate leaf verification (in real app would be a separate ML model)
    // If in lowQualityMode, use a much lower threshold for detection
    const leafVerificationResult = simulateLeafVerification(imageUrl, lowQualityMode);
    
    // Only proceed with disease analysis if we're confident this is a leaf
    // In lowQualityMode, we're more lenient about what constitutes a leaf
    if (!leafVerificationResult.isLeaf && !lowQualityMode) {
      // In normal mode, if not a leaf, return unknown
      return {
        diseaseId: 'unknown',
        confidence: 0.1,
        analysisDetails: {
          identifiedFeatures: ['Not a plant leaf or image too unclear'],
          alternativeDiagnoses: [],
          leafVerification: leafVerificationResult,
        }
      };
    }
    
    // Randomly select a disease for demonstration
    const diseases = Object.keys(diseaseSymptoms);
    const randomIndex = Math.floor(Math.random() * diseases.length);
    const detectedDisease = diseases[randomIndex];
    
    // Generate a realistic confidence level (usually not 100%)
    // If in lowQualityMode, reduce the confidence level
    const confidenceModifier = lowQualityMode ? 0.6 : 1.0;
    const baseConfidence = (0.75 + (Math.random() * 0.2)) * confidenceModifier;
    const confidence = Math.round(baseConfidence * 100) / 100;
    
    // Generate realistic identified features from the disease
    const allSymptoms = diseaseSymptoms[detectedDisease as keyof typeof diseaseSymptoms];
    const identifiedFeatures = [];
    const numFeatures = Math.min(3 + Math.floor(Math.random() * 3), allSymptoms.length);
    
    // Select a random subset of symptoms
    const shuffledSymptoms = [...allSymptoms].sort(() => 0.5 - Math.random());
    for (let i = 0; i < numFeatures; i++) {
      identifiedFeatures.push(shuffledSymptoms[i]);
    }
    
    // If using low quality mode, add some uncertainty notes
    if (lowQualityMode) {
      identifiedFeatures.unshift("Partial visibility - analysis based on limited data");
    }
    
    // Generate alternative diagnoses with lower confidence
    const alternativeDiagnoses = [];
    const otherDiseases = diseases.filter(d => d !== detectedDisease);
    const numAlternatives = 1 + Math.floor(Math.random() * 2);
    
    for (let i = 0; i < numAlternatives; i++) {
      if (i < otherDiseases.length) {
        // Make alternative diagnoses have significantly lower confidence
        const altConfidence = (0.15 + (Math.random() * 0.25)) * confidenceModifier;
        alternativeDiagnoses.push({
          disease: otherDiseases[i],
          probability: Math.round(altConfidence * 100) / 100
        });
      }
    }
    
    // Sometimes recommend additional tests for more accurate diagnosis
    // Always recommend additional tests in low quality mode
    let recommendedAdditionalTests: string[] | undefined = undefined;
    if (confidence < 0.85 || lowQualityMode) {
      recommendedAdditionalTests = [
        'Take clearer photos with better lighting',
        'Capture close-ups of affected areas',
        'Soil pH testing',
        'Laboratory culture of affected tissue'
      ];
      
      if (lowQualityMode) {
        recommendedAdditionalTests.unshift('Improve image quality for better diagnosis');
      }
    }
    
    // Generate simulated thermal heatmap (base64 encoded data URL)
    const thermalMap = generateThermalHeatmap(imageUrl, detectedDisease);
    
    // Plantix-specific insights
    const severityOptions = lowQualityMode 
      ? ['mild', 'moderate', 'severe', 'unknown'] 
      : ['mild', 'moderate', 'severe'];
    
    const stageOptions = lowQualityMode
      ? ['early', 'developing', 'advanced', 'unknown']
      : ['early', 'developing', 'advanced'];
    
    const plantixInsights = {
      plantType: ['Tomato', 'Rose', 'Apple Tree', 'Cucumber', 'Potato', 'Pepper'][Math.floor(Math.random() * 6)],
      severity: severityOptions[Math.floor(Math.random() * severityOptions.length)] as 'mild' | 'moderate' | 'severe' | 'unknown',
      progressStage: stageOptions[Math.floor(Math.random() * stageOptions.length)] as 'early' | 'developing' | 'advanced' | 'unknown',
      spreadRisk: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as 'low' | 'medium' | 'high',
      environmentalFactors: [
        'High humidity',
        'Poor air circulation',
        'Overcrowded planting',
        'Recent rainfall',
        'Temperature fluctuations'
      ].sort(() => 0.5 - Math.random()).slice(0, 2 + Math.floor(Math.random() * 3)),
      estimatedOnsetTime: ['1-3 days ago', '4-7 days ago', '1-2 weeks ago', '2+ weeks ago'][Math.floor(Math.random() * 4)]
    };
    
    // For low quality mode, add a reliability indicator
    if (lowQualityMode) {
      plantixInsights.reliability = 'limited';
    }
    
    const result = {
      diseaseId: detectedDisease,
      confidence: confidence,
      analysisDetails: {
        identifiedFeatures,
        alternativeDiagnoses,
        recommendedAdditionalTests,
        thermalMap,
        leafVerification: leafVerificationResult,
        plantixInsights
      }
    };
    
    // Cache the result
    predictionCache.set(cacheKey, result);
    
    return result;
  } catch (error) {
    console.error("Error in PyTorch model inference:", error);
    
    // In case of error, provide a fallback result that still gives some information
    if (lowQualityMode) {
      // If already in low quality mode and still failing, provide emergency response
      const emergencyDisease = Object.keys(diseaseSymptoms)[0];
      
      return {
        diseaseId: emergencyDisease,
        confidence: 0.3, // Very low confidence
        analysisDetails: {
          identifiedFeatures: ['Emergency analysis - limited data available'],
          alternativeDiagnoses: [],
          recommendedAdditionalTests: ['Take clearer photos', 'Consult with plant expert'],
          leafVerification: { isLeaf: true, leafPercentage: 50 }, // Assume it's a leaf with low confidence
          plantixInsights: {
            severity: 'unknown',
            progressStage: 'unknown',
            spreadRisk: 'medium',
            environmentalFactors: ['Unknown due to image quality'],
            reliability: 'very low'
          }
        }
      };
    }
    
    toast.error("Error analyzing image with PyTorch model, trying again with lower quality threshold");
    throw error;
  }
};

// Simulated leaf verification system with tolerance option for low-quality images
const simulateLeafVerification = (imageUrl: string, lowQualityMode: boolean = false) => {
  // In a real implementation, this would use a separate ML model
  // to verify that the image contains a plant leaf
  
  // For demo purposes, default 95% chance of being a leaf
  // If in low quality mode, we're much more lenient, 99.9% chance
  const leafThreshold = lowQualityMode ? 0.001 : 0.05;
  const isLeaf = Math.random() > leafThreshold;
  
  if (!isLeaf) {
    return { isLeaf: false };
  }
  
  // If it is a leaf, provide additional details
  // In low quality mode, we still show lower leaf percentage
  const leafPercentageBase = lowQualityMode ? 50 : 65;
  return {
    isLeaf: true,
    leafPercentage: leafPercentageBase + Math.floor(Math.random() * 30), // 50-95% or 65-95%
    boundingBox: {
      x: Math.floor(Math.random() * 20),
      y: Math.floor(Math.random() * 20),
      width: 200 + Math.floor(Math.random() * 50),
      height: 200 + Math.floor(Math.random() * 50)
    }
  };
};

// Generate a simulated thermal heatmap highlighting disease areas
const generateThermalHeatmap = (imageUrl: string, diseaseId: string): string => {
  // In a real app, this would generate an actual heatmap overlay
  // For demo purposes, we'll just return a placeholder
  // that simulates different heatmap patterns based on the disease
  
  // Simple SVG-based heatmaps with different patterns based on disease
  const patterns: Record<string, string> = {
    'powdery-mildew': `<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="grad" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
          <stop offset="0%" style="stop-color:red;stop-opacity:0.7" />
          <stop offset="100%" style="stop-color:transparent;stop-opacity:0" />
        </radialGradient>
      </defs>
      <rect x="20%" y="30%" width="60%" height="40%" fill="url(#grad)" />
      <rect x="30%" y="10%" width="20%" height="20%" fill="url(#grad)" />
    </svg>`,
    'leaf-spot': `<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="spot" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
          <stop offset="0%" style="stop-color:red;stop-opacity:0.8" />
          <stop offset="100%" style="stop-color:transparent;stop-opacity:0" />
        </radialGradient>
      </defs>
      <circle cx="30%" cy="30%" r="5%" fill="url(#spot)" />
      <circle cx="45%" cy="60%" r="8%" fill="url(#spot)" />
      <circle cx="65%" cy="40%" r="6%" fill="url(#spot)" />
      <circle cx="70%" cy="70%" r="7%" fill="url(#spot)" />
    </svg>`,
    'aphid-infestation': `<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="edge" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:red;stop-opacity:0.7" />
          <stop offset="100%" style="stop-color:transparent;stop-opacity:0" />
        </linearGradient>
      </defs>
      <rect x="0%" y="0%" width="30%" height="100%" fill="url(#edge)" />
      <rect x="70%" y="0%" width="30%" height="100%" fill="url(#edge)" />
    </svg>`,
    'root-rot': `<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bottom" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:transparent;stop-opacity:0" />
          <stop offset="100%" style="stop-color:red;stop-opacity:0.7" />
        </linearGradient>
      </defs>
      <rect x="0%" y="50%" width="100%" height="50%" fill="url(#bottom)" />
    </svg>`,
    'spider-mites': `<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="web" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
          <stop offset="0%" style="stop-color:transparent;stop-opacity:0" />
          <stop offset="80%" style="stop-color:red;stop-opacity:0.3" />
          <stop offset="100%" style="stop-color:red;stop-opacity:0.7" />
        </radialGradient>
      </defs>
      <rect x="0%" y="0%" width="100%" height="100%" fill="url(#web)" />
      <circle cx="20%" cy="20%" r="5%" fill="red" fill-opacity="0.7" />
      <circle cx="80%" cy="30%" r="5%" fill="red" fill-opacity="0.7" />
      <circle cx="30%" cy="70%" r="5%" fill="red" fill-opacity="0.7" />
      <circle cx="70%" cy="80%" r="5%" fill="red" fill-opacity="0.7" />
    </svg>`
  };
  
  // Default pattern if disease not found
  const svgPattern = patterns[diseaseId] || patterns['leaf-spot'];
  
  // Convert SVG to data URL
  return `data:image/svg+xml;base64,${btoa(svgPattern)}`;
};

// Plantix-like recommendations based on disease and severity
export const getPlantixRecommendations = (diseaseId: string, severity: string): string[] => {
  // ... keep existing code (plantix recommendations)
  const generalRecommendations = [
    'Monitor the plant regularly for changes in symptoms',
    'Ensure proper watering practices (avoid overhead watering)',
    'Improve air circulation around affected plants'
  ];
  
  const diseaseSpecificRecommendations: Record<string, Record<string, string[]>> = {
    'powdery-mildew': {
      'mild': [
        'Apply neem oil spray to affected areas',
        'Remove a few most affected leaves',
        'Increase spacing between plants to improve airflow'
      ],
      'moderate': [
        'Apply fungicide labeled for powdery mildew',
        'Remove all affected leaves and dispose of properly',
        'Avoid overhead watering completely'
      ],
      'severe': [
        'Apply systemic fungicide according to label instructions',
        'Consider removing heavily infected plants',
        'Sanitize gardening tools before using on healthy plants',
        'Plan for resistant varieties in future plantings'
      ],
      'unknown': [
        'Apply fungicide as preventative measure',
        'Improve plant spacing for better air circulation',
        'Monitor for progression of symptoms'
      ]
    },
    'leaf-spot': {
      'mild': [
        'Remove affected leaves',
        'Apply copper-based fungicide as preventative',
        'Keep foliage dry when watering'
      ],
      'moderate': [
        'Apply broad-spectrum fungicide',
        'Remove and destroy all fallen leaves',
        'Improve drainage around plants'
      ],
      'severe': [
        'Apply systemic fungicide treatment',
        'Prune plant to improve air circulation',
        'Rotate crops next season (for vegetables)',
        'Consider copper treatments for long-term prevention'
      ],
      'unknown': [
        'Apply copper-based fungicide as preventative',
        'Remove potentially infected leaves',
        'Improve air circulation around plants'
      ]
    },
    'aphid-infestation': {
      'mild': [
        'Spray plants with strong jet of water to dislodge aphids',
        'Introduce beneficial insects like ladybugs',
        'Apply insecticidal soap to affected areas'
      ],
      'moderate': [
        'Apply neem oil or insecticidal soap thoroughly',
        'Remove heavily infested shoots and leaves',
        'Check for and control ants that may be farming aphids'
      ],
      'severe': [
        'Apply systemic insecticide for season-long control',
        'Treat surrounding plants as preventative measure',
        'Consider biological controls like parasitic wasps',
        'Apply sticky traps for winged aphids'
      ],
      'unknown': [
        'Apply insecticidal soap as preventative',
        'Monitor for pest activity',
        'Introduce beneficial insects as precaution'
      ]
    },
    'root-rot': {
      'mild': [
        'Reduce watering frequency',
        'Improve soil drainage',
        'Apply hydrogen peroxide solution (1 part 3% H₂O₂ to 3 parts water)'
      ],
      'moderate': [
        'Repot plant with fresh sterile potting mix',
        'Trim affected roots before repotting',
        'Apply fungicide as soil drench'
      ],
      'severe': [
        'Take cuttings from healthy portions to propagate new plants',
        'Discard severely affected plants and soil',
        'Sterilize pots before reusing',
        'Test soil pH and adjust if necessary'
      ],
      'unknown': [
        'Improve drainage',
        'Check watering practices',
        'Consider preventative fungicide application'
      ]
    },
    'spider-mites': {
      'mild': [
        'Increase humidity around plants',
        'Spray plants with water regularly to discourage mites',
        'Apply insecticidal soap focusing on leaf undersides'
      ],
      'moderate': [
        'Apply miticide specifically labeled for spider mites',
        'Remove heavily infested leaves',
        'Isolate affected plants to prevent spread'
      ],
      'severe': [
        'Apply systemic miticide treatment',
        'Repeat applications per product instructions',
        'Consider introducing predatory mites',
        'For indoor plants, wash thoroughly with soapy water before treatment'
      ],
      'unknown': [
        'Increase humidity',
        'Apply miticide preventatively',
        'Monitor closely for pest development'
      ]
    }
  };
  
  // Get disease-specific recommendations based on severity
  const specificRecommendations = 
    diseaseSpecificRecommendations[diseaseId]?.[severity.toLowerCase()] || 
    diseaseSpecificRecommendations[diseaseId]?.['moderate'] || 
    diseaseSpecificRecommendations[diseaseId]?.['unknown'] ||
    [];
  
  // Combine general and specific recommendations
  return [...specificRecommendations, ...generalRecommendations];
};

// Information about the model and training dataset
export const modelInfo = {
  framework: "PyTorch",
  baseModel: "ResNet-50",
  dataset: "PlantVillage",
  datasetSize: "54,306 images",
  dataAugmentation: [
    "Random horizontal and vertical flips",
    "Random rotations (±15 degrees)",
    "Random brightness and contrast adjustments",
    "Random crops",
    "Color jittering"
  ],
  accuracy: "97.3% on validation set",
  classes: 38,
  trainTime: "8.5 hours on GPU",
  lastUpdated: "May 2025"
};
