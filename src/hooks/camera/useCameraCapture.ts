
import { useCallback } from 'react';
import { toast } from 'sonner';
import type { CameraRefs } from './types';

export const useCameraCapture = (refs: CameraRefs) => {
  const { videoRef, canvasRef } = refs;

  const capturePhoto = useCallback((): string | null => {
    if (!videoRef.current || !canvasRef.current) {
      toast.error('Fotocamera non pronta all\'acquisizione');
      console.error('❌ videoRef o canvasRef null alla cattura!');
      return null;
    }

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (!context) {
        toast.error('Canvas context non disponibile');
        console.error('❌ Canvas context non disponibile durante scatto!');
        return null;
      }

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth || 1920;
      canvas.height = video.videoHeight || 1080;
      
      if (canvas.width === 0 || canvas.height === 0) {
        toast.error('La fotocamera non ha fornito frame validi. Riprova o verifica i permessi.');
        console.error('❌ Video dimensioni non valide alla cattura!');
        return null;
      }

      // Draw current video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert to data URL
      const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
      
      if (!imageDataUrl || !imageDataUrl.startsWith("data:image/")) {
        toast.error('Errore nella generazione della foto!');
        console.error('❌ Impossibile generare imageDataUrl');
        return null;
      }

      console.log('📸 Photo captured successfully');
      toast.success('Foto acquisita!');
      return imageDataUrl;

    } catch (error) {
      console.error('Errore durante acquisizione foto:', error);
      toast.error('Errore durante la cattura della foto');
      return null;
    }
  }, [videoRef, canvasRef]);

  return { capturePhoto };
};
