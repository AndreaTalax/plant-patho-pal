
/**
 * Provides a list of product codes based on plant name and health status.
 * @param {string} plantName - Name of the plant.
 * @param {boolean} isHealthy - Indicates if the plant is healthy.
 * @returns {string[]} Array of product codes tailored to the plant's needs.
 */
export const selectRelevantProducts = (plantName: string, isHealthy: boolean): string[] => {
  if (!plantName || typeof plantName !== 'string') {
    return ['1', '2']; // Default products
  }

  const plantLower = plantName.toLowerCase();

  if (!isHealthy) {
    // Disease treatment products
    if (plantLower.includes('funghi') || plantLower.includes('muffa') || plantLower.includes('fungus')) {
      return ['1', '3'];
    }
    if (plantLower.includes('insetti') || plantLower.includes('afidi') || plantLower.includes('pest')) {
      return ['4', '1'];
    }
    return ['1', '2'];
  } else {
    // Maintenance products for healthy plants
    if (plantLower.includes('indoor') || plantLower.includes('interno') || plantLower.includes('casa')) {
      return ['2', '5'];
    }
    return ['2', '1'];
  }
};
