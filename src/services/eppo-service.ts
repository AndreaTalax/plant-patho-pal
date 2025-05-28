// Interfacce per i tipi di risposta EPPO
export interface EPPOTaxon {
  eppocode: string;
  fullname: string;
  preferred: boolean;
  taxonomy: {
    kingdom?: string;
    phylum?: string;
    class?: string;
    order?: string;
    family?: string;
    genus?: string;
    species?: string;
  };
  status?: string;
}

export interface EPPOSearchResponse {
  data?: EPPOTaxon[];
  error?: string;
  status?: string;
}

export interface EPPOError {
  error: string;
  details?: string;
  timestamp?: string;
}

class EPPOService {
  private baseUrl: string;

  constructor() {
    // In produzione su Netlify userà /.netlify/functions/
    // In sviluppo locale puoi usare il proxy o configurare netlify dev
    this.baseUrl = process.env.NODE_ENV === 'development' 
      ? 'http://localhost:8888/.netlify/functions' 
      : '/.netlify/functions';
  }

  /**
   * Cerca taxa nell'EPPO database
   * @param query - Termine di ricerca (nome scientifico o comune)
   * @returns Promise con i risultati della ricerca
   */
  async searchTaxa(query: string): Promise<EPPOSearchResponse> {
    if (!query.trim()) {
      throw new Error('Query cannot be empty');
    }

    try {
      console.log(`Searching EPPO for: "${query}"`);
      
      const url = `${this.baseUrl}/eppo-search?q=${encodeURIComponent(query.trim())}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData: EPPOError = await response.json().catch(() => ({
          error: `HTTP ${response.status}: ${response.statusText}`
        }));
        
        throw new Error(errorData.error || `Request failed with status ${response.status}`);
      }

      const data: EPPOSearchResponse = await response.json();
      
      console.log(`EPPO search completed. Found ${data.data?.length || 0} results`);
      
      return data;
    } catch (error) {
      console.error('Error in EPPO search:', error);
      
      if (error instanceof Error) {
        throw error;
      }
      
      throw new Error('An unexpected error occurred while searching EPPO database');
    }
  }

  /**
   * Cerca specificamente piante nell'EPPO database
   * @param plantName - Nome della pianta
   * @returns Promise con i risultati filtrati per piante
   */
  async searchPlants(plantName: string): Promise<EPPOTaxon[]> {
    const response = await this.searchTaxa(plantName);
    
    if (response.error) {
      throw new Error(response.error);
    }

    // Filtra solo i risultati che sono piante (regno Plantae)
    return response.data?.filter(taxon => 
      taxon.taxonomy.kingdom?.toLowerCase() === 'plantae' ||
      taxon.taxonomy.kingdom?.toLowerCase() === 'plant'
    ) || [];
  }

  /**
   * Cerca specificamente patogeni nell'EPPO database
   * @param pathogenName - Nome del patogeno
   * @returns Promise con i risultati filtrati per patogeni
   */
  async searchPathogens(pathogenName: string): Promise<EPPOTaxon[]> {
    const response = await this.searchTaxa(pathogenName);
    
    if (response.error) {
      throw new Error(response.error);
    }

    // Filtra i risultati per fungi, bacteria, virus, etc.
    return response.data?.filter(taxon => {
      const kingdom = taxon.taxonomy.kingdom?.toLowerCase();
      const phylum = taxon.taxonomy.phylum?.toLowerCase();
      
      return kingdom === 'fungi' || 
             kingdom === 'bacteria' || 
             kingdom === 'virus' ||
             phylum?.includes('virus') ||
             phylum?.includes('bacteria') ||
             phylum?.includes('fungi');
    }) || [];
  }
}

// Esporta un'istanza singleton del servizio
export const eppoService = new EPPOService();
