
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface EppoPest {
  eppoCode: string;
  preferredName: string;
  otherNames?: string[];
  category?: string;
  taxonomy?: {
    kingdom?: string;
    phylum?: string;
    class?: string;
    order?: string;
    family?: string;
    genus?: string;
  };
  hosts?: string[];
  regulatoryStatus?: string[];
  images?: string[];
}

export interface EppoPlant {
  eppoCode: string;
  preferredName: string;
  scientificName?: string;
  otherNames?: string[];
  taxonomy?: {
    kingdom?: string;
    family?: string;
    genus?: string;
  };
  images?: string[];
}

export interface EppoDiseases {
  eppoCode: string;
  preferredName: string;
  scientificName?: string;
  causalAgents?: string[];
  hosts?: string[];
  symptoms?: string[];
  regulatoryStatus?: string[];
  images?: string[];
}

/**
 * Service for interacting with the EPPO Global Database API
 */
export const eppoApiService = {
  /**
   * Search for pests in the EPPO database
   * @param searchTerm The term to search for
   * @returns Promise with search results
   */
  async searchPests(searchTerm: string): Promise<EppoPest[]> {
    try {
      const { data, error } = await supabase.functions.invoke('eppo-api', {
        body: {
          searchTerm,
          searchType: 'pests'
        }
      });

      if (error) {
        console.error('EPPO API search error:', error);
        return [];
      }

      if (!data?.data || !Array.isArray(data.data)) {
        return [];
      }

      return data.data.map((item: any) => ({
        eppoCode: item.codeid || item.eppocode,
        preferredName: item.fullname || item.prefname,
        otherNames: [],
        category: 'pest'
      }));
    } catch (err) {
      console.error('EPPO API connection error:', err);
      return [];
    }
  },


  /**
   * Search for plants in the EPPO database
   * @param searchTerm The term to search for
   * @returns Promise with search results
   */
  async searchPlants(searchTerm: string): Promise<EppoPlant[]> {
    try {
      const { data, error } = await supabase.functions.invoke('eppo-api', {
        body: {
          searchTerm,
          searchType: 'plants'
        }
      });

      if (error) {
        console.error('EPPO API plant search error:', error);
        return [];
      }

      if (!data?.data || !Array.isArray(data.data)) {
        return [];
      }

      return data.data.map((item: any) => ({
        eppoCode: item.codeid || item.eppocode,
        preferredName: item.fullname || item.prefname,
        scientificName: item.fullname || item.prefname,
        otherNames: []
      }));
    } catch (err) {
      console.error('EPPO API connection error:', err);
      return [];
    }
  },

  /**
   * Search for diseases in the EPPO database
   * @param searchTerm The term to search for
   * @returns Promise with search results
   */
  async searchDiseases(searchTerm: string): Promise<EppoDiseases[]> {
    try {
      const { data, error } = await supabase.functions.invoke('eppo-api', {
        body: {
          searchTerm,
          searchType: 'diseases'
        }
      });

      if (error) {
        console.error('EPPO API disease search error:', error);
        return [];
      }

      if (!data?.data || !Array.isArray(data.data)) {
        return [];
      }

      return data.data.map((item: any) => ({
        eppoCode: item.codeid || item.eppocode,
        preferredName: item.fullname || item.prefname,
        scientificName: item.fullname || item.prefname,
        causalAgents: [],
        regulatoryStatus: []
      }));
    } catch (err) {
      console.error('EPPO API connection error:', err);
      return [];
    }
  },

  /**
   * Enhanced search for plants with local and EPPO database combination
   * @param plantName The plant name to search for
   * @param scientificName Optional scientific name for more accurate search
   * @returns Promise with enhanced search results
   */
  async searchEnhancedPlants(plantName: string, scientificName?: string): Promise<{
    localMatch?: any;
    eppoMatches: EppoPlant[];
    suggestions: EppoPlant[];
  }> {
    try {
      const searchTerms = [plantName];
      if (scientificName && scientificName !== plantName) {
        searchTerms.push(scientificName);
      }

      // Search EPPO for all terms
      const allResults = await Promise.all(
        searchTerms.map(term => this.searchPlants(term))
      );

      const eppoMatches = allResults.flat();
      
      // Remove duplicates based on eppoCode
      const uniqueMatches = eppoMatches.filter((match, index, self) => 
        index === self.findIndex(m => m.eppoCode === match.eppoCode)
      );

      return {
        eppoMatches: uniqueMatches.slice(0, 5), // Top 5 matches
        suggestions: uniqueMatches.slice(5, 10) // Additional suggestions
      };
    } catch (err) {
      console.warn('Enhanced EPPO plant search error:', err);
      return { eppoMatches: [], suggestions: [] };
    }
  },

  /**
   * Search for pathogens (diseases/pests) associated with a plant
   * @param plantName The plant name to search for
   * @param scientificName Optional scientific name for better accuracy
   * @returns Promise with pathogen results
   */
  async searchPathogens(plantName: string, scientificName?: string): Promise<EppoDiseases[]> {
    try {
      const searchTerms = [plantName];
      if (scientificName && scientificName !== plantName) {
        searchTerms.push(scientificName);
      }

      // Search both diseases and pests for all terms
      const searchPromises = searchTerms.flatMap(term => [
        this.searchDiseases(term),
        this.searchPests(term)
      ]);

      const results = await Promise.all(searchPromises);
      const [diseases, pests] = [
        results.filter((_, i) => i % 2 === 0).flat(),
        results.filter((_, i) => i % 2 === 1).flat()
      ];

      // Convert pests to disease format for unified handling
      const pestsAsDiseases: EppoDiseases[] = pests.map(pest => ({
        eppoCode: pest.eppoCode,
        preferredName: pest.preferredName,
        scientificName: pest.preferredName,
        causalAgents: ['pest'],
        hosts: [plantName],
        symptoms: [],
        regulatoryStatus: pest.regulatoryStatus || []
      }));

      // Combine and remove duplicates
      const allPathogens = [...diseases, ...pestsAsDiseases];
      const uniquePathogens = allPathogens.filter((pathogen, index, self) => 
        index === self.findIndex(p => p.eppoCode === pathogen.eppoCode)
      );

      return uniquePathogens;
    } catch (err) {
      console.warn('EPPO API pathogen connection error:', err);
      return [];
    }
  }
};
