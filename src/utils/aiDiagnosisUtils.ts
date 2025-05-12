
// This file would contain the actual AI model implementation
// For this demo, we're just simulating the results

// Mock model information
export const modelInfo = {
  name: "PlantDisease-ResNet50",
  accuracy: "94.7%",
  dataset: "PlantVillage + Custom Dataset",
  inputSize: "224x224",
  classes: 38,
  lastUpdated: "2025-03-15",
  framework: "PyTorch 2.2.0",
  architecture: {
    name: "ResNet50",
    modified: true,
    layers: 50,
    parameters: "23.5M"
  },
  metrics: {
    precision: 0.943,
    recall: 0.928,
    f1Score: 0.935
  },
  // Additional fields needed by ModelInfoPanel
  baseModel: "ResNet50",
  datasetSize: "50,000+ images",
  dataAugmentation: ["Rotation", "Flipping", "Color jittering", "Random cropping"],
  trainTime: "72 hours on 4x NVIDIA A100 GPUs"
};

// Plant disease categories for predictive analysis
const diseaseCategories = [
  'powdery-mildew',
  'leaf-spot',
  'aphid-infestation',
  'root-rot',
  'spider-mites'
];

// Add disease details export that DiagnosisTabs.tsx is expecting
export const diseaseDetails: {
  [key: string]: {
    scientificName: string;
    hostPlants: string[];
    environmentalConditions: string;
    spreadMechanism: string;
    preventionTips: string[];
  }
} = {
  'powdery-mildew': {
    scientificName: 'Erysiphales spp.',
    hostPlants: ['Roses', 'Cucurbits', 'Grapes', 'Apples', 'Ornamentals'],
    environmentalConditions: 'Moderate temperatures (60-80°F) with high humidity but dry leaf surfaces. Common in crowded plantings with poor air circulation.',
    spreadMechanism: 'Wind-dispersed spores that can survive without free water. Can overwinter on plant debris.',
    preventionTips: [
      'Plant resistant varieties',
      'Ensure proper spacing for air circulation',
      'Avoid overhead watering',
      'Apply preventative fungicides during susceptible periods',
      'Remove and destroy infected plant material'
    ]
  },
  'leaf-spot': {
    scientificName: 'Various (Septoria, Cercospora, Alternaria spp.)',
    hostPlants: ['Tomatoes', 'Peppers', 'Strawberries', 'Hydrangeas', 'Maple trees'],
    environmentalConditions: 'Warm, wet conditions with extended leaf wetness. Especially prevalent in rainy seasons.',
    spreadMechanism: 'Water splash from rain or irrigation. Spores can survive on plant debris in soil.',
    preventionTips: [
      'Practice crop rotation',
      'Use drip irrigation instead of sprinklers',
      'Apply mulch to prevent soil splash',
      'Remove infected leaves promptly',
      'Apply copper-based fungicides preventatively'
    ]
  },
  'aphid-infestation': {
    scientificName: 'Aphididae family (various species)',
    hostPlants: ['Roses', 'Vegetables', 'Fruit trees', 'Ornamentals', 'Herbs'],
    environmentalConditions: 'Warm weather, especially spring and early summer. Often found on new, tender growth.',
    spreadMechanism: 'Winged adults fly to new plants. Reproduce rapidly with live birth. Often spread by ants.',
    preventionTips: [
      'Encourage beneficial insects like ladybugs and lacewings',
      'Use reflective mulch to confuse aphids',
      'Apply insecticidal soaps for early infestations',
      'Prune and destroy heavily infested plant parts',
      'Control ant populations which protect and farm aphids'
    ]
  },
  'root-rot': {
    scientificName: 'Phytophthora, Pythium, Fusarium spp.',
    hostPlants: ['Houseplants', 'Shrubs', 'Trees', 'Vegetables', 'Ornamentals'],
    environmentalConditions: 'Overwatered soil, poor drainage, high humidity. Can be exacerbated by cool temperatures.',
    spreadMechanism: 'Fungal spores spread through water in soil. Can persist in soil for years.',
    preventionTips: [
      'Ensure proper drainage in containers and garden beds',
      'Avoid overwatering, especially in cool weather',
      'Use sterile potting mix for houseplants',
      'Allow soil to dry between waterings',
      'Apply fungicides containing phosphorous acid as preventatives for valuable plants'
    ]
  },
  'spider-mites': {
    scientificName: 'Tetranychidae family (primarily Tetranychus spp.)',
    hostPlants: ['Houseplants', 'Vegetables', 'Fruit trees', 'Ornamentals', 'Herbs'],
    environmentalConditions: 'Hot, dry conditions. Especially problematic in indoor environments with low humidity.',
    spreadMechanism: 'Wind dispersal. Can "balloon" on silk threads. Also spread by movement of infested plants.',
    preventionTips: [
      'Maintain adequate humidity around plants',
      'Regularly spray plants with water to discourage colonization',
      'Introduce predatory mites as biological control',
      'Apply horticultural oils or insecticidal soaps',
      'Isolate new plants before introducing to collections'
    ]
  }
};

// Add disease symptoms export that DiagnosisTabs.tsx is expecting
export const diseaseSymptoms: {
  [key: string]: {
    primary: string[];
    secondary: string[];
    progression: string[];
  }
} = {
  'powdery-mildew': {
    primary: [
      'White to gray powdery coating on leaves and stems',
      'Distorted leaf growth',
      'Yellowing of affected leaves'
    ],
    secondary: [
      'Premature leaf drop',
      'Reduced vigor',
      'Stunted growth',
      'Reduced fruit quality'
    ],
    progression: [
      'Initial small white spots on upper leaf surfaces',
      'Powdery patches expand to cover leaves and stems',
      'Leaves may curl, pucker, or become distorted',
      'In severe cases, plants may defoliate and buds may not open'
    ]
  },
  'leaf-spot': {
    primary: [
      'Circular to irregular dark spots on leaves',
      'Spots with tan to gray centers and dark margins',
      'Yellow halos around lesions'
    ],
    secondary: [
      'Leaf yellowing',
      'Premature defoliation',
      'Reduced plant vigor',
      'Sunscald of fruits due to lack of leaf coverage'
    ],
    progression: [
      'Small water-soaked spots appear',
      'Spots enlarge and develop distinct margins',
      'Centers of spots may dry out and tear',
      'Multiple spots can merge causing large blighted areas',
      'Severely affected leaves turn yellow and drop'
    ]
  },
  'aphid-infestation': {
    primary: [
      'Clusters of small soft-bodied insects on stems and leaf undersides',
      'Curled, distorted, or stunted leaves',
      'Sticky honeydew on leaves and surfaces below plants'
    ],
    secondary: [
      'Sooty mold growing on honeydew',
      'Yellowing leaves',
      'Transmitted viral diseases',
      'Reduced growth and vigor'
    ],
    progression: [
      'Few individual aphids appear on tender new growth',
      'Rapid population increase leads to colonies forming',
      'Leaves begin to curl and protect the growing colonies',
      'Honeydew accumulates and attracts ants',
      'Plants become weakened and secondary infections may occur'
    ]
  },
  'root-rot': {
    primary: [
      'Wilting despite adequate soil moisture',
      'Yellowing of lower leaves',
      'Stunted growth',
      'Brown, soft, decaying roots'
    ],
    secondary: [
      'Leaf drop',
      'Discolored stems near soil line',
      'Reduced flowering and fruiting',
      'Plant collapse in severe cases'
    ],
    progression: [
      'Initial symptoms include slight wilting during warmest part of day',
      'Plants fail to recover when watered',
      'Lower leaves yellow and drop',
      'Root system becomes increasingly damaged and unable to support plant',
      'Plant eventually collapses and dies'
    ]
  },
  'spider-mites': {
    primary: [
      'Fine stippling or speckling on upper leaf surfaces',
      'Yellowing or bronzing of leaves',
      'Fine webbing between leaves and stems',
      'Visible tiny mites under magnification'
    ],
    secondary: [
      'Leaf drop',
      'Reduced vigor',
      'Stunted growth',
      'Plant death in severe infestations'
    ],
    progression: [
      'Initial light stippling appears on leaves',
      'Affected areas expand and leaves develop yellow or bronze appearance',
      'Webbing appears between leaves and on leaf undersides',
      'Leaves dry out, curl, and drop',
      'Plants become severely weakened or die if infestation continues'
    ]
  }
};

// Simulated plant verification function 
const verifyPlantImage = (image: string): { isPlant: boolean, confidence: number } => {
  // In a real implementation, this would use a trained model to detect if the image contains a plant
  
  // For demo purposes, we'll return true 90% of the time, 
  // and randomly false 10% of the time to simulate failure cases
  const isPlant = Math.random() > 0.1;
  
  return {
    isPlant,
    confidence: isPlant ? 0.7 + Math.random() * 0.3 : 0.1 + Math.random() * 0.3
  };
};

// Simulated leaf verification function 
const verifyLeafImage = (image: string): { isLeaf: boolean, confidence: number } => {
  // In a real implementation, this would use more specific ML to identify leaves
  // For simulation, this has a 15% chance to fail
  const isLeaf = Math.random() > 0.15;
  
  return {
    isLeaf,
    confidence: isLeaf ? 0.65 + Math.random() * 0.35 : 0.05 + Math.random() * 0.4
  };
};

// This function would call our PyTorch model in a real implementation
export const analyzeImage = async (
  imageData: string, 
  lowThreshold = false,
  plantVerificationOnly = false
): Promise<any> => {
  // Simulating analysis delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Plant verification step
  const plantVerification = verifyPlantImage(imageData);
  
  if (!plantVerification.isPlant || plantVerificationOnly) {
    // Return early with just plant verification if:
    // 1. It's not a plant, or
    // 2. We only need plant verification
    return {
      analysisDetails: {
        plantVerification
      }
    };
  }
  
  // Leaf verification step
  const leafVerification = verifyLeafImage(imageData);
  
  // Generate a simulated diagnosis with a weighted random approach
  const randomDiseaseIndex = Math.floor(Math.random() * diseaseCategories.length);
  const diseaseId = diseaseCategories[randomDiseaseIndex];
  
  // Generate a confidence score, higher for standard threshold
  const confidenceBase = lowThreshold ? 0.5 : 0.7;
  const confidenceVariation = lowThreshold ? 0.3 : 0.25;
  const confidence = confidenceBase + Math.random() * confidenceVariation;
  
  // Create simulated analysis details
  const analysisDetails = {
    plantVerification,
    leafVerification,
    identifiedFeatures: [
      "Discoloration patterns",
      "Texture anomalies",
      "Growth irregularities"
    ],
    alternativeDiagnoses: [
      ...diseaseCategories
        .filter(d => d !== diseaseId)
        .slice(0, 2)
        .map(disease => ({
          disease,
          probability: 0.1 + Math.random() * 0.25
        }))
    ],
    recommendedAdditionalTests: [
      "Soil pH analysis",
      "Root examination"
    ],
    plantixInsights: {
      severity: ["mild", "moderate", "severe"][Math.floor(Math.random() * 3)],
      progressStage: ["early", "intermediate", "advanced"][Math.floor(Math.random() * 3)],
      spreadRisk: ["low", "medium", "high"][Math.floor(Math.random() * 3)],
      environmentalFactors: [
        "High humidity",
        "Temperature fluctuations"
      ],
      reliability: confidence > 0.8 ? "high" : confidence > 0.6 ? "medium" : "low"
    }
  };
  
  return {
    diseaseId,
    confidence,
    analysisDetails
  };
};
