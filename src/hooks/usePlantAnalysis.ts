import { useState } from 'react';
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
      console.log('🔬 Avvio analisi avanzata con validazione migliorata...');
      
      // Usa il nuovo sistema di validazione avanzato
      const { performEnhancedPlantAnalysis } = await import('@/utils/plant-analysis/enhancedPlantAnalysis');
      
      setAnalysisProgress(10);
      console.log('📋 Validazione immagine in corso...');
      
      // Esegui l'analisi con il nuovo sistema
      const diagnosis = await performEnhancedPlantAnalysis(imageFile, plantInfo);
      
      setAnalysisProgress(50);
      
      if (!diagnosis.success) {
        throw new Error(diagnosis.error || 'Analisi fallita');
      }
      
      console.log('✅ Analisi avanzata completata:', diagnosis);
      
      // Usa direttamente i dati dal nuovo sistema di validazione
      const plantName = diagnosis.plantName;
      const scientificName = diagnosis.scientificName || '';
      const isHealthy = diagnosis.isHealthy;
      const diseases = diagnosis.diseases || [];
      const recommendations = diagnosis.recommendations || [];
      const confidence = Math.round(diagnosis.confidence * 100);
      
      setAnalysisProgress(75);
      
      let diagnosisText = `**Pianta identificata:** ${plantName}`;
      if (scientificName && scientificName !== plantName) {
        diagnosisText += ` (${scientificName})`;
      }
      diagnosisText += `\n**Confidenza identificazione:** ${confidence}%`;
      
      if (isHealthy) {
        diagnosisText += `\n\n🌿 **Stato di salute:** Sana`;
      } else {
        diagnosisText += `\n\n🚨 **Stato di salute:** Problemi rilevati`;
        
        if (diseases.length > 0) {
          diagnosisText += `\n\n**Problemi rilevati:**`;
          diseases.forEach((disease, index) => {
            diagnosisText += `\n${index + 1}. **${disease.name}** (${Math.round((disease.probability || 0) * 100)}%)`;
            if (disease.description) {
              diagnosisText += `\n   ${disease.description}`;
            }
            if (disease.treatment) {
              diagnosisText += `\n   **Trattamento:** ${disease.treatment}`;
            }
          });
        }
      }
      
      if (recommendations.length > 0) {
        diagnosisText += `\n\n**Raccomandazioni:**`;
        recommendations.forEach((rec, index) => {
          diagnosisText += `\n${index + 1}. ${rec}`;
        });
      }
      
      // Aggiungi informazioni sulla qualità dell'analisi
      if (diagnosis.analysisDetails?.source) {
        diagnosisText += `\n\n**Fonte:** ${diagnosis.analysisDetails.source}`;
      }
      
      setDiagnosisResult(diagnosisText);
      
      // Crea l'oggetto disease per compatibilità se ci sono problemi
      if (!isHealthy && diseases.length > 0) {
        const primaryIssue = diseases[0];
        const diagnosedIssue: DiagnosedDisease = {
          id: crypto.randomUUID(),
          name: primaryIssue.name,
          description: primaryIssue.description || 'Nessuna descrizione disponibile',
          causes: 'Determinato attraverso analisi AI avanzata',
          symptoms: [],
          treatments: primaryIssue.treatment ? [primaryIssue.treatment] : recommendations,
          confidence: Math.round((primaryIssue.probability || 0) * 100),
          healthy: false,
          products: [],
          disclaimer: 'Questa è una diagnosi AI con validazione avanzata. Consulta un esperto per conferma.',
          recommendExpertConsultation: confidence < 80,
          resources: [diagnosis.analysisDetails?.source || 'Analisi AI'],
          label: primaryIssue.name,
          disease: {
            name: primaryIssue.name
          }
        };
        setDiagnosedDisease(diagnosedIssue);
      }
      
      // Crea i dettagli dell'analisi
      const analysisFeatures = [
        `Identificazione: ${plantName}`,
        `Confidenza: ${confidence}%`,
        `Stato: ${isHealthy ? 'Sana' : 'Problemi rilevati'}`,
        `Qualità immagine: ${Math.round((diagnosis.analysisDetails?.imageQuality || 0) * 100)}%`
      ];
      
      if (diseases.length > 0) {
        analysisFeatures.push(`Problemi rilevati: ${diseases.length}`);
      }
      
      const detailsObj: AnalysisDetails = {
        multiServiceInsights: {
          plantName: plantName,
          plantSpecies: scientificName,
          isHealthy: isHealthy,
          isValidPlantImage: true,
          primaryService: diagnosis.analysisDetails?.source || 'Enhanced Analysis',
          agreementScore: confidence / 100,
          dataSource: diagnosis.analysisDetails?.source || 'Enhanced AI Analysis'
        },
        identifiedFeatures: analysisFeatures,
        analysisTechnology: 'Enhanced AI Analysis with Advanced Validation',
        originalConfidence: confidence,
        enhancedConfidence: confidence
      };
      
      setAnalysisDetails(detailsObj);
      setAnalysisProgress(100);
      
      toast.success(`✅ Analisi completata: ${plantName} ${isHealthy ? '(Sana)' : '(Problemi rilevati)'}`);
      
    } catch (error: any) {
      console.error('❌ Errore durante l\'analisi:', error);
      
      let errorMessage = 'Errore durante l\'analisi';
      let errorDescription = 'Si è verificato un errore. Riprova o consulta un esperto.';
      
      if (error.message?.includes('NOT_A_PLANT')) {
        errorMessage = 'Immagine non valida';
        errorDescription = 'L\'immagine caricata non sembra contenere una pianta. Carica un\'immagine con una pianta chiaramente visibile.';
      } else if (error.message?.includes('INVALID_IMAGE')) {
        errorMessage = 'Qualità immagine insufficiente';
        errorDescription = 'La qualità dell\'immagine non è sufficiente per l\'analisi. Usa un\'immagine più chiara e nitida.';
      } else if (error.message?.includes('API_ERROR')) {
        errorMessage = 'Servizio temporaneamente non disponibile';
        errorDescription = 'Il servizio di analisi è temporaneamente non disponibile. Riprova tra qualche minuto.';
      }
      
      toast.error(errorMessage, {
        description: errorDescription,
        duration: 6000
      });
      
      setDiagnosisResult(`Errore: ${errorMessage}`);
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