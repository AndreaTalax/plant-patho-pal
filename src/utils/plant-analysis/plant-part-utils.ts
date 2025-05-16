
/**
 * Utility functions to identify plant parts and standardize terminology
 */

// Function to get a standardized plant part from a label
export const getPlantPartFromLabel = (label: string): string | null => {
  label = label.toLowerCase();
  
  // Map of plant part keywords to standardized terms
  const plantPartMap: Record<string, string> = {
    'leaf': 'leaf',
    'leaves': 'leaf',
    'foliage': 'leaf',
    'stem': 'stem',
    'stalk': 'stem',
    'trunk': 'stem',
    'branch': 'branch',
    'twig': 'branch',
    'flower': 'flower',
    'bloom': 'flower',
    'blossom': 'flower',
    'inflorescence': 'flower',
    'fruit': 'fruit',
    'berry': 'fruit',
    'root': 'root',
    'bulb': 'root',
    'tuber': 'root',
    'seed': 'seed',
    'pod': 'seed',
    'whole': 'whole plant',
    'full': 'whole plant',
    'entire': 'whole plant',
    'potted': 'whole plant',
    'indoor': 'whole plant',
    'house': 'whole plant'
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
  return str
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Function to check if a label refers to a plant
export const isPlantLabel = (label: string): boolean => {
  const plantKeywords = [
    'plant', 'flower', 'tree', 'shrub', 'herb', 'bush', 'foliage',
    'leaf', 'leaves', 'stem', 'branch', 'root', 'potted', 'indoor plant',
    'garden', 'botanical', 'pot plant', 'houseplant', 'flora',
    'vegetation', 'greenery', 'grass', 'fern', 'succulent', 'cactus',
    'ivy', 'vine', 'orchid', 'palm', 'rose', 'tulip', 'lily', 'daisy',
    'green', 'grow', 'monstera', 'philodendron', 'pothos', 'aloe',
    'spider plant', 'snake plant', 'ficus', 'jade', 'bamboo',
    'bonsai', 'planter', 'flowerpot', 'vase', 'flowerpot'
  ];
  
  const labelLower = label.toLowerCase();
  return plantKeywords.some(keyword => labelLower.includes(keyword));
};
