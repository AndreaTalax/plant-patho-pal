import { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useImageValidation } from './useImageValidation';
import type { PlantInfo } from '@/components/diagnose/types';
import type { AnalysisDetails, DiagnosedDisease } from '@/components/diagnose/types';
import { DiagnosisConsensusService } from '@/services/diagnosisConsensusService';
import { LocalPlantIdentifier } from '@/services/localPlantIdentifier';
import { eppoApiService } from '@/utils/eppoApiService';
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
      console.log('🔬 Avvio diagnosi completa multi‑AI (OpenAI + Plant.ID + PlantNet + EPPO)...');

      // Esecuzione diagnosi completa tramite edge function esistente
      const compRes = await supabase.functions.invoke('comprehensive-plant-diagnosis', {
        body: { imageBase64 }
      });

      if (compRes.error) {
        throw new Error(compRes.error.message || 'Errore nella diagnosi completa');
      }

      const comp: any = compRes.data;
      if (!comp || !comp.plantIdentification) {
        throw new Error('Risultato diagnosi non valido');
      }

      let plantName = comp.plantIdentification.name || 'Pianta non identificata';
      let scientificName = comp.plantIdentification.scientificName || '';
      // Cap accuracy at 70% for UI consistency
      let confidencePct = Math.min(70, Math.round((comp.plantIdentification.confidence || 0) * 100));

      let diseases = Array.isArray(comp.healthAssessment?.diseases) ? comp.healthAssessment.diseases : [];
      let isHealthy = comp.healthAssessment?.isHealthy === true && diseases.length === 0;

      // Raffinamento consenso multi‑AI (EPPO + altre AI)
      try {
        const consensus = await DiagnosisConsensusService.refineDiagnosis(imageBase64, comp);
        if (consensus) {
          if (Array.isArray(consensus.diseases) && consensus.diseases.length > 0) {
            diseases = consensus.diseases;
          }
          if (typeof consensus.isHealthy === 'boolean') {
            isHealthy = consensus.isHealthy;
          }
        }
      } catch (e) {
        console.warn('Consensus refinement skipped:', e);
      }

      // FALLBACK LOCALE: identifica pianta lato client + EPPO se bassa confidenza o risultato "sana" sospetto
      if ((confidencePct < 40) || (isHealthy && diseases.length === 0)) {
        try {
          const local = await LocalPlantIdentifier.identify(imageFile);
          if (local.plantName) {
            plantName = local.plantName;
            if (!scientificName) scientificName = local.plantName;
            confidencePct = Math.max(confidencePct, local.confidence);

            // Valida contro EPPO e cerca patogeni associati
            const pathogens = await eppoApiService.searchPathogens(local.plantName);
            if (Array.isArray(pathogens) && pathogens.length > 0) {
              isHealthy = false;
              const mapped = pathogens.slice(0, 3).map((p) => ({
                name: p.preferredName,
                probability: 0.6,
                description: p.scientificName || 'Patogeno correlato (EPPO)',
                symptoms: p.symptoms || [],
              }));
              // Mantieni eventuali malattie già individuate, ma dai priorità a EPPO
              diseases = mapped.length ? mapped : diseases;
            }
          }
        } catch (err) {
          console.warn('Fallback locale non riuscito:', err);
        }
      }

      // Testo compatto per UI (niente dettagli tecnici superflui)
      let diagnosisText = `🌿 Pianta: ${plantName}`;
      if (scientificName && scientificName !== plantName) diagnosisText += ` (*${scientificName}*)`;
      diagnosisText += `\n🎯 Confidenza: ${confidencePct}%`;
      diagnosisText += `\n💚 Stato: ${isHealthy ? 'Sana' : 'Possibili problemi'}`;

      if (!isHealthy && diseases.length > 0) {
        const top = diseases
          .filter((d: any) => d && (typeof d === 'object'))
          .sort((a: any, b: any) => (b.probability || 0) - (a.probability || 0))[0];
        if (top) {
          diagnosisText += `\n\n🔍 Possibile malattia: ${top.name} (${Math.round((top.probability || 0) * 100)}%)`;
          if (top.description) diagnosisText += `\nDescrizione: ${top.description}`;
        }
      }

      setDiagnosisResult(diagnosisText);

      // Popola struttura diagnosedDisease minimale per compatibilità UI
      const primary = !isHealthy && diseases.length > 0 ? diseases[0] : null;
      setDiagnosedDisease(primary ? {
        id: crypto.randomUUID(),
        name: primary.name,
        description: primary.description || 'Problema rilevato',
        causes: 'Analisi multi‑AI',
        symptoms: primary.symptoms || [],
        treatments: (primary.treatment && (primary.treatment.biological || primary.treatment.chemical))
          ? [
              ...(primary.treatment.biological || []),
              ...(primary.treatment.chemical || [])
            ]
          : [],
        confidence: Math.min(70, Math.round((primary.probability || 0.7) * 100)),
        healthy: false,
        products: [],
        disclaimer: 'Diagnosi AI. Conferma con un esperto.',
        recommendExpertConsultation: true,
        resources: comp.sources || [],
        label: primary.name,
        disease: { name: primary.name }
      } : {
        id: crypto.randomUUID(),
        name: 'Pianta sana',
        description: 'Nessuna malattia evidente',
        causes: '—',
        symptoms: [],
        treatments: [],
        confidence: confidencePct,
        healthy: true,
        products: [],
        disclaimer: 'Analisi AI. Continua a monitorare.',
        recommendExpertConsultation: false,
        resources: comp.sources || [],
        label: plantName,
        disease: { name: 'Nessuna' }
      });

      setAnalysisDetails({
        multiServiceInsights: {
          plantName,
          plantSpecies: scientificName,
          isHealthy,
          isValidPlantImage: true,
          primaryService: 'Comprehensive AI',
          agreementScore: (comp.plantIdentification.confidence || 0.7),
          dataSource: (comp.sources || []).join(', '),
          eppoDiseasesFound: (comp.sources || []).includes('EPPO') ? (comp.healthAssessment?.diseases?.length || 0) : 0,
        },
        identifiedFeatures: [
          `Confidenza: ${confidencePct}%`,
          `Stato: ${isHealthy ? 'Sana' : 'Problemi'}`
        ],
        analysisTechnology: 'OpenAI + Plant.ID + PlantNet + EPPO',
        originalConfidence: confidencePct,
        enhancedConfidence: confidencePct
      } as any);

      setAnalysisProgress(100);
      setIsAnalyzing(false);
      return;
      
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