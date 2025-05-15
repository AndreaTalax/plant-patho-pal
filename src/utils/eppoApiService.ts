
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
   * Search for a pest or disease in the EPPO database
   * @param searchTerm The term to search for
   * @returns Promise with search results
   */
  async searchPests(searchTerm: string): Promise<EppoPest[]> {
    try {
      const { data, error } = await supabase.functions.invoke('eppo-api', {
        body: {
          endpoint: 'pests/search',
          query: `q=${encodeURIComponent(searchTerm)}`
        }
      });

      if (error) {
        toast.error(`Error searching EPPO database: ${error.message}`);
        console.error('EPPO API search error:', error);
        return [];
      }

      return data.map((pest: any) => ({
        eppoCode: pest.eppoCode,
        preferredName: pest.preferredName,
        otherNames: pest.otherNames || [],
        category: pest.category,
        regulatoryStatus: pest.regulatoryStatus || []
      }));
    } catch (err) {
      toast.error(`Error connecting to EPPO database: ${(err as Error).message}`);
      console.error('EPPO API connection error:', err);
      return [];
    }
  },

  /**
   * Get details for a specific pest by EPPO code
   * @param eppoCode The EPPO code of the pest
   * @returns Promise with pest details
   */
  async getPestDetails(eppoCode: string): Promise<EppoPest | null> {
    try {
      const { data, error } = await supabase.functions.invoke('eppo-api', {
        body: {
          endpoint: `pests/${eppoCode}`
        }
      });

      if (error) {
        toast.error(`Error getting pest details: ${error.message}`);
        console.error('EPPO API pest details error:', error);
        return null;
      }

      return {
        eppoCode: data.eppoCode,
        preferredName: data.preferredName,
        otherNames: data.otherNames || [],
        category: data.category,
        taxonomy: data.taxonomy || {},
        hosts: data.hosts || [],
        regulatoryStatus: data.regulatoryStatus || [],
        images: data.images || []
      };
    } catch (err) {
      toast.error(`Error connecting to EPPO database: ${(err as Error).message}`);
      console.error('EPPO API connection error:', err);
      return null;
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
          endpoint: 'plants/search',
          query: `q=${encodeURIComponent(searchTerm)}`
        }
      });

      if (error) {
        toast.error(`Error searching EPPO plant database: ${error.message}`);
        console.error('EPPO API plant search error:', error);
        return [];
      }

      return data.map((plant: any) => ({
        eppoCode: plant.eppoCode,
        preferredName: plant.preferredName,
        scientificName: plant.scientificName,
        otherNames: plant.otherNames || []
      }));
    } catch (err) {
      toast.error(`Error connecting to EPPO database: ${(err as Error).message}`);
      console.error('EPPO API connection error:', err);
      return [];
    }
  },

  /**
   * Get details for a specific plant by EPPO code
   * @param eppoCode The EPPO code of the plant
   * @returns Promise with plant details
   */
  async getPlantDetails(eppoCode: string): Promise<EppoPlant | null> {
    try {
      const { data, error } = await supabase.functions.invoke('eppo-api', {
        body: {
          endpoint: `plants/${eppoCode}`
        }
      });

      if (error) {
        toast.error(`Error getting plant details: ${error.message}`);
        console.error('EPPO API plant details error:', error);
        return null;
      }

      return {
        eppoCode: data.eppoCode,
        preferredName: data.preferredName,
        scientificName: data.scientificName,
        otherNames: data.otherNames || [],
        taxonomy: data.taxonomy || {},
        images: data.images || []
      };
    } catch (err) {
      toast.error(`Error connecting to EPPO database: ${(err as Error).message}`);
      console.error('EPPO API connection error:', err);
      return null;
    }
  },

  /**
   * Get diseases information from EPPO database
   * @param searchTerm The term to search for
   * @returns Promise with search results
   */
  async searchDiseases(searchTerm: string): Promise<EppoDiseases[]> {
    try {
      const { data, error } = await supabase.functions.invoke('eppo-api', {
        body: {
          endpoint: 'diseases/search',
          query: `q=${encodeURIComponent(searchTerm)}`
        }
      });

      if (error) {
        toast.error(`Error searching EPPO disease database: ${error.message}`);
        console.error('EPPO API disease search error:', error);
        return [];
      }

      return data.map((disease: any) => ({
        eppoCode: disease.eppoCode,
        preferredName: disease.preferredName,
        scientificName: disease.scientificName,
        causalAgents: disease.causalAgents || [],
        regulatoryStatus: disease.regulatoryStatus || []
      }));
    } catch (err) {
      toast.error(`Error connecting to EPPO database: ${(err as Error).message}`);
      console.error('EPPO API connection error:', err);
      return [];
    }
  },

  /**
   * Get details for a specific disease by EPPO code
   * @param eppoCode The EPPO code of the disease
   * @returns Promise with disease details
   */
  async getDiseaseDetails(eppoCode: string): Promise<EppoDiseases | null> {
    try {
      const { data, error } = await supabase.functions.invoke('eppo-api', {
        body: {
          endpoint: `diseases/${eppoCode}`
        }
      });

      if (error) {
        toast.error(`Error getting disease details: ${error.message}`);
        console.error('EPPO API disease details error:', error);
        return null;
      }

      return {
        eppoCode: data.eppoCode,
        preferredName: data.preferredName,
        scientificName: data.scientificName,
        causalAgents: data.causalAgents || [],
        hosts: data.hosts || [],
        symptoms: data.symptoms || [],
        regulatoryStatus: data.regulatoryStatus || [],
        images: data.images || []
      };
    } catch (err) {
      toast.error(`Error connecting to EPPO database: ${(err as Error).message}`);
      console.error('EPPO API connection error:', err);
      return null;
    }
  }
};
