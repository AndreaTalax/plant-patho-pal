
/**
 * Utility functions to identify plant parts and standardize terminology
 */

// Function to get a standardized plant part from a label
/**
* Standardizes plant part labels based on provided keywords.
* @example
* label('leaves') // 'leaf'
* label('stem') // 'stem'
* label('bark') // 'whole plant'
* @param {string} label - The plant part description provided as a string.
* @returns {string | null} Returns standardized plant part term or null if no label is provided.
* @description
*   - Converts input label to lowercase for case-insensitive matching.
*   - Maps various synonyms of plant parts to a single standardized term.
*   - Falls back to 'whole plant' when no specific part is identified.
*   - Returns null for empty or undefined label inputs.
*/
export const getPlantPartFromLabel = (label: string): string | null => {
  if (!label) return null;
  
  label = label.toLowerCase();
  
  // Enhanced map of plant part keywords to standardized terms
  const plantPartMap: Record<string, string> = {
    // Leaf related terms
    'leaf': 'leaf',
    'leaves': 'leaf',
    'foliage': 'leaf',
    'frond': 'leaf',
    'leaflet': 'leaf',
    
    // Stem related terms
    'stem': 'stem',
    'stalk': 'stem',
    'trunk': 'stem',
    'cane': 'stem',
    'shoot': 'stem',
    'petiole': 'stem',
    
    // Branch related terms
    'branch': 'branch',
    'twig': 'branch',
    'limb': 'branch',
    'bough': 'branch',
    
    // Flower related terms
    'flower': 'flower',
    'bloom': 'flower',
    'blossom': 'flower',
    'inflorescence': 'flower',
    'petal': 'flower',
    'floret': 'flower',
    
    // Fruit related terms
    'fruit': 'fruit',
    'berry': 'fruit',
    'pod': 'fruit',
    'tomato': 'fruit',
    'apple': 'fruit',
    'vegetable': 'fruit',
    
    // Root related terms
    'root': 'root',
    'bulb': 'root',
    'tuber': 'root',
    'rhizome': 'root',
    'corm': 'root',
    
    // Seed related terms
    'seed': 'seed',
    'grain': 'seed',
    'kernel': 'seed',
    'pit': 'seed',
    
    // Whole plant indicators
    'whole': 'whole plant',
    'full': 'whole plant',
    'entire': 'whole plant',
    'potted': 'whole plant',
    'indoor': 'whole plant',
    'house': 'whole plant',
    'plant': 'whole plant',
    'garden': 'whole plant',
    'pot': 'whole plant',
  };
  
  // Find the first matching part term in the label
  for (const [keyword, standardTerm] of Object.entries(plantPartMap)) {
    if (label.includes(keyword)) {
      return standardTerm;
    }
  }
  
  // Default to 'whole plant' if no specific part is identified
  // This helps when the image is recognized as a plant but no specific part is mentioned
  return 'whole plant';
};

// Function to capitalize the first letter of each word in a string
export const capitalize = (str: string): string => {
  if (!str) return '';
  
  return str
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

// Function to check if a label refers to a plant with expanded keyword list
/**
 * Determines if a given label is related to plants based on a set of predefined keywords.
 * @example
 * isPlantLabel("Rose bush"); // returns true
 * isPlantLabel("Wooden table"); // returns false
 * @param {string} label - The label or name to be evaluated.
 * @returns {boolean} Returns true if the label contains plant-related keywords, otherwise false.
 * @description
 *   - Converts the label to lowercase to ensure case-insensitivity during keyword comparison.
 *   - Uses a predefined list of plant-related keywords to perform the check.
 *   - Keywords include names of common houseplants, garden plants, and general plant descriptors.
 *   - The function returns false immediately if the label is empty or not provided.
 */
export const isPlantLabel = (label: string): boolean => {
  if (!label) return false;
  
  const plantKeywords = [
    // Basic plant terms
    'plant', 'flower', 'tree', 'shrub', 'herb', 'bush', 'foliage',
    'leaf', 'leaves', 'stem', 'branch', 'root', 'potted', 'indoor plant',
    'garden', 'botanical', 'pot plant', 'houseplant', 'flora',
    'vegetation', 'greenery', 'grass', 'fern', 'succulent', 'cactus',
    'ivy', 'vine', 'orchid', 'palm', 'rose', 'tulip', 'lily', 'daisy',
    'green', 'grow', 'monstera', 'philodendron', 'pothos', 'aloe',
    'spider plant', 'snake plant', 'ficus', 'jade', 'bamboo',
    'bonsai', 'planter', 'flowerpot', 'vase',
    
    // Common houseplants
    'calathea', 'dracaena', 'zz plant', 'peace lily', 'sansevieria',
    'yucca', 'rubber plant', 'bromeliad', 'anthurium', 'prayer plant',
    'boston fern', 'chinese money plant', 'pilea', 'croton',
    'dieffenbachia', 'schefflera', 'areca palm', 'bird of paradise',
    
    // Garden plants
    'tomato', 'pepper', 'cucumber', 'lettuce', 'basil', 'mint',
    'rosemary', 'thyme', 'sage', 'parsley', 'cilantro', 'chives',
    'oregano', 'lavender', 'strawberry', 'raspberry', 'blueberry',
    'blackberry', 'grape', 'apple', 'pear', 'peach', 'plum', 'cherry',
    'corn', 'wheat', 'barley', 'oats', 'rice', 'potato', 'carrot',
    'onion', 'garlic', 'pumpkin', 'squash', 'zucchini', 'cabbage',
    'broccoli', 'cauliflower', 'spinach', 'kale', 'chard', 'sunflower',
    
    // May be misrecognized but still plants
    'pot', 'botanical', 'vegetable', 'herb garden', 'floral', 
    'seedling', 'sprout', 'foliage', 'leafy', 'woody'
  ];
  
  const labelLower = label.toLowerCase();
  return plantKeywords.some(keyword => labelLower.includes(keyword));
};

// Function to extract the most likely plant name from a label
/**
 * Finds and returns a capitalized common plant name from a given label if it exists.
 * @example
 * findPlantName("I have a Monstera plant")
 * Monstera
 * @param {string} label - The input text which may contain a plant name.
 * @returns {string | null} Capitalized plant name if found; otherwise, null.
 * @description
 *   - Converts the input label to lowercase to ensure case-insensitive matching.
 *   - Searches for occurrences of plant names within the provided label.
 *   - Capitalizes the matched plant name before returning.
 */
export const extractPlantName = (label: string): string | null => {
  if (!label) return null;
  
  const commonPlantNames = [
    'monstera', 'pothos', 'philodendron', 'snake plant', 'aloe',
    'ficus', 'jade', 'spider plant', 'zz plant', 'peace lily',
    'orchid', 'succulent', 'cactus', 'fern', 'palm', 'bamboo',
    'rose', 'tulip', 'lily', 'daisy', 'sunflower', 'tomato',
    'potato', 'pepper', 'cucumber', 'lettuce', 'basil', 'mint',
    'lavender', 'rosemary', 'thyme', 'dill', 'parsley', 'cilantro',
    'oregano', 'sage', 'chives', 'strawberry', 'raspberry', 'blueberry',
    'blackberry', 'grape', 'apple', 'pear', 'peach', 'plum', 'cherry'
  ];
  
  const labelLower = label.toLowerCase();
  
  for (const plantName of commonPlantNames) {
    if (labelLower.includes(plantName)) {
      return capitalize(plantName);
    }
  }
  
  return null;
};
