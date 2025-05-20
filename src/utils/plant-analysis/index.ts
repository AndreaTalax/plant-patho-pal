
// Re-export functions from other files for easier imports
export * from './api-service';
export * from './eppo-utils';
export * from './health-detection';
export * from './image-utils';
export * from './leaf-analysis';
// Explicitly re-export from plant-name-extractor to avoid ambiguity
export { detectPlantType } from './plant-name-extractor';
export * from './plant-part-utils';
export * from './result-formatter';
export * from './plant-id-service';

// Utility function to format percentage values
export const formatPercentage = (value: number): string => {
  return `${Math.round(value * 100)}%`;
};

// Expose the analyzePlantImage function directly from the api-service
export { analyzePlantImage } from './api-service';
export { dataURLtoFile } from './plantAnalysisUtils';
