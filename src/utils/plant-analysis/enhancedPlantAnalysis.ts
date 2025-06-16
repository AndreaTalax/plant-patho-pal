
import { verifyImageContainsPlant, analyzeImageQuality } from './plantImageVerification';
import { RealPlantDiagnosisService } from './realPlantDiagnosis';
import { toast } from 'sonner';

export interface EnhancedAnalysisResult {
  success: boolean;
  plantName?: string;
  scientificName?: string;
  confidence?: number;
  isHealthy?: boolean;
  diseases?: Array<{
    name: string;
    probability: number;
    description: string;
    treatment: string;
  }>;
  recommendations?: string[];
  error?: string;
  analysisDetails?: {
    verificationPassed: boolean;
    qualityCheck: boolean;
    source: string;
  };
}

/**
 * Analisi completa e rigorosa delle piante - BLOCCA diagnosi su non-piante
 */
export const performEnhancedPlantAnalysis = async (
  imageFile: File,
  plantInfo?: any
): Promise<EnhancedAnalysisResult> => {
  
  try {
    // 1. Verifica qualità immagine
    console.log('🔍 Controllo qualità immagine...');
    const qualityCheck = analyzeImageQuality(imageFile);
    
    if (!qualityCheck.isGoodQuality) {
      toast.error('Problemi con la qualità dell\'immagine', {
        description: qualityCheck.issues.join(', ')
      });
      
      return {
        success: false,
        error: `Qualità immagine insufficiente: ${qualityCheck.issues.join(', ')}`,
        analysisDetails: {
          verificationPassed: false,
          qualityCheck: false,
          source: 'Quality Check'
        }
      };
    }
    
    // 2. Verifica RIGOROSA che l'immagine contenga una pianta
    console.log('🌿 Verifica RIGOROSA presenza pianta nell\'immagine...');
    toast.info('Verifico che l\'immagine contenga una pianta...', { duration: 3000 });
    
    const plantVerification = await verifyImageContainsPlant(imageFile);
    
    // CRITERI MOLTO PIÙ RIGOROSI - minimo 60% di confidenza
    if (!plantVerification.isPlant || plantVerification.confidence < 60) {
      const errorMessage = `L'immagine non contiene una pianta riconoscibile. ${plantVerification.reason}`;
      
      toast.error('🚫 Immagine NON valida per diagnosi', {
        description: errorMessage,
        duration: 8000
      });
      
      return {
        success: false,
        error: errorMessage,
        analysisDetails: {
          verificationPassed: false,
          qualityCheck: true,
          source: 'Plant Verification - FAILED'
        }
      };
    }
    
    console.log('✅ Pianta rilevata con confidenza sufficiente:', plantVerification.confidence);
    toast.success(`✅ Pianta rilevata (${Math.round(plantVerification.confidence)}% confidenza)`);
    
    // 3. Converti immagine in base64
    const imageBase64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(imageFile);
    });
    
    // 4. Identificazione pianta con API reale
    console.log('🔬 Identificazione pianta con API specializzata...');
    toast.info('Identificazione pianta in corso...', { duration: 3000 });
    
    const identification = await RealPlantDiagnosisService.identifyPlantWithPlantId(imageBase64);
    
    if (!identification.success) {
      return {
        success: false,
        error: identification.error || 'Identificazione pianta fallita',
        analysisDetails: {
          verificationPassed: true,
          qualityCheck: true,
          source: 'Plant Identification - FAILED'
        }
      };
    }
    
    // Verifica che la confidenza dell'identificazione sia sufficiente
    if ((identification.confidence || 0) < 0.4) {
      return {
        success: false,
        error: `Identificazione troppo incerta (${Math.round((identification.confidence || 0) * 100)}%). L'immagine potrebbe non essere sufficientemente chiara.`,
        analysisDetails: {
          verificationPassed: true,
          qualityCheck: true,
          source: 'Plant Identification - LOW CONFIDENCE'
        }
      };
    }
    
    console.log('✅ Pianta identificata:', identification.plantName);
    toast.success(`Pianta identificata: ${identification.plantName}`);
    
    // 5. Diagnosi malattie con API reale
    console.log('🏥 Diagnosi malattie in corso...');
    toast.info('Analisi dello stato di salute...', { duration: 3000 });
    
    const diagnosis = await RealPlantDiagnosisService.diagnosePlantHealth(
      imageBase64, 
      identification.plantName
    );
    
    if (!diagnosis.success) {
      // Se l'identificazione è riuscita ma la diagnosi no, restituiamo almeno l'identificazione
      return {
        success: true,
        plantName: identification.plantName,
        scientificName: identification.scientificName,
        confidence: identification.confidence,
        isHealthy: true,
        diseases: [],
        recommendations: [
          'Identificazione riuscita ma diagnosi dettagliata non disponibile',
          'Per una diagnosi approfondita, consulta il nostro fitopatologo esperto'
        ],
        analysisDetails: {
          verificationPassed: true,
          qualityCheck: true,
          source: 'Plant.id Identification Only'
        }
      };
    }
    
    // 6. Risultato completo
    const result: EnhancedAnalysisResult = {
      success: true,
      plantName: identification.plantName,
      scientificName: identification.scientificName,
      confidence: identification.confidence,
      isHealthy: diagnosis.isHealthy,
      diseases: diagnosis.diseases,
      recommendations: diagnosis.isHealthy ? [
        'La pianta appare in buona salute',
        'Continua con le cure standard',
        'Monitora regolarmente per eventuali cambiamenti'
      ] : [
        'Problemi di salute rilevati',
        'Segui i trattamenti consigliati',
        'Consulta un fitopatologo se i sintomi peggiorano'
      ],
      analysisDetails: {
        verificationPassed: true,
        qualityCheck: true,
        source: 'Complete Plant.id Analysis'
      }
    };
    
    console.log('✅ Analisi completa terminata con successo');
    toast.success(
      diagnosis.isHealthy ? 
        'Analisi completata - Pianta sana!' : 
        'Analisi completata - Problemi rilevati'
    );
    
    return result;
    
  } catch (error) {
    console.error('❌ Errore nell\'analisi della pianta:', error);
    toast.error('Errore durante l\'analisi', {
      description: 'Si è verificato un errore tecnico'
    });
    
    return {
      success: false,
      error: `Errore tecnico: ${error.message}`,
      analysisDetails: {
        verificationPassed: false,
        qualityCheck: false,
        source: 'Error'
      }
    };
  }
};
