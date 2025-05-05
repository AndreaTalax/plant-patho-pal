
// Advanced plant disease detection utilities

// Collection of realistic plant disease symptoms
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

// Detailed disease information for more realistic diagnoses
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

// Advanced image analysis simulation
export const analyzeImage = async (imageUrl: string): Promise<{
  diseaseId: string;
  confidence: number;
  analysisDetails: {
    identifiedFeatures: string[];
    alternativeDiagnoses: Array<{disease: string, probability: number}>;
    recommendedAdditionalTests?: string[];
  }
}> => {
  // In a real application, this would call a machine learning model
  // For demo purposes, we'll simulate a realistic plant disease analysis
  
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Randomly select a disease for demonstration
  const diseases = Object.keys(diseaseSymptoms);
  const randomIndex = Math.floor(Math.random() * diseases.length);
  const detectedDisease = diseases[randomIndex];
  
  // Generate a realistic confidence level (usually not 100%)
  const baseConfidence = 0.75 + (Math.random() * 0.2);
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
  
  // Generate alternative diagnoses with lower confidence
  const alternativeDiagnoses = [];
  const otherDiseases = diseases.filter(d => d !== detectedDisease);
  const numAlternatives = 1 + Math.floor(Math.random() * 2);
  
  for (let i = 0; i < numAlternatives; i++) {
    if (i < otherDiseases.length) {
      // Make alternative diagnoses have significantly lower confidence
      const altConfidence = 0.15 + (Math.random() * 0.25);
      alternativeDiagnoses.push({
        disease: otherDiseases[i],
        probability: Math.round(altConfidence * 100) / 100
      });
    }
  }
  
  // Sometimes recommend additional tests for more accurate diagnosis
  let recommendedAdditionalTests: string[] | undefined = undefined;
  if (confidence < 0.85) {
    recommendedAdditionalTests = [
      'Close-up photos of affected areas',
      'Soil pH testing',
      'Laboratory culture of affected tissue'
    ];
  }
  
  return {
    diseaseId: detectedDisease,
    confidence: confidence,
    analysisDetails: {
      identifiedFeatures,
      alternativeDiagnoses,
      recommendedAdditionalTests
    }
  };
};
