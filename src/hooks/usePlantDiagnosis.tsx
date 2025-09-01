
import { useEffect, useMemo, useState } from 'react';
import { usePlantAnalysis } from './usePlantAnalysis';
import { usePlantImageUpload } from './usePlantImageUpload';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { PlantInfo } from '@/components/diagnose/types';

export const usePlantDiagnosis = () => {
  const { user } = useAuth();

  // Nuovo hook analisi
  const { 
    results,
    isAnalyzing,
    progress,
    analyzeImage,
    clearResults,
  } = usePlantAnalysis();

  // Wrapper per compatibilità con usePlantImageUpload
  const analyzeUploadedImage = async (file: File) => {
    console.log('▶️ analyzeUploadedImage wrapper called');
    return analyzeImage(file);
  };

  const {
    uploadedImage,
    setUploadedImage,
    captureImage,
    handleImageUpload,
    stopCameraStream,
    streamRef,
  } = usePlantImageUpload({ analyzeUploadedImage });

  const [isSaving, setIsSaving] = useState(false);

  // Derivati dai risultati
  const diagnosisResult = useMemo(() => {
    const plant = results?.consensus?.mostLikelyPlant;
    if (!plant) return null;
    const conf = Math.min(70, Math.round(plant.confidence || 0));
    return `Pianta identificata: ${plant.plantName}${plant.scientificName ? ` (${plant.scientificName})` : ''} • Affidabilità ${conf}%`;
  }, [results]);

  const diagnosedDisease = useMemo(() => {
    const dis = results?.consensus?.mostLikelyDisease;
    if (!dis) return null;
    return {
      id: dis.disease,
      name: dis.disease,
      description: '',
      causes: dis.additionalInfo?.cause || '',
      symptoms: dis.symptoms || [],
      treatments: dis.treatments || [],
      confidence: Math.min(70, Math.round(dis.confidence || 0)),
      healthy: false,
      label: dis.severity,
    };
  }, [results]);

  const analysisDetails = useMemo(() => {
    if (!results) return null;
    return {
      multiServiceInsights: {
        plantName: results.consensus.mostLikelyPlant?.plantName,
        plantSpecies: results.consensus.mostLikelyPlant?.scientificName,
        isHealthy: !results.consensus.mostLikelyDisease,
        agreementScore: results.consensus.agreementScore,
        primaryService: results.consensus.bestProvider,
        eppoDiseasesFound: results.diseaseDetection?.length || 0,
      },
      identifiedFeatures: [],
      analysisTechnology: 'Global AI + EPPO',
      // Includiamo anche i provider usati per trasparenza
      risultatiCompleti: {
        plantInfo: undefined,
        accuracyGuarantee: undefined,
        plantIdResult: undefined,
        detectedDiseases: results.diseaseDetection,
        eppoPathogens: undefined,
      }
    };
  }, [results]);

  const analysisProgress = useMemo(() => progress?.progress ?? 0, [progress]);

  // Event-based global name update
  useEffect(() => {
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && typeof customEvent.detail === "string") {
        setUploadedImage(prev => prev);
        if (typeof window !== "undefined" && (window as any).setPlantInfo) {
          (window as any).setPlantInfo((prev: any) => ({
            ...prev,
            name: customEvent.detail
          }));
        }
      }
    };
    window.addEventListener("updatePlantInfoName", handler as any);
    return () => window.removeEventListener("updatePlantInfoName", handler as any);
  }, [setUploadedImage]);

  // Salvataggio diagnosi nel database MIGLIORATO
  const saveDiagnosis = async () => {
    if (!user) {
      toast.error('Devi essere autenticato per salvare la diagnosi');
      return;
    }

    if (!results || !uploadedImage) {
      toast.error('Nessuna diagnosi da salvare');
      return;
    }

    setIsSaving(true);
    
    try {
      const plant = results.consensus.mostLikelyPlant;
      const disease = results.consensus.mostLikelyDisease;

      console.log('🔄 Salvando diagnosi migliorata...', {
        user_id: user.id,
        plant,
        disease,
        results
      });

      // Upload immagine se necessario
      let imageUrl = '';
      if (typeof uploadedImage === 'string') {
        imageUrl = uploadedImage;
      } else {
        const fileExt = 'jpg';
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('plant-images')
          .upload(fileName, uploadedImage, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error('❌ Errore upload immagine:', uploadError);
          throw new Error(`Upload fallito: ${uploadError.message}`);
        }

        const { data: { publicUrl } } = supabase.storage
          .from('plant-images')
          .getPublicUrl(fileName);

        imageUrl = publicUrl;
        console.log('📸 Immagine caricata:', imageUrl);
      }

      // Crea un payload JSON-safe completamente serializzabile
      const now = new Date().toISOString();
      const diagnosisResultData = {
        confidence: Math.min(70, Math.round(plant?.confidence || 0)),
        isHealthy: !disease,
        disease: disease?.disease || 'Nessuna malattia rilevata',
        description: diagnosisResult,
        treatments: disease?.treatments || [],
        causes: disease?.additionalInfo?.cause || '',
        severity: disease?.severity || 'N/A',
        timestamp: now,
        // Serializza i risultati completi come stringa JSON
        analysisDetails: analysisDetails ? JSON.stringify(analysisDetails) : null,
        fullResults: results ? JSON.stringify(results) : null
      };

      // Assicurati che tutto sia JSON-safe
      const safeDiagnosisResult = JSON.parse(JSON.stringify(diagnosisResultData));

      const diagnosisData = {
        user_id: user.id,
        plant_type: plant?.plantName || 'Pianta sconosciuta',
        plant_variety: plant?.scientificName || '',
        symptoms: diagnosedDisease?.symptoms?.join(', ') || disease?.symptoms?.join(', ') || 'Nessun sintomo specifico',
        image_url: imageUrl,
        status: 'completed',
        diagnosis_result: safeDiagnosisResult,
        // Forza la data corrente
        created_at: now,
        updated_at: now
      };

      console.log('📝 Dati diagnosi completi da salvare:', diagnosisData);

      const { data, error } = await supabase
        .from('diagnoses')
        .insert(diagnosisData)
        .select()
        .single();

      if (error) {
        console.error('❌ Errore Supabase nel salvataggio:', error);
        throw error;
      }

      console.log('✅ Diagnosi salvata con successo:', data);
      toast.success('✅ Diagnosi salvata con successo!', {
        description: `Salvata il ${new Date().toLocaleDateString('it-IT')}`,
        duration: 4000
      });

      return data;

    } catch (error: any) {
      console.error('❌ Errore nel salvare la diagnosi:', error);
      
      let errorMessage = 'Errore nel salvare la diagnosi';
      if (error.message?.includes('row-level security') || error.message?.includes('RLS')) {
        errorMessage = 'Permessi insufficienti. Assicurati di essere autenticato.';
      } else if (error.message?.includes('upload')) {
        errorMessage = 'Errore nel caricamento dell\'immagine';
      } else if (error.message) {
        errorMessage = `Errore: ${error.message}`;
      }
      
      toast.error(`❌ ${errorMessage}`, {
        description: 'Riprova o contatta il supporto se il problema persiste',
        duration: 6000
      });

      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  // Reset diagnosi/immagine etc
  const resetDiagnosis = () => {
    setUploadedImage(null);
    clearResults();
    stopCameraStream();
  };

  // For test/debug only
  const [retryCount, setRetryCount] = useState(0);

  return {
    isAnalyzing,
    uploadedImage,
    diagnosisResult,
    diagnosedDisease,
    analysisProgress,
    analysisDetails,
    retryCount,
    streamRef,
    isSaving,
    resetDiagnosis,
    captureImage,
    handleImageUpload,
    analyzeUploadedImage,
    stopCameraStream,
    setUploadedImage,
    saveDiagnosis,
    // Esponi i risultati completi per la chat con l'esperto
    fullResults: results,
  };
};
