
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Camera, Info, Leaf, Bug } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface CameraCaptureProps {
  onCapture: (imageUrl: string) => void;
  onCancel: () => void;
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  mode?: 'identify' | 'diagnose';
}

const CameraCapture = ({ 
  onCapture, 
  onCancel, 
  videoRef, 
  canvasRef,
  mode = 'diagnose'
}: CameraCaptureProps) => {
  const [showTips, setShowTips] = useState(false);
  const [flashActive, setFlashActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  
  // Initialize camera on component mount
  useEffect(() => {
    startCamera();
    
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);
  
  const startCamera = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          } 
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setCameraError(null);
          toast.success("Fotocamera attivata con successo");
        }
      } else {
        setCameraError("Il tuo browser non supporta l'accesso alla fotocamera");
        toast.error("Fotocamera non supportata dal tuo browser o dispositivo");
      }
    } catch (err: any) {
      console.error("Errore nell'accesso alla fotocamera:", err);
      setCameraError(err.message || "Impossibile accedere alla fotocamera");
      toast.error("Impossibile accedere alla fotocamera. Controlla i permessi.");
    }
  };
  
  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw the current video frame to canvas
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert to data URL
        const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
        onCapture(imageDataUrl);
      }
    }
  };

  // Camera guidelines based on the mode
  const GuideLines = () => {
    return (
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div className={cn(
          "border-2 border-dashed rounded-lg transition-all",
          mode === 'identify' ? 'w-3/4 h-3/4 border-green-400' : 'w-2/3 aspect-square border-yellow-400'
        )}>
          {mode === 'identify' && (
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-3 bg-green-400 text-xs text-white px-2 py-0.5 rounded">
              Intera Pianta
            </div>
          )}
          {mode === 'diagnose' && (
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-3 bg-yellow-400 text-xs text-black px-2 py-0.5 rounded">
              Area Affetta
            </div>
          )}
        </div>
      </div>
    );
  };

  const Tips = () => {
    if (!showTips) return null;
    
    return (
      <div className="absolute bottom-20 left-4 right-4 bg-black bg-opacity-70 rounded-lg p-3 text-white text-xs">
        <h4 className="font-medium mb-1.5">Consigli per {mode === 'identify' ? 'identificazione' : 'diagnosi'}:</h4>
        <ul className="space-y-1 ml-4 list-disc">
          {mode === 'identify' ? (
            <>
              <li>Includi l'intera pianta nell'inquadratura</li>
              <li>Assicurati di avere una buona illuminazione</li>
              <li>Cattura caratteristiche uniche come disposizione fogliare</li>
              <li>Includi fiori se presenti per un'identificazione più facile</li>
            </>
          ) : (
            <>
              <li>Concentrati direttamente sull'area affetta</li>
              <li>Fai foto ravvicinate dei sintomi (macchie, scolorimento)</li>
              <li>Includi sia parti sane che affette per un confronto</li>
              <li>Evita ombre che coprono dettagli importanti</li>
            </>
          )}
        </ul>
      </div>
    );
  };

  // Simulate flash effect
  const activateFlash = () => {
    setFlashActive(true);
    setTimeout(() => setFlashActive(false), 200);
  };
  
  // Try again function to request camera access again
  const handleTryAgain = () => {
    startCamera();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-2xl overflow-hidden max-w-md w-full">
        <div className={cn(
          "p-4 text-white flex justify-between items-center",
          mode === 'identify' ? "bg-drplant-green" : "bg-drplant-blue"
        )}>
          <h3 className="font-semibold flex items-center gap-2">
            {mode === 'identify' ? (
              <>
                <Leaf className="h-4 w-4" /> Identificazione Pianta
              </>
            ) : (
              <>
                <Bug className="h-4 w-4" /> Diagnosi Malattia
              </>
            )}
          </h3>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-white hover:bg-opacity-20 hover:bg-white" 
            onClick={onCancel}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="relative aspect-square bg-black w-full">
          {/* Error state */}
          {cameraError ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
              <div className="bg-red-500 rounded-full p-3 mb-4">
                <Camera className="h-8 w-8 text-white" />
              </div>
              <h4 className="text-white font-medium mb-2">Errore Fotocamera</h4>
              <p className="text-gray-300 text-sm text-center mb-4">
                {cameraError}
              </p>
              <Button 
                variant="outline" 
                className="bg-white"
                onClick={handleTryAgain}
              >
                Riprova
              </Button>
            </div>
          ) : (
            <>
              {/* Video element */}
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                className="absolute inset-0 w-full h-full object-cover"
              ></video>
              
              {/* Guide lines overlay */}
              <GuideLines />
              
              {/* Flash effect overlay */}
              <div className={cn(
                "absolute inset-0 bg-white transition-opacity pointer-events-none", 
                flashActive ? "opacity-70" : "opacity-0"
              )} />
              
              {/* Tips overlay */}
              <Tips />
              
              {/* Controls overlay */}
              <div className="absolute top-2 right-2">
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="bg-black bg-opacity-50 text-white hover:bg-opacity-70 rounded-full h-8 w-8"
                  onClick={() => setShowTips(!showTips)}
                >
                  <Info className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </div>
        
        <div className="p-4 flex flex-col gap-4">
          <div className="text-xs text-gray-500 text-center">
            {cameraError 
              ? "Assicurati che i permessi della fotocamera siano abilitati nel browser"
              : mode === 'identify' 
                ? "Posiziona l'intera pianta all'interno del contorno verde" 
                : "Ingrandisci le aree affette per una diagnosi migliore"
            }
          </div>
          
          <div className="flex gap-4">
            <Button 
              variant="outline" 
              className="flex-1" 
              onClick={onCancel}
            >
              Annulla
            </Button>
            {!cameraError && (
              <Button 
                className={cn(
                  "flex-1",
                  mode === 'identify' 
                    ? "bg-drplant-green hover:bg-drplant-green-dark" 
                    : "bg-drplant-blue hover:bg-drplant-blue-dark"
                )}
                onClick={() => {
                  activateFlash();
                  setTimeout(captureImage, 150);
                }}
              >
                <Camera className="mr-2 h-5 w-5" /> Cattura
              </Button>
            )}
          </div>
        </div>
      </div>
      <canvas ref={canvasRef} className="hidden"></canvas>
    </div>
  );
};

export default CameraCapture;
