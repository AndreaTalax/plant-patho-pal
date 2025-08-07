import { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useImageValidation } from './useImageValidation';
import type { PlantInfo } from '@/components/diagnose/types';
import type { AnalysisDetails, DiagnosedDisease } from '@/components/diagnose/types';

export const usePlantAnalysis = () => {
  const { user } = useAuth();
  const { validateImage, isValidating } = useImageValidation();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [diagnosisResult, setDiagnosisResult] = useState<string | null>(null);
  const [diagnosedDisease, setDiagnosedDisease] = useState<DiagnosedDisease | null>(null);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisDetails, setAnalysisDetails] = useState<AnalysisDetails | null>(null);

  const analyzeUploadedImage = async (imageFile: File, plantInfo?: PlantInfo): Promise<void> => {
    // FASE 1: Validazione rapida immagine (controllo se è una pianta)
    console.log('🔍 FASE 1: Validazione rapida immagine...');
    const validationResult = await validateImage(imageFile);
    
    if (!validationResult.isValid) {
      console.log('❌ Validazione fallita:', validationResult.reason);
      toast.error('Immagine non valida per diagnosi', {
        description: `${validationResult.reason}. Carica una foto che mostra chiaramente una pianta.`,
        duration: 6000
      });
      return;
    }

    console.log('✅ Validazione superata, procedo con diagnosi completa...');
    toast.success('Pianta rilevata, avvio diagnosi...', {
      description: `Confidenza: ${validationResult.confidence.toFixed(1)}%`,
      duration: 2000
    });
    
    // FASE 2: Diagnosi completa (solo se validazione ok)
    setIsAnalyzing(true);
    setDiagnosisResult(null);
    setDiagnosedDisease(null);
    setAnalysisProgress(0);
    setAnalysisDetails(null);

    try {
      console.log('🔬 Avvio diagnosi unificata AI avanzata...');
      
      // Controlla se le API sono configurate
      setAnalysisProgress(5);
      const { data: apiStatus } = await supabase.functions.invoke('check-api-status');
      
      if (!apiStatus || (!apiStatus.openai && !apiStatus.plantid && !apiStatus.eppo && !apiStatus.plantnet)) {
        throw new Error('API_NOT_CONFIGURED: Nessuna API di diagnosi configurata. Configura almeno una tra OpenAI, Plant.ID, PlantNet o EPPO per abilitare la diagnosi AI.');
      }
      
      setAnalysisProgress(10);
      console.log('📋 Preparazione immagine per diagnosi unificata...');
      
      // Converti l'immagine in base64 con formato corretto
      const arrayBuffer = await imageFile.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      let binary = '';
      for (let i = 0; i < uint8Array.byteLength; i++) {
        binary += String.fromCharCode(uint8Array[i]);
      }
      const base64 = btoa(binary);
      const imageBase64 = `data:${imageFile.type};base64,${base64}`;
      
      setAnalysisProgress(20);
      console.log('🔬 Chiamando diagnosi unificata con AI avanzata...');
      
      // FASE 1: Identificazione accurata della pianta
      console.log('🌿 FASE 1: Identificazione della pianta...');
      setAnalysisProgress(25);
      
      const identificationResponse = await supabase.functions.invoke('enhanced-plant-identification', {
        body: { imageBase64 }
      });
      
      let plantIdentification = null;
      if (identificationResponse.data?.success) {
        plantIdentification = identificationResponse.data.identificazione;
        console.log('✅ Pianta identificata:', plantIdentification.consensus.mostProbabile?.nomeComune);
      }
      
      // FASE 2: Diagnosi malattie con informazioni della pianta identificata
      setAnalysisProgress(40);
      console.log('🔬 FASE 2: Diagnosi malattie...');
      
      // Usa la nuova edge function unificata con informazioni della pianta identificata
      const diagnosisResponse = await supabase.functions.invoke('unified-plant-diagnosis', {
        body: { 
          imageBase64,
          plantInfo: {
            symptoms: plantInfo?.symptoms,
            plantName: plantIdentification?.consensus?.mostProbabile?.nomeComune || plantInfo?.name,
            scientificName: plantIdentification?.consensus?.mostProbabile?.nomeScientifico,
            isIndoor: plantInfo?.isIndoor,
            wateringFrequency: plantInfo?.wateringFrequency,
            lightExposure: plantInfo?.lightExposure
          }
        }
      });

      console.log('📊 Risposta diagnosi:', diagnosisResponse);

      if (diagnosisResponse.error) {
        throw new Error(diagnosisResponse.error.message || 'Errore nella chiamata alla diagnosi');
      }

      // Anche se la diagnosi ha avvertimenti, procedi comunque se c'è un risultato
      if (!diagnosisResponse.data?.success && !diagnosisResponse.data?.diagnosis) {
        const errorMsg = diagnosisResponse.data?.error || 'Errore nella diagnosi unificata';
        if (errorMsg.includes('non valida') || errorMsg.includes('not valid')) {
          throw new Error('INVALID_IMAGE: ' + errorMsg);
        }
        throw new Error('API_ERROR: ' + errorMsg);
      }
      
      // Se la diagnosi ha successo parziale (con avvertimenti), procedi comunque
      if (!diagnosisResponse.data?.success && diagnosisResponse.data?.diagnosis) {
        console.log('⚠️ Diagnosi con avvertimenti:', diagnosisResponse.data.error);
      }

      const { diagnosis, validation } = diagnosisResponse.data;

      // Pulisci i dati corrotti da MaxDepthReached
      const cleanDiagnosis = cleanMaxDepthData(diagnosis);
      
      console.log('✅ Diagnosi unificata completata:', cleanDiagnosis);
      
      // Estrai dati dalla struttura di diagnosi pulita
      const plantName = cleanDiagnosis?.plantIdentification?.name || 'Pianta non identificata';
      const scientificName = cleanDiagnosis?.plantIdentification?.scientificName || '';
      const family = cleanDiagnosis?.plantIdentification?.family || '';
      const isHealthy = cleanDiagnosis?.healthAnalysis?.isHealthy ?? true;
      const issues = cleanDiagnosis?.healthAnalysis?.issues?.filter(issue => issue && typeof issue === 'object') || [];
      const recommendations = [
        ...(cleanDiagnosis?.recommendations?.immediate || []),
        ...(cleanDiagnosis?.recommendations?.longTerm || [])
      ];
      const confidence = Math.round((cleanDiagnosis?.plantIdentification?.confidence || 0.7) * 100);
      const healthScore = Math.round((cleanDiagnosis?.healthAnalysis?.overallScore || 0.8) * 100);
      
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
      
      // Aggiungi informazioni dalle fonti aggiuntive
      let sourceInfo = `\n\n**🔬 Fonti utilizzate:**`;
      sourceInfo += `\n• OpenAI GPT-4o Vision (Diagnosi principale)`;
      
      // PlantNet info
      if (diagnosis.crossValidation?.plantNet) {
        const plantNet = diagnosis.crossValidation.plantNet;
        sourceInfo += `\n• PlantNet (Identificazione: ${plantNet.confidence ? Math.round(plantNet.confidence * 100) : 'N/A'}%)`;
        if (plantNet.species) {
          sourceInfo += ` - ${plantNet.species}`;
        }
      }
      
      // Plant.ID info
      if (diagnosis.crossValidation?.plantId) {
        sourceInfo += `\n• Plant.ID (Validazione incrociata)`;
      }
      
      // EPPO Database info
      if (diagnosis.crossValidation?.eppo) {
        const eppo = diagnosis.crossValidation.eppo;
        const totalResults = (eppo.plants?.length || 0) + (eppo.diseases?.length || 0) + (eppo.pests?.length || 0);
        if (totalResults > 0) {
          sourceInfo += `\n• Database EPPO (${totalResults} risultati fitosanitari)`;
          if (eppo.diseases?.length > 0) {
            sourceInfo += `\n  - ${eppo.diseases.length} malattie identificate`;
          }
          if (eppo.pests?.length > 0) {
            sourceInfo += `\n  - ${eppo.pests.length} parassiti identificati`;
          }
        }
      }
      
      diagnosisText += sourceInfo;
      
      setDiagnosisResult(diagnosisText);
      
      // SEMPRE crea l'oggetto diagnosedDisease per la visualizzazione
      let primaryIssue = null;
      if (!isHealthy && issues.length > 0) {
        primaryIssue = issues[0];
      }
      
      const diagnosedIssue: any = {
        id: crypto.randomUUID(),
        name: primaryIssue ? primaryIssue.name : 'Analisi completata',
        description: primaryIssue ? (primaryIssue.description || 'Problemi rilevati') : 'Pianta analizzata con successo',
        causes: 'Determinato attraverso analisi AI avanzata',
        symptoms: primaryIssue ? (primaryIssue.symptoms || []) : [],
        treatments: primaryIssue ? (primaryIssue.treatment || recommendations) : recommendations,
        confidence: Math.round(confidence),
        healthy: isHealthy,
        products: [],
        disclaimer: 'Questa è una diagnosi AI avanzata con GPT-4o Vision. Consulta un esperto per conferma.',
        recommendExpertConsultation: confidence < 80,
        resources: ['Analisi AI Avanzata'],
        label: primaryIssue ? primaryIssue.name : plantName,
        disease: {
          name: primaryIssue ? primaryIssue.name : 'Nessun problema rilevato'
        },
        // Aggiungi i dati necessari per la visualizzazione nel frontend
        plantName: plantName,
        scientificName: scientificName,
        isHealthy: isHealthy,
        diseases: issues || []
      };
      setDiagnosedDisease(diagnosedIssue);
      
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
          primaryService: 'Multi-AI Enhanced Analysis',
          agreementScore: confidence / 100,
          dataSource: 'OpenAI + PlantNet + Plant.ID + EPPO Database',
          // Add EPPO data insights using existing properties
          eppoDiseasesFound: diagnosis.crossValidation?.eppo ? 
            (diagnosis.crossValidation.eppo.diseases?.length || 0) + 
            (diagnosis.crossValidation.eppo.pests?.length || 0) : 0
        },
        identifiedFeatures: analysisFeatures,
        analysisTechnology: 'Multi-AI Enhanced Analysis with PlantNet and EPPO Database',
        originalConfidence: confidence,
        enhancedConfidence: confidence,
        // Add comprehensive analysis data using existing EPPO structure
        eppoData: diagnosis.crossValidation?.eppo ? {
          plantMatch: diagnosis.crossValidation.eppo.plants?.[0],
          diseaseMatches: diagnosis.crossValidation.eppo.diseases || [],
          recommendations: {
            diseases: diagnosis.crossValidation.eppo.diseases || [],
            pests: diagnosis.crossValidation.eppo.pests || [],
            careAdvice: recommendations
          }
        } : undefined
      };
      
      setAnalysisDetails(detailsObj);
      setAnalysisProgress(95);
      
      // Nota: Salvataggio Firebase temporaneamente disabilitato per evitare errori CORS
      console.log('ℹ️ Salvataggio Firebase disabilitato temporaneamente');
      
      setAnalysisProgress(100);
      
      toast.success(`✅ Analisi completata: ${plantName} ${isHealthy ? '(Sana)' : '(Problemi rilevati)'}`);
      
      // Log successful analysis
      console.log('✅ Analisi completata per:', plantName);
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

  // Funzione per pulire i dati corrotti da MaxDepthReached
  const cleanMaxDepthData = (obj: any): any => {
    if (!obj || typeof obj !== 'object') return obj;
    
    if (Array.isArray(obj)) {
      return obj.map(cleanMaxDepthData);
    }
    
    if (obj._type === 'MaxDepthReached') {
      return null; // o un valore di default appropriato
    }
    
    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      cleaned[key] = cleanMaxDepthData(value);
    }
    
    return cleaned;
  };

  return {
    isAnalyzing: isAnalyzing || isValidating,
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