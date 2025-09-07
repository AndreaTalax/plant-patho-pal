// Utility functions for converting between different PlantInfo types

import { PlantInfo as ContextPlantInfo } from '@/context/PlantInfoContext';
import { PlantInfo as DiagnoseTypeInfo } from '@/components/diagnose/types';

/**
 * Converts PlantInfo from context (with string[] symptoms) to diagnose types (with string symptoms)
 */
export function convertPlantInfoToString(plantInfo: ContextPlantInfo): any {
  return {
    ...plantInfo,
    symptoms: Array.isArray(plantInfo.symptoms) ? plantInfo.symptoms.join(', ') : (plantInfo.symptoms || '')
  };
}

/**
 * Converts PlantInfo from diagnose types (with string symptoms) to context (with string[] symptoms)
 */
export function convertPlantInfoToArray(plantInfo: DiagnoseTypeInfo): ContextPlantInfo {
  return {
    ...plantInfo,
    symptoms: typeof plantInfo.symptoms === 'string' ? (plantInfo.symptoms ? [plantInfo.symptoms] : []) : plantInfo.symptoms
  };
}

/**
 * Gets symptoms as a string regardless of input type
 */
export function getSymptomsAsString(symptoms: string | string[]): string {
  return Array.isArray(symptoms) ? symptoms.join(', ') : symptoms;
}

/**
 * Gets symptoms as an array regardless of input type
 */
export function getSymptomsAsArray(symptoms: string | string[]): string[] {
  return Array.isArray(symptoms) ? symptoms : (symptoms ? [symptoms] : []);
}