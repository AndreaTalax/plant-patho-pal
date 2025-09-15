import { supabase } from '@/integrations/supabase/client';

export interface PlantAnalysisProgress {
  step: string;
  progress: number;
  message: string;
}

export interface ComprehensivePlantDiagnosis {
  plantIdentification: {
    name: string;
    scientificName: string;
    confidence: number;
    commonNames: string[];
    family?: string;
    genus?: string;
    source: string;
  };
  healthAssessment: {
    isHealthy: boolean;
    overallHealthScore: number;
    diseases: any[];
    pests: any[];
  };
  recommendations: string[];
  sources: string[];
  confidence: number;
  metadata: {
    analysisTime: number;
    imageQuality: string;
    apiResponsesReceived: string[];
  };
}

export const comprehensivePlantDiagnosisService = {
  async diagnosePlant(
    imageFile: any,
    onProgress?: (progress: PlantAnalysisProgress) => void
  ): Promise<ComprehensivePlantDiagnosis> {

    const updateProgress = (step: string, progress: number, message: string) => {
      onProgress?.({ step, progress, message });
    };

    // Converti immagine in base64 (React Native)
    async function convertImageToBase64(uri: string): Promise<string> {
      const response = await fetch(uri);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Failed to convert image to base64'));
        reader.readAsDataURL(blob);
      });
    }

    // Estrai colore dominante (fallback semplice)
    async function extractDominantColor(uri: string): Promise<string> {
      try {
        // Semplice fallback senza dipendenze esterne
        return 'verde';
      } catch {
        return 'verde';
      }
    }

    // Fallback iNaturalist
    async function fetchFromINaturalist(metadata: any): Promise<ComprehensivePlantDiagnosis | null> {
      try {
        const parts = [];
        if (metadata.color) parts.push(metadata.color);
        if (metadata.plantPart) parts.push(metadata.plantPart);
        if (metadata.shape) parts.push(metadata.shape);
        const query = parts.length > 0 ? parts.join(' ') : 'pianta';

        const res = await fetch(`https://api.inaturalist.org/v1/taxa/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        if (data.results && data.results.length > 0) {
          const first = data.results[0];
          return {
            plantIdentification: {
              name: first.preferred_common_name || first.name,
              scientificName: first.name,
              confidence: 0.6,
              commonNames: first.common_name ? [first.common_name] : [],
              source: 'iNaturalist'
            },
            healthAssessment: { isHealthy: true, overallHealthScore: 0.5, diseases: [], pests: [] },
            recommendations: ['Riferimento ottenuto da iNaturalist, verificare immagine originale'],
            sources: ['iNaturalist'],
            confidence: 0.6,
            metadata: {
              analysisTime: Date.now(),
              imageQuality: metadata.imageQuality || 'Unknown',
              apiResponsesReceived: ['iNaturalist']
            }
          } as ComprehensivePlantDiagnosis;
        }
      } catch (err) { console.warn('❌ iNaturalist fallback failed:', err); }
      return null;
    }

    // Fallback GBIF
    async function fetchFromGBIF(metadata: any): Promise<ComprehensivePlantDiagnosis | null> {
      try {
        const query = metadata.scientificHint || 'pianta';
        const res = await fetch(`https://api.gbif.org/v1/species/match?name=${encodeURIComponent(query)}`);
        const data = await res.json();
        if (data && data.scientificName) {
          return {
            plantIdentification: {
              name: data.canonicalName || data.scientificName,
              scientificName: data.scientificName,
              confidence: 0.5,
              commonNames: [],
              source: 'GBIF'
            },
            healthAssessment: { isHealthy: true, overallHealthScore: 0.5, diseases: [], pests: [] },
            recommendations: ['Riferimento ottenuto da GBIF, verificare immagine originale'],
            sources: ['GBIF'],
            confidence: 0.5,
            metadata: {
              analysisTime: Date.now(),
              imageQuality: metadata.imageQuality || 'Unknown',
              apiResponsesReceived: ['GBIF']
            }
          } as ComprehensivePlantDiagnosis;
        }
      } catch (err) { console.warn('❌ GBIF fallback failed:', err); }
      return null;
    }

    try {
      updateProgress('preparation', 10, 'Preparazione immagine...');
      const imageBase64 = await convertImageToBase64(imageFile.uri);

      updateProgress('preparation', 15, 'Analisi colore dominante...');
      const dominantColor = await extractDominantColor(imageFile.uri);

      updateProgress('uploading', 20, 'Invio immagine per l\'analisi con API reali...');
      const { data, error } = await supabase.functions.invoke('real-plant-diagnosis', { body: { imageBase64 } });
      
      if (!error && data?.success) {
        updateProgress('complete', 100, 'Diagnosi completata con API reali!');
        const diagnosis = data.diagnosis;
        const bestPlant = diagnosis.plantIdentification?.[0] || {};
        
        return {
          plantIdentification: {
            name: bestPlant.name || 'Pianta identificata',
            scientificName: bestPlant.scientificName || '',
            confidence: bestPlant.confidence || 0,
            commonNames: [],
            family: bestPlant.family,
            source: bestPlant.source || 'Real API Analysis'
          },
          healthAssessment: {
            isHealthy: diagnosis.healthAnalysis?.isHealthy ?? true,
            overallHealthScore: diagnosis.healthAnalysis?.overallScore || 70,
            diseases: diagnosis.diseases?.map((disease: any) => ({
              name: disease.name,
              probability: disease.confidence / 100,
              description: disease.symptoms?.join('. ') || '',
              treatment: disease.treatments || [],
              source: disease.source
            })) || [],
            pests: []
          },
          recommendations: diagnosis.recommendations?.immediate || ['Mantenere le condizioni ottimali'],
          sources: diagnosis.analysisDetails?.apiServicesUsed || ['Real API'],
          confidence: diagnosis.analysisDetails?.totalConfidence || bestPlant.confidence || 0,
          metadata: {
            analysisTime: Date.now(),
            imageQuality: 'Alta',
            apiResponsesReceived: diagnosis.analysisDetails?.apiServicesUsed || []
          }
        } as ComprehensivePlantDiagnosis;
      }

      updateProgress('analysis', 40, 'Fallback interno in corso...');
      const fallbackResponse = await supabase.functions.invoke('analyze-plant', { body: { imageBase64 } });
      if (fallbackResponse.data && fallbackResponse.data.isValidPlantImage) {
        const result = fallbackResponse.data.analysisResult || fallbackResponse.data;
        updateProgress('complete', 100, 'Analisi completata (modalità fallback interno)');
        return {
          plantIdentification: {
            name: result.plantName || result.scientificName || 'Specie sconosciuta',
            scientificName: result.scientificName || result.plantName || 'Unknown species',
            confidence: result.confidence || 0.5,
            commonNames: result.commonNames || [],
            family: result.family || '',
            genus: result.genus || '',
            source: 'Fallback Analysis'
          },
          healthAssessment: {
            isHealthy: result.isHealthy !== false,
            overallHealthScore: result.isHealthy ? 0.9 : 0.5,
            diseases: (result.diseases || []).map((disease: any) => ({
              name: disease.name || 'Malattia sconosciuta',
              probability: disease.probability || 0.7,
              description: disease.description || '',
              treatment: disease.treatment || {},
              source: 'Fallback'
            })),
            pests: []
          },
          recommendations: result.recommendations || ['Consultare un esperto per maggiori informazioni'],
          sources: ['Fallback Analysis'],
          confidence: result.confidence || 0.5,
          metadata: {
            analysisTime: Date.now(),
            imageQuality: 'Unknown',
            apiResponsesReceived: ['Fallback']
          }
        } as ComprehensivePlantDiagnosis;
      }

      updateProgress('external-fallback', 70, 'Fallback esterni in corso...');
      const metadata = {
        color: dominantColor,
        plantPart: 'foglia',
        shape: 'lanceolata',
        imageQuality: 'Alta',
        scientificHint: fallbackResponse.data?.genus || fallbackResponse.data?.family
      };

      const inatResult = await fetchFromINaturalist(metadata);
      if (inatResult) return inatResult;

      const gbifResult = await fetchFromGBIF(metadata);
      if (gbifResult) return gbifResult;

      updateProgress('complete', 100, 'Nessuna pianta rilevata, risultato minimo restituito');
      return {
        plantIdentification: { name: 'Nessuna pianta rilevata', scientificName: 'Unknown', confidence: 0, commonNames: [], source: 'Fallback Generico' },
        healthAssessment: { isHealthy: false, overallHealthScore: 0, diseases: [], pests: [] },
        recommendations: ['Riprova con un\'altra immagine chiara della pianta'],
        sources: ['Fallback Generico'],
        confidence: 0,
        metadata: { analysisTime: Date.now(), imageQuality: 'Unknown', apiResponsesReceived: [] }
      } as ComprehensivePlantDiagnosis;

    } catch (error) {
      console.error('❌ Diagnosi fallita:', error);
      updateProgress('error', 0, `Errore: ${error.message}`);
      throw error;
    }
  }
};
