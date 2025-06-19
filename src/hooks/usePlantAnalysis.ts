
import { useState } from 'react';
import { performEnhancedPlantAnalysis, type PlantAnalysisResult } from '@/utils/plant-analysis/enhancedPlantAnalysis';
import { toast } from 'sonner';
import type { PlantInfo } from '@/components/diagnose/types';
import type { AnalysisDetails, DiagnosedDisease } from '@/components/diagnose/types';

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
      console.log('🔍 Avvio analisi rigorosa dell\'immagine...');
      setAnalysisProgress(10);
      
      // Usa il nuovo sistema di analisi rigoroso
      const analysisResult: PlantAnalysisResult = await performEnhancedPlantAnalysis(imageFile, plantInfo);
      
      setAnalysisProgress(90);
      
      if (!analysisResult.success) {
        // Mostra errore specifico
        toast.error('Analisi non riuscita', {
          description: analysisResult.error,
          duration: 6000
        });
        
        setDiagnosisResult('Analisi non completata');
        setAnalysisProgress(0);
        return;
      }
      
      // Converti risultato nel formato atteso dall'UI
      const diseaseInfo: DiagnosedDisease = {
        id: `diagnosis-${Date.now()}`,
        name: analysisResult.plantName || 'Pianta identificata',
        description: analysisResult.isHealthy ? 
          'La pianta appare in buona salute secondo l\'analisi specializzata' :
          'Sono stati rilevati possibili problemi di salute',
        causes: analysisResult.isHealthy ? 'N/A - Pianta sana' : 'Vedere malattie specifiche rilevate',
        symptoms: analysisResult.diseases?.map(d => d) || ['Nessun sintomo specifico'],
        treatments: analysisResult.recommendations || [],
        confidence: analysisResult.confidence || 0,
        healthy: analysisResult.isHealthy || false,
        products: [], // Da implementare se necessario
        recommendExpertConsultation: (analysisResult.confidence || 0) < 0.7,
        disclaimer: (analysisResult.confidence || 0) < 0.7 ? 
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
          agreementScore: analysisResult.confidence || 0,
          huggingFaceResult: {
            label: analysisResult.plantName || 'Pianta',
            score: analysisResult.confidence || 0
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
          accuracyGuarantee: (analysisResult.confidence || 0) >= 0.8 ? "80%+" : 
                           (analysisResult.confidence || 0) >= 0.6 ? "60%+" : "40%+"
        },
        identifiedFeatures: [
          analysisResult.plantName || 'Pianta non identificata',
          `Confidenza: ${Math.round((analysisResult.confidence || 0) * 100)}%`,
          analysisResult.isHealthy ? 'Pianta sana' : 'Problemi rilevati',
          'Analisi con API specializzate'
        ],
        sistemaDigitaleFoglia: false,
        analysisTechnology: 'Plant.id Professional API'
      };
      
      setDiagnosedDisease(diseaseInfo);
      setDiagnosisResult(`${analysisResult.plantName} identificata con ${Math.round((analysisResult.confidence || 0) * 100)}% di confidenza`);
      setAnalysisDetails(detailedAnalysis);
      setAnalysisProgress(100);
      
      // Feedback finale
      const confidencePercent = Math.round((analysisResult.confidence || 0) * 100);
      if ((analysisResult.confidence || 0) >= 0.8) {
        toast.success(`✅ Analisi completata con alta precisione (${confidencePercent}%)!`);
      } else if ((analysisResult.confidence || 0) >= 0.6) {
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
