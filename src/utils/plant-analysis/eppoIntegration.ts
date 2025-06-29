
import { eppoApiService } from '@/utils/eppoApiService';

/**
 * Enhanced EPPO integration for plant diagnosis
 */
export interface EppoSearchResult {
  name: string;
  eppoCode: string;
  category: 'pest' | 'disease' | 'plant';
  description: string;
  symptoms?: string[];
  treatment?: string;
  probability: number;
  regulatoryStatus?: string[];
}

/**
 * Searches EPPO database for plant diseases and pests based on symptoms
 */
export const searchEppoDatabase = async (
  plantName: string,
  symptoms: string,
  plantInfo?: any
): Promise<EppoSearchResult[]> => {
  const results: EppoSearchResult[] = [];
  
  try {
    console.log('🔍 Searching EPPO database for:', { plantName, symptoms });
    
    // Extract keywords for search
    const searchTerms = extractSearchTerms(plantName, symptoms, plantInfo);
    
    // Search for diseases
    for (const term of searchTerms) {
      try {
        const diseases = await eppoApiService.searchDiseases(term);
        for (const disease of diseases) {
          const probability = calculateProbability(disease, symptoms, plantName);
          if (probability > 0.3) {
            results.push({
              name: disease.preferredName,
              eppoCode: disease.eppoCode,
              category: 'disease',
              description: disease.scientificName || disease.preferredName,
              symptoms: disease.symptoms || [],
              treatment: 'Consultare un fitopatologo per trattamento specifico',
              probability,
              regulatoryStatus: disease.regulatoryStatus
            });
          }
        }
      } catch (error) {
        console.warn(`EPPO disease search failed for term "${term}":`, error);
      }
    }
    
    // Search for pests
    for (const term of searchTerms) {
      try {
        const pests = await eppoApiService.searchPests(term);
        for (const pest of pests) {
          const probability = calculateProbability(pest, symptoms, plantName);
          if (probability > 0.3) {
            results.push({
              name: pest.preferredName,
              eppoCode: pest.eppoCode,
              category: 'pest',
              description: `Parassita: ${pest.preferredName}`,
              treatment: 'Trattamento antiparassitario specifico - consultare esperto',
              probability,
              regulatoryStatus: pest.regulatoryStatus
            });
          }
        }
      } catch (error) {
        console.warn(`EPPO pest search failed for term "${term}":`, error);
      }
    }
    
    // Sort by probability (highest first)
    results.sort((a, b) => b.probability - a.probability);
    
    console.log(`✅ EPPO search completed: ${results.length} results found`);
    return results.slice(0, 5); // Return top 5 results
    
  } catch (error) {
    console.error('❌ EPPO database search failed:', error);
    return [];
  }
};

/**
 * Extract search terms from plant name, symptoms, and plant info
 */
const extractSearchTerms = (plantName: string, symptoms: string, plantInfo?: any): string[] => {
  const terms = new Set<string>();
  
  // Add plant name if available
  if (plantName && plantName !== 'Sconosciuta' && plantName !== 'Pianta non identificata') {
    terms.add(plantName.toLowerCase());
  }
  
  // Extract symptom keywords
  const symptomKeywords = [
    'macchie', 'ingiallimento', 'appassimento', 'muffe', 'ruggine', 'oidio',
    'peronospora', 'antracnosi', 'marciume', 'necrosi', 'clorosi', 'defogliazione',
    'lesioni', 'pustole', 'cancro', 'batteriosi', 'virosi', 'nanismo',
    'deformazioni', 'disseccamento', 'avvizzimento'
  ];
  
  const symptomsLower = symptoms.toLowerCase();
  symptomKeywords.forEach(keyword => {
    if (symptomsLower.includes(keyword)) {
      terms.add(keyword);
    }
  });
  
  // Add plant environment context
  if (plantInfo?.isIndoor) {
    terms.add('indoor plants');
  } else {
    terms.add('outdoor plants');
  }
  
  // Add generic terms if no specific symptoms found
  if (terms.size === 0) {
    terms.add('plant diseases');
    terms.add('fungal diseases');
  }
  
  return Array.from(terms);
};

/**
 * Calculate probability based on symptom matching and context
 */
const calculateProbability = (
  eppoResult: any,
  symptoms: string,
  plantName: string
): number => {
  let probability = 0.4; // Base probability
  
  // Increase probability if names match
  if (plantName && eppoResult.preferredName?.toLowerCase().includes(plantName.toLowerCase())) {
    probability += 0.3;
  }
  
  // Increase probability based on symptom matching
  if (eppoResult.symptoms && Array.isArray(eppoResult.symptoms)) {
    const symptomsLower = symptoms.toLowerCase();
    const matchingSymptoms = eppoResult.symptoms.filter(symptom =>
      symptomsLower.includes(symptom.toLowerCase())
    );
    probability += (matchingSymptoms.length / eppoResult.symptoms.length) * 0.3;
  }
  
  // Increase probability if it's a regulated organism (likely important)
  if (eppoResult.regulatoryStatus && eppoResult.regulatoryStatus.length > 0) {
    probability += 0.1;
  }
  
  return Math.min(probability, 0.95); // Cap at 95%
};

/**
 * Format EPPO results for display
 */
export const formatEppoResults = (results: EppoSearchResult[]) => {
  return results.map(result => ({
    name: result.name,
    description: result.description,
    probability: result.probability,
    treatment: result.treatment || 'Consultare un esperto per trattamento specifico',
    isRegulated: (result.regulatoryStatus && result.regulatoryStatus.length > 0),
    category: result.category,
    eppoCode: result.eppoCode
  }));
};
