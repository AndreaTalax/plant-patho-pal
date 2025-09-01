import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ImageIcon, Camera, Upload, Loader2 } from 'lucide-react';
import { usePlantInfo } from '@/context/PlantInfoContext';
import CameraCapture from '@/components/camera/CameraCapture';
import { useImageValidation } from '@/hooks/useImageValidation';
import { toast } from 'sonner';

interface ScanMethodsProps {
  onImageCapture: (imageDataUrl: string) => void;
  onFileUpload: (file: File) => void;
  isLoading: boolean;
  uploadedImage: string | null;
}

export const ScanMethods: React.FC<ScanMethodsProps> = ({
  onImageCapture,
  onFileUpload,
  isLoading,
  uploadedImage
}) => {
  const { plantInfo } = usePlantInfo();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showCamera, setShowCamera] = useState(false);
  const { validateImage, isValidating } = useImageValidation();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      // Validazione rigorosa dell'immagine
      console.log('🔍 Validazione rigorosa dell\'immagine caricata...');
      const validationResult = await validateImage(file);
      
      if (!validationResult.isValid) {
        // I toast di errore sono già gestiti nella validazione
        console.log('❌ Immagine respinta durante validazione');
        return;
      }

      console.log('✅ Immagine validata, procedendo con il caricamento...');
      toast.success('✅ Immagine valida!', {
        description: 'Immagine della pianta accettata con successo'
      });
      
      onFileUpload(file);
    } catch (error) {
      console.error('❌ Errore durante validazione file:', error);
      toast.error('Errore durante la validazione dell\'immagine');
    } finally {
      // Reset input per permettere selezione stesso file
      event.target.value = '';
    }
  };

  const handleCameraCapture = async (imageDataUrl: string) => {
    try {
      setShowCamera(false);
      
      if (!imageDataUrl) {
        toast.error('Errore nella cattura dell\'immagine');
        return;
      }

      // Converte dataURL in File per la validazione
      const response = await fetch(imageDataUrl);
      const blob = await response.blob();
      const file = new File([blob], `plant-photo-${Date.now()}.jpg`, { type: 'image/jpeg' });

      // Validazione rigorosa dell'immagine catturata
      console.log('🔍 Validazione rigorosa dell\'immagine catturata...');
      const validationResult = await validateImage(file);
      
      if (!validationResult.isValid) {
        // I toast di errore sono già gestiti nella validazione
        console.log('❌ Foto respinta durante validazione');
        return;
      }

      console.log('✅ Foto validata, procedendo...');
      toast.success('✅ Foto valida!', {
        description: 'Foto della pianta accettata con successo'
      });
      
      onImageCapture(imageDataUrl);
    } catch (error) {
      console.error('❌ Errore durante validazione foto:', error);
      toast.error('Errore durante la validazione della foto');
    }
  };

  return (
    <div className="space-y-6">
      {!uploadedImage ? (
        <>
          {/* Upload da File */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-drplant-green transition-colors">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
              disabled={isLoading || isValidating}
            />
            <ImageIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Carica una foto della pianta
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Seleziona un'immagine dal tuo dispositivo
            </p>
            <Button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading || isValidating}
              className="bg-drplant-green hover:bg-drplant-green/90"
            >
              {isValidating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Validazione...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Scegli File
                </>
              )}
            </Button>
          </div>

          {/* Fotocamera */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-drplant-green transition-colors">
            <Camera className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Scatta una foto
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Usa la fotocamera per fotografare la pianta
            </p>
            <Button 
              onClick={() => setShowCamera(true)}
              disabled={isLoading || isValidating}
              variant="outline"
            >
              <Camera className="w-4 h-4 mr-2" />
              Apri Fotocamera
            </Button>
          </div>

          {showCamera && (
            <CameraCapture
              onCapture={handleCameraCapture}
              onClose={() => setShowCamera(false)}
            />
          )}
        </>
      ) : (
        <div className="flex justify-center">
          <div className="relative">
            <img
              src={uploadedImage}
              alt="Pianta caricata"
              className="max-w-full h-auto rounded-lg shadow-md"
            />
            <div className="absolute top-2 right-2">
              <Button
                onClick={() => onImageCapture(null)}
                variant="secondary"
                size="icon"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="text-center text-gray-500 text-sm">
        Assicurati che la foto sia chiara e ben illuminata, e che mostri chiaramente le foglie o i sintomi della pianta.
      </div>
    </div>
  );
};

export default ScanMethods;
