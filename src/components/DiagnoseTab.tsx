
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { modelInfo } from '@/utils/aiDiagnosisUtils';
import { usePlantInfo } from '@/context/PlantInfoContext';
import { usePlantDiagnosis } from '@/hooks/usePlantDiagnosis';
import { PlantInfoFormValues } from './diagnose/PlantInfoForm';
import { toast } from 'sonner';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/context/AuthContext';
import { AuthRequiredDialog } from './auth/AuthRequiredDialog';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { notifyExpert } from '@/components/expert/NotifyExpertService';

// Importing our components
import DiagnoseHeader from './diagnose/DiagnoseHeader';
import DiagnosisStages from './diagnose/stages/DiagnosisStages';
import ModelInfoPanel from './diagnose/ModelInfoPanel';

const DiagnoseTab = () => {
  const { plantInfo, setPlantInfo } = usePlantInfo();
  const { userProfile, isAuthenticated } = useAuth();
  const [showCamera, setShowCamera] = useState(false);
  const [showModelInfo, setShowModelInfo] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [authDialogConfig, setAuthDialogConfig] = useState({
    title: "You must log in",
    description: "To use this feature, you need to log in to your account."
  });
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const navigate = useNavigate();
  
  // Dismiss any stuck toast notifications when component mounts
  useEffect(() => {
    toast.dismiss();
    
    // Clean up function to dismiss toasts when unmounting
    return () => {
      toast.dismiss();
    };
  }, []);
  
  const {
    isAnalyzing,
    uploadedImage,
    diagnosedDisease,
    analysisDetails,
    resetDiagnosis,
    captureImage,
    handleImageUpload,
    stopCameraStream,
    setUploadedImage
  } = usePlantDiagnosis();

  const handleImageUploadEvent = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!plantInfo.infoComplete) {
      toast.warning("Inserisci prima le informazioni sulla pianta", {
        dismissible: true,
        duration: 3000
      });
      return;
    }
    
    const file = e.target.files?.[0];
    if (file) {
      // Verifica che il file sia un'immagine
      if (!file.type.startsWith('image/')) {
        toast.error("Seleziona un file immagine valido");
        return;
      }

      // Verifica dimensioni del file (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Il file è troppo grande. Dimensione massima: 10MB");
        return;
      }
      
      // Pulisci l'immagine precedente se esiste
      if (uploadedImage && uploadedImage.startsWith('blob:')) {
        URL.revokeObjectURL(uploadedImage);
      }
      
      // Create a temporary URL for the uploaded image
      const tempUrl = URL.createObjectURL(file);
      setUploadedImage(tempUrl);
      
      // Store the file for later use when user chooses diagnosis method
      setPlantInfo({ ...plantInfo, uploadedFile: file, uploadedImageUrl: tempUrl });
    }
    
    // Reset dell'input file per permettere di selezionare lo stesso file di nuovo
    e.target.value = '';
  };

  const takePicture = () => {
    if (!plantInfo.infoComplete) {
      toast.warning("Inserisci prima le informazioni sulla pianta", {
        dismissible: true,
        duration: 3000
      });
      return;
    }
    
    console.log("Activating camera...");
    setShowCamera(true);
  };

  function handlePlantInfoSubmit(data: PlantInfoFormValues) {
    const updatedPlantInfo = {
      isIndoor: data.isIndoor,
      wateringFrequency: data.wateringFrequency,
      lightExposure: data.lightExposure,
      symptoms: data.symptoms,
      useAI: false, // Reset useAI, will be set when user selects option
      sendToExpert: false, // Reset sendToExpert, will be set when user selects option
      name: data.name || "Pianta sconosciuta",
      infoComplete: true,
      uploadedFile: null,
      uploadedImageUrl: null
    };
    
    setPlantInfo(updatedPlantInfo);
    
    setTimeout(() => {
      window.scrollTo({
        top: window.scrollY + 200,
        behavior: 'smooth'
      });
    }, 300);
  }

  function handleSelectAI() {
    // Check if user has uploaded an image
    if (!uploadedImage) {
      toast.warning("Carica prima un'immagine della pianta", {
        dismissible: true,
        duration: 3000
      });
      return;
    }
    
    setPlantInfo({ ...plantInfo, useAI: true, sendToExpert: false });
    
    // If user uploaded a file, process with AI
    if (plantInfo.uploadedFile) {
      handleImageUpload(plantInfo.uploadedFile, plantInfo);
    } else if (uploadedImage && uploadedImage.startsWith('data:image/')) {
      // If it's a captured image (base64), process with AI
      captureImage(uploadedImage, plantInfo);
    }
  }

  function handleSelectExpert() {
    // Check if user has uploaded an image
    if (!uploadedImage) {
      toast.warning("Carica prima un'immagine della pianta", {
        dismissible: true,
        duration: 3000
      });
      return;
    }
    
    if (!isAuthenticated) {
      setAuthDialogConfig({
        title: "Devi effettuare il login per contattare l'esperto",
        description: "Per inviare la tua richiesta all'esperto, devi prima accedere."
      });
      setShowAuthDialog(true);
      return;
    }
    
    // Check if user profile is complete
    if (!userProfile?.firstName || !userProfile?.lastName || !userProfile?.birthDate || !userProfile?.birthPlace) {
      toast.error("Completa il tuo profilo prima di inviare una richiesta", {
        description: "Nome, cognome, data e luogo di nascita sono richiesti",
        duration: 4000
      });
      navigate('/complete-profile');
      return;
    }
    
    setPlantInfo({ ...plantInfo, useAI: false, sendToExpert: true });
    
    // Send to expert immediately
    sendToExpert();
  }

  async function sendToExpert() {
    try {
      if (plantInfo.uploadedFile) {
        await notifyExpert(plantInfo.uploadedFile, undefined, plantInfo);
      } else if (uploadedImage) {
        await notifyExpert(undefined, uploadedImage, plantInfo);
      }
    } catch (error) {
      console.error("Error notifying expert:", error);
      toast.error("Errore nell'invio della richiesta all'esperto");
    }
  }

  async function handleCaptureImage(imageDataUrl: string) {
    setShowCamera(false);
    
    // Verifica che l'immagine sia valida
    if (!imageDataUrl || !imageDataUrl.startsWith('data:image/')) {
      toast.error("Immagine non valida");
      return;
    }
    
    // Pulisci l'immagine precedente se esiste
    if (uploadedImage && uploadedImage.startsWith('blob:')) {
      URL.revokeObjectURL(uploadedImage);
    }
    
    // Store the captured image
    setUploadedImage(imageDataUrl);
    setPlantInfo({ ...plantInfo, uploadedFile: null, uploadedImageUrl: imageDataUrl });
  }

  function handleCancelCamera() {
    console.log("Camera cancelled, cleaning up...");
    setShowCamera(false);
    // The camera cleanup is now handled by the CameraCapture component
  }

  function navigateToChat() {
    navigate('/');
    // Using a slight timeout to ensure navigation completes before tab selection
    setTimeout(() => {
      const event = new CustomEvent('switchTab', { detail: 'chat' });
      window.dispatchEvent(event);
    }, 100);
  }

  function navigateToShop(productId?: string) {
    navigate('/');
    setTimeout(() => {
      const event = new CustomEvent('switchTab', { detail: 'shop' });
      window.dispatchEvent(event);
    }, 100);
  }

  function navigateToLibrary(resourceId?: string) {
    navigate('/');
    setTimeout(() => {
      const event = new CustomEvent('switchTab', { detail: 'library' });
      window.dispatchEvent(event);
    }, 100);
  }

  // Determine which stage we're in based on new flow
  let currentStage: 'info' | 'capture' | 'options' | 'result' = 'info';
  if (plantInfo.infoComplete) {
    if (!uploadedImage) {
      currentStage = 'capture';
    } else if (!plantInfo.useAI && !plantInfo.sendToExpert) {
      currentStage = 'options';
    } else {
      currentStage = 'result';
    }
  }

  // Handle back navigation with proper state reset
  const handleBack = () => {
    if (currentStage === 'result') {
      // From result, go back to options - reset diagnosis choice
      setPlantInfo({ ...plantInfo, useAI: false, sendToExpert: false });
      resetDiagnosis();
    } else if (currentStage === 'options') {
      // From options, go back to capture - remove image
      setUploadedImage(null);
      resetDiagnosis();
      setPlantInfo({ ...plantInfo, uploadedFile: null, uploadedImageUrl: null });
      stopCameraStream();
    } else if (currentStage === 'capture') {
      // From capture, go back to info - reset everything
      setUploadedImage(null);
      resetDiagnosis();
      setPlantInfo({ ...plantInfo, infoComplete: false, useAI: false, sendToExpert: false, uploadedFile: null, uploadedImageUrl: null });
      stopCameraStream();
    }
    
    // Dismiss any active toasts when going back
    toast.dismiss();
  };

  const shouldShowBackButton = currentStage !== 'info' && !showCamera;

  return (
    <div className="flex flex-col items-center justify-start px-4 pt-6 pb-24 min-h-full">
      {/* Back Button */}
      {shouldShowBackButton && (
        <div className="w-full max-w-4xl mb-4">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Indietro
          </Button>
        </div>
      )}

      <DiagnoseHeader 
        showModelInfo={showModelInfo} 
        onToggleModelInfo={() => setShowModelInfo(!showModelInfo)} 
      />
      
      {/* PlantNet Model Information Panel */}
      {showModelInfo && (
        <ModelInfoPanel modelInfo={modelInfo} onClose={() => setShowModelInfo(false)} />
      )}
      
      <div className="w-full">
        <DiagnosisStages
          stage={currentStage}
          showCamera={showCamera}
          uploadedImage={uploadedImage}
          isAnalyzing={isAnalyzing}
          diagnosedDisease={diagnosedDisease}
          analysisDetails={analysisDetails}
          videoRef={videoRef}
          canvasRef={canvasRef}
          onPlantInfoComplete={handlePlantInfoSubmit}
          onPlantInfoEdit={() => setPlantInfo({ ...plantInfo, infoComplete: false })}
          onSelectAI={handleSelectAI}
          onSelectExpert={handleSelectExpert}
          onTakePhoto={takePicture}
          onUploadPhoto={() => document.getElementById('file-upload')?.click()}
          onCapture={handleCaptureImage}
          onCancelCamera={handleCancelCamera}
          onStartNewAnalysis={resetDiagnosis}
          onChatWithExpert={navigateToChat}
        />
      </div>
      
      {/* Hidden file input for image uploads */}
      <input
        id="file-upload"
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageUploadEvent}
      />
      
      {/* Authentication Dialog */}
      <AuthRequiredDialog 
        isOpen={showAuthDialog}
        onClose={() => setShowAuthDialog(false)}
        title={authDialogConfig.title}
        description={authDialogConfig.description}
      />
    </div>
  );
};

export default DiagnoseTab;
