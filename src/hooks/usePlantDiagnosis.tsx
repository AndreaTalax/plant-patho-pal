
import { useEffect, useMemo, useState } from 'react';
import { usePlantAnalysis } from './usePlantAnalysis';
import { usePlantImageUpload } from './usePlantImageUpload';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { PlantInfo } from '@/components/diagnose/types';

export const usePlantDiagnosis = () => {
  const { user, userProfile } = useAuth();

  // Nuovo hook analisi
  const { 
    results,
    isAnalyzing,
    progress,
    analyzeImage,
    clearResults,
  } = usePlantAnalysis();

  // Wrapper per compatibilità con usePlantImageUpload - ottimizzato
  const analyzeUploadedImage = async (file: File) => {
    console.log('🚀 Fast analysis started');
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

      console.log('💾 Salvando diagnosi migliorata...', {
        user_id: user.id,
        plant: plant?.plantName,
        confidence: plant?.confidence,
        hasDisease: !!disease
      });

      // Converti l'immagine in URL permanente se necessario
      let permanentImageUrl = uploadedImage;
      if (typeof uploadedImage === 'string' && uploadedImage.startsWith('blob:')) {
        permanentImageUrl = `diagnosi_${user.id}_${Date.now()}.jpg`;
      }

      const diagnosisData = {
        user_id: user.id,
        plant_type: plant?.plantName || 'Pianta non identificata',
        plant_variety: plant?.scientificName || '',
        symptoms: diagnosedDisease?.symptoms?.join(', ') || 'Nessun sintomo rilevato',
        image_url: permanentImageUrl,
        status: 'completed',
        diagnosis_result: {
          confidence: Math.min(75, Math.round(plant?.confidence || 0)),
          isHealthy: !disease,
          disease: disease?.disease || null,
          description: diagnosisResult || `Identificata come ${plant?.plantName || 'pianta sconosciuta'}`,
          analysisDetails: analysisDetails ? JSON.parse(JSON.stringify(analysisDetails)) : null,
          timestamp: new Date().toISOString(),
          aiProvider: plant?.provider || 'unknown',
          isFallback: results.consensus?.providersUsed?.includes('fallback') || false
        }
      };

      console.log('📝 Salvando diagnosi:', diagnosisData);

      // Prova a salvare tramite edge function se disponibile
      let success = false;
      try {
        const { data: functionData, error: functionError } = await supabase.functions.invoke('save-diagnosis', {
          body: diagnosisData
        });
        
        if (functionError) {
          console.warn('Edge function failed, trying direct insert:', functionError);
        } else {
          console.log('✅ Diagnosis saved via edge function:', functionData);
          success = true;
        }
      } catch (funcError) {
        console.warn('Edge function not available, using direct insert:', funcError);
      }
      
      // Fallback to direct database insert if edge function fails
      if (!success) {
        const { data, error } = await supabase
          .from('diagnoses')
          .insert(diagnosisData)
          .select()
          .single();

        if (error) {
          console.error('❌ Errore nel salvataggio:', error);
          throw error;
        }
        
        console.log('✅ Diagnosi salvata direttamente con ID:', data.id);
      }

      toast.success('✅ Diagnosi salvata!', {
        description: `${plant?.plantName || 'Pianta'} salvata nella tua cronologia`,
        duration: 3000
      });

    } catch (error: any) {
      console.error('❌ Errore salvataggio diagnosi:', error);
      
      let errorMessage = 'Impossibile salvare la diagnosi';
      if (error.message?.includes('row-level security')) {
        errorMessage = 'Errore di autenticazione. Riprova dopo aver effettuato il login.';
      } else if (error.code === '23503') {
        errorMessage = 'Errore di riferimento nel database. Contatta il supporto.';
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
