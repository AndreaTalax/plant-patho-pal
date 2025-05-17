
/**
 * Determines if the plant appears healthy based on the label
 * @param label The classification label from the model
 * @returns True if the plant appears healthy, false otherwise
 */
export function isPlantHealthy(label: string): boolean {
  if (!label) return true; // Default to healthy if no label
  
  const labelLower = label.toLowerCase();
  
  // Words indicating disease or problems
  const unhealthyTerms = [
    'disease', 'infected', 'spot', 'blight', 'rot', 'rust', 'mildew', 
    'virus', 'bacteria', 'pest', 'damage', 'wilting', 'unhealthy', 
    'deficiency', 'burned', 'chlorosis', 'necrosis', 'dying'
  ];
  
  // Check if any unhealthy term is in the label
  for (const term of unhealthyTerms) {
    if (labelLower.includes(term)) {
      return false;
    }
  }
  
  // Check for explicit health indication
  if (labelLower.includes('healthy') || labelLower.includes('normal')) {
    return true;
  }
  
  // Default to healthy if no unhealthy indicators found
  return true;
}
