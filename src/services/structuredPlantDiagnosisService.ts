import { supabase } from '@/integrations/supabase/client';
import { PlantInfo } from '@/context/PlantInfoContext';
import { toast } from "@/components/ui/sonner";

export interface UserProvidedData {
  plantName: string;
  isIndoor: boolean;
  wateringFrequency: string;
  lightExposure: string;
  symptoms: string;
  plantLocation?: string;
  plantAge?: string;
}

export interface StructuredDiagnosisResult {
  plantIdentification: {
    name: string;
    scientificName: string;
    confidence: number;
    source: 'user-provided' | 'ai-vision' | 'combined';
    userConfirmation?: boolean;
  };
  healthAssessment: {
    isHealthy: boolean;
    confidence: number;
    problems: Array<{
      name: string;
      scientificName?: string;
      severity: 'low' | 'medium' | 'high';
      confidence: number;
      symptoms: string[];
      possibleCauses: string[];
      treatments: Array<{
        type: 'immediate' | 'ongoing' | 'preventive';
        action: string;
        description: string;
        products?: string[];
      }>;
    }>;
  };
  careRecommendations: {
    watering: {
      frequency: string;
      method: string;
      warnings: string[];
    };
    lighting: {
      requirements: string;
      recommendations: string[];
    };
    environment: {
      humidity: string;
      temperature: string;
      location: string;
    };
    nutrition: {
      fertilizer: string;
      schedule: string;
    };
  };
  analysisMetadata: {
    timestamp: string;
    confidenceScore: number;
    dataSourcesUsed: string[];
    recommendationAccuracy: 'high' | 'medium' | 'low';
  };
}

export class StructuredPlantDiagnosisService {
  
  /**
   * Esegue una diagnosi strutturata combinando dati utente e analisi AI
   */
  static async performStructuredDiagnosis(
    userPlantInfo: PlantInfo,
    imageBase64?: string,
    onProgress?: (step: string, progress: number, message: string) => void
  ): Promise<StructuredDiagnosisResult> {
    
    const updateProgress = (step: string, progress: number, message: string) => {
      onProgress?.(step, progress, message);
    };

    try {
      updateProgress('validation', 5, 'Validazione dati utente...');
      
      // 1. Prima fase: Analisi dei dati forniti dall'utente
      const userProvidedData = this.extractUserData(userPlantInfo);
      
      updateProgress('user-analysis', 15, 'Analisi informazioni fornite dall\'utente...');
      
      // 2. Seconda fase: Analisi AI dell'immagine (se fornita)
      let visionAnalysis = null;
      if (imageBase64) {
        updateProgress('vision-analysis', 30, 'Analisi immagine con modelli di visione artificiale...');
        visionAnalysis = await this.performVisionAnalysis(imageBase64);
      }
      
      updateProgress('data-integration', 50, 'Integrazione dati utente e analisi AI...');
      
      // 3. Terza fase: Integrazione e reconciliazione dei dati
      const plantIdentification = await this.reconcilePlantIdentification(userProvidedData, visionAnalysis);
      
      updateProgress('health-assessment', 65, 'Valutazione salute della pianta...');
      
      // 4. Quarta fase: Analisi della salute basata su sintomi e immagine
      const healthAssessment = await this.performHealthAssessment(userProvidedData, visionAnalysis);
      
      updateProgress('care-recommendations', 80, 'Generazione raccomandazioni di cura...');
      
      // 5. Quinta fase: Generazione raccomandazioni di cura personalizzate
      const careRecommendations = await this.generateCareRecommendations(plantIdentification, userProvidedData);
      
      updateProgress('finalization', 95, 'Finalizzazione diagnosi...');
      
      const result: StructuredDiagnosisResult = {
        plantIdentification,
        healthAssessment,
        careRecommendations,
        analysisMetadata: {
          timestamp: new Date().toISOString(),
          confidenceScore: this.calculateOverallConfidence(plantIdentification, healthAssessment),
          dataSourcesUsed: this.getDataSources(userProvidedData, visionAnalysis),
          recommendationAccuracy: this.assessRecommendationAccuracy(plantIdentification, healthAssessment)
        }
      };

      updateProgress('complete', 100, 'Diagnosi strutturata completata!');
      
      toast.success('Diagnosi completata!', {
        description: `Pianta identificata: ${plantIdentification.name} (Confidenza: ${plantIdentification.confidence}%)`
      });
      
      return result;

    } catch (error) {
      console.error('Errore nella diagnosi strutturata:', error);
      toast.error('Errore durante la diagnosi', {
        description: error instanceof Error ? error.message : 'Errore sconosciuto'
      });
      throw error;
    }
  }

  /**
   * Estrae e normalizza i dati forniti dall'utente
   */
  private static extractUserData(plantInfo: PlantInfo): UserProvidedData {
    return {
      plantName: plantInfo.name.trim(),
      isIndoor: plantInfo.isIndoor,
      wateringFrequency: plantInfo.wateringFrequency,
      lightExposure: plantInfo.lightExposure,
      symptoms: plantInfo.symptoms.join(', '), // Convert array to string
    };
  }

  /**
   * Esegue l'analisi dell'immagine utilizzando modelli di visione artificiale
   */
  private static async performVisionAnalysis(imageBase64: string) {
    try {
      // Chiamata all'edge function per diagnosi AI completa
      const { data, error } = await supabase.functions.invoke('comprehensive-plant-diagnosis', {
        body: { 
          image: imageBase64,
          analysisType: 'comprehensive',
          includeDiseaseDiagnosis: true,
          includePlantIdentification: true
        }
      });

      if (error) {
        console.error('Errore nella diagnosi AI:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Errore nell\'analisi dell\'immagine:', error);
      return null;
    }
  }

  /**
   * Reconcilia l'identificazione della pianta tra dati utente e AI
   */
  private static async reconcilePlantIdentification(
    userData: UserProvidedData, 
    visionAnalysis: any
  ): Promise<StructuredDiagnosisResult['plantIdentification']> {
    
    // Se l'utente ha fornito il nome della pianta
    if (userData.plantName && userData.plantName.length > 2) {
      
      // Verifica se l'AI concorda
      if (visionAnalysis?.plantIdentification?.name) {
        const userPlant = userData.plantName.toLowerCase();
        const aiPlant = visionAnalysis.plantIdentification.name.toLowerCase();
        
        // Calcola similarità
        const similarity = this.calculateTextSimilarity(userPlant, aiPlant);
        
        if (similarity > 0.7) {
          return {
            name: userData.plantName,
            scientificName: visionAnalysis.plantIdentification.scientificName || '',
            confidence: Math.min(95, visionAnalysis.plantIdentification.confidence + 15),
            source: 'combined',
            userConfirmation: true
          };
        } else {
          // Discrepanza tra utente e AI - chiedi conferma
          return {
            name: userData.plantName,
            scientificName: '',
            confidence: 75,
            source: 'user-provided',
            userConfirmation: false
          };
        }
      } else {
        // Solo dati utente disponibili
        return {
          name: userData.plantName,
          scientificName: '',
          confidence: 80,
          source: 'user-provided',
          userConfirmation: true
        };
      }
    } else if (visionAnalysis?.plantIdentification?.name) {
      // Solo AI disponibile
      return {
        name: visionAnalysis.plantIdentification.name,
        scientificName: visionAnalysis.plantIdentification.scientificName || '',
        confidence: visionAnalysis.plantIdentification.confidence,
        source: 'ai-vision'
      };
    } else {
      // Nessuna identificazione disponibile
      return {
        name: 'Pianta non identificata',
        scientificName: '',
        confidence: 10,
        source: 'user-provided'
      };
    }
  }

  /**
   * Esegue una valutazione completa della salute della pianta
   */
  private static async performHealthAssessment(
    userData: UserProvidedData,
    visionAnalysis: any
  ): Promise<StructuredDiagnosisResult['healthAssessment']> {
    
    const problems: StructuredDiagnosisResult['healthAssessment']['problems'] = [];
    
    // Analizza i sintomi forniti dall'utente
    if (userData.symptoms && userData.symptoms.trim().length > 5) {
      const userSymptomProblems = await this.analyzeUserSymptoms(userData.symptoms);
      problems.push(...userSymptomProblems);
    }
    
    // Integra i risultati dell'AI se disponibili
    if (visionAnalysis?.diseaseDetection?.length > 0) {
      const aiProblems = visionAnalysis.diseaseDetection.map((disease: any) => ({
        name: disease.disease,
        scientificName: disease.scientificName,
        severity: disease.severity || 'medium',
        confidence: disease.confidence,
        symptoms: disease.symptoms || [],
        possibleCauses: [disease.additionalInfo?.cause || 'Causa sconosciuta'],
        treatments: this.generateTreatments(disease)
      }));
      problems.push(...aiProblems);
    }
    
    // Valutazione ambientale basata sui dati utente
    const environmentalProblems = this.assessEnvironmentalFactors(userData);
    problems.push(...environmentalProblems);
    
    const isHealthy = problems.length === 0 || problems.every(p => p.severity === 'low');
    const confidence = this.calculateHealthConfidence(problems, userData, visionAnalysis);
    
    return {
      isHealthy,
      confidence,
      problems: problems.slice(0, 5) // Limita ai 5 problemi più rilevanti
    };
  }

  /**
   * Genera raccomandazioni di cura personalizzate
   */
  private static async generateCareRecommendations(
    plantId: StructuredDiagnosisResult['plantIdentification'],
    userData: UserProvidedData
  ): Promise<StructuredDiagnosisResult['careRecommendations']> {
    
    // Usa l'edge function per ottenere raccomandazioni specifiche
    try {
      const { data: careData, error } = await supabase.functions.invoke('generate-care-recommendations', {
        body: {
          plantName: plantId.name,
          isIndoor: userData.isIndoor,
          currentWatering: userData.wateringFrequency,
          currentLight: userData.lightExposure,
          symptoms: userData.symptoms
        }
      });

      if (error || !careData) {
        // Fallback a raccomandazioni generiche
        return this.generateGenericCareRecommendations(plantId, userData);
      }

      return careData;
    } catch (error) {
      console.warn('Errore nel recupero raccomandazioni specifiche, uso fallback:', error);
      return this.generateGenericCareRecommendations(plantId, userData);
    }
  }

  // Metodi helper privati

  private static calculateTextSimilarity(text1: string, text2: string): number {
    const longer = text1.length > text2.length ? text1 : text2;
    const shorter = text1.length > text2.length ? text2 : text1;
    
    if (longer.length === 0) return 1.0;
    
    const distance = this.levenshteinDistance(longer, shorter);
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

  private static async analyzeUserSymptoms(symptoms: string) {
    const problems = [];
    const symptomsLower = symptoms.toLowerCase();
    
    // Analisi pattern comuni nei sintomi
    if (symptomsLower.includes('foglie gialle') || symptomsLower.includes('ingiallimento')) {
      problems.push({
        name: 'Ingiallimento fogliare',
        severity: 'medium' as const,
        confidence: 70,
        symptoms: ['Foglie gialle'],
        possibleCauses: ['Eccesso di acqua', 'Carenza nutrizionale', 'Stress ambientale'],
        treatments: [
          {
            type: 'immediate' as const,
            action: 'Verifica drenaggio',
            description: 'Controlla che il terreno non sia troppo bagnato'
          },
          {
            type: 'ongoing' as const,
            action: 'Riduzione annaffiature',
            description: 'Diminuisci la frequenza di irrigazione'
          }
        ]
      });
    }
    
    if (symptomsLower.includes('macchie') || symptomsLower.includes('puntini')) {
      problems.push({
        name: 'Macchie sulle foglie',
        severity: 'high' as const,
        confidence: 80,
        symptoms: ['Macchie sulle foglie'],
        possibleCauses: ['Infezione fungina', 'Attacco parassitario', 'Bruciature da sole'],
        treatments: [
          {
            type: 'immediate' as const,
            action: 'Isolare la pianta',
            description: 'Separa la pianta da altre per evitare contagi'
          },
          {
            type: 'ongoing' as const,
            action: 'Trattamento fungicida',
            description: 'Applica un fungicida specifico per le macchie fogliari'
          }
        ]
      });
    }
    
    return problems;
  }

  private static assessEnvironmentalFactors(userData: UserProvidedData) {
    const problems = [];
    
    // Analisi illuminazione
    if (userData.lightExposure === 'directSun' && userData.isIndoor) {
      problems.push({
        name: 'Illuminazione eccessiva',
        severity: 'medium' as const,
        confidence: 60,
        symptoms: ['Possibili bruciature fogliari'],
        possibleCauses: ['Sole diretto su pianta da interno'],
        treatments: [
          {
            type: 'immediate' as const,
            action: 'Spostar in zona ombreggiata',
            description: 'Allontana la pianta dalla luce diretta'
          }
        ]
      });
    }
    
    return problems;
  }

  private static generateTreatments(disease: any) {
    return [
      {
        type: 'immediate' as const,
        action: 'Valutazione specialistica',
        description: `Consulta un esperto per ${disease.disease}`
      },
      {
        type: 'ongoing' as const,
        action: 'Monitoraggio',
        description: 'Tieni sotto controllo l\'evoluzione dei sintomi'
      }
    ];
  }

  private static calculateOverallConfidence(plantId: any, health: any): number {
    return Math.round((plantId.confidence + health.confidence) / 2);
  }

  private static getDataSources(userData: UserProvidedData, visionAnalysis: any): string[] {
    const sources = ['user-input'];
    if (visionAnalysis) sources.push('ai-vision');
    return sources;
  }

  private static assessRecommendationAccuracy(plantId: any, health: any): 'high' | 'medium' | 'low' {
    const avgConfidence = (plantId.confidence + health.confidence) / 2;
    if (avgConfidence > 80) return 'high';
    if (avgConfidence > 60) return 'medium';
    return 'low';
  }

  private static calculateHealthConfidence(problems: any[], userData: UserProvidedData, visionAnalysis: any): number {
    if (problems.length === 0) return 85;
    
    const avgProblemConfidence = problems.reduce((sum, p) => sum + p.confidence, 0) / problems.length;
    return Math.round(avgProblemConfidence);
  }

  private static generateGenericCareRecommendations(
    plantId: StructuredDiagnosisResult['plantIdentification'],
    userData: UserProvidedData
  ): StructuredDiagnosisResult['careRecommendations'] {
    return {
      watering: {
        frequency: userData.isIndoor ? '1-2 volte a settimana' : '2-3 volte a settimana',
        method: 'Innaffia quando il terreno è asciutto in superficie',
        warnings: ['Evita ristagni d\'acqua', 'Controlla il drenaggio']
      },
      lighting: {
        requirements: userData.isIndoor ? 'Luce indiretta brillante' : 'Luce solare diretta/indiretta',
        recommendations: [
          'Ruota la pianta periodicamente',
          'Evita cambi drastici di illuminazione'
        ]
      },
      environment: {
        humidity: '40-60%',
        temperature: '18-24°C',
        location: userData.isIndoor ? 'Ambiente interno ventilato' : 'Zona riparata dal vento'
      },
      nutrition: {
        fertilizer: 'Fertilizzante bilanciato N-P-K',
        schedule: 'Ogni 2-4 settimane durante la stagione di crescita'
      }
    };
  }
}