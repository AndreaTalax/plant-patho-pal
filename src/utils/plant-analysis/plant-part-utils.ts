
/**
 * Try to identify the plant part from the classification label
 * @param label The classification label from the model
 * @returns The identified plant part or null if not identifiable
 */
export function getPlantPartFromLabel(label: string): string | null {
  const lowerLabel = label.toLowerCase();
  
  // Check for different plant parts in the label
  if (lowerLabel.includes('leaf') || lowerLabel.includes('foliage')) {
    return 'leaf';
  } else if (lowerLabel.includes('stem') || lowerLabel.includes('stalk')) {
    return 'stem';
  } else if (lowerLabel.includes('root') || lowerLabel.includes('tuber')) {
    return 'root';
  } else if (lowerLabel.includes('flower') || lowerLabel.includes('bloom')) {
    return 'flower';
  } else if (lowerLabel.includes('fruit')) {
    return 'fruit';
  } else if (lowerLabel.includes('seedling') || lowerLabel.includes('shoot')) {
    return 'shoot';
  } else if (lowerLabel.includes('branch') || lowerLabel.includes('twig')) {
    return 'branch';
  } else if (lowerLabel.includes('trunk') || lowerLabel.includes('bark')) {
    return 'trunk';
  } else if (lowerLabel.includes('collar') || lowerLabel.includes('crown')) {
    return 'collar region';
  }
  
  return null;
}

/**
 * Determines if a plant part is likely to show disease symptoms
 * @param plantPart The identified plant part
 * @returns A boolean indicating if this part commonly shows disease
 */
export function isDiseasePronePlantPart(plantPart: string | null): boolean {
  if (!plantPart) return false;
  
  // Parts that commonly show disease symptoms
  const diseaseProneParts = ['leaf', 'stem', 'fruit', 'flower', 'branch'];
  return diseaseProneParts.includes(plantPart);
}

/**
 * Simple utility function to capitalize the first letter of a string
 */
export function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}
