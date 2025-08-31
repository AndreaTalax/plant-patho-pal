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
import { VisualPlantAnalysisService } from '@/services/visualPlantAnalysisService';

// Visual symptoms mapping for better symptom detection
const visualSymptomsMap = {
  'yellow spots': {
    symptoms: ['macchie gialle', 'ingiallimento fogliare', 'clorosi'],
    possibleDiseases: ['septoria leaf spot', 'bacterial spot', 'fungal leaf spot', 'nutrient deficiency']
  },
  'brown spots': {
    symptoms: ['macchie marroni', 'necrosi fogliare', 'lesioni scure'],
    possibleDiseases: ['blight', 'anthracnose', 'leaf spot', 'bacterial canker']
  },
  'wilting': {
    symptoms: ['appassimento', 'foglie cadenti', 'perdita di turgore'],
    possibleDiseases: ['bacterial wilt', 'fusarium wilt', 'root rot', 'water stress']
  },
  'white powder': {
    symptoms: ['polvere bianca', 'muffa bianca', 'patina biancastra'],
    possibleDiseases: ['powdery mildew', 'oidio', 'white mold']
  },
  'black spots': {
    symptoms: ['macchie nere', 'lesioni scure', 'necrosi'],
    possibleDiseases: ['black spot', 'sooty mold', 'bacterial spot', 'fungal infection']
  },
  'curled leaves': {
    symptoms: ['foglie arricciate', 'deformazioni fogliari', 'accartocciamento'],
    possibleDiseases: ['leaf curl virus', 'aphid damage', 'herbicide damage', 'heat stress']
  }
};

// Function to analyze visual symptoms from label/description
const analyzeVisualSymptoms = (label: string, description?: string): { 
  detectedSymptoms: string[], 
  visualAnalysis: string,
  linkedDiseases: string[]
} => {
  const text = `${label} ${description || ''}`.toLowerCase();
  const detectedSymptoms: string[] = [];
  const linkedDiseases: string[] = [];
  let visualAnalysis = '';

  // Check for visual symptoms
  Object.entries(visualSymptomsMap).forEach(([key, data]) => {
    const isPresent = data.symptoms.some(symptom => 
      text.includes(symptom.toLowerCase()) || 
      text.includes(key.toLowerCase())
    );
    
    if (isPresent) {
      detectedSymptoms.push(...data.symptoms);
      linkedDiseases.push(...data.possibleDiseases);
      
      if (!visualAnalysis) {
        if (key === 'yellow spots') {
          visualAnalysis = 'Rilevate macchie gialle sulle foglie, tipiche di infezioni fungine o carenze nutrizionali';
        } else if (key === 'brown spots') {
          visualAnalysis = 'Osservate macchie marroni, indicative di malattie batteriche o fungine';
        } else if (key === 'wilting') {
          visualAnalysis = 'Segni di appassimento visibili, possibile stress idrico o malattie vascolari';
        } else if (key === 'white powder') {
          visualAnalysis = 'Presenza di patina biancastra, caratteristica dell\'oidio';
        } else if (key === 'black spots') {
          visualAnalysis = 'Macchie nere evidenti, sintomo di infezioni batteriche o fungine';
        } else if (key === 'curled leaves') {
          visualAnalysis = 'Foglie arricciate osservate, possibile stress ambientale o virale';
        }
      }
    }
  });

  // Generic visual analysis if no specific symptoms detected
  if (!visualAnalysis) {
    if (text.includes('spot') || text.includes('macchia')) {
      visualAnalysis = 'Macchie visibili sulla superficie fogliare';
      detectedSymptoms.push('macchie fogliari');
    } else if (text.includes('yellow') || text.includes('giallo')) {
      visualAnalysis = 'Ingiallimento fogliare osservato';
      detectedSymptoms.push('ingiallimento');
    } else if (text.includes('brown') || text.includes('marrone')) {
      visualAnalysis = 'Imbrunimento dei tessuti vegetali';
      detectedSymptoms.push('imbrunimento');
    } else {
      visualAnalysis = 'Anomalie visive rilevate sui tessuti vegetali';
    }
  }

  return {
    detectedSymptoms: [...new Set(detectedSymptoms)],
    visualAnalysis,
    linkedDiseases: [...new Set(linkedDiseases)]
  };
};

// Function to generate causes from visual analysis
const generateCausesFromVisualAnalysis = (analysis: any): string[] => {
  const causes = [];
  
  if (analysis.leafCondition?.yellowing) {
    causes.push('Ingiallimento fogliare: possibile carenza nutrizionale o eccesso idrico');
  }
  if (analysis.leafCondition?.spots) {
    causes.push('Macchie fogliari: probabile infezione fungina o batterica');
  }
  if (analysis.leafCondition?.dryness) {
    causes.push('Secchezza fogliare: insufficiente irrigazione o bassa umidità ambientale');
  }
  if (analysis.stemAndFlowerCondition?.deterioration) {
    causes.push('Deperimento di steli/fiori: stress della pianta o malattie vascolari');
  }
  if (analysis.stemAndFlowerCondition?.pests) {
    causes.push('Presenza di parassiti: infestazione da insetti o acari');
  }
  if (analysis.generalGrowth?.drooping) {
    causes.push('Portamento cadente: stress idrico, problemi radicali o carenza di luce');
  }
  
  return causes.length > 0 ? causes : ['Analisi delle cause basata su osservazione diretta dell\'immagine'];
};

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

      // NUOVA FASE: Analisi visiva dettagliata dell'immagine
      setAnalysisProgress(30);
      console.log('👁️ Avvio analisi visiva dettagliata dell\'immagine...');
      const visualAnalysis = await VisualPlantAnalysisService.analyzeVisualConditions(imageBase64);
      
      setAnalysisProgress(50);

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

      // Integra l'analisi visiva con CAUSE sempre in italiano
      // - Prendo le cause dell'AI solo se sono specifiche e non il fallback "Analisi automatica non disponibile"
      const generatedCauses = generateCausesFromVisualAnalysis(visualAnalysis);
      const aiCauses = (visualAnalysis.specificCauses || []).filter((c: string) => 
        c && !/analisi automatica non disponibile/i.test(c)
      );
      const finalCauses = aiCauses.length > 0 ? aiCauses : generatedCauses;

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

      // Costruiamo una lista ordinata di ipotesi (prime 3)
      let ranked = (Array.isArray(diseases) ? diseases : [])
        .filter((d: any) => d && typeof d === 'object' && typeof (d.name || d.label) === 'string')
        .map((d: any) => ({
          name: d.name || d.label,
          probability: typeof d.probability === 'number' ? d.probability : (typeof d.score === 'number' ? d.score : 0.6),
          description: d.description || '',
          symptoms: d.symptoms || [],
          treatment: d.treatment || {}
        }))
        .sort((a: any, b: any) => (b.probability || 0) - (a.probability || 0))
        .slice(0, 3);

      // Analisi visiva dei sintomi per ogni malattia rilevata
      let visualSymptomsAnalysis = '';
      const allDetectedSymptoms: string[] = [];
      
      if (!isHealthy && ranked.length > 0) {
        ranked.forEach((disease, index) => {
          const symptomAnalysis = analyzeVisualSymptoms(disease.name, disease.description);
          allDetectedSymptoms.push(...symptomAnalysis.detectedSymptoms);
          
          if (index === 0 && symptomAnalysis.visualAnalysis) {
            visualSymptomsAnalysis = symptomAnalysis.visualAnalysis;
          }
        });
      }

      // Recalibrazione: evita falsi positivi e ripetizioni
      // - Se non ci sono ipotesi o sono deboli e non abbiamo sintomi visivi forti, marchiamo come SANA.
      const topProb = ranked[0]?.probability ?? 0;
      const hasVisual = allDetectedSymptoms.length > 0 || Boolean(visualSymptomsAnalysis);
      const strongTerms = ['oidio', 'muffa', 'ruggine', 'necrosi', 'peronospora', 'cancro', 'afidi', 'virus'];      
      const hasStrongVisual = allDetectedSymptoms.some(s =>
        strongTerms.some(t => s.toLowerCase().includes(t))
      );

      const needsHealthyOverride =
        // nessuna ipotesi → sano
        ranked.length === 0
        // ipotesi deboli e nessun sintomo visivo
        || (topProb < 0.55 && !hasVisual)
        // pochi sintomi deboli + probabilità bassa
        || (!hasStrongVisual && allDetectedSymptoms.length <= 1 && topProb < 0.5);

      if (needsHealthyOverride) {
        console.log('🟢 Healthy override attivato: ipotesi deboli o nessuna evidenza visiva.');
        isHealthy = true;
        diseases = [];
        ranked = [];
        visualSymptomsAnalysis = '';
        // Svuotiamo i sintomi visivi rilevati
        while (allDetectedSymptoms.length) allDetectedSymptoms.pop();
      }

      // Costruiamo il testo della diagnosi con l'analisi visiva integrata
      const visualReport = VisualPlantAnalysisService.formatVisualAnalysisForDisplay(visualAnalysis);
      
      let diagnosisText = `🌿 Pianta: ${plantName}`;
      if (scientificName && scientificName !== plantName) diagnosisText += ` (*${scientificName}*)`;
      diagnosisText += `\n🎯 Confidenza: ${confidencePct}%`;
      diagnosisText += `\n💚 Stato: ${isHealthy ? 'Sana' : 'Possibili problemi'}`;

      // Aggiungi l'analisi visiva dettagliata
      diagnosisText += `\n\n${visualReport}`;

      // Aggiungiamo ipotesi principali (se presenti) con collegamento ai sintomi
      if (!isHealthy && ranked.length > 0) {
        diagnosisText += `\n\n🧪 Ipotesi principali:`;
        ranked.forEach((r, idx) => {
          const pct = Math.round((r.probability || 0) * 100);
          const symptomAnalysis = analyzeVisualSymptoms(r.name, r.description);
          diagnosisText += `\n${idx + 1}. ${r.name} (${pct}%)`;
          if (symptomAnalysis.detectedSymptoms.length > 0) {
            diagnosisText += `\n   Sintomi: ${symptomAnalysis.detectedSymptoms.slice(0, 2).join(', ')}`;
          }
        });
      }

      // Dettaglio prima ipotesi (se disponibile) per compatibilità con UI esistente
      if (!isHealthy && ranked.length > 0) {
        const top = ranked[0];
        if (top) {
          diagnosisText += `\n\n🔍 Possibile malattia: ${top.name} (${Math.round((top.probability || 0.7) * 100)}%)`;
          if (top.description) diagnosisText += `\nDescrizione: ${top.description}`;
          
          const topSymptomAnalysis = analyzeVisualSymptoms(top.name, top.description);
          if (topSymptomAnalysis.visualAnalysis) {
            diagnosisText += `\nAnalisi visiva: ${topSymptomAnalysis.visualAnalysis}`;
          }
        }
      }

      setDiagnosisResult(diagnosisText);

      // Popola struttura diagnosedDisease con cause finali in italiano
      const primary = !isHealthy && ranked.length > 0 ? ranked[0] : null;
      const primarySymptomAnalysis = primary ? analyzeVisualSymptoms(primary.name, primary.description) : null;
      
      setDiagnosedDisease(primary ? {
        id: crypto.randomUUID(),
        name: primary.name,
        description: primary.description || 'Problema rilevato',
        causes: finalCauses.join('; ') || 'Cause multiple rilevate dall\'analisi visiva',
        symptoms: primarySymptomAnalysis ? 
          [...(primary.symptoms || []), ...primarySymptomAnalysis.detectedSymptoms] : 
          (primary.symptoms || []),
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
        causes: 'Nessuna causa di preoccupazione rilevata',
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

      // Salviamo le ipotesi e le cause nei dettagli (in italiano)
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
        analysisTechnology: 'OpenAI + Plant.ID + PlantNet + EPPO + Visual Analysis',
        originalConfidence: confidencePct,
        enhancedConfidence: confidencePct,
        visualSymptoms: allDetectedSymptoms,
        visualAnalysis: visualAnalysis,
        visualReport: visualReport,
        specificCauses: finalCauses,
        possibleDiseases: ranked.map(r => {
          const symptomAnalysis = analyzeVisualSymptoms(r.name, r.description);
          return {
            name: r.name,
            probability: r.probability,
            description: r.description,
            symptoms: r.symptoms,
            treatment: r.treatment,
            visualSymptoms: symptomAnalysis.detectedSymptoms,
            visualAnalysis: symptomAnalysis.visualAnalysis
          };
        })
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
