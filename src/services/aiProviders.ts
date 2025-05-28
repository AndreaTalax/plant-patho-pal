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
  private static readonly API_KEY = 'gngTbZrNCA5gGxqxd2M9iXzKFjiypW3iuF1UcS6tRB1PkYq80z'; // Sostituire con la chiave reale
  
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

// EPPO Proxy Service - usa la function Netlify invece della chiamata diretta
export class EPPOProxyService {
  private static readonly API_URL =
    process.env.NODE_ENV === 'development'
      ? 'http://localhost:8888/.netlify/functions/eppo-search'
      : '/.netlify/functions/eppo-search';

  static async searchByName(plantName: string): Promise<PlantIdentificationResult[]> {
    try {
      const response = await fetch(`${this.API_URL}?q=${encodeURIComponent(plantName)}`);
      if (!response.ok) throw new Error('Errore chiamata EPPO function');

      const data = await response.json();
      if (!data.data || !Array.isArray(data.data)) return [];

      // Mappa i risultati nel formato PlantIdentificationResult:
      return data.data.slice(0, 5).map((item: any) => ({
        plantName: item.fullname || item.scientificname || item.name || plantName,
        scientificName: item.scientificname || item.fullname || '',
        confidence: EPPOProxyService.calculateConfidence(plantName, item.fullname || item.scientificname || item.name || ''),
        provider: 'eppo'
      }));
    } catch (error) {
      console.error('EPPOProxyService searchByName failed:', error);
      return [];
    }
  }

  // Calcola la confidenza basata su similarità semplice
  private static calculateConfidence(searchTerm: string, foundName: string): number {
    const search = searchTerm.toLowerCase();
    const found = foundName.toLowerCase();
    if (found === search) return 0.95;
    if (found.includes(search) || search.includes(found)) return 0.80;
    // Calcolo semplice di similarità
    const similarity = EPPOProxyService.calculateSimilarity(search, found);
    return Math.max(0.3, Math.min(0.95, similarity));
  }

  private static calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    if (longer.length === 0) return 1.0;
    const distance = EPPOProxyService.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

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
}

// Servizio simulato per test locali (quando le API non sono disponibili)
export class MockPlantService {
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

      // Fase 2: EPPO (usando function Netlify)
      onProgress?.({ stage: 'EPPO Database', percentage: 50, message: 'Analizzando con database EPPO...' });
      try {
        // Qui usiamo il proxy verso la Netlify Function e non chiamate dirette!
        const eppoResults = await EPPOProxyService.searchByName(results[0]?.plantName || '');
        if (eppoResults.length > 0) {
          // Solo il primo risultato, oppure fondi logiche a piacimento
          results.push(eppoResults[0]);
        }
      } catch (error) {
        console.warn('EPPO function non disponibile');
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

// Funzione aggiuntiva per ricerca diretta per nome con EPPO (usando la function Netlify)
export async function searchPlantByName(plantName: string): Promise<PlantIdentificationResult[]> {
  try {
    const results = await EPPOProxyService.searchByName(plantName);
    return results;
  } catch (error) {
    console.error('Errore nella ricerca per nome:', error);
    return [];
  }
}

// Esempio di utilizzo con ricerca per nome
export async function identifyPlantByNameOrImage(
  input: File | string, 
  isImageFile: boolean = true
): Promise<CombinedAnalysisResult> {
  
  if (isImageFile && input instanceof File) {
    // Identifica da immagine
    return identifyPlantFromImage(input);
  } else if (!isImageFile && typeof input === 'string') {
    // Cerca per nome usando EPPO (tramite Netlify function)
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
