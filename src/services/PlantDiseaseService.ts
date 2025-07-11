import { DiseaseDetectionResult } from './aiProviders';
import { PlantIDService } from './aiProviders/PlantIDService';

/**
 * Servizio specializzato per la diagnosi AI delle malattie delle piante
 * Integra multiple API AI per una diagnosi completa e accurata
 */
export class PlantDiseaseService {
  private static readonly PLANT_ID_API_KEY = '6d4146706e385077db06e57b76fd967d10b4cb2ce23070580160ebb069da8420';
  private static readonly PLANTNET_API_KEY = '2c3cc11af50602d90073a401dc7ccce7ba70abc40bda9d84794';
  private static readonly HUGGINGFACE_ACCESS_TOKEN = 'fb752ef5f96488fc2659a524aeece4b8d790b82b7cf19fe4c4e72ba86298cb60';
  private static readonly EPPO_API_KEY = 'ce550a719eec290cb93614cc5dcc027e39164548e21f5849900416cfd3537f8d';
  
  /**
   * Plant.ID - Diagnosi specializzata delle malattie
   */
  static async diagnosePlantDisease(imageBase64: string): Promise<DiseaseDetectionResult[]> {
    try {
      const response = await fetch('https://api.plant.id/v2/health_assessment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Api-Key': this.PLANT_ID_API_KEY
        },
        body: JSON.stringify({
          images: [imageBase64],
          modifiers: ["crops_fast", "similar_images"],
          disease_details: ["cause", "common_names", "classification", "description", "treatment", "url"],
          plant_language: "it"
        })
      });

      if (!response.ok) {
        throw new Error(`Plant.ID Health API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.health_assessment) {
        return [];
      }

      const diseases: DiseaseDetectionResult[] = [];

      // Malattie rilevate
      if (data.health_assessment.diseases) {
        data.health_assessment.diseases.forEach((disease: any) => {
          diseases.push({
            disease: disease.name,
            confidence: Math.round(disease.probability * 100),
            severity: this.calculateSeverity(disease.probability),
            symptoms: disease.disease_details?.description ? [disease.disease_details.description] : [],
            treatments: disease.disease_details?.treatment ? [disease.disease_details.treatment] : [],
            provider: 'plantid-health',
            additionalInfo: {
              cause: disease.disease_details?.cause,
              commonNames: disease.disease_details?.common_names,
              classification: disease.disease_details?.classification,
              similar_images: disease.similar_images
            }
          });
        });
      }

      // Parassiti rilevati
      if (data.health_assessment.pests) {
        data.health_assessment.pests.forEach((pest: any) => {
          diseases.push({
            disease: `Parassita: ${pest.name}`,
            confidence: Math.round(pest.probability * 100),
            severity: this.calculateSeverity(pest.probability),
            symptoms: pest.disease_details?.description ? [pest.disease_details.description] : [],
            treatments: pest.disease_details?.treatment ? [pest.disease_details.treatment] : [],
            provider: 'plantid-health',
            additionalInfo: {
              cause: pest.disease_details?.cause,
              commonNames: pest.disease_details?.common_names,
              classification: pest.disease_details?.classification
            }
          });
        });
      }

      return diseases;
    } catch (error) {
      console.error('Plant.ID health assessment error:', error);
      return [];
    }
  }

  /**
   * PlantNet - Analisi tramite identificazione botanica
   */
  static async analyzePlantHealthWithPlantNet(imageBase64: string): Promise<DiseaseDetectionResult[]> {
    try {
      // Converti base64 in blob per PlantNet
      const base64Data = imageBase64.split(',')[1];
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/jpeg' });

      const formData = new FormData();
      formData.append('images', blob, 'plant.jpg');
      formData.append('organs', 'leaf');
      formData.append('organs', 'flower');
      formData.append('organs', 'fruit');
      formData.append('include-related-images', 'true');

      const response = await fetch(`https://my-api.plantnet.org/v2/identify/weurope?api-key=${this.PLANTNET_API_KEY}`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`PlantNet API error: ${response.status}`);
      }

      const data = await response.json();
      
      return this.extractHealthFromPlantNet(data);
    } catch (error) {
      console.error('PlantNet health analysis error:', error);
      return [];
    }
  }

  /**
   * Hugging Face - Modelli di computer vision per malattie
   */
  static async analyzeWithHuggingFace(imageBase64: string): Promise<DiseaseDetectionResult[]> {
    try {
      // Usa il modello specifico per malattie delle piante
      const models = [
        'google/vit-base-patch16-224', // Vision Transformer generale
        'microsoft/resnet-50', // ResNet per classificazione immagini
        'facebook/detr-resnet-50' // DETR per object detection
      ];

      const results: DiseaseDetectionResult[] = [];

      for (const model of models) {
        try {
          const response = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${this.HUGGINGFACE_ACCESS_TOKEN}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              inputs: imageBase64
            })
          });

          if (!response.ok) continue;

          const data = await response.json();
          
          // Analizza i risultati per indicatori di malattie
          const diseaseResults = this.extractDiseaseIndicatorsFromHF(data, model);
          results.push(...diseaseResults);
        } catch (modelError) {
          console.warn(`Hugging Face model ${model} failed:`, modelError);
          continue;
        }
      }

      return results;
    } catch (error) {
      console.error('Hugging Face analysis error:', error);
      return [];
    }
  }

  /**
   * Analisi specializzata con modello dedicato alle malattie delle piante
   */
  static async analyzeWithPlantDiseaseModel(imageBase64: string): Promise<DiseaseDetectionResult[]> {
    try {
      // Usa un modello specifico per malattie delle piante se disponibile
      const response = await fetch('https://api-inference.huggingface.co/models/nateraw/plant-disease-classifier', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.HUGGINGFACE_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inputs: imageBase64
        })
      });

      if (!response.ok) {
        throw new Error(`Plant Disease Model API error: ${response.status}`);
      }

      const data = await response.json();
      
      return data.map((result: any) => ({
        disease: result.label,
        confidence: Math.round(result.score * 100),
        severity: this.calculateSeverity(result.score),
        symptoms: [`Identificato tramite modello AI: ${result.label}`],
        treatments: ['Consulta esperto per trattamento specifico'],
        provider: 'huggingface-plant-disease'
      }));
    } catch (error) {
      console.error('Plant Disease Model analysis error:', error);
      return [];
    }
  }

  /**
   * Metodi di supporto
   */
  private static calculateSeverity(probability: number): 'low' | 'medium' | 'high' {
    if (probability > 0.7) return 'high';
    if (probability > 0.4) return 'medium';
    return 'low';
  }

  private static extractHealthFromPlantNet(plantNetData: any): DiseaseDetectionResult[] {
    const diseases: DiseaseDetectionResult[] = [];
    
    if (plantNetData.results) {
      plantNetData.results.forEach((result: any) => {
        // Analizza le immagini simili per indicatori di salute
        if (result.images && result.images.length > 0) {
          const unhealthyKeywords = ['diseased', 'sick', 'damaged', 'infected', 'pest', 'fungus'];
          const healthyKeywords = ['healthy', 'normal', 'good'];
          
          result.images.forEach((img: any) => {
            const filename = img.url.o || img.url.m || '';
            const isUnhealthy = unhealthyKeywords.some(keyword => 
              filename.toLowerCase().includes(keyword)
            );
            const isHealthy = healthyKeywords.some(keyword => 
              filename.toLowerCase().includes(keyword)
            );

            if (isUnhealthy && !isHealthy) {
              diseases.push({
                disease: 'Possibile problema di salute rilevato',
                confidence: Math.round(result.score * 100),
                severity: this.calculateSeverity(result.score),
                symptoms: [`Indicatori visivi simili a ${filename}`],
                treatments: ['Analisi più dettagliata necessaria'],
                provider: 'plantnet'
              });
            }
          });
        }

        // Analizza i nomi scientifici per indicatori di malattie
        const scientificName = result.species.scientificNameWithoutAuthor.toLowerCase();
        const diseaseKeywords = ['blight', 'rot', 'mildew', 'fungus', 'disease', 'infection', 'virus'];
        
        diseaseKeywords.forEach(keyword => {
          if (scientificName.includes(keyword)) {
            diseases.push({
              disease: `Possibile ${keyword} (${result.species.scientificNameWithoutAuthor})`,
              confidence: Math.round(result.score * 100),
              severity: this.calculateSeverity(result.score),
              symptoms: ['Identificato tramite analisi botanica'],
              treatments: ['Consulta database specifico per trattamenti'],
              provider: 'plantnet'
            });
          }
        });
      });
    }

    return diseases;
  }

  private static extractDiseaseIndicatorsFromHF(data: any, model: string): DiseaseDetectionResult[] {
    const diseases: DiseaseDetectionResult[] = [];
    
    if (Array.isArray(data)) {
      data.forEach((result: any) => {
        const label = result.label?.toLowerCase() || '';
        const score = result.score || 0;
        
        // Cerca indicatori di malattie nei label
        const diseaseKeywords = [
          'disease', 'sick', 'infected', 'pest', 'fungus', 'blight', 'rot', 'mildew',
          'virus', 'bacteria', 'damaged', 'unhealthy', 'wilted', 'spotted', 'yellow'
        ];
        
        const foundKeywords = diseaseKeywords.filter(keyword => label.includes(keyword));
        
        if (foundKeywords.length > 0) {
          diseases.push({
            disease: `Possibile problema: ${result.label}`,
            confidence: Math.round(score * 100),
            severity: this.calculateSeverity(score),
            symptoms: [`Rilevato tramite ${model}: ${result.label}`],
            treatments: ['Analisi specialistica consigliata'],
            provider: 'huggingface'
          });
        }
      });
    }

    return diseases;
  }
}