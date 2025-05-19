
/**
 * Utilities for plant part identification
 */

/**
 * Try to identify the plant part from the classification label
 * @param label The classification label from the model
 * @returns The identified plant part or null if not identifiable
 */
export function getPlantPartFromLabel(label: string): string | null {
  if (!label) return null;
  
  const lowerLabel = label.toLowerCase();
  
  // Check for different plant parts in the label
  if (lowerLabel.includes('leaf') || lowerLabel.includes('foglia')) {
    return 'leaf';
  } else if (lowerLabel.includes('stem') || lowerLabel.includes('stalk') || lowerLabel.includes('stelo')) {
    return 'stem';
  } else if (lowerLabel.includes('root') || lowerLabel.includes('tuber') || lowerLabel.includes('radice')) {
    return 'root';
  } else if (lowerLabel.includes('flower') || lowerLabel.includes('bloom') || lowerLabel.includes('fiore')) {
    return 'flower';
  } else if (lowerLabel.includes('fruit') || lowerLabel.includes('frutto')) {
    return 'fruit';
  } else if (lowerLabel.includes('seedling') || lowerLabel.includes('shoot') || lowerLabel.includes('germoglio')) {
    return 'shoot';
  } else if (lowerLabel.includes('branch') || lowerLabel.includes('twig') || lowerLabel.includes('ramo')) {
    return 'branch';
  } else if (lowerLabel.includes('trunk') || lowerLabel.includes('bark') || lowerLabel.includes('tronco')) {
    return 'trunk';
  } else if (lowerLabel.includes('collar') || lowerLabel.includes('crown') || lowerLabel.includes('colletto')) {
    return 'collar region';
  }
  
  return null;
}

/**
 * Simple utility function to capitalize the first letter of a string
 */
export function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Check if a label appears to be a plant identification
 */
export function isPlantLabel(label: string): boolean {
  if (!label) return false;
  
  const lowerLabel = label.toLowerCase();
  const plantIndicators = ['plant', 'tree', 'shrub', 'herb', 'flower', 'pianta', 'albero', 'arbusto', 'erba', 'fiore'];
  
  return plantIndicators.some(indicator => lowerLabel.includes(indicator)) &&
         !lowerLabel.includes('disease') && 
         !lowerLabel.includes('mildew') &&
         !lowerLabel.includes('blight') &&
         !lowerLabel.includes('spot');
}
