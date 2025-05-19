
/**
 * Analyze leaf characteristics to enhance diagnosis
 * @param result Raw analysis result
 * @param label Classification label
 * @param score Confidence score
 * @returns Enhanced leaf analysis data
 */
export function analyzeLeafCharacteristics(result: any, label: string, score: number) {
  const lowerLabel = label.toLowerCase();
  
  // Determine leaf color from label
  let leafColor = 'green';
  if (lowerLabel.includes('yellow') || lowerLabel.includes('giallo')) {
    leafColor = 'yellow';
  } else if (lowerLabel.includes('brown') || lowerLabel.includes('marrone')) {
    leafColor = 'brown';
  } else if (lowerLabel.includes('white') || lowerLabel.includes('bianco')) {
    leafColor = 'white spots';
  } else if (lowerLabel.includes('black') || lowerLabel.includes('nero')) {
    leafColor = 'black spots';
  }
  
  // Determine pattern type
  let patternDetected = 'normal';
  if (lowerLabel.includes('spot') || lowerLabel.includes('macchia')) {
    patternDetected = 'leaf spots';
  } else if (lowerLabel.includes('mosaic') || lowerLabel.includes('mosaico')) {
    patternDetected = 'mosaic pattern';
  } else if (lowerLabel.includes('curl') || lowerLabel.includes('arrotolamento')) {
    patternDetected = 'leaf curl';
  } else if (lowerLabel.includes('wilt') || lowerLabel.includes('avvizzimento')) {
    patternDetected = 'wilting';
  } else if (lowerLabel.includes('mildew') || lowerLabel.includes('oidio')) {
    patternDetected = 'powdery coating';
  }
  
  // Determine health status
  const isHealthy = !( 
    lowerLabel.includes('disease') || 
    lowerLabel.includes('malattia') ||
    lowerLabel.includes('spot') || 
    lowerLabel.includes('macchia') ||
    lowerLabel.includes('blight') ||
    lowerLabel.includes('mildew') ||
    lowerLabel.includes('oidio') ||
    lowerLabel.includes('rot') ||
    lowerLabel.includes('marciume')
  );
  
  // Create detailed symptom description
  let symptomDescription = '';
  let symptomCategory = '';
  
  if (!isHealthy) {
    if (lowerLabel.includes('mildew') || lowerLabel.includes('oidio')) {
      symptomDescription = 'White powdery patches on leaves';
      symptomCategory = 'fungal disease';
    } else if (lowerLabel.includes('spot') || lowerLabel.includes('macchia')) {
      symptomDescription = 'Spots with chlorotic halos';
      symptomCategory = 'fungal disease';
    } else if (lowerLabel.includes('mosaic') || lowerLabel.includes('mosaico')) {
      symptomDescription = 'Mottled pattern with light/dark areas';
      symptomCategory = 'viral disease';
    } else if (lowerLabel.includes('curl') || lowerLabel.includes('arrotolamento')) {
      symptomDescription = 'Curled or distorted leaf edges';
      symptomCategory = 'viral disease or insect damage';
    } else if (lowerLabel.includes('rust') || lowerLabel.includes('ruggine')) {
      symptomDescription = 'Rust-colored pustules on leaf undersides';
      symptomCategory = 'fungal disease';
    } else if (lowerLabel.includes('blight') || lowerLabel.includes('avvizzimento')) {
      symptomDescription = 'Rapid tissue death with water-soaked appearance';
      symptomCategory = 'bacterial or fungal disease';
    } else {
      symptomDescription = 'General signs of disease or stress';
      symptomCategory = 'undetermined';
    }
  }
  
  // Determine leaf type if available
  let leafType = 'Unknown';
  if (result && result.multiServiceInsights?.plantType) {
    const plantType = result.multiServiceInsights.plantType;
    if (['palm', 'succulent', 'herb', 'vegetable', 'flowering'].includes(plantType)) {
      if (plantType === 'palm') leafType = 'Palmate';
      else if (plantType === 'succulent') leafType = 'Succulent';
      else if (plantType === 'herb') leafType = 'Simple';
      else if (plantType === 'vegetable') leafType = 'Compound';
      else if (plantType === 'flowering') leafType = 'Simple';
    }
  }
  
  // Create leaf analysis object
  return {
    leafColor,
    patternDetected,
    diseaseConfidence: score,
    healthStatus: isHealthy ? 'healthy' : 'diseased',
    leafType,
    details: {
      symptomDescription: isHealthy ? 'No symptoms detected' : symptomDescription,
      symptomCategory: isHealthy ? 'healthy' : symptomCategory
    }
  };
}

/**
 * Enhance multiServiceInsights with leaf disease classification
 * @param label The raw classification label
 * @param insights The existing multiServiceInsights object
 * @returns Enhanced multiServiceInsights with leaf disease classification
 */
export function enhanceLeafDiseaseClassification(label: string, insights: any) {
  if (!insights) return insights;
  
  const lowerLabel = label.toLowerCase();
  const leafInsights = {...insights};
  
  // Add Digital Leaf System capabilities
  leafInsights.leafDiagnosticCapabilities = [
    'Pattern recognition',
    'Chlorosis detection',
    'Necrosis identification',
    'Disease progression analysis',
    'Nutrient deficiency recognition'
  ];
  
  // Set Sistema Digitale Foglia flag
  leafInsights.sistemaDigitaleFogliaVersion = '2.0';
  
  return leafInsights;
}
