
import { useState } from 'react';
import { toast } from 'sonner';
import { verifyImageContainsPlant, analyzeImageQuality } from '@/utils/plant-analysis/plantImageVerification';

export interface ImageValidationResult {
  isValid: boolean;
  isPlant: boolean;
  confidence: number;
  qualityIssues: string[];
  reason: string;
}

export const useImageValidation = () => {
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<ImageValidationResult | null>(null);

  const validateImage = async (imageFile: File): Promise<ImageValidationResult> => {
    setIsValidating(true);
    setValidationResult(null);

    try {
      console.log('🔍 Avvio validazione rigorosa immagine...');
      
      // 1. Controllo qualità rigoroso dell'immagine
      const qualityCheck = analyzeImageQuality(imageFile);
      
      if (!qualityCheck.isGoodQuality) {
        const result = {
          isValid: false,
          isPlant: false,
          confidence: 0,
          qualityIssues: qualityCheck.issues,
          reason: `Problemi di qualità: ${qualityCheck.issues.join(', ')}`
        };
        
        toast.error('❌ Immagine non valida', {
          description: `${qualityCheck.issues.join(', ')}. ${qualityCheck.recommendations.join(', ')}.`,
          duration: 6000
        });
        
        setValidationResult(result);
        return result;
      }

      // 2. Controllo RIGOROSO se contiene SOLO una pianta vera
      const plantCheck = await verifyImageContainsPlant(imageFile);
      
      const result = {
        isValid: plantCheck.isPlant && plantCheck.confidence > 50, // Soglia più alta
        isPlant: plantCheck.isPlant,
        confidence: plantCheck.confidence,
        qualityIssues: [],
        reason: plantCheck.reason
      };

      if (!result.isValid) {
        // Il toast è già gestito dentro verifyImageContainsPlant
        console.log('❌ Immagine respinta:', result.reason);
      } else {
        console.log('✅ Immagine validata con successo');
      }

      setValidationResult(result);
      return result;

    } catch (error) {
      console.error('❌ Errore durante validazione immagine:', error);
      
      const result = {
        isValid: false,
        isPlant: false,
        confidence: 0,
        qualityIssues: ['Errore di analisi'],
        reason: 'Errore durante l\'analisi dell\'immagine'
      };

      toast.error('❌ Errore di validazione', {
        description: 'Errore durante l\'analisi dell\'immagine. Riprova con un\'altra foto di pianta.',
        duration: 5000
      });

      setValidationResult(result);
      return result;
    } finally {
      setIsValidating(false);
    }
  };

  const resetValidation = () => {
    setValidationResult(null);
    setIsValidating(false);
  };

  return {
    isValidating,
    validationResult,
    validateImage,
    resetValidation
  };
};
