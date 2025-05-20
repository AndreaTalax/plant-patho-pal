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
    title: "Devi accedere",
    description: "Per utilizzare questa funzionalità devi accedere al tuo account."
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
      // Create a temporary URL for the uploaded image
      const tempUrl = URL.createObjectURL(file);
      setUploadedImage(tempUrl);
      
      if (plantInfo.useAI) {
        // If AI is selected, proceed with AI analysis
        handleImageUpload(file);
      } else {
        // If AI is not selected, check authentication first
        if (!isAuthenticated) {
          setAuthDialogConfig({
            title: "Devi accedere per contattare il fitopatologo",
            description: "Per inviare la tua richiesta al fitopatologo devi prima accedere."
          });
          setShowAuthDialog(true);
          return;
        }
        
        // Check if user profile is complete
        if (!userProfile.firstName || !userProfile.lastName || !userProfile.birthDate || !userProfile.birthPlace) {
          toast.error("Completa il tuo profilo prima di inviare una richiesta", {
            description: "Nome, cognome, data e luogo di nascita sono obbligatori",
            duration: 4000
          });
          navigate('/complete-profile');
          return;
        }
        
        // If authenticated and profile complete, notify expert
        await notifyExpert(file, tempUrl);
      }
    }
  };

  const takePicture = () => {
    if (!plantInfo.infoComplete) {
      toast.warning("Inserisci prima le informazioni sulla pianta", {
        dismissible: true,
        duration: 3000
      });
      return;
    }
    
    setShowCamera(true);
    
    // Start camera stream
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } // Use back camera if available
      })
      .then(stream => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          if (stream) {
            stopCameraStream(); // Clean up any existing stream
          }
          console.log("Camera activated successfully");
        }
      })
      .catch(err => {
        console.error("Error accessing camera:", err);
        toast.error("Impossibile accedere alla fotocamera. Verifica i permessi.", {
          dismissible: true,
          duration: 4000
        });
        setShowCamera(false);
      });
    } else {
      toast.error("Fotocamera non supportata nel tuo browser o dispositivo", {
        dismissible: true,
        duration: 4000
      });
      setShowCamera(false);
    }
  };

  // Funzione per notificare l'esperto con tutte le informazioni
  const notifyExpert = async (imageFile?: File, imageDataUrl?: string) => {
    try {
      // Controlla l'autenticazione dell'utente
      if (!isAuthenticated) {
        setAuthDialogConfig({
          title: "Devi accedere per contattare il fitopatologo",
          description: "Per inviare la tua richiesta al fitopatologo devi prima accedere."
        });
        setShowAuthDialog(true);
        return;
      }
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error("User not logged in");
        toast.error("Devi accedere per contattare il fitopatologo", {
          duration: 3000
        });
        return;
      }

      // Ottieni le informazioni del profilo utente
      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (profileError) {
        console.error("Error fetching user profile:", profileError);
        toast.error("Errore nel recupero del profilo utente", {
          duration: 3000
        });
        return;
      }
      
      // Controlla se l'utente ha completato il proprio profilo
      if (!userProfile.first_name || !userProfile.last_name || !userProfile.birth_date || !userProfile.birth_place) {
        toast.error("Completa il tuo profilo prima di inviare una richiesta", {
          description: "Nome, cognome, data e luogo di nascita sono obbligatori",
          duration: 4000
        });
        navigate('/complete-profile');
        return;
      }

      let imageUrl = imageDataUrl;
      
      // Se abbiamo un file ma non un URL di dati, converte il file in URL di dati
      if (imageFile && !imageDataUrl) {
        const reader = new FileReader();
        imageUrl = await new Promise((resolve) => {
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(imageFile);
        });
      }

      // Prima, crea un record di consultazione
      const { data: consultationData, error: consultationError } = await supabase
        .from('expert_consultations')
        .insert({
          user_id: user.id,
          symptoms: plantInfo.symptoms,
          image_url: imageUrl,
          plant_info: {
            isIndoor: plantInfo.isIndoor,
            wateringFrequency: plantInfo.wateringFrequency,
            lightExposure: plantInfo.lightExposure
          },
          status: 'pending'
        })
        .select();
        
      if (consultationError) {
        console.error("Error creating consultation:", consultationError);
        toast.error("Errore nell'invio della richiesta", {
          description: "Non è stato possibile creare la consultazione",
          duration: 4000
        });
        return;
      }
      
      // Invia notifica all'esperto (usando edge function)
      const consultationId = consultationData?.[0]?.id;
      if (consultationId) {
        toast.info("Invio richiesta in corso...", { duration: 2000 });
        
        // Invoca la edge function per notificare l'esperto via chat ed email
        const { data: notifyData, error: notifyError } = await supabase.functions.invoke('notify-expert', {
          body: { 
            consultationId,
            userId: user.id,
            imageUrl,
            symptoms: plantInfo.symptoms,
            plantInfo: {
              isIndoor: plantInfo.isIndoor,
              wateringFrequency: plantInfo.wateringFrequency,
              lightExposure: plantInfo.lightExposure,
              symptoms: plantInfo.symptoms
            }
          }
        });
        
        if (notifyError) {
          console.error("Error notifying expert:", notifyError);
          toast.error("Errore nell'invio della notifica all'esperto", { duration: 3000 });
          return;
        }
        
        toast.success("Richiesta inviata con successo!", {
          description: "Il fitopatologo risponderà al più presto",
          duration: 4000
        });
        
        // Naviga automaticamente alla scheda chat
        setTimeout(() => {
          navigate('/');
          setTimeout(() => {
            const event = new CustomEvent('switchTab', { detail: 'chat' });
            window.dispatchEvent(event);
          }, 100);
        }, 2000);
      }
    } catch (error) {
      console.error("Error notifying expert:", error);
      toast.error("Si è verificato un errore durante l'invio della richiesta", {
        duration: 4000
      });
    }
  };

  const handlePlantInfoSubmit = (data: PlantInfoFormValues) => {
    setPlantInfo({
      isIndoor: data.isIndoor,
      wateringFrequency: data.wateringFrequency,
      lightExposure: data.lightExposure,
      symptoms: data.symptoms,
      useAI: data.useAI,
      infoComplete: true
    });
    
    // After completing plant info, automatically scroll to the next section
    setTimeout(() => {
      window.scrollTo({
        top: window.scrollY + 200,
        behavior: 'smooth'
      });
    }, 300);
  };

  const handleCaptureImage = async (imageDataUrl: string) => {
    setShowCamera(false);
    
    // Store the captured image
    setUploadedImage(imageDataUrl);
    
    if (plantInfo.useAI) {
      // If AI is selected, process the image with AI
      captureImage(imageDataUrl);
    } else {
      // If AI is not selected, check authentication first
      if (!isAuthenticated) {
        setAuthDialogConfig({
          title: "Devi accedere per contattare il fitopatologo",
          description: "Per inviare la tua richiesta al fitopatologo devi prima accedere."
        });
        setShowAuthDialog(true);
        return;
      }
      
      // Check if user profile is complete before sending to expert
      if (!userProfile.firstName || !userProfile.lastName || !userProfile.birthDate || !userProfile.birthPlace) {
        toast.error("Completa il tuo profilo prima di inviare una richiesta", {
          description: "Nome, cognome, data e luogo di nascita sono obbligatori",
          duration: 4000
        });
        navigate('/complete-profile');
        return;
      }
      
      // If authenticated and profile complete, send directly to the expert
      await notifyExpert(undefined, imageDataUrl);
    }
  };

  const handleCancelCamera = () => {
    stopCameraStream();
    setShowCamera(false);
  };

  const navigateToChat = () => {
    // Check authentication before navigating
    if (!isAuthenticated) {
      setAuthDialogConfig({
        title: "Devi accedere per accedere alla chat",
        description: "Per visualizzare le conversazioni con il fitopatologo devi prima accedere."
      });
      setShowAuthDialog(true);
      return;
    }
    
    navigate('/');
    // Using a slight timeout to ensure navigation completes before tab selection
    setTimeout(() => {
      const event = new CustomEvent('switchTab', { detail: 'chat' });
      window.dispatchEvent(event);
    }, 100);
  };

  const navigateToShop = (productId?: string) => {
    navigate('/');
    setTimeout(() => {
      const event = new CustomEvent('switchTab', { detail: 'shop' });
      window.dispatchEvent(event);
    }, 100);
  };

  const navigateToLibrary = (resourceId?: string) => {
    navigate('/');
    setTimeout(() => {
      const event = new CustomEvent('switchTab', { detail: 'library' });
      window.dispatchEvent(event);
    }, 100);
  };

  // Determine which stage we're in
  let currentStage: 'info' | 'capture' | 'result' = 'info';
  if (plantInfo.infoComplete) {
    currentStage = uploadedImage ? 'result' : 'capture';
  }

  return (
    <div className="flex flex-col items-center justify-start px-4 pt-6 pb-24 min-h-full">
      <DiagnoseHeader 
        showModelInfo={showModelInfo} 
        onToggleModelInfo={() => setShowModelInfo(!showModelInfo)} 
      />
      
      {/* PlantNet Model Information Panel */}
      {showModelInfo && (
        <ModelInfoPanel modelInfo={modelInfo} onClose={() => setShowModelInfo(false)} />
      )}
      
      <div className="space-y-6 w-full max-w-md">
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
        accept="image/*,video/*"
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
