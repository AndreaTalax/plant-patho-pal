
export interface EppoSearchResult {
  code?: string;
  name?: string;
  fullname?: string;
  scientificname?: string;
}

export class EppoService {
  static async identifyPlant(plantName: string): Promise<{ plant?: EppoSearchResult }> {
    // Mock implementation for now
    return {
      plant: {
        code: 'MOCK001',
        name: plantName,
        fullname: `${plantName} species`,
        scientificname: `${plantName} scientificus`
      }
    };
  }

  static async searchDiseasesBySymptoms(symptoms: string[]): Promise<EppoSearchResult[]> {
    // Mock implementation
    return symptoms.map((symptom, index) => ({
      code: `DISEASE_${index}`,
      name: `Disease related to ${symptom}`,
      fullname: `Full disease name for ${symptom}`
    }));
  }

  static async getPlantRecommendations(plantName: string): Promise<{
    diseases: EppoSearchResult[];
    pests: EppoSearchResult[];
    careAdvice: string[];
  }> {
    return {
      diseases: [],
      pests: [],
      careAdvice: [
        'Fornire luce adeguata',
        'Mantenere terreno ben drenato',
        'Controllare regolarmente per parassiti'
      ]
    };
  }
}
