
/**
 * Utilities for working with the EPPO database and regulated pest/disease identification
 */
import { eppoSymptoms } from './eppo-symptoms';

/**
 * Checks if the analysis result might be related to an EPPO regulated pest or disease
 * @param label The classification label from the model
 * @returns Information about the EPPO relation if found, null otherwise
 */
export function checkForEppoRelation(
  label: string
): { term: string, category: 'pest' | 'disease' | 'plant' } | null {
  // Ensure label is lowercase for case-insensitive matching
  const labelLower = label.toLowerCase();

  // List of EPPO regulated pests
  const eppoPests = [
    'xylella', 'japanese beetle', 'emerald ash borer', 'box tree moth', 
    'red palm weevil', 'pine processionary', 'asian longhorn beetle', 
    'colorado beetle', 'coleottero', 'insetto'
  ];
  
  // List of EPPO regulated diseases
  const eppoDiseases = [
    'citrus greening', 'huanglongbing', 'citrus canker', 'fire blight', 
    'sudden oak death', 'dutch elm', 'ash dieback', 'plum pox', 'sharka',
    'bacterial wilt', 'ralstonia', 'potato ring rot', 'grapevine flavescence',
    'black sigatoka', 'tristeza', 'tomato brown', 'cancrena'
  ];
  
  // Check for pests
  for (const pest of eppoPests) {
    if (labelLower.includes(pest)) {
      return { term: pest, category: 'pest' };
    }
  }
  
  // Check for diseases
  for (const disease of eppoDiseases) {
    if (labelLower.includes(disease)) {
      return { term: disease, category: 'disease' };
    }
  }
  
  // Look for symptoms associated with EPPO diseases
  for (const [disease, symptoms] of Object.entries(eppoSymptoms)) {
    if (Array.isArray(symptoms)) {
      for (const symptom of symptoms) {
        if (labelLower.includes(symptom.toLowerCase())) {
          return { term: disease, category: 'disease' };
        }
      }
    }
  }
  
  return null;
}
