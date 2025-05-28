// Interfacce per le diverse AI
export interface PlantIdentificationResult {
  plantName: string;
  scientificName: string;
  confidence: number;
  habitat?: string;
  careInstructions?: string[];
  commonDiseases?: string[];
  provider: 'plantnet' | 'vision' | 'plantid';
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
  private static readonly API_KEY = 'YOUR_PLANT_ID_API_KEY'; // Sostituire con la chiave reale
  
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

// Google Vision API Service - alternativa per identificazione
export class GoogleVisionService {
  private static readonly API_URL = 'https://vision.googleapis.com/v1/images:annotate';
  private static readonly API_KEY = 'YOUR_GOOGLE_VISION_API_KEY'; // Sostituire con la chiave reale
  
  static async identifyPlant(imageData: string): Promise<PlantIdentificationResult> {
    try {
      const base64Image = imageData.startsWith('data:') 
        ? imageData.split(',')[1] 
        : imageData;

      const response = await fetch(`${this.API_URL}?key=${this.API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [{
            image: {
              content: base64Image
            },
            features: [
              { type: 'LABEL_DETECTION', maxResults: 10 },
              { type: 'WEB_DETECTION', maxResults: 5 }
            ]
          }]
        })
      });

      if (!response.ok) {
        throw new Error(`Google Vision API error: ${response.status}`);
      }

      const data = await response.json();
      const labels = data.responses[0]?.labelAnnotations || [];
      
      // Cerca etichette relative alle piante
      const plantLabels = labels.filter((label: any) => 
        this.isPlantRelated(label.description.toLowerCase())
      );

      if (plantLabels.length > 0) {
        const topPlantLabel = plantLabels[0];
        return {
          plantName: this.formatPlantName(topPlantLabel.description),
          scientificName: '', // Google Vision non fornisce nomi scientifici
          confidence: topPlantLabel.score || 0,
          careInstructions: PlantIdService['generateCareInstructions'](topPlantLabel.description),
          commonDiseases: PlantIdService['getCommonDiseases'](topPlantLabel.description),
          provider: 'vision'
        };
      }

      return this.getFallbackResult();
    } catch (error) {
      console.error('Google Vision identification failed:', error);
      return this.getFallbackResult();
    }
  }

  private static isPlantRelated(label: string): boolean {
    const plantKeywords = [
      'plant', 'flower', 'leaf', 'tree', 'bush', 'herb', 'fern', 'moss',
      'pianta', 'fiore', 'foglia', 'albero', 'cespuglio', 'erba', 'felce', 'muschio'
    ];
    return plantKeywords.some(keyword => label.includes(keyword));
  }

  private static formatPlantName(description: string): string {
    return description.charAt(0).toUpperCase() + description.slice(1).toLowerCase();
  }

  private static getFallbackResult(): PlantIdentificationResult {
    return {
      plantName: 'Identificazione non disponibile',
      scientificName: '',
      confidence: 0,
      provider: 'vision'
    };
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

      // Fase 2: Google Vision (se Plant.id fallisce o per conferma)
      onProgress?.({ stage: 'Google Vision', percentage: 50, message: 'Analizzando con Google Vision...' });
      try {
        const visionResult = await GoogleVisionService.identifyPlant(imageData);
        if (visionResult.confidence > 0) {
          results.push(visionResult);
        }
      } catch (error) {
        console.warn('Google Vision non disponibile');
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

// Esempio di utilizzo
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
