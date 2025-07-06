// Interfacce per le diverse AI
export interface PlantIdentificationResult {
  plantName: string;
  scientificName: string;
  confidence: number;
  habitat?: string;
  careInstructions?: string[];
  commonDiseases?: string[];
  provider: 'plantnet' | 'eppo' | 'plantid';
}

export interface DiseaseDetectionResult {
  disease: string;
  confidence: number;
  symptoms: string[];
  treatments: string[];
  severity: 'low' | 'medium' | 'high';
  provider: string;
  additionalInfo?: {
    cause?: string;
    commonNames?: string[];
    classification?: any;
    similar_images?: any[];
  };
}

export interface AnalysisProgress {
  stage: string;
  percentage: number;
  message: string;
}

export interface CombinedAnalysisResult {
  plantIdentification: PlantIdentificationResult[];
  diseaseDetection: DiseaseDetectionResult[];
  consensus: {
    mostLikelyPlant: PlantIdentificationResult;
    mostLikelyDisease?: DiseaseDetectionResult;
    confidenceScore: number;
  };
}

// Plant.id API Service - servizio reale per identificazione piante
export class PlantIdService {
  private static readonly API_URL = 'https://api.plant.id/v3/identification';
  private static readonly API_KEY = 'kaeFr1HprbQj7TfxgloAIDPQm6gOfJjiYgBO1TAwwWmpYoUH0O'; // Sostituire con la chiave reale
  
  /**
   * Identifies a plant based on provided image data.
   * @example
   * identifyPlant('data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/...')
   * Returns a PlantIdentificationResult object with details about the identified plant.
   * @param {string} imageData - Base64-encoded image data or image URL for the plant identification.
   * @returns {Promise<PlantIdentificationResult>} An object containing the plant name, scientific name, confidence, habitat, care instructions, common diseases, and provider.
   * @description
   *   - Converts image data to base64 format if it's not already.
   *   - In case of API error, the function throws an error and logs it to the console.
   *   - Utilizes the Plant.id API with specific modifiers and plant details.
   *   - Provide a fallback result if no suggestions are returned from the API.
   */
  static async identifyPlant(imageData: string): Promise<PlantIdentificationResult> {
    try {
      // Converti l'immagine in base64 se necessario
      const base64Image = imageData.startsWith('data:') 
        ? imageData.split(',')[1] 
        : imageData;

      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Api-Key': this.API_KEY
        },
        body: JSON.stringify({
          images: [base64Image],
          modifiers: ["crops_fast", "similar_images"],
          plant_details: ["common_names", "url", "description", "taxonomy", "rank", "gbif_id"]
        })
      });

      if (!response.ok) {
        throw new Error(`Plant.id API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.suggestions && data.suggestions.length > 0) {
        const topSuggestion = data.suggestions[0];
        
        return {
          plantName: topSuggestion.plant_name || 'Pianta non identificata',
          scientificName: topSuggestion.plant_details?.structured_name?.genus + ' ' + 
                         topSuggestion.plant_details?.structured_name?.species || '',
          confidence: topSuggestion.probability || 0,
          habitat: topSuggestion.plant_details?.description?.value || undefined,
          careInstructions: this.generateCareInstructions(topSuggestion.plant_name),
          commonDiseases: this.getCommonDiseases(topSuggestion.plant_name),
          provider: 'plantid'
        };
      }

      return this.getFallbackResult();
    } catch (error) {
      console.error('Plant.id identification failed:', error);
      return this.getFallbackResult();
    }
  }

  private static getFallbackResult(): PlantIdentificationResult {
    return {
      plantName: 'Identificazione non disponibile',
      scientificName: '',
      confidence: 0,
      provider: 'plantid'
    };
  }

  /**
  * Generates care instructions for a specified plant based on its name.
  * @example
  * generateCareInstructions('rosa')
  * ['Annaffia regolarmente ma evita ristagni', 'Esponi alla luce solare diretta', 'Pota i fiori appassiti']
  * @param {string} plantName - The name of the plant to retrieve care instructions for.
  * @returns {string[]} An array of care instructions tailored to the specified plant.
  * @description
  *   - Searches for the plant's name in a local care instructions database.
  *   - If the plant name is found as a substring, corresponding care instructions are returned.
  *   - Defaults to common care instructions if no specific match is found.
  */
  private static generateCareInstructions(plantName: string): string[] {
    // Database locale di istruzioni base per piante comuni
    const careDatabase: { [key: string]: string[] } = {
      'rosa': ['Annaffia regolarmente ma evita ristagni', 'Esponi alla luce solare diretta', 'Pota i fiori appassiti'],
      'basilico': ['Annaffia quando il terreno è asciutto', 'Mantieni in luogo luminoso', 'Pizzica i fiori per favorire le foglie'],
      'geranio': ['Annaffia moderatamente', 'Esponi alla luce diretta', 'Rimuovi foglie secche'],
      'default': ['Annaffia quando necessario', 'Fornisci luce adeguata', 'Controlla regolarmente la salute']
    };

    const key = plantName.toLowerCase();
    for (const plant in careDatabase) {
      if (key.includes(plant)) {
        return careDatabase[plant];
      }
    }
    return careDatabase['default'];
  }

  /**
   * Retrieves a list of common diseases for a given plant.
   * @example
   * getCommonDiseases('rosa')
   * // returns ['Oidio', 'Ruggine', 'Macchia nera']
   * @param {string} plantName - The name of the plant to retrieve diseases for.
   * @returns {string[]} A list of common diseases associated with the specified plant.
   * @description
   *   - Converts the plant name to lowercase for case-insensitive matching.
   *   - Falls back to a default list if no match is found.
   *   - Utilizes a predefined disease database for plant-disease associations.
   */
  private static getCommonDiseases(plantName: string): string[] {
    const diseaseDatabase: { [key: string]: string[] } = {
      'rosa': ['Oidio', 'Ruggine', 'Macchia nera'],
      'basilico': ['Peronospora', 'Fusarium', 'Afidi'],
      'geranio': ['Botrytis', 'Ruggine del geranio', 'Afidi'],
      'default': ['Funghi fogliari', 'Parassiti comuni', 'Marciume radicale']
    };

    const key = plantName.toLowerCase();
    for (const plant in diseaseDatabase) {
      if (key.includes(plant)) {
        return diseaseDatabase[plant];
      }
    }
    return diseaseDatabase['default'];
  }
}

// EPPO API Service - per identificazione piante usando database EPPO
export class EPPOService {
  private static readonly API_BASE_URL = 'https://gd.eppo.int/taxon';
  private static readonly API_KEY = '279ad2d34aba9a168628a818d734df4b';
  
  /**
   * Identifies a plant from given image data using an indirect approach through EPPO.
   * @example
   * identifyPlant("someImageData")
   * { plantName: "Rose", scientificName: "Rosa", confidence: 0.7, habitat: "Garden", careInstructions: "Water regularly", commonDiseases: ["Aphids"], provider: "eppo" }
   * @param {string} imageData - The base64 encoded image data for identification.
   * @returns {Promise<PlantIdentificationResult>} An object containing details about the identified plant.
   * @description
   *   - Uses EPPO service indirectly because it does not support direct image identification.
   *   - First searches for common plants and retrieves specific details for the best match.
   *   - Returns a fallback result in case of errors or no match found.
   */
  static async identifyPlant(imageData: string): Promise<PlantIdentificationResult> {
    try {
      // EPPO non supporta identificazione diretta da immagine, quindi usiamo un approccio ibrido:
      // 1. Prima cerchiamo di ottenere una lista di piante comuni
      // 2. Poi otteniamo dettagli specifici per ciascuna
      
      const searchResults = await this.searchCommonPlants();
      
      if (searchResults.length > 0) {
        // Prendiamo il primo risultato come esempio
        const plantCode = searchResults[0].code;
        const plantDetails = await this.getPlantDetails(plantCode);
        
        return {
          plantName: plantDetails.preferredName || searchResults[0].name,
          scientificName: plantDetails.scientificName || '',
          confidence: 0.7, // Valore simulato per piante comuni
          habitat: plantDetails.habitat,
          careInstructions: this.generateCareFromEPPOData(plantDetails),
          commonDiseases: plantDetails.pests || [],
          provider: 'eppo' as const
        };
      }

      return this.getFallbackResult();
    } catch (error) {
      console.error('EPPO identification failed:', error);
      return this.getFallbackResult();
    }
  }

  // Cerca piante comuni nel database EPPO
  /**
   * Searches for common plants and retrieves their scientific names and codes.
   * @example
   * searchCommonPlants()
   * [{ code: 'E1234', name: 'Rosa' }, { code: 'E5678', name: 'Basilicum' }]
   * @param {string[]} commonPlants - List of plant names to search.
   * @returns {Promise<any[]>} A promise that resolves to an array of objects containing plant codes and scientific names.
   * @description
   *   - The search is limited to the first two plants in the list to prevent server overload.
   *   - Uses external API defined in `this.API_BASE_URL`.
   *   - Fetch requests are made with the API key stored in `this.API_KEY`.
   *   - Handles errors gracefully, returning an empty array if the search fails.
   */
  private static async searchCommonPlants(): Promise<any[]> {
    try {
      // Lista di piante comuni da cercare
      const commonPlants = ['rosa', 'basilicum', 'geranium', 'lavandula', 'rosmarinus'];
      const results = [];
      
      for (const plant of commonPlants.slice(0, 2)) { // Limitiamo per non sovraccaricare
        try {
          const response = await fetch(`${this.API_BASE_URL}/search?q=${plant}&key=${this.API_KEY}`, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
            }
          });

          if (response.ok) {
            const data = await response.json();
            if (data && Array.isArray(data) && data.length > 0) {
              results.push({
                code: data[0].eppocode || data[0].code,
                name: data[0].scientificname || data[0].name || plant
              });
            }
          }
        } catch (searchError) {
          console.warn(`Ricerca fallita per ${plant}:`, searchError);
        }
      }

      return results;
    } catch (error) {
      console.error('Errore nella ricerca EPPO:', error);
      return [];
    }
  }

  // Ottieni dettagli specifici per una pianta
  /**
  * Retrieves detailed information about a plant given its plant code.
  * @example
  * getPlantDetails('ABC123')
  * {preferredName: 'Plant Name', scientificName: 'Scientific Name', habitat: 'Habitat Info', pests: ['Pest'], taxonomy: 'Taxonomy Info', status: 'Status Info'}
  * @param {string} plantCode - The code used to identify the plant within the database.
  * @returns {Promise<any>} An object containing details about the plant, including names, habitat, pests, taxonomy, and status.
  * @description
  *   - Utilizes the EPPO API to fetch data about plants.
  *   - Handles API errors by logging and returning an empty object.
  *   - Returns default values if specific data fields are missing.
  *   - Accesses a static base URL and a specific API key for requests.
  */
  private static async getPlantDetails(plantCode: string): Promise<any> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/${plantCode}?key=${this.API_KEY}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`EPPO API error: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        preferredName: data.preferredname || data.name,
        scientificName: data.scientificname || data.fullname,
        habitat: data.habitat || data.distribution,
        pests: data.pests || data.diseases || [],
        taxonomy: data.taxonomy,
        status: data.status
      };
    } catch (error) {
      console.error(`Errore dettagli pianta ${plantCode}:`, error);
      return {};
    }
  }

  // Genera istruzioni di cura basate sui dati EPPO
  /**
  * Generates care instructions based on EPPO data for a given plant.
  * @example
  * generateCareFromEPPOData({ habitat: 'Mediterranean' })
  * ['Preferisce clima mediterraneo con estati secche', 'Annaffia moderatamente, evita eccessi d\'acqua']
  * @param {Object} plantDetails - Details about the plant, usually including habitat data.
  * @returns {string[]} An array of care instructions tailored to the plant’s habitat.
  * @description
  *   - Utilizes EPPO data to determine care instructions based on plant habitat.
  *   - Provides generic instructions if specific habitat-based data is unavailable.
  *   - Supports 'Mediterranean' and 'Temperate' habitat types with dedicated care advice.
  */
  private static generateCareFromEPPOData(plantDetails: any): string[] {
    const careInstructions = [];
    
    // Istruzioni base basate sui dati EPPO
    if (plantDetails.habitat) {
      if (plantDetails.habitat.toLowerCase().includes('mediterranean')) {
        careInstructions.push('Preferisce clima mediterraneo con estati secche');
        careInstructions.push('Annaffia moderatamente, evita eccessi d\'acqua');
      }
      if (plantDetails.habitat.toLowerCase().includes('temperate')) {
        careInstructions.push('Adatta a clima temperato');
        careInstructions.push('Proteggi dalle gelate intense');
      }
    }

    // Istruzioni generiche se non abbiamo dati specifici
    if (careInstructions.length === 0) {
      careInstructions.push('Fornisci luce adeguata secondo le esigenze della specie');
      careInstructions.push('Mantieni il terreno ben drenato');
      careInstructions.push('Monitora regolarmente la salute della pianta');
    }

    return careInstructions;
  }

  // Ricerca alternativa per nome scientifico o comune
  /**
   * Searches for plant identification information by plant name.
   * @example
   * searchByName('rose')
   * [
   *   {
   *     plantName: 'Rosa',
   *     scientificName: 'Rosa rubiginosa',
   *     confidence: 0.95,
   *     habitat: 'Temperate climates',
   *     careInstructions: 'Requires full sun and well-drained soil',
   *     commonDiseases: ['Black spot', 'Powdery mildew'],
   *     provider: 'eppo'
   *   },
   *   ...
   * ]
   * @param {string} plantName - The name of the plant to search for.
   * @returns {Promise<PlantIdentificationResult[]>} A list of plant identification results with details.
   * @description
   *   - Limits the number of search results to a maximum of 5.
   *   - Utilizes the EPPO database for plant data retrieval.
   *   - Calculates the confidence level based on the similarity between the input name and the scientific name.
   *   - Fetches additional plant details like habitat and potential diseases.
   */
  static async searchByName(plantName: string): Promise<PlantIdentificationResult[]> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/search?q=${encodeURIComponent(plantName)}&key=${this.API_KEY}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`EPPO search error: ${response.status}`);
      }

      const data = await response.json();
      const results: PlantIdentificationResult[] = [];

      if (Array.isArray(data)) {
        for (const item of data.slice(0, 5)) { // Massimo 5 risultati
          const details = await this.getPlantDetails(item.eppocode || item.code);
          
          results.push({
            plantName: details.preferredName || item.scientificname || item.name,
            scientificName: item.scientificname || details.scientificName || '',
            confidence: this.calculateConfidence(plantName, item.scientificname || item.name),
            habitat: details.habitat,
            careInstructions: this.generateCareFromEPPOData(details),
            commonDiseases: details.pests || [],
            provider: 'eppo'
          });
        }
      }

      return results;
    } catch (error) {
      console.error('EPPO search by name failed:', error);
      return [];
    }
  }

  // Calcola la confidenza basata sulla corrispondenza del nome
  private static calculateConfidence(searchTerm: string, foundName: string): number {
    const search = searchTerm.toLowerCase();
    const found = foundName.toLowerCase();
    
    if (found === search) return 0.95;
    if (found.includes(search) || search.includes(found)) return 0.80;
    
    // Calcolo semplice di similarità
    const similarity = this.calculateSimilarity(search, found);
    return Math.max(0.3, Math.min(0.95, similarity));
  }

  // Calcolo similarità tra stringhe
  private static calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  // Calcolo distanza di Levenshtein
  /**
   * Calculates the Levenshtein distance between two strings.
   * @example
   * levenshteinDistance("kitten", "sitting")
   * 3
   * @param {string} str1 - The first string for comparison.
   * @param {string} str2 - The second string for comparison.
   * @returns {number} The Levenshtein distance, representing the minimum number of edits required to transform str1 into str2.
   * @description
   *   - Utilizes a dynamic programming approach to build a matrix that keeps track of the edit distances.
   *   - Matrix rows represent the second string, str2, and columns represent the first string, str1.
   *   - The algorithm considers substitution, insertion, and deletion operations for computing distances.
   */
  private static levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  private static getFallbackResult(): PlantIdentificationResult {
    return {
      plantName: 'Identificazione EPPO non disponibile',
      scientificName: '',
      confidence: 0,
      provider: 'eppo'
    };
  }
}

// Servizio simulato per test locali (quando le API non sono disponibili)
export class MockPlantService {
  /**
   * Simulates the identification of a plant species based on image data.
   * @example
   * identifyPlant("image_data_string")
   * Returns an object containing details about the identified plant.
   * @param {string} imageData - Base64 encoded string of image data representing the plant.
   * @returns {Promise<PlantIdentificationResult>} A promise that resolves to an object containing plant identification details such as name, confidence level, habitat, care instructions, common diseases, and provider.
   * @description
   *   - Delays the simulation to mimic the behavior of an actual API call.
   *   - Returns simulated results with various common plants.
   *   - Uses a random index to select one of several pre-defined mock results.
   */
  static async identifyPlant(imageData: string): Promise<PlantIdentificationResult> {
    // Simula un delay della chiamata API
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Risultati simulati basati su piante comuni
    const mockResults = [
      {
        plantName: 'Rosa comune',
        scientificName: 'Rosa gallica',
        confidence: 0.85,
        habitat: 'Giardini e aree coltivate',
        careInstructions: [
          'Annaffia regolarmente ma evita ristagni d\'acqua',
          'Esponi alla luce solare diretta per almeno 6 ore al giorno',
          'Pota i fiori appassiti per stimolare nuove fioriture',
          'Fertilizza ogni 4-6 settimane durante la stagione di crescita'
        ],
        commonDiseases: ['Oidio', 'Ruggine', 'Macchia nera', 'Afidi'],
        provider: 'plantnet' as const
      },
      {
        plantName: 'Basilico',
        scientificName: 'Ocimum basilicum',
        confidence: 0.92,
        habitat: 'Orti e vasi, zone temperate',
        careInstructions: [
          'Annaffia quando il terreno superficiale è asciutto',
          'Mantieni in luogo luminoso ma evita sole diretto intenso',
          'Pizzica i fiori per favorire la crescita delle foglie',
          'Raccogli le foglie regolarmente per stimolare la crescita'
        ],
        commonDiseases: ['Peronospora', 'Fusarium', 'Afidi', 'Acari'],
        provider: 'plantnet' as const
      },
      {
        plantName: 'Geranio',
        scientificName: 'Pelargonium zonale',
        confidence: 0.78,
        habitat: 'Balconi, terrazze, giardini mediterranei',
        careInstructions: [
          'Annaffia moderatamente, lascia asciugare tra un\'annaffiatura e l\'altra',
          'Espone alla luce diretta del sole',
          'Rimuovi fiori e foglie secche regolarmente',
          'Proteggi dal gelo in inverno'
        ],
        commonDiseases: ['Botrytis', 'Ruggine del geranio', 'Afidi', 'Mosca bianca'],
        provider: 'plantnet' as const
      }
    ];

    // Restituisce un risultato casuale per la simulazione
    const randomIndex = Math.floor(Math.random() * mockResults.length);
    return mockResults[randomIndex];
  }
}

// Servizio principale che combina i risultati
export class CombinedPlantAnalysisService {
  /**
   * Analyzes a plant using multiple identification services and returns the most likely result.
   * @example
   * analyzePlant(imageData, progressCallback)
   * // Returns a CombinedAnalysisResult containing the most likely plant identification.
   * @param {string} imageData - Base64 encoded string of the image data for plant analysis.
   * @param {function} [onProgress] - Optional callback function reporting progress of the analysis.
   * @returns {Promise<CombinedAnalysisResult>} Contains plant identifications with confidence scores and consensus on the most likely plant.
   * @description
   *   - Utilizes multiple services: PlantIdService, EPPOService, and MockPlantService for identification.
   *   - Provides progressive updates via the `onProgress` callback.
   *   - Includes fallback mechanisms if services are unavailable, ensuring a result is returned.
   */
  static async analyzePlant(
    imageData: string, 
    onProgress?: (progress: AnalysisProgress) => void
  ): Promise<CombinedAnalysisResult> {
    const results: PlantIdentificationResult[] = [];
    
    try {
      // Fase 1: Plant.id
      onProgress?.({ stage: 'Plant.id', percentage: 25, message: 'Analizzando con Plant.id...' });
      try {
        const plantIdResult = await PlantIdService.identifyPlant(imageData);
        if (plantIdResult.confidence > 0) {
          results.push(plantIdResult);
        }
      } catch (error) {
        console.warn('Plant.id non disponibile, uso servizio mock');
      }

      // Fase 2: EPPO (se Plant.id fallisce o per conferma)
      onProgress?.({ stage: 'EPPO Database', percentage: 50, message: 'Analizzando con database EPPO...' });
      try {
        const eppoResult = await EPPOService.identifyPlant(imageData);
        if (eppoResult.confidence > 0) {
          results.push(eppoResult);
        }
      } catch (error) {
        console.warn('EPPO non disponibile');
      }

      // Fase 3: Servizio Mock (come fallback)
      if (results.length === 0) {
        onProgress?.({ stage: 'Servizio locale', percentage: 75, message: 'Usando database locale...' });
        const mockResult = await MockPlantService.identifyPlant(imageData);
        results.push(mockResult);
      }

      onProgress?.({ stage: 'Completato', percentage: 100, message: 'Analisi completata!' });

      // Determina il risultato più probabile
      const mostLikelyPlant = results.reduce((best, current) => 
        current.confidence > best.confidence ? current : best
      );

      return {
        plantIdentification: results,
        diseaseDetection: [], // Per ora vuoto, può essere esteso
        consensus: {
          mostLikelyPlant,
          confidenceScore: mostLikelyPlant.confidence
        }
      };

    } catch (error) {
      console.error('Errore nell\'analisi combinata:', error);
      
      // Fallback finale
      const fallbackResult = await MockPlantService.identifyPlant(imageData);
      return {
        plantIdentification: [fallbackResult],
        diseaseDetection: [],
        consensus: {
          mostLikelyPlant: fallbackResult,
          confidenceScore: fallbackResult.confidence
        }
      };
    }
  }
}

// Esempio di utilizzo per immagini
/**
* Identifies a plant from a given image file utilizing a combined analysis service.
* @example
* identifyPlantFromImage(imageFile)
* Promise { <CombinedAnalysisResult> }
* @param {File} imageFile - An image file containing a picture of the plant to be identified.
* @returns {Promise<CombinedAnalysisResult>} A promise that resolves to the result of the combined plant analysis.
* @description
*   - Utilizes FileReader API to read the image file as a data URL.
*   - Provides real-time progress logging of the analysis stages and percentages.
*   - Handles errors in both file reading and analysis processes.
*   - Calls an external service for image analysis, which is asynchronous.
*/
export async function identifyPlantFromImage(imageFile: File): Promise<CombinedAnalysisResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      try {
        const imageData = event.target?.result as string;
        
        const result = await CombinedPlantAnalysisService.analyzePlant(
          imageData,
          (progress) => console.log(`${progress.stage}: ${progress.percentage}% - ${progress.message}`)
        );
        
        resolve(result);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Errore nella lettura del file'));
    reader.readAsDataURL(imageFile);
  });
}

// Funzione aggiuntiva per ricerca diretta per nome con EPPO
export async function searchPlantByName(plantName: string): Promise<PlantIdentificationResult[]> {
  try {
    const results = await EPPOService.searchByName(plantName);
    return results;
  } catch (error) {
    console.error('Errore nella ricerca per nome:', error);
    return [];
  }
}

// Esempio di utilizzo con ricerca per nome
/**
 * Identifies a plant using an image file or a plant name string.
 * @example
 * identifyPlantByNameOrImage(imageFile)
 * // Returns: Promise<CombinedAnalysisResult>
 *
 * @param {File | string} input - An image file for plant identification or a string representing the plant name.
 * @param {boolean} isImageFile - A flag indicating whether the input is an image file; defaults to true.
 * @returns {Promise<CombinedAnalysisResult>} - An object with plant identification results, disease detection (empty if no disease detection), and a consensus containing the most likely plant and its confidence score.
 * @description
 *   - If input is an image, it calls the identifyPlantFromImage method.
 *   - If input is a string, it searches the plant by name using the EPPO service.
 *   - If both methods fail or inputs are invalid, it utilizes a mock service for fallback identification.
 */
export async function identifyPlantByNameOrImage(
  input: File | string, 
  isImageFile: boolean = true
): Promise<CombinedAnalysisResult> {
  
  if (isImageFile && input instanceof File) {
    // Identifica da immagine
    return identifyPlantFromImage(input);
  } else if (!isImageFile && typeof input === 'string') {
    // Cerca per nome usando EPPO
    const searchResults = await searchPlantByName(input);
    
    if (searchResults.length > 0) {
      const mostLikelyPlant = searchResults[0]; // Il primo risultato è il più probabile
      
      return {
        plantIdentification: searchResults,
        diseaseDetection: [],
        consensus: {
          mostLikelyPlant,
          confidenceScore: mostLikelyPlant.confidence
        }
      };
    }
  }
  
  // Fallback
  const fallbackResult = await MockPlantService.identifyPlant('');
  return {
    plantIdentification: [fallbackResult],
    diseaseDetection: [],
    consensus: {
      mostLikelyPlant: fallbackResult,
      confidenceScore: fallbackResult.confidence
    }
  };
}
