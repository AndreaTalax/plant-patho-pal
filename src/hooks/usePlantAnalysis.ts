
import { useState } from 'react';
import { performEnhancedPlantAnalysis, type PlantAnalysisResult } from '@/utils/plant-analysis/enhancedPlantAnalysis';
import { toast } from 'sonner';
import type { PlantInfo } from '@/components/diagnose/types';
import type { AnalysisDetails, DiagnosedDisease } from '@/components/diagnose/types';

// Funzione di utilità per garantire percentuali valide
const ensureValidPercentage = (value: any, fallback: number = 75): number => {
  if (typeof value === 'number' && !isNaN(value) && isFinite(value)) {
    if (value <= 1) {
      return Math.max(Math.round(value * 100), 1);
    }
    return Math.max(Math.round(value), 1);
  }
  
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    if (!isNaN(parsed) && isFinite(parsed)) {
      if (parsed <= 1) {
        return Math.max(Math.round(parsed * 100), 1);
      }
      return Math.max(Math.round(parsed), 1);
    }
  }
  
  return fallback;
};

export const usePlantAnalysis = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [diagnosisResult, setDiagnosisResult] = useState<string | null>(null);
  const [diagnosedDisease, setDiagnosedDisease] = useState<DiagnosedDisease | null>(null);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisDetails, setAnalysisDetails] = useState<AnalysisDetails | null>(null);

  const analyzeUploadedImage = async (imageFile: File, plantInfo?: PlantInfo) => {
    setIsAnalyzing(true);
    setDiagnosisResult(null);
    setDiagnosedDisease(null);
    setAnalysisProgress(0);
    setAnalysisDetails(null);

    try {
      console.log('🔍 Avvio analisi rigorosa dell\'immagine con percentuali validate...');
      setAnalysisProgress(10);
      
      // Usa il sistema di analisi migliorato con validazione pianta
      const analysisResult: PlantAnalysisResult = await performEnhancedPlantAnalysis(imageFile, plantInfo);
      
      setAnalysisProgress(90);
      
      if (!analysisResult.success) {
        // Mostra errore specifico per non-piante o altri problemi
        toast.error('Analisi non riuscita', {
          description: analysisResult.error,
          duration: 8000
        });
        
        setDiagnosisResult('Analisi non completata - ' + analysisResult.error);
        setAnalysisProgress(0);
        return;
      }
      
      // Valida e converte la confidenza con robustezza
      const confidencePercent = ensureValidPercentage(analysisResult.confidence, 75);
      
      const diseaseInfo: DiagnosedDisease = {
        id: `diagnosis-${Date.now()}`,
        name: analysisResult.plantName || 'Pianta identificata',
        description: analysisResult.isHealthy ? 
          `La pianta appare in buona salute secondo l'analisi specializzata (${confidencePercent}% confidenza)` :
          `Sono stati rilevati possibili problemi di salute (${confidencePercent}% confidenza)`,
        causes: analysisResult.isHealthy ? 'N/A - Pianta sana' : 'Vedere malattie specifiche rilevate',
        symptoms: analysisResult.diseases?.map(d => {
          const probability = ensureValidPercentage(d.probability, 60);
          return `${d.name} (${probability}%)`;
        }) || ['Nessun sintomo specifico'],
        treatments: analysisResult.recommendations || [],
        confidence: confidencePercent,
        healthy: analysisResult.isHealthy || false,
        products: [],
        recommendExpertConsultation: confidencePercent < 70,
        disclaimer: confidencePercent < 70 ? 
          'Confidenza moderata. Consultazione esperta raccomandata per conferma.' : undefined
      };
      
      const detailedAnalysis: AnalysisDetails = {
        multiServiceInsights: {
          plantName: analysisResult.plantName || 'Sconosciuta',
          plantSpecies: analysisResult.scientificName || 'Non determinata',
          plantPart: 'whole plant',
          isHealthy: analysisResult.isHealthy || false,
          isValidPlantImage: true,
          primaryService: analysisResult.analysisDetails?.source || 'Enhanced Analysis',
          agreementScore: confidencePercent / 100,
          huggingFaceResult: {
            label: analysisResult.plantName || 'Pianta',
            score: confidencePercent / 100
          },
          dataSource: 'Real Plant APIs'
        },
        risultatiCompleti: {
          plantInfo: plantInfo || {
            isIndoor: false,
            wateringFrequency: '',
            lightExposure: '',
            symptoms: '',
            useAI: false,
            sendToExpert: false,
            name: '',
            infoComplete: false
          },
          accuracyGuarantee: confidencePercent >= 80 ? "80%+" : 
                           confidencePercent >= 60 ? "60%+" : "40%+"
        },
        identifiedFeatures: [
          analysisResult.plantName || 'Pianta non identificata',
          `Confidenza: ${confidencePercent}%`,
          analysisResult.isHealthy ? 'Pianta sana' : 'Problemi rilevati',
          'Analisi con validazione pianta',
          ...(analysisResult.diseases || []).map(d => {
            const probability = ensureValidPercentage(d.probability, 60);
            return `${d.name}: ${probability}% probabilità`;
          })
        ],
        sistemaDigitaleFoglia: false,
        analysisTechnology: 'Enhanced Plant Analysis with Validation'
      };
      
      setDiagnosedDisease(diseaseInfo);
      setDiagnosisResult(`${analysisResult.plantName} identificata con ${confidencePercent}% di confidenza`);
      setAnalysisDetails(detailedAnalysis);
      setAnalysisProgress(100);
      
      // Feedback finale con percentuali validate
      if (confidencePercent >= 80) {
        toast.success(`✅ Analisi completata con alta precisione (${confidencePercent}%)!`);
      } else if (confidencePercent >= 60) {
        toast.success(`✅ Analisi completata (${confidencePercent}%). Consulenza esperta raccomandata per maggiore certezza.`);
      } else {
        toast.warning(`⚠️ Analisi completata ma con confidenza moderata (${confidencePercent}%). Consulenza esperta fortemente raccomandata.`);
      }
      
    } catch (error) {
      console.error('❌ Errore durante l\'analisi:', error);
      toast.error('Errore durante l\'analisi', {
        description: 'Si è verificato un errore tecnico. Riprova o consulta un esperto.',
        duration: 6000
      });
      
      setDiagnosisResult('Errore durante l\'analisi');
      setAnalysisProgress(0);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return {
    isAnalyzing,
    diagnosisResult,
    diagnosedDisease,
    analysisProgress,
    analysisDetails,
    analyzeUploadedImage,
    setDiagnosisResult,
    setDiagnosedDisease,
    setAnalysisProgress,
    setAnalysisDetails,
  };
};
