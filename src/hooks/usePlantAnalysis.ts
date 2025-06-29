
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
      console.log('🔍 Avvio analisi avanzata con integrazione database EPPO...');
      setAnalysisProgress(10);
      
      // Use enhanced analysis with EPPO integration
      const analysisResult: PlantAnalysisResult = await performEnhancedPlantAnalysis(imageFile, plantInfo);
      
      setAnalysisProgress(90);
      
      if (!analysisResult.success) {
        toast.error('Analisi non riuscita', {
          description: analysisResult.error,
          duration: 8000
        });
        
        setDiagnosisResult('Analisi non completata - ' + analysisResult.error);
        setAnalysisProgress(0);
        return;
      }
      
      // Enhanced confidence validation
      const confidencePercent = ensureValidPercentage(analysisResult.confidence, 75);
      
      // Check for regulated organisms
      const hasRegulatedOrganisms = analysisResult.diseases?.some(d => (d as any).isRegulated) || false;
      
      const diseaseInfo: DiagnosedDisease = {
        id: `diagnosis-${Date.now()}`,
        name: analysisResult.plantName || 'Pianta identificata',
        description: analysisResult.isHealthy ? 
          `La pianta appare in buona salute secondo l'analisi avanzata EPPO (${confidencePercent}% accuratezza)` :
          `Sono stati rilevati possibili problemi di salute tramite analisi EPPO (${confidencePercent}% accuratezza)`,
        causes: analysisResult.isHealthy ? 'N/A - Pianta sana' : 'Vedere malattie specifiche rilevate nel database EPPO',
        symptoms: analysisResult.diseases?.map(d => {
          const probability = ensureValidPercentage((d as any).probability, 60);
          const regulated = (d as any).isRegulated ? ' [REGOLAMENTATO]' : '';
          return `${d.name} (${probability}%)${regulated}`;
        }) || ['Nessun sintomo specifico'],
        treatments: analysisResult.recommendations || [],
        confidence: confidencePercent,
        healthy: analysisResult.isHealthy || false,
        products: [],
        recommendExpertConsultation: confidencePercent < 70 || hasRegulatedOrganisms,
        disclaimer: hasRegulatedOrganisms ? 
          'ATTENZIONE: Rilevati organismi regolamentati EPPO. Consulenza fitopatologo URGENTE.' :
          confidencePercent < 70 ? 
          'Accuratezza moderata. Consulenza esperta raccomandata per conferma.' : undefined
      };
      
      const detailedAnalysis: AnalysisDetails = {
        multiServiceInsights: {
          plantName: analysisResult.plantName || 'Sconosciuta',
          plantSpecies: analysisResult.scientificName || 'Non determinata',
          plantPart: 'whole plant',
          isHealthy: analysisResult.isHealthy || false,
          isValidPlantImage: true,
          primaryService: 'Enhanced EPPO Analysis',
          agreementScore: confidencePercent / 100,
          huggingFaceResult: {
            label: analysisResult.plantName || 'Pianta',
            score: confidencePercent / 100
          },
          dataSource: 'Enhanced Plant APIs + EPPO Database'
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
          `Accuratezza: ${confidencePercent}%`,
          analysisResult.isHealthy ? 'Pianta sana' : 'Problemi rilevati',
          'Analisi potenziata con database EPPO',
          ...(analysisResult.diseases || []).map(d => {
            const probability = ensureValidPercentage((d as any).probability, 60);
            const regulated = (d as any).isRegulated ? ' [EPPO REGOLAMENTATO]' : '';
            return `${d.name}: ${probability}% probabilità${regulated}`;
          })
        ],
        sistemaDigitaleFoglia: false,
        analysisTechnology: 'Enhanced Plant Analysis with EPPO Database Integration',
        eppoResultsCount: analysisResult.analysisDetails?.eppoResultsCount || 0,
        originalConfidence: analysisResult.analysisDetails?.originalConfidence,
        enhancedConfidence: analysisResult.confidence
      };
      
      setDiagnosedDisease(diseaseInfo);
      setDiagnosisResult(`${analysisResult.plantName} identificata con ${confidencePercent}% di accuratezza (Database EPPO)`);
      setAnalysisDetails(detailedAnalysis);
      setAnalysisProgress(100);
      
      // Enhanced feedback with EPPO integration status
      const eppoCount = analysisResult.analysisDetails?.eppoResultsCount || 0;
      
      if (hasRegulatedOrganisms) {
        toast.error(`⚠️ ATTENZIONE: Organismi regolamentati rilevati! Consulenza urgente necessaria.`);
      } else if (confidencePercent >= 80) {
        toast.success(`✅ Analisi EPPO completata con alta precisione (${confidencePercent}%)! ${eppoCount} corrispondenze trovate.`);
      } else if (confidencePercent >= 60) {
        toast.success(`✅ Analisi EPPO completata (${confidencePercent}%). Consulenza esperta raccomandata. ${eppoCount} corrispondenze trovate.`);
      } else {
        toast.warning(`⚠️ Analisi EPPO completata ma con accuratezza moderata (${confidencePercent}%). Consulenza esperta fortemente raccomandata.`);
      }
      
    } catch (error) {
      console.error('❌ Errore durante l\'analisi EPPO:', error);
      toast.error('Errore durante l\'analisi avanzata', {
        description: 'Si è verificato un errore nell\'analisi EPPO. Riprova o consulta un esperto.',
        duration: 6000
      });
      
      setDiagnosisResult('Errore durante l\'analisi avanzata');
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
