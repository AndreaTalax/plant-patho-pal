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
      console.log('🔬 Avvio diagnosi completa con AI integrata...');
      
      // Importa il servizio diagnosi completo
      const { comprehensivePlantDiagnosisService } = await import('@/services/comprehensivePlantDiagnosisService');
      
      // Avvia la diagnosi completa con progress tracking
      const diagnosis = await comprehensivePlantDiagnosisService.diagnosePlant(
        imageFile,
        (progress) => {
          setAnalysisProgress(progress.progress);
          console.log(`📊 ${progress.step}: ${progress.message}`);
        }
      );
      
      console.log('✅ Diagnosi completa ricevuta:', diagnosis);
      
      // Estrai le informazioni principali
      const plantName = diagnosis.plantIdentification?.name || 'Pianta non identificata';
      const scientificName = diagnosis.plantIdentification?.scientificName || '';
      const isHealthy = diagnosis.healthAssessment?.isHealthy || false;
      const overallScore = diagnosis.healthAssessment?.overallHealthScore || 0.5;
      const diseases = diagnosis.healthAssessment?.diseases || [];
      const pests = diagnosis.healthAssessment?.pests || [];
      const recommendations = diagnosis.recommendations || [];
      
      // Crea il risultato della diagnosi
      const plantHealthStatus = isHealthy ? 'healthy' : 'diseased';
      const confidence = Math.round(diagnosis.confidence * 100);
      
      let diagnosisText = `**Pianta identificata:** ${plantName}`;
      if (scientificName && scientificName !== plantName) {
        diagnosisText += ` (${scientificName})`;
      }
      diagnosisText += `\n**Confidenza identificazione:** ${Math.round(diagnosis.plantIdentification?.confidence * 100)}%`;
      
      if (isHealthy) {
        diagnosisText += `\n\n🌿 **Stato di salute:** Sana (Score: ${Math.round(overallScore * 100)}%)`;
      } else {
        diagnosisText += `\n\n🚨 **Stato di salute:** Problemi rilevati (Score: ${Math.round(overallScore * 100)}%)`;
        
        if (diseases.length > 0) {
          diagnosisText += `\n\n**Malattie rilevate:**`;
          diseases.forEach((disease, index) => {
            diagnosisText += `\n${index + 1}. **${disease.name}** (${Math.round(disease.probability * 100)}%)`;
            if (disease.description) {
              diagnosisText += `\n   ${disease.description}`;
            }
          });
        }
        
        if (pests.length > 0) {
          diagnosisText += `\n\n**Parassiti rilevati:**`;
          pests.forEach((pest, index) => {
            diagnosisText += `\n${index + 1}. **${pest.name}** (${Math.round(pest.probability * 100)}%)`;
            if (pest.description) {
              diagnosisText += `\n   ${pest.description}`;
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
      
      // Ottieni raccomandazioni di trattamento specifiche
      const treatmentRecommendations = comprehensivePlantDiagnosisService.getTreatmentRecommendations(diagnosis);
      if (treatmentRecommendations.length > 0) {
        diagnosisText += `\n\n**Trattamenti suggeriti:**`;
        treatmentRecommendations.forEach((treatment, index) => {
          diagnosisText += `\n${index + 1}. ${treatment}`;
        });
      }
      
      // Aggiungi informazioni sulle fonti
      if (diagnosis.sources.length > 0) {
        diagnosisText += `\n\n**Fonti:** ${diagnosis.sources.join(', ')}`;
      }
      
      setDiagnosisResult(diagnosisText);
      
      // Crea l'oggetto disease per compatibilità
      if (!isHealthy && (diseases.length > 0 || pests.length > 0)) {
        const primaryIssue = diseases.length > 0 ? diseases[0] : pests[0];
        const diagnosedIssue: DiagnosedDisease = {
          id: crypto.randomUUID(),
          name: primaryIssue.name,
          description: primaryIssue.description || 'Nessuna descrizione disponibile',
          causes: 'Cause non specificate',
          symptoms: [],
          treatments: treatmentRecommendations,
          confidence: Math.round(primaryIssue.probability * 100),
          healthy: false,
          products: [],
          disclaimer: 'Questa è una diagnosi AI. Consulta un esperto per conferma.',
          recommendExpertConsultation: true,
          resources: diagnosis.sources,
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
        `Confidenza: ${Math.round(diagnosis.plantIdentification?.confidence * 100)}%`,
        `Stato: ${isHealthy ? 'Sana' : 'Problemi rilevati'}`,
        `Score salute: ${Math.round(overallScore * 100)}%`,
        `Fonti: ${diagnosis.sources.join(', ')}`
      ];
      
      if (diseases.length > 0) {
        analysisFeatures.push(`Malattie: ${diseases.length} rilevate`);
      }
      if (pests.length > 0) {
        analysisFeatures.push(`Parassiti: ${pests.length} rilevati`);
      }
      
      const detailsObj: AnalysisDetails = {
        multiServiceInsights: {
          plantName: plantName,
          plantSpecies: scientificName,
          isHealthy: isHealthy,
          isValidPlantImage: true,
          primaryService: 'Comprehensive AI Analysis',
          agreementScore: confidence / 100,
          dataSource: diagnosis.sources.join(', ')
        },
        identifiedFeatures: analysisFeatures,
        analysisTechnology: 'Multi-AI Comprehensive Analysis',
        originalConfidence: confidence,
        enhancedConfidence: confidence
      };
      
      setAnalysisDetails(detailsObj);
      setAnalysisProgress(100);
      
      toast.success(`✅ Diagnosi completata: ${plantName} ${isHealthy ? '(Sana)' : '(Problemi rilevati)'}`);
      
    } catch (error) {
      console.error('❌ Errore durante l\'analisi:', error);
      toast.error('Errore durante l\'analisi', {
        description: 'Si è verificato un errore. Riprova o consulta un esperto.',
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