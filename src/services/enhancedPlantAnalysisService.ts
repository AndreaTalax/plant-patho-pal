// Importa i servizi reali invece di quelli fittizi
import { PlantIdService, EPPOService, MockPlantService, CombinedPlantAnalysisService } from './aiProviders';
import type { 
  PlantIdentificationResult, 
  DiseaseDetectionResult, 
  AnalysisProgress, 
  CombinedAnalysisResult 
} from './aiProviders';

// Servizio per l'elaborazione delle immagini
export class ImageProcessingService {
  /**
   * Processes the input image data by resizing and compressing it.
   * @example
   * processImage('data:image/jpeg;base64,...')
   * Returns { processedImage: 'data:image/jpeg;base64,...', metadata: {...} }
   * @param {string} imageData - Base64 encoded image data to be processed.
   * @returns {Promise<{processedImage: string, metadata: any}>} Return processed image and metadata.
   * @description
   *   - Resizes the image to a maximum dimension of 1024x1024 while maintaining aspect ratio.
   *   - Compresses the image to JPEG format with a quality setting of 0.8.
   *   - Metadata includes original and processed dimensions and compression level.
   *   - Handles errors gracefully by returning the original image if processing fails.
   */
  static async processImage(imageData: string): Promise<{ processedImage: string; metadata: any }> {
    try {
      // Conversione e ottimizzazione dell'immagine
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      return new Promise((resolve) => {
        img.onload = () => {
          // Ridimensiona se necessario (max 1024x1024)
          const maxSize = 1024;
          let { width, height } = img;
          
          if (width > maxSize || height > maxSize) {
            if (width > height) {
              height = (height * maxSize) / width;
              width = maxSize;
            } else {
              width = (width * maxSize) / height;
              height = maxSize;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          ctx?.drawImage(img, 0, 0, width, height);
          
          const processedImage = canvas.toDataURL('image/jpeg', 0.8);
          
          resolve({
            processedImage,
            metadata: {
              originalSize: { width: img.naturalWidth, height: img.naturalHeight },
              processedSize: { width, height },
              compression: 0.8
            }
          });
        };
        
        img.src = imageData;
      });
    } catch (error) {
      console.error('Image processing failed:', error);
      return { processedImage: imageData, metadata: {} };
    }
  }
}

// Servizio per la cache (usando solo memoria, non localStorage)
export class CacheService {
  private static cache = new Map<string, any>();
  private static readonly CACHE_DURATION = 1000 * 60 * 30; // 30 minuti

  static generateImageHash(imageData: string): string {
    // Genera un hash semplice dell'immagine per la cache
    let hash = 0;
    const shortData = imageData.substring(0, Math.min(1000, imageData.length)); // Usa solo primi 1000 caratteri per performance
    for (let i = 0; i < shortData.length; i++) {
      const char = shortData.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Converte a 32bit integer
    }
    return hash.toString();
  }

  static async get<T>(key: string): Promise<T | null> {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }
    return null;
  }

  static set(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  static clear(): void {
    this.cache.clear();
  }
}

// Definisce il tipo per i pattern delle malattie
interface DiseasePattern {
  keywords: string[];
  diseases: DiseaseDetectionResult[];
}

// Modifica il servizio per il rilevamento malattie basato su AI locale/regole
export class LocalDiseaseDetectionService {
  private static readonly diseasePatterns: Record<string, DiseasePattern> = {
    fungalInfections: {
      keywords: ['macchie', 'spots', 'muffa', 'funghi', 'mold'],
      diseases: [
        {
          disease: 'Infezione fungina',
          confidence: 0.7,
          symptoms: ['Macchie scure su foglie', 'Crescita di muffa'],
          treatments: ['Fungicida', 'Migliorare ventilazione'],
          severity: 'medium',
          provider: 'pattern-matching'
        }
      ]
    },
    viralInfections: {
      keywords: ['ingiallimento', 'yellowing', 'mosaic', 'mosaico'],
      diseases: [
        {
          disease: 'Possibile infezione virale',
          confidence: 0.6,
          symptoms: ['Ingiallimento foglie', 'Pattern a mosaico'],
          treatments: ['Rimozione piante infette', 'Controllo vettori'],
          severity: 'high',
          provider: 'pattern-matching'
        }
      ]
    }
  };

  // NUOVO: Metodo principale che analizza l'immagine per sintomi visivi
  /**
  * Analyzes an image to detect plant diseases.
  * @example
  * analyzeImageForDiseases("base64ImageData", "rose", (stage, percentage, message) => console.log(stage, percentage, message))
  * Returns a promise resolving to an array of detected diseases.
  * @param {string} imageData - Base64 encoded image data representing the plant.
  * @param {string} plantName - Name of the plant species being analyzed.
  * @param {function} [onProgress] - Optional callback function to track the progress of the analysis.
  * @returns {Promise<DiseaseDetectionResult[]>} A promise that resolves to an array of disease detection results.
  * @description
  *   - Uses visual analysis to detect symptoms on the plant.
  *   - Integrates symptoms analysis with plant-specific disease knowledge.
  *   - Combines multiple disease detection techniques and deduplicates results.
  */
  static async analyzeImageForDiseases(
    imageData: string,
    plantName: string,
    onProgress?: (stage: string, percentage: number, message: string) => void
  ): Promise<DiseaseDetectionResult[]> {
    const updateProgress = (percentage: number, message: string) => {
      onProgress?.('disease-analysis', percentage, message);
    };

    updateProgress(10, 'Analisi immagine per sintomi...');
    
    // Simula analisi dell'immagine per rilevare sintomi visivi
    const visualSymptoms = await this.detectVisualSymptoms(imageData);
    
    updateProgress(40, 'Identificazione pattern malattie...');
    
    // Combina analisi visiva con conoscenza specifica della pianta
    const plantSpecificDiseases = await this.detectDisease(plantName, visualSymptoms);
    const patternBasedDiseases = this.analyzeSymptoms(visualSymptoms);
    
    updateProgress(80, 'Consolidamento risultati...');
    
    // Combina e deduplica i risultati
    const allDiseases = this.combineAndRankDiseases(plantSpecificDiseases, patternBasedDiseases);
    
    updateProgress(100, 'Analisi malattie completata');
    
    return allDiseases;
  }

  // NUOVO: Simula l'analisi dell'immagine per rilevare sintomi visivi
  /**
   * Detects visual symptoms in given plant image data and returns an array of symptoms.
   * @example
   * detectVisualSymptoms('base64ImageData')
   * ['ingiallimento foglie', 'bordi secchi']
   * @param {string} imageData - Base64 encoded string representing the image data of the plant.
   * @returns {Promise<string[]>} A promise that resolves to an array of detected symptom descriptions.
   * @description
   *   - Simulates the visual symptoms detection using random selection from predefined symptoms.
   *   - Introduces a simulated delay of 1200ms to mimic processing time.
   *   - Randomly selects 1 to 3 symptoms from a predefined list to simulate detection.
   */
  private static async detectVisualSymptoms(imageData: string): Promise<string[]> {
    // Simula il tempo di elaborazione
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    // In un'implementazione reale, qui useresti computer vision
    // Per ora, simula il rilevamento di sintomi comuni
    const possibleSymptoms = [
      'macchie marroni sulle foglie',
      'ingiallimento foglie',
      'bordi secchi',
      'macchie bianche polverose',
      'piccoli buchi nelle foglie',
      'foglie appassite',
      'crescita stentata',
      'decolorazione',
      'muffa grigia',
      'sostanze appiccicose'
    ];
    
    // Simula il rilevamento casuale di alcuni sintomi
    const detectedSymptoms: string[] = [];
    const numSymptoms = Math.floor(Math.random() * 3) + 1; // 1-3 sintomi
    
    for (let i = 0; i < numSymptoms; i++) {
      const randomSymptom = possibleSymptoms[Math.floor(Math.random() * possibleSymptoms.length)];
      if (!detectedSymptoms.includes(randomSymptom)) {
        detectedSymptoms.push(randomSymptom);
      }
    }
    
    return detectedSymptoms;
  }

  // NUOVO: Combina e classifica i risultati delle diverse analisi
  /**
   * Combines and ranks plant-specific and pattern-based diseases by confidence.
   * @example
   * combineAndRankDiseases(plantSpecificDiseases, patternBasedDiseases)
   * // Returns an array of the top 5 ranked diseases based on confidence
   * @param {DiseaseDetectionResult[]} plantSpecific - Array of diseases detected with plant-specific analysis.
   * @param {DiseaseDetectionResult[]} patternBased - Array of diseases detected with pattern-based analysis.
   * @returns {DiseaseDetectionResult[]} An array of the top 5 diseases sorted by confidence.
   * @description
   *   - Boosts the confidence of plant-specific diseases by a factor of 1.2.
   *   - Increases confidence for existing diseases in the map by 30% of the pattern-based confidence, capped at 0.95.
   *   - Merges unique symptoms from both analyses for the same disease.
   *   - Limits the results to the top 5 diseases sorted by confidence.
   */
  private static combineAndRankDiseases(
    plantSpecific: DiseaseDetectionResult[],
    patternBased: DiseaseDetectionResult[]
  ): DiseaseDetectionResult[] {
    const combinedMap = new Map<string, DiseaseDetectionResult>();
    
    // Aggiungi malattie specifiche della pianta
    plantSpecific.forEach(disease => {
      combinedMap.set(disease.disease, {
        ...disease,
        confidence: disease.confidence * 1.2 // Boost per specificità della pianta
      });
    });
    
    // Aggiungi o aggiorna con analisi basata su pattern
    patternBased.forEach(disease => {
      const existing = combinedMap.get(disease.disease);
      if (existing) {
        // Se già presente, aumenta la confidenza
        existing.confidence = Math.min(0.95, existing.confidence + disease.confidence * 0.3);
        existing.symptoms = [...new Set([...existing.symptoms, ...disease.symptoms])];
      } else {
        combinedMap.set(disease.disease, disease);
      }
    });
    
    // Converti in array e ordina per confidenza
    return Array.from(combinedMap.values())
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5); // Limita ai primi 5 risultati
  }

  // Mantieni il metodo esistente ma miglioralo
  /**
   * Detects plant diseases based on the plant name and optionally provided symptoms.
   * @example
   * detectDisease('basilico', ['Macchie gialle su foglie'])
   * // Returns an array of guesses for diseases, their confidence levels, symptoms, treatments, severity, and provider.
   * @param {string} plantName - The name of the plant to analyze for potential diseases.
   * @param {string[]} [symptoms] - An array of symptoms observed on the plant, used to refine disease detection confidence.
   * @returns {Promise<DiseaseDetectionResult[]>} A promise resolving to an array of disease detection results with adjusted confidence levels.
   * @description
   *   - The function queries an internal plant disease database to identify potential diseases.
   *   - It adjusts detection confidence based on symptom matching when symptoms are provided.
   *   - If no specific diseases are found, it provides general plant care recommendations.
   */
  static async detectDisease(
    plantName: string, 
    symptoms?: string[]
  ): Promise<DiseaseDetectionResult[]> {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const detectedDiseases: DiseaseDetectionResult[] = [];
    const lowerPlantName = plantName.toLowerCase();
    
    // Database malattie più esteso
    const plantDiseaseDatabase = {
      'rosa': [
        {
          disease: 'Macchia nera della rosa',
          confidence: 0.75,
          symptoms: ['Macchie nere circolari su foglie', 'Ingiallimento foglie', 'Caduta prematura'],
          treatments: ['Fungicida specifico per rose', 'Rimozione foglie colpite', 'Migliorare aerazione'],
          severity: 'medium' as const
        },
        {
          disease: 'Oidio delle rose',
          confidence: 0.70,
          symptoms: ['Macchie bianche polverose', 'Deformazione foglie', 'Crescita stentata'],
          treatments: ['Fungicida a base di zolfo', 'Migliorare circolazione aria', 'Evitare irrigazione fogliare'],
          severity: 'medium' as const
        }
      ],
      'basilico': [
        {
          disease: 'Peronospora del basilico',
          confidence: 0.70,
          symptoms: ['Macchie gialle su foglie', 'Muffa bianca sotto le foglie', 'Appassimento'],
          treatments: ['Fungicida biologico', 'Ridurre umidità', 'Spaziare le piante'],
          severity: 'high' as const
        },
        {
          disease: 'Fusariosi del basilico',
          confidence: 0.65,
          symptoms: ['Appassimento improvviso', 'Annerimento del fusto', 'Crescita stentata'],
          treatments: ['Rimozione piante colpite', 'Migliorare drenaggio', 'Rotazione colture'],
          severity: 'high' as const
        }
      ],
      'geranio': [
        {
          disease: 'Ruggine del geranio',
          confidence: 0.68,
          symptoms: ['Pustole arancioni sotto foglie', 'Macchie gialle sopra', 'Caduta foglie'],
          treatments: ['Fungicida a base di rame', 'Rimozione foglie colpite', 'Evitare bagnatura foglie'],
          severity: 'medium' as const
        }
      ],
      'pomodoro': [
        {
          disease: 'Peronospora del pomodoro',
          confidence: 0.80,
          symptoms: ['Macchie scure su foglie', 'Muffa bianca sotto foglie', 'Marciume frutti'],
          treatments: ['Fungicida preventivo', 'Migliorare aerazione', 'Evitare irrigazione fogliare'],
          severity: 'high' as const
        }
      ]
    };
    
    // Cerca malattie specifiche per tipo di pianta
    for (const [plant, diseases] of Object.entries(plantDiseaseDatabase)) {
      if (lowerPlantName.includes(plant)) {
        diseases.forEach(disease => {
          // Aumenta confidenza se i sintomi corrispondono
          let adjustedConfidence = disease.confidence;
          if (symptoms && symptoms.length > 0) {
            const symptomMatch = this.calculateSymptomMatchScore(symptoms, disease.symptoms);
            adjustedConfidence = Math.min(0.95, disease.confidence + symptomMatch * 0.2);
          }
          
          detectedDiseases.push({
            ...disease,
            confidence: adjustedConfidence,
            provider: 'plant-specific-db'
          });
        });
        break;
      }
    }
    
    // Se non trovate malattie specifiche, aggiungi controlli generici
    if (detectedDiseases.length === 0) {
      detectedDiseases.push({
        disease: 'Controllo preventivo generale',
        confidence: 0.4,
        symptoms: ['Nessun sintomo specifico rilevato'],
        treatments: [
          'Monitoraggio regolare della pianta',
          'Mantenere buona igiene del giardino',
          'Irrigazione corretta',
          'Fertilizzazione equilibrata'
        ],
        severity: 'low',
        provider: 'general-care'
      });
    }
    
    return detectedDiseases;
  }

  // NUOVO: Calcola corrispondenza tra sintomi osservati e sintomi noti
  /**
  * Calculates a match score between observed and known symptoms.
  * @example
  * calculateSymptomMatchScore(["headache", "nausea"], ["headache severe", "nausea mild"])
  * 0.75
  * @param {string[]} observedSymptoms - An array of observed symptoms from a patient.
  * @param {string[]} knownSymptoms - An array of known symptom patterns to compare against.
  * @returns {number} A score between 0 and 1 indicating the degree of match between the observed and known symptoms.
  * @description
  *   - The score accounts for partial word matches, considering words longer than 3 characters.
  *   - The function normalizes text to lowercase to ensure case-insensitive comparison.
  *   - The returned score is a minimum of 1, representing a perfect match, or less, denoting partial matches.
  */
  private static calculateSymptomMatchScore(observedSymptoms: string[], knownSymptoms: string[]): number {
    let matches = 0;
    const observedText = observedSymptoms.join(' ').toLowerCase();
    
    knownSymptoms.forEach(symptom => {
      const symptomWords = symptom.toLowerCase().split(' ');
      const matchingWords = symptomWords.filter(word => 
        word.length > 3 && observedText.includes(word)
      );
      matches += matchingWords.length / symptomWords.length;
    });
    
    return Math.min(1, matches / knownSymptoms.length);
  }

  // Migliora il metodo esistente analyzeSymptoms
  /**
   * Analyzes a list of symptoms to detect possible diseases with confidence ratings.
   * @example
   * analyzeSymptoms(['cough', 'fever'])
   * // Returns array of DiseaseDetectionResult objects sorted by confidence
   * @param {string[]} symptoms - List of symptoms to be analyzed.
   * @returns {DiseaseDetectionResult[]} Array of detected diseases with calculated confidence scores.
   * @description
   *   - Utilizes a pattern-matching algorithm to identify diseases.
   *   - A lower match threshold captures more potential cases of diseases.
   *   - Adjusts confidence scores based on symptom matching and predefined weights.
   *   - Results are sorted in descending order based on confidence scores for better prioritization.
   */
  static analyzeSymptoms(symptoms: string[]): DiseaseDetectionResult[] {
    const results: DiseaseDetectionResult[] = [];
    
    for (const [category, data] of Object.entries(this.diseasePatterns)) {
      const matchScore = this.calculateSymptomMatch(symptoms, data.keywords);
      
      if (matchScore > 0.2) { // Soglia più bassa per catturare più casi
        data.diseases.forEach(disease => {
          results.push({
            ...disease,
            confidence: Math.min(0.9, disease.confidence * matchScore * 1.5),
            provider: 'pattern-matching'
          });
        });
      }
    }
    
    return results.sort((a, b) => b.confidence - a.confidence);
  }
  
  /**
  * Calculates the match score between provided symptoms and predefined keywords.
  * @example
  * calculateSymptomMatch(['fever', 'headache'], ['headache', 'cough'])
  * 0.9
  * @param {string[]} symptoms - An array of symptoms as strings.
  * @param {string[]} keywords - An array of keywords to match against.
  * @returns {number} A number representing the match score, scaled between 0 and 1.
  * @description
  *   - Converts symptoms to a single lowercase string for keyword matching.
  *   - If the symptoms array is empty, returns a base match score of 0.1.
  *   - The match score is the proportion of keywords found in the symptoms, scaled by 1.8.
  */
  private static calculateSymptomMatch(symptoms: string[], keywords: string[]): number {
    if (!symptoms || symptoms.length === 0) return 0.1;
    
    let matches = 0;
    const symptomText = symptoms.join(' ').toLowerCase();
    
    keywords.forEach(keyword => {
      if (symptomText.includes(keyword)) {
        matches++;
      }
    });

    return Math.min(1, matches / keywords.length * 1.8);
  }
}

export class EnhancedPlantAnalysisService {
  /**
   * Analyzes an image to identify plants and detect diseases, providing progress updates.
   * @example
   * analyzeImage('base64ImageData', (progress) => console.log(progress))
   * Returns an object detailing plant identification and disease detection with a consensus.
   * @param {string} imageData - Base64-encoded string representing the image data to be analyzed.
   * @param {function} [onProgress] - Optional callback function to report progress updates. Receives an AnalysisProgress object.
   * @returns {Promise<CombinedAnalysisResult>} Resolves to a CombinedAnalysisResult object containing plant identification, disease detection, and consensus data.
   * @description
   *   - Utilizes image preprocessing before attempting plant identification and disease detection.
   *   - Caches results using a hash of the processed image to enhance performance on repeated analyses.
   *   - Provides a fallback mechanism using local services in case of errors during the enhanced analysis process.
   *   - The consensus calculation combines plant identification and disease detection results for a conclusive outcome.
   */
  static async analyzeImage(
    imageData: string,
    onProgress?: (progress: AnalysisProgress) => void
  ): Promise<CombinedAnalysisResult> {
    
    const updateProgress = (stage: string, percentage: number, message: string) => {
      onProgress?.({ stage, percentage, message });
    };

    try {
      // 1. Pre-elaborazione immagine
      updateProgress('preprocessing', 10, 'Elaborazione immagine...');
      const processedImage = await ImageProcessingService.processImage(imageData);
      
      // 2. Controllo cache
      updateProgress('cache-check', 20, 'Controllo cache...');
      const cacheKey = CacheService.generateImageHash(processedImage.processedImage);
      const cachedResult = await CacheService.get<CombinedAnalysisResult>(cacheKey);
      
      if (cachedResult) {
        updateProgress('cache-hit', 100, 'Risultato trovato in cache');
        return cachedResult;
      }
      
      // 3. Identificazione pianta
      updateProgress('plant-identification', 40, 'Identificazione pianta...');
      const plantResult = await CombinedPlantAnalysisService.analyzePlant(
        processedImage.processedImage,
        (progress) => updateProgress('plant-id', 40 + progress.percentage * 0.2, progress.message)
      );
      
      // 4. Rilevamento malattie CON L'IMMAGINE
      updateProgress('disease-detection', 60, 'Rilevamento malattie...');
      const diseaseResults = await this.performDiseaseDetection(
        plantResult.consensus.mostLikelyPlant,
        updateProgress,
        processedImage.processedImage
      );
      
      // 5. Calcolo consensus finale
      updateProgress('final-consensus', 90, 'Calcolo risultati finali...');
      const finalConsensus = this.calculateEnhancedConsensus(
        plantResult.plantIdentification,
        diseaseResults
      );
      
      const finalResult: CombinedAnalysisResult = {
        plantIdentification: plantResult.plantIdentification,
        diseaseDetection: diseaseResults,
        consensus: finalConsensus
      };
      
      // 6. Salva in cache
      CacheService.set(cacheKey, finalResult);
      
      updateProgress('complete', 100, 'Analisi completata con successo');
      return finalResult;
      
    } catch (error) {
      console.error('Enhanced analysis failed:', error);
      
      // Risultato di fallback migliorato
      const fallbackPlant = await MockPlantService.identifyPlant(imageData);
      const fallbackDiseases = await LocalDiseaseDetectionService.detectDisease(fallbackPlant.plantName);
      
      return {
        plantIdentification: [fallbackPlant],
        diseaseDetection: fallbackDiseases,
        consensus: {
          mostLikelyPlant: fallbackPlant,
          mostLikelyDisease: fallbackDiseases[0],
          confidenceScore: (fallbackPlant.confidence + (fallbackDiseases[0]?.confidence || 0)) / 2
        }
      };
    }
  }
  
  /**
  * Performs disease detection on a given plant image and updates progress.
  * @example
  * performDiseaseDetection(identifiedPlant, updateProgress, processedImageData)
  * Returns an array of sorted DiseaseDetectionResult objects.
  * @param {PlantIdentificationResult} identifiedPlant - The result containing identified plant details.
  * @param {function} updateProgress - Callback function to update the progress of the detection process with stage, percentage, and message.
  * @param {string} processedImageData - Base64 encoded image data to be analyzed.
  * @returns {Promise<DiseaseDetectionResult[]>} Returns a promise that resolves to an array of DiseaseDetectionResult objects sorted by confidence.
  * @description
  *   - The function utilizes LocalDiseaseDetectionService to analyze the processed image data.
  *   - Sorting of diseases is performed based on confidence level, in descending order.
  */
  private static async performDiseaseDetection(
    identifiedPlant: PlantIdentificationResult,
    updateProgress: (stage: string, percentage: number, message: string) => void,
    processedImageData: string
  ): Promise<DiseaseDetectionResult[]> {
    
    updateProgress('disease-analysis', 70, 'Analisi malattie per ' + identifiedPlant.plantName);
    
    // USA IL NUOVO METODO che analizza l'immagine
    const diseases = await LocalDiseaseDetectionService.analyzeImageForDiseases(
      processedImageData,
      identifiedPlant.plantName,
      updateProgress
    );
    
    return diseases.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Calculates an enhanced consensus from plant identifications and disease detections.
   * @example
   * calculateEnhancedConsensus(plantIdentifications, diseaseDetections)
   * {mostLikelyPlant: {...}, mostLikelyDisease: {...}, confidenceScore: 85.2}
   * @param {PlantIdentificationResult[]} identifications - Array of plant identification results with confidence values.
   * @param {DiseaseDetectionResult[]} diseases - Array of disease detection results with confidence values.
   * @returns {Object} An object containing the most likely plant identification, the most probable disease, and an improved confidence score.
   * @description
   *   - Uses a weighted confidence score giving more importance to plant identifications (70%).
   *   - Rounds the confidence score to two decimal places for precision.
   *   - Provides fallback for unavailable plant identifications with default values.
   */
  private static calculateEnhancedConsensus(
    identifications: PlantIdentificationResult[],
    diseases: DiseaseDetectionResult[]
  ) {
    // Trova l'identificazione con maggiore confidenza
    const mostLikelyPlant = identifications.reduce((best, current) => {
      return current.confidence > best.confidence ? current : best;
    }, identifications[0] || {
      plantName: 'Identificazione non disponibile',
      scientificName: '',
      confidence: 0,
      provider: 'plantnet'
    } as PlantIdentificationResult);

    // Trova la malattia più probabile
    const mostLikelyDisease = diseases.length > 0 
      ? diseases.reduce((best, current) => {
          return current.confidence > best.confidence ? current : best;
        })
      : undefined;

    // Calcola un punteggio di confidenza complessivo migliorato
    const avgPlantConfidence = identifications.length > 0
      ? identifications.reduce((sum, id) => sum + id.confidence, 0) / identifications.length
      : 0;

    const avgDiseaseConfidence = diseases.length > 0
      ? diseases.reduce((sum, disease) => sum + disease.confidence, 0) / diseases.length
      : 0;

    // Peso maggiore all'identificazione della pianta
    const confidenceScore = avgPlantConfidence * 0.7 + avgDiseaseConfidence * 0.3;

    return {
      mostLikelyPlant,
      mostLikelyDisease,
      confidenceScore: Math.round(confidenceScore * 100) / 100 // Arrotonda a 2 decimali
    };
  }

  // Metodo per analisi diretta da file
  /**
   * Analyzes the content of an image file to provide detailed analysis results.
   * @example
   * analyzeImageFile(file, progress => console.log(progress))
   * Promise<CombinedAnalysisResult>
   * @param {File} imageFile - The image file that contains data to be analyzed.
   * @param {function} [onProgress] - Optional callback function that receives progress updates.
   * @returns {Promise<CombinedAnalysisResult>} A promise that resolves to the combined analysis result.
   * @description
   *   - Utilizes internal `analyzeImage` method to process image data.
   *   - Handles potential errors during file reading and image data analysis.
   *   - Supports providing progress feedback if the `onProgress` callback is provided.
   */
  static async analyzeImageFile(
    imageFile: File,
    onProgress?: (progress: AnalysisProgress) => void
  ): Promise<CombinedAnalysisResult> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        try {
          const imageData = event.target?.result as string;
          const result = await this.analyzeImage(imageData, onProgress);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Errore nella lettura del file immagine'));
      reader.readAsDataURL(imageFile);
    });
  }

  // Metodo per pulire la cache
  static clearCache(): void {
    CacheService.clear();
  }

  // Metodo per ottenere statistiche della cache
  static getCacheStats(): { size: number; duration: number } {
    return {
      size: CacheService['cache'].size,
      duration: CacheService['CACHE_DURATION']
    };
  }
}
