
/**
 * Check if a plant appears healthy based on label
 * @param label The model classification label
 * @returns boolean indicating if the plant is healthy
 */
export function isPlantHealthy(label: string): boolean {
  if (!label) return false;
  
  const lowerLabel = label.toLowerCase();
  
  // Check for health indicators in multiple languages
  const healthyIndicators = [
    'healthy', 'normal', 'good', 'sano', 'normale', 'buono', 'salutare',
    'no disease', 'no pest', 'nessuna malattia', 'nessun parassita'
  ];
  
  // Check for disease indicators in multiple languages
  const diseaseIndicators = [
    'disease', 'infection', 'pest', 'malattia', 'infezione', 'parassita',
    'blight', 'mildew', 'spot', 'rot', 'rust', 'mold', 'virus', 
    'fungus', 'bacteria', 'damaged', 'dying', 'dead',
    'muffa', 'ruggine', 'marciume', 'danneggiat', 'morente', 'morto'
  ];
  
  // If we have explicit health indicators, trust those
  const hasHealthIndicator = healthyIndicators.some(indicator => lowerLabel.includes(indicator));
  const hasDiseaseIndicator = diseaseIndicators.some(indicator => lowerLabel.includes(indicator));
  
  if (hasHealthIndicator && !hasDiseaseIndicator) {
    return true;
  }
  
  if (hasDiseaseIndicator) {
    return false;
  }
  
  // Default to assuming not healthy if we can't determine (safer option)
  return false;
}
