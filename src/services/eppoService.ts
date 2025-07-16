import { supabase } from '@/integrations/supabase/client';

export interface EppoSearchResult {
  code?: string;
  name?: string;
  fullname?: string;
  scientificname?: string;
}

export interface EppoTaxonDetails {
  code: string;
  name: string;
  fullname: string;
  scientificname?: string;
  taxonomy?: any;
  hosts?: any[];
  distribution?: any;
  nomenclature?: any;
  notes?: string;
  status?: string;
}

export class EppoService {
  
  /**
   * Search for plants, pests, and diseases in EPPO database
   */
  static async searchEppo(plantName: string): Promise<{
    plants: EppoSearchResult[];
    pests: EppoSearchResult[];
    diseases: EppoSearchResult[];
    searchTerm: string;
    source: string;
  }> {
    try {
      const { data, error } = await supabase.functions.invoke('eppo-search', {
        body: { plantName }
      });

      if (error) {
        console.error('❌ Error calling EPPO search function:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('❌ EPPO search failed:', error);
      // Return fallback data
      return {
        plants: [{
          code: 'LOCAL_001',
          name: plantName,
          fullname: `${plantName} (identificazione locale)`,
          scientificname: plantName
        }],
        pests: [],
        diseases: [],
        searchTerm: plantName,
        source: 'fallback'
      };
    }
  }

  /**
   * Get detailed taxon information by EPPO code
   */
  static async getTaxonDetails(eppoCode: string): Promise<EppoTaxonDetails | null> {
    try {
      const { data, error } = await supabase.functions.invoke('eppo-search', {
        body: { 
          eppoCode,
          action: 'getTaxon'
        }
      });

      if (error) {
        console.error('❌ Error getting taxon details:', error);
        throw error;
      }

      return data.taxon;
    } catch (error) {
      console.error('❌ Failed to get taxon details:', error);
      return null;
    }
  }

  /**
   * Enhanced plant identification with detailed information
   */
  static async identifyPlant(plantName: string): Promise<{ 
    plant?: EppoSearchResult; 
    details?: EppoTaxonDetails;
    diseases: EppoSearchResult[];
    pests: EppoSearchResult[];
  }> {
    try {
      // First search for the plant
      const searchResults = await this.searchEppo(plantName);
      
      let details = null;
      const primaryPlant = searchResults.plants[0];
      
      // If we found a plant with an EPPO code, get detailed information
      if (primaryPlant?.code && primaryPlant.code !== 'LOCAL_001') {
        details = await this.getTaxonDetails(primaryPlant.code);
      }

      return {
        plant: primaryPlant,
        details,
        diseases: searchResults.diseases,
        pests: searchResults.pests
      };
    } catch (error) {
      console.error('❌ Plant identification failed:', error);
      return {
        plant: {
          code: 'ERROR_001',
          name: plantName,
          fullname: `${plantName} (identificazione fallback)`,
          scientificname: plantName
        },
        diseases: [],
        pests: []
      };
    }
  }

  /**
   * Search for diseases and pests by symptoms
   */
  static async searchDiseasesBySymptoms(symptoms: string[]): Promise<{
    diseases: EppoSearchResult[];
    pests: EppoSearchResult[];
  }> {
    try {
      // Search using symptom keywords
      const symptomQuery = symptoms.join(' ');
      const searchResults = await this.searchEppo(symptomQuery);
      
      return {
        diseases: searchResults.diseases,
        pests: searchResults.pests
      };
    } catch (error) {
      console.error('❌ Disease search by symptoms failed:', error);
      return {
        diseases: [],
        pests: []
      };
    }
  }

  /**
   * Get comprehensive plant recommendations
   */
  static async getPlantRecommendations(plantName: string): Promise<{
    plant?: EppoSearchResult;
    details?: EppoTaxonDetails;
    diseases: EppoSearchResult[];
    pests: EppoSearchResult[];
    careAdvice: string[];
  }> {
    try {
      const identification = await this.identifyPlant(plantName);
      
      // Generate care advice based on the plant details
      const careAdvice = [
        'Fornire luce adeguata alla specie',
        'Mantenere terreno ben drenato',
        'Controllare regolarmente per parassiti',
        'Seguire le indicazioni specifiche per la specie'
      ];

      // Add specific advice based on EPPO data
      if (identification.details?.hosts?.length > 0) {
        careAdvice.push('Fare attenzione ai parassiti specifici della specie');
      }

      return {
        ...identification,
        careAdvice
      };
    } catch (error) {
      console.error('❌ Plant recommendations failed:', error);
      return {
        diseases: [],
        pests: [],
        careAdvice: [
          'Fornire cure generali per la pianta',
          'Monitorare salute generale',
          'Consultare un esperto se necessario'
        ]
      };
    }
  }
}
