
import { capitalize } from './plant-part-utils';

/**
 * Enhanced plant name extraction utility
 * Attempts to identify plant names from various sources and formats
 * @param label The classification label from the model
 * @param plantSpeciesMap Map of known plant species
 * @returns The extracted plant name or null if not found
 */
export function extractPlantName(
  label: string, 
  plantSpeciesMap: Record<string, string> | null = null
): string | null {
  if (!label) return null;

  // Convert label to lowercase for case-insensitive matching
  const labelLower = label.toLowerCase();
  let plantName = null;
  
  // First check in the plantSpeciesMap if provided
  if (plantSpeciesMap) {
    for (const [key, value] of Object.entries(plantSpeciesMap)) {
      if (labelLower.includes(key)) {
        return typeof value === 'string' ? value : key;
      }
    }
  }
  
  // If no match in mapping, look for common plant keywords
  const plantLabels = [
    'tomato', 'potato', 'apple', 'corn', 'grape', 'strawberry',
    'pepper', 'lettuce', 'monstera', 'aloe', 'cactus', 'fern', 
    'ficus', 'jade', 'snake plant', 'rose', 'orchid', 'basil',
    'mint', 'rosemary', 'lavender', 'cannabis', 'hemp', 
    'sunflower', 'tulip', 'lily', 'bamboo', 'palm',
    // Italian plant names
    'pomodoro', 'patata', 'mela', 'mais', 'uva', 'fragola',
    'peperone', 'lattuga', 'felce', 'rosa', 'basilico',
    'menta', 'rosmarino', 'lavanda', 'girasole', 'tulipano',
    'giglio', 'bambù', 'palma', 'fico', 'orchidea'
  ];
  
  const matchedPlant = plantLabels.find(plant => labelLower.includes(plant));
  
  if (matchedPlant) {
    return capitalize(matchedPlant);
  }
  
  // If still no plant name found, try to extract from words in the label
  const possiblePlantWords = label.split(/[\s,_-]+/).filter(word => 
    word.length > 3 && !word.match(/disease|infected|spot|blight|rot|rust|mildew|virus/i)
  );
  
  if (possiblePlantWords.length > 0) {
    // Use the most likely word as plant name
    return capitalize(possiblePlantWords[0]);
  }
  
  return null;
}

/**
 * Determines the most likely plant type based on the plant name
 * @param plantName The name of the plant
 * @returns The detected plant type or null if not determinable
 */
export function detectPlantType(plantName: string | null): string | null {
  if (!plantName) return null;
  
  const nameLower = plantName.toLowerCase();
  
  // Map common plant names to their types
  if (['palm', 'palma'].some(term => nameLower.includes(term))) return 'palm';
  if (['cactus', 'succulent', 'aloe', 'jade'].some(term => nameLower.includes(term))) return 'succulent';
  if (['monstera', 'ficus', 'snake plant'].some(term => nameLower.includes(term))) return 'houseplant';
  if (['tomato', 'potato', 'pepper', 'corn', 'pomodoro', 'patata', 'peperone', 'mais'].some(term => nameLower.includes(term))) return 'vegetable';
  if (['rose', 'tulip', 'lily', 'orchid', 'rosa', 'tulipano', 'giglio', 'orchidea'].some(term => nameLower.includes(term))) return 'flowering';
  
  return null;
}
