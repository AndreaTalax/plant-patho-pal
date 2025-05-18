
// Re-export functions from other files for easier imports
export * from './api-service';
export * from './eppo-utils';
export * from './health-detection';
export * from './image-utils';
export * from './leaf-analysis';
export * from './plant-name-extractor';
export * from './plant-part-utils';
export * from './result-formatter';

// Utility function to format percentage values
export const formatPercentage = (value: number): string => {
  return `${Math.round(value * 100)}%`;
};
