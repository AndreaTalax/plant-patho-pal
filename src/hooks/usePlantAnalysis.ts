import { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
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
      
      // Prima controlla se le API sono configurate
      setAnalysisProgress(5);
      const { data: apiStatus } = await supabase.functions.invoke('check-api-status');
      
      if (!apiStatus || (!apiStatus.openai && !apiStatus.plantid && !apiStatus.eppo)) {
        throw new Error('API_NOT_CONFIGURED: Nessuna API di diagnosi configurata. Configura almeno OpenAI, Plant.ID o EPPO per abilitare la diagnosi AI.');
      }
      
      // Usa il nuovo sistema di diagnosi avanzata con GPT-4o
      setAnalysisProgress(10);
      console.log('📋 Conversione immagine per analisi avanzata...');
      
      // Converti l'immagine in base64
      const arrayBuffer = await imageFile.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      
      setAnalysisProgress(20);
      console.log('🔬 Chiamando diagnosi avanzata con AI...');
      
      const advancedResponse = await supabase.functions.invoke('advanced-plant-diagnosis', {
        body: { 
          imageBase64: base64, 
          plantInfo: {
            symptoms: plantInfo?.symptoms,
            plantName: plantInfo?.name,
            isIndoor: plantInfo?.isIndoor,
            wateringFrequency: plantInfo?.wateringFrequency,
            lightExposure: plantInfo?.lightExposure
          }
        }
      });

      if (advancedResponse.error) {
        throw new Error(advancedResponse.error.message);
      }

      if (!advancedResponse.data?.success) {
        throw new Error(advancedResponse.data?.error || 'Errore nella diagnosi avanzata');
      }

      const { diagnosis } = advancedResponse.data;
      console.log('✅ Diagnosi avanzata completata:', diagnosis);
      
      // Estrai dati dalla nuova struttura di diagnosi avanzata
      const plantName = diagnosis.plantIdentification.name;
      const scientificName = diagnosis.plantIdentification.scientificName;
      const family = diagnosis.plantIdentification.family;
      const isHealthy = diagnosis.healthAnalysis.isHealthy;
      const issues = diagnosis.healthAnalysis.issues || [];
      const recommendations = [
        ...diagnosis.recommendations.immediate,
        ...diagnosis.recommendations.longTerm
      ];
      const confidence = Math.round(diagnosis.plantIdentification.confidence * 100);
      const healthScore = Math.round(diagnosis.healthAnalysis.overallScore * 100);
      
      setAnalysisProgress(75);
      
      let diagnosisText = `**🌿 Pianta identificata:** ${plantName}`;
      if (scientificName && scientificName !== plantName) {
        diagnosisText += ` (*${scientificName}*)`;
      }
      if (family) {
        diagnosisText += `\n**📚 Famiglia:** ${family}`;
      }
      diagnosisText += `\n**🎯 Confidenza identificazione:** ${confidence}%`;
      diagnosisText += `\n**💚 Punteggio salute:** ${healthScore}%`;
      
      if (isHealthy) {
        diagnosisText += `\n\n✅ **Stato di salute:** Pianta sana!`;
      } else {
        diagnosisText += `\n\n⚠️ **Stato di salute:** Problemi rilevati`;
        
        if (issues.length > 0) {
          diagnosisText += `\n\n**🔍 Problemi identificati:**`;
          issues.forEach((issue, index) => {
            const severityIcon = issue.severity === 'high' ? '🔴' : issue.severity === 'medium' ? '🟡' : '🟢';
            diagnosisText += `\n\n${index + 1}. ${severityIcon} **${issue.name}** (${issue.type})`;
            diagnosisText += `\n   **Gravità:** ${issue.severity} - **Confidenza:** ${Math.round(issue.confidence * 100)}%`;
            if (issue.description) {
              diagnosisText += `\n   **Descrizione:** ${issue.description}`;
            }
            if (issue.symptoms && issue.symptoms.length > 0) {
              diagnosisText += `\n   **Sintomi:** ${issue.symptoms.join(', ')}`;
            }
            if (issue.treatment && issue.treatment.length > 0) {
              diagnosisText += `\n   **Trattamento:** ${issue.treatment.join(', ')}`;
            }
          });
        }
      }
      
      if (recommendations.length > 0) {
        diagnosisText += `\n\n**📋 Raccomandazioni:**`;
        recommendations.forEach((rec, index) => {
          diagnosisText += `\n${index + 1}. ${rec}`;
        });
      }
      
      // Aggiungi istruzioni di cura specifiche
      const { careInstructions } = diagnosis;
      if (careInstructions) {
        diagnosisText += `\n\n**🌱 Istruzioni di cura specifiche:**`;
        if (careInstructions.watering) {
          diagnosisText += `\n💧 **Irrigazione:** ${careInstructions.watering}`;
        }
        if (careInstructions.light) {
          diagnosisText += `\n☀️ **Luce:** ${careInstructions.light}`;
        }
        if (careInstructions.temperature) {
          diagnosisText += `\n🌡️ **Temperatura:** ${careInstructions.temperature}`;
        }
        if (careInstructions.fertilization) {
          diagnosisText += `\n🌿 **Fertilizzazione:** ${careInstructions.fertilization}`;
        }
      }
      
      diagnosisText += `\n\n**🔬 Fonte:** Analisi AI avanzata con GPT-4o Vision`;
      
      setDiagnosisResult(diagnosisText);
      
      // Crea l'oggetto disease per compatibilità se ci sono problemi
      if (!isHealthy && issues.length > 0) {
        const primaryIssue = issues[0];
        const diagnosedIssue: DiagnosedDisease = {
          id: crypto.randomUUID(),
          name: primaryIssue.name,
          description: primaryIssue.description || 'Nessuna descrizione disponibile',
          causes: 'Determinato attraverso analisi AI avanzata',
          symptoms: primaryIssue.symptoms || [],
          treatments: primaryIssue.treatment || recommendations,
          confidence: Math.round(primaryIssue.confidence * 100),
          healthy: false,
          products: [],
          disclaimer: 'Questa è una diagnosi AI avanzata con GPT-4o Vision. Consulta un esperto per conferma.',
          recommendExpertConsultation: confidence < 80,
          resources: ['Analisi AI Avanzata'],
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
      
      if (issues.length > 0) {
        analysisFeatures.push(`Problemi rilevati: ${issues.length}`);
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
      
      if (error.message?.includes('NOT_A_PLANT') || error.message?.includes('INVALID_IMAGE')) {
        errorMessage = 'Immagine non valida';
        // Extract the specific error message if available
        const specificError = error.message.split('INVALID_IMAGE: ')[1] || error.message.split('NOT_A_PLANT: ')[1];
        errorDescription = specificError || 'L\'immagine caricata non sembra contenere una pianta. Carica un\'immagine con una pianta chiaramente visibile.';
      } else if (error.message?.includes('API_ERROR')) {
        errorMessage = 'Servizio temporaneamente non disponibile';
        errorDescription = 'Il servizio di analisi è temporaneamente non disponibile. Riprova tra qualche minuto.';
      } else if (error.message?.includes('API_NOT_CONFIGURED')) {
        errorMessage = 'Servizio non configurato';
        errorDescription = 'Il servizio di diagnosi non è ancora configurato. Contatta l\'amministratore.';
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