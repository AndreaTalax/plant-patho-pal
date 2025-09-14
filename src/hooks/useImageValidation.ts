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
      console.log('🔍 Avvio validazione rapida immagine...');
      
      // 1. Controllo qualità base dell'immagine (veloce)
      const qualityCheck = analyzeImageQuality(imageFile);
      
      if (!qualityCheck.isGoodQuality) {
        const result = {
          isValid: false,
          isPlant: false,
          confidence: 0,
          qualityIssues: qualityCheck.issues,
          reason: `Problemi di qualità: ${qualityCheck.issues.join(', ')}`
        };
        
        toast.error('Immagine non valida', {
          description: `${qualityCheck.issues.join(', ')}. ${qualityCheck.recommendations.join(', ')}.`,
          duration: 5000
        });
        
        setValidationResult(result);
        return result;
      }

      // 2. Controllo veloce se contiene una pianta (analisi pixel)
      const plantCheck = await verifyImageContainsPlant(imageFile);
      
      const result = {
        isValid: plantCheck.isPlant && plantCheck.confidence > 50, // Soglia più alta
        isPlant: plantCheck.isPlant,
        confidence: plantCheck.confidence,
        qualityIssues: [],
        reason: plantCheck.reason
      };

      if (!result.isValid) {
        if (!plantCheck.isPlant) {
          toast.error('Pianta non rilevata', {
            description: 'Non riesco a identificare una pianta in questa immagine. Assicurati che la pianta sia ben visibile e abbia foglie verdi.',
            duration: 6000,
            action: {
              label: 'Consigli',
              onClick: () => {
                toast.info('Consigli per foto migliori', {
                  description: '• Inquadra foglie, fiori o parti verdi della pianta\n• Usa buona illuminazione naturale\n• Evita sfondi troppo uniformi\n• Avvicinati alla pianta per i dettagli',
                  duration: 8000
                });
              }
            }
          });
        } else if (plantCheck.confidence <= 50) {
          toast.warning('Pianta poco chiara', {
            description: `La pianta è rilevata ma con bassa confidenza (${plantCheck.confidence.toFixed(1)}%). Serve un'immagine più chiara con parti verdi ben visibili.`,
            duration: 5000
          });
        }
      } else {
        toast.success('Pianta rilevata!', {
          description: `Pianta identificata con confidenza ${plantCheck.confidence.toFixed(1)}%. Procedo con la diagnosi completa.`,
          duration: 3000
        });
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

      toast.error('Errore di validazione', {
        description: 'Errore durante l\'analisi dell\'immagine. Riprova con un\'altra foto.',
        duration: 4000
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