/**
 * Servizio per ottenere la distribuzione geografica delle piante tramite GBIF API
 * GBIF (Global Biodiversity Information Facility) fornisce dati aperti sulla biodiversità
 */

export interface GBIFDistribution {
  country: string;
  countryCode: string;
  establishmentMeans?: string;
  occurrenceStatus?: string;
}

export interface GBIFSpeciesInfo {
  scientificName: string;
  commonName?: string;
  kingdom?: string;
  phylum?: string;
  class?: string;
  order?: string;
  family?: string;
  genus?: string;
  species?: string;
  speciesKey?: number;
  distribution: GBIFDistribution[];
  nativeCountries: string[];
  introducedCountries: string[];
  totalOccurrences: number;
}

export class GBIFService {
  
  /**
   * Cerca una specie per nome scientifico
   */
  static async searchSpecies(scientificName: string): Promise<GBIFSpeciesInfo | null> {
    try {
      console.log(`🌍 GBIF: Ricerca specie "${scientificName}"`);
      
      // Importa supabase client
      const { supabase } = await import('@/integrations/supabase/client');
      
      // Usa la edge function come proxy per evitare problemi CORS
      const { data: searchResponse, error: searchError } = await supabase.functions.invoke('gbif-proxy', {
        body: {
          action: 'searchSpecies',
          scientificName: scientificName
        }
      });
      
      if (searchError) {
        throw new Error(`GBIF search failed: ${searchError.message}`);
      }
      
      const searchData = searchResponse;
      
      if (!searchData.results || searchData.results.length === 0) {
        console.log(`⚠️ GBIF: Nessuna specie trovata per "${scientificName}"`);
        return null;
      }
      
      // Prendi il primo risultato più rilevante
      const species = searchData.results[0];
      const speciesKey = species.key;
      
      console.log(`✅ GBIF: Trovata specie ${species.scientificName} (key: ${speciesKey})`);
      
      // Ottieni la distribuzione geografica
      const distribution = await this.getSpeciesDistribution(speciesKey, species.scientificName || scientificName);
      
      return {
        scientificName: species.scientificName || scientificName,
        commonName: species.vernacularName,
        kingdom: species.kingdom,
        phylum: species.phylum,
        class: species.class,
        order: species.order,
        family: species.family,
        genus: species.genus,
        species: species.species,
        speciesKey: speciesKey,
        distribution: distribution.all,
        nativeCountries: distribution.native,
        introducedCountries: distribution.introduced,
        totalOccurrences: distribution.totalOccurrences
      };
      
    } catch (error) {
      console.error('GBIF species search error:', error);
      return null;
    }
  }
  
  /**
   * Ottiene la distribuzione geografica di una specie
   */
  private static async getSpeciesDistribution(speciesKey: number, scientificName?: string): Promise<{
    all: GBIFDistribution[];
    native: string[];
    introduced: string[];
    totalOccurrences: number;
  }> {
    try {
      console.log(`🗺️ GBIF: Ottengo distribuzione per specie ${speciesKey}`);
      
      // Importa supabase client
      const { supabase } = await import('@/integrations/supabase/client');
      
      // Usa la edge function come proxy
      const { data: distributionResponse, error: distributionError } = await supabase.functions.invoke('gbif-proxy', {
        body: {
          action: 'getDistribution',
          speciesKey: speciesKey,
          scientificName: scientificName
        }
      });
      
      if (distributionError) {
        throw new Error(`GBIF distribution search failed: ${distributionError.message}`);
      }
      
      const { occurrence: occurrenceData, distribution: distributionData } = distributionResponse;
      const countryFacets = occurrenceData.facets?.find((f: any) => f.field === 'COUNTRY')?.counts || [];
      const distributionDetails = distributionData?.results || [];
      
      const all: GBIFDistribution[] = [];
      const native: string[] = [];
      const introduced: string[] = [];
      
      // Usa il conteggio totale diretto dall'API GBIF se disponibile
      let totalOccurrences = occurrenceData.count || 0;
      
      // Processa i risultati delle occorrenze per paese
      for (const countryFacet of countryFacets.slice(0, 20)) { // Limita ai primi 20 paesi per performance
        const countryCode = countryFacet.name;
        const count = countryFacet.count;
        
        // Trova dettagli aggiuntivi sulla distribuzione se disponibili
        const distributionInfo = distributionDetails.find(d => 
          d.locationId === countryCode || 
          d.locality?.includes(countryCode)
        );
        
        const countryInfo = await this.getCountryName(countryCode);
        
        const distribution: GBIFDistribution = {
          country: countryInfo || countryCode,
          countryCode: countryCode,
          establishmentMeans: distributionInfo?.establishmentMeans,
          occurrenceStatus: distributionInfo?.occurrenceStatus
        };
        
        all.push(distribution);
        
        // Classifica come nativa o introdotta basandosi sui dati disponibili
        if (distributionInfo?.establishmentMeans === 'NATIVE') {
          native.push(countryInfo || countryCode);
        } else if (distributionInfo?.establishmentMeans === 'INTRODUCED') {
          introduced.push(countryInfo || countryCode);
        } else {
          // Se non ci sono informazioni specifiche, considera come distribuzione generale
          native.push(countryInfo || countryCode);
        }
      }
      
      console.log(`✅ GBIF: Distribuzione ottenuta - ${all.length} paesi, ${totalOccurrences} occorrenze totali`);
      
      // Se non abbiamo paesi ma abbiamo occorrenze, mostra almeno il numero
      if (all.length === 0 && totalOccurrences > 0) {
        console.log(`📊 GBIF: Nessun dettaglio per paese ma ${totalOccurrences} occorrenze trovate`);
      }
      
      return {
        all,
        native,
        introduced,
        totalOccurrences
      };
      
    } catch (error) {
      console.error('GBIF distribution error:', error);
      return {
        all: [],
        native: [],
        introduced: [],
        totalOccurrences: 0
      };
    }
  }
  
  /**
   * Converte codice paese ISO in nome paese
   */
  private static async getCountryName(countryCode: string): Promise<string> {
    // Mapping di base per i paesi più comuni
    const countryNames: { [key: string]: string } = {
      'IT': 'Italia',
      'FR': 'Francia',
      'ES': 'Spagna',
      'DE': 'Germania',
      'GB': 'Regno Unito',
      'US': 'Stati Uniti',
      'CA': 'Canada',
      'AU': 'Australia',
      'BR': 'Brasile',
      'IN': 'India',
      'CN': 'Cina',
      'JP': 'Giappone',
      'RU': 'Russia',
      'MX': 'Messico',
      'AR': 'Argentina',
      'CL': 'Cile',
      'PE': 'Perù',
      'CO': 'Colombia',
      'VE': 'Venezuela',
      'EC': 'Ecuador'
    };
    
    return countryNames[countryCode] || countryCode;
  }
  
  /**
   * Formatta la distribuzione in un testo leggibile
   */
  static formatDistributionText(gbifInfo: GBIFSpeciesInfo): string {
    if (!gbifInfo.distribution.length) {
      return 'Distribuzione geografica non disponibile';
    }
    
    const topCountries = gbifInfo.distribution.slice(0, 10).map(d => d.country);
    const additionalCount = gbifInfo.distribution.length - 10;
    
    let text = `Distribuita principalmente in: ${topCountries.join(', ')}`;
    
    if (additionalCount > 0) {
      text += ` e altri ${additionalCount} paesi`;
    }
    
    if (gbifInfo.totalOccurrences > 0) {
      text += `. Totale occorrenze registrate: ${gbifInfo.totalOccurrences.toLocaleString()}`;
    }
    
    return text;
  }
}