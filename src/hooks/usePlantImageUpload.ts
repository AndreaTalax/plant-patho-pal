
import { useState, useRef } from 'react';
import { dataURLtoFile } from '@/utils/plant-analysis';
import { toast } from 'sonner';
import type { PlantInfo } from '@/components/diagnose/types';

export const usePlantImageUpload = ({
  analyzeUploadedImage
}: {
  analyzeUploadedImage: (file: File, plantInfo?: PlantInfo) => Promise<void>;
}) => {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCameraStream = () => {
    if (streamRef.current) {
      const tracks = streamRef.current.getTracks();
      tracks.forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  // Se l'immagine arriva dalla fotocamera (base64)
  const captureImage = (imageDataUrl: string, plantInfo?: PlantInfo) => {
    if (!imageDataUrl) {
      toast.error("Errore nella cattura dell'immagine");
      return;
    }
    setUploadedImage(imageDataUrl);
    stopCameraStream();
    setAnalysisProgress(0);

    try {
      const imageFile = dataURLtoFile(imageDataUrl, "camera-capture.jpg");
      analyzeUploadedImage(imageFile, plantInfo);
    } catch (error) {
      toast.error("Errore nell'elaborazione dell'immagine catturata");
    }
  };

  // Gestione upload normale
  const handleImageUpload = (file: File, plantInfo?: PlantInfo) => {
    if (!file) {
      toast.error("Nessun file selezionato");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result;
      if (result) {
        setUploadedImage(result as string);
        analyzeUploadedImage(file, plantInfo);
      } else {
        toast.error("Errore nella lettura del file");
      }
    };
    reader.onerror = () => {
      toast.error("Errore nella lettura del file immagine");
    };
    reader.readAsDataURL(file);
  };

  return {
    uploadedImage,
    setUploadedImage,
    analysisProgress,
    setAnalysisProgress,
    captureImage,
    handleImageUpload,
    stopCameraStream,
    streamRef,
  };
};
