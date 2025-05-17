
// Export all the utility functions from the modules
export { analyzePlantImage } from './api-service';
export { dataURLtoFile, preprocessImageForPlantDetection, validateImageForAnalysis, resizeImageForOptimalDetection } from './image-utils';
export { formatHuggingFaceResult } from './result-formatter';
export { getPlantPartFromLabel, capitalize } from './plant-part-utils';

// Export from the new modular files
export { isPlantHealthy } from './health-detection';
export { extractPlantName, detectPlantType } from './plant-name-extractor';
export { checkForEppoRelation } from './eppo-utils';
export { eppoSymptoms } from './eppo-symptoms';
