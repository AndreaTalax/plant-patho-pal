
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

  // Salvataggio diagnosi nel database
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

      console.log('🔄 Salvando diagnosi...', {
        user_id: user.id,
        diagnosisResult,
        diagnosedDisease,
        analysisDetails
      });

      const imageUrl = typeof uploadedImage === 'string' ? uploadedImage : `temp_image_${Date.now()}.jpg`;

      const diagnosisData = {
        user_id: user.id,
        plant_type: plant?.plantName || 'Pianta sconosciuta',
        plant_variety: plant?.scientificName || '',
        symptoms: diagnosedDisease?.symptoms?.join(', ') || 'Nessun sintomo specifico',
        image_url: imageUrl,
        status: 'completed',
        diagnosis_result: {
          confidence: Math.min(70, Math.round(plant?.confidence || 0)),
          isHealthy: !disease,
          disease: disease?.disease || 'Nessuna',
          description: diagnosisResult,
          analysisDetails: analysisDetails ? JSON.parse(JSON.stringify(analysisDetails)) : null,
          timestamp: new Date().toISOString()
        }
      };

      console.log('📝 Dati diagnosi da salvare:', diagnosisData);

      const { data, error } = await supabase
        .from('diagnoses')
        .insert(diagnosisData)
        .select()
        .single();

      if (error) {
        console.error('❌ Errore nel salvataggio:', error);
        throw error;
      }

      console.log('✅ Diagnosi salvata con successo:', data);
      toast.success('✅ Diagnosi salvata con successo!', {
        description: 'La tua diagnosi è stata salvata nella cronologia',
        duration: 4000
      });

    } catch (error: any) {
      console.error('❌ Errore nel salvare la diagnosi:', error);
      
      let errorMessage = 'Errore nel salvare la diagnosi';
      if (error.message?.includes('row-level security')) {
        errorMessage = 'Permessi insufficienti. Assicurati di essere autenticato.';
      } else if (error.message) {
        errorMessage = `Errore: ${error.message}`;
      }
      
      toast.error(`❌ ${errorMessage}`);
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
  };
};
