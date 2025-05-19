
import { plantSpeciesMap } from '@/data/plantDatabase';

/**
 * Extract plant name from label using fuzzy matching against plant database
 * @param label The raw label from the model
 * @param plantDatabase A map of plant IDs to scientific names
 * @returns The identified plant name or null
 */
export function extractPlantName(label: string, plantDatabase: Record<string, string>): string | null {
  if (!label) return null;
  
  const lowerLabel = label.toLowerCase();
  
  // First check if label directly contains a species name from our database
  const databaseEntries = Object.entries(plantDatabase);
  
  for (const [id, speciesName] of databaseEntries) {
    const scientificName = speciesName.toLowerCase();
    const commonName = id.toLowerCase().replace(/_/g, ' ');
    
    if (lowerLabel.includes(scientificName) || lowerLabel.includes(commonName)) {
      return speciesName;
    }
  }
  
  // Check for common plant names that might be in the label
  const commonPlantTypeIndicators = [
    'tomato', 'pomodoro',
    'apple', 'mela',
    'basil', 'basilico',
    'pepper', 'peperone',
    'rose', 'rosa',
    'citrus', 'agrume',
    'monstera',
    'pothos',
    'ficus',
    'olive', 'olivo',
    'grape', 'uva'
  ];
  
  for (const indicator of commonPlantTypeIndicators) {
    if (lowerLabel.includes(indicator)) {
      // Try to find matching plant in database
      const matchingPlant = databaseEntries.find(([id, name]) => 
        id.toLowerCase().includes(indicator) || name.toLowerCase().includes(indicator)
      );
      
      if (matchingPlant) {
        return matchingPlant[1]; // Return scientific name
      }
      
      // Return capitalized indicator as fallback
      return indicator.charAt(0).toUpperCase() + indicator.slice(1);
    }
  }
  
  return null;
}

/**
 * Detect the general plant type based on name
 * @param plantName The plant name
 * @returns The detected plant type or null
 */
export function detectPlantType(plantName: string | null): string | null {
  if (!plantName) return null;
  
  const lowerName = plantName.toLowerCase();
  
  // Plant type classification based on name patterns
  if (lowerName.includes('palm') || lowerName.includes('cocos') || lowerName.includes('palma')) {
    return 'palm';
  }
  
  if (lowerName.includes('cactus') || lowerName.includes('succulen') || lowerName.includes('aloe') || 
      lowerName.includes('echeveria') || lowerName.includes('grassa')) {
    return 'succulent';
  }
  
  if (lowerName.includes('monstera') || lowerName.includes('pothos') || 
      lowerName.includes('philodendron') || lowerName.includes('ficus') || 
      lowerName.includes('snake plant') || lowerName.includes('sansevieria')) {
    return 'houseplant';
  }
  
  if (lowerName.includes('tomato') || lowerName.includes('pomodoro') ||
      lowerName.includes('pepper') || lowerName.includes('peperone') ||
      lowerName.includes('cucumber') || lowerName.includes('cetriolo') ||
      lowerName.includes('lettuce') || lowerName.includes('lattuga') ||
      lowerName.includes('cabbage') || lowerName.includes('cavolo')) {
    return 'vegetable';
  }
  
  if (lowerName.includes('rose') || lowerName.includes('rosa') ||
      lowerName.includes('tulip') || lowerName.includes('tulipano') ||
      lowerName.includes('lily') || lowerName.includes('giglio') ||
      lowerName.includes('pansy') || lowerName.includes('viola')) {
    return 'flowering';
  }
  
  if (lowerName.includes('oak') || lowerName.includes('quercia') ||
      lowerName.includes('maple') || lowerName.includes('acero') ||
      lowerName.includes('pine') || lowerName.includes('pino') ||
      lowerName.includes('birch') || lowerName.includes('betulla')) {
    return 'tree';
  }
  
  if (lowerName.includes('basil') || lowerName.includes('basilico') ||
      lowerName.includes('mint') || lowerName.includes('menta') ||
      lowerName.includes('oregano') || lowerName.includes('rosemary') || 
      lowerName.includes('rosmarino') || lowerName.includes('thyme') || 
      lowerName.includes('timo')) {
    return 'herb';
  }
  
  return null;
}
