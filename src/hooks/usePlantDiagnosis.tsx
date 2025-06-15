
import { useEffect, useState } from 'react';
import { usePlantAnalysis } from './usePlantAnalysis';
import { usePlantImageUpload } from './usePlantImageUpload';
import type { PlantInfo } from '@/components/diagnose/types';

export const usePlantDiagnosis = () => {
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
    resetDiagnosis,
    captureImage,
    handleImageUpload,
    analyzeUploadedImage,
    stopCameraStream,
    setUploadedImage,
  };
};
