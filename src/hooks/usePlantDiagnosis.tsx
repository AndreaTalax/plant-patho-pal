
import { useEffect, useState } from 'react';
import { usePlantAnalysis } from './usePlantAnalysis';
import { usePlantImageUpload } from './usePlantImageUpload';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { PlantInfo } from '@/components/diagnose/types';

export const usePlantDiagnosis = () => {
  const { user } = useAuth();
  const { 
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
  } = usePlantAnalysis();

  const {
    uploadedImage,
    setUploadedImage,
    captureImage,
    handleImageUpload,
    stopCameraStream,
    streamRef,
  } = usePlantImageUpload({ analyzeUploadedImage });

  const [isSaving, setIsSaving] = useState(false);

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

  // Funzione per salvare la diagnosi nel database
  const saveDiagnosis = async () => {
    if (!user) {
      toast.error('Devi essere autenticato per salvare la diagnosi');
      return;
    }

    if (!diagnosisResult || !uploadedImage) {
      toast.error('Nessuna diagnosi da salvare');
      return;
    }

    setIsSaving(true);
    
    try {
      console.log('🔄 Salvando diagnosi...', {
        user_id: user.id,
        diagnosisResult,
        diagnosedDisease,
        analysisDetails
      });

      // Crea un URL valido per l'immagine
      const imageUrl = typeof uploadedImage === 'string' ? 
        uploadedImage : 
        `temp_image_${Date.now()}.jpg`;

      // Prepara i dati per il salvataggio (serializza correttamente gli oggetti complessi)
      const diagnosisData = {
        user_id: user.id,
        plant_type: diagnosedDisease?.name || 'Pianta sconosciuta',
        plant_variety: analysisDetails?.multiServiceInsights?.plantSpecies || '',
        symptoms: diagnosedDisease?.symptoms?.join(', ') || 'Nessun sintomo specifico',
        image_url: imageUrl,
        status: 'completed',
        diagnosis_result: {
          confidence: diagnosedDisease?.confidence || 0,
          isHealthy: diagnosedDisease?.healthy || false,
          disease: diagnosedDisease?.disease?.name || diagnosedDisease?.name || 'Nessuna',
          description: diagnosisResult,
          // Serializza analysisDetails in modo sicuro per il database
          analysisDetails: analysisDetails ? JSON.parse(JSON.stringify(analysisDetails)) : null,
          timestamp: new Date().toISOString()
        }
      };

      console.log('📝 Dati diagnosi da salvare:', diagnosisData);

      // Salva nel database
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
    setDiagnosisResult(null);
    setDiagnosedDisease(null);
    setAnalysisProgress(0);
    setAnalysisDetails(null);
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
