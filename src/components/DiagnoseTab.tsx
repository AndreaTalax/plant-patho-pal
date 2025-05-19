
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { modelInfo } from '@/utils/aiDiagnosisUtils';
import { usePlantInfo } from '@/context/PlantInfoContext';
import { usePlantDiagnosis } from '@/hooks/usePlantDiagnosis';
import { PlantInfoFormValues } from './diagnose/PlantInfoForm';
import { toast } from 'sonner';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/context/AuthContext';

// Importing our components
import DiagnoseHeader from './diagnose/DiagnoseHeader';
import DiagnosisStages from './diagnose/stages/DiagnosisStages';
import ModelInfoPanel from './diagnose/ModelInfoPanel';

const DiagnoseTab = () => {
  const { plantInfo, setPlantInfo } = usePlantInfo();
  const { userProfile, isAuthenticated } = useAuth();
  const [showCamera, setShowCamera] = useState(false);
  const [showModelInfo, setShowModelInfo] = useState(false);
  
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
        // If AI is not selected and user not authenticated, redirect to login
        if (!isAuthenticated) {
          navigate('/auth');
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

  // Function to notify plant pathologist with all information
  const notifyExpert = async (imageFile?: File, imageDataUrl?: string) => {
    try {
      // Check for user authentication
      if (!isAuthenticated) {
        navigate('/auth');
        return;
      }
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error("User not logged in");
        toast.error("Devi accedere per contattare il fitopatologo", {
          duration: 3000
        });
        navigate('/auth');
        return;
      }

      // Get user profile information
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
      
      // Check if user has completed their profile
      if (!userProfile.first_name || !userProfile.last_name || !userProfile.birth_date || !userProfile.birth_place) {
        toast.error("Completa il tuo profilo prima di inviare una richiesta", {
          description: "Nome, cognome, data e luogo di nascita sono obbligatori",
          duration: 4000
        });
        navigate('/complete-profile');
        return;
      }

      let imageUrl = imageDataUrl;
      
      // If we have a file but not a data URL, convert the file to data URL
      if (imageFile && !imageDataUrl) {
        const reader = new FileReader();
        imageUrl = await new Promise((resolve) => {
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(imageFile);
        });
      }

      // First, create a consultation record
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
      
      // Send notification to expert (using edge function)
      const consultationId = consultationData?.[0]?.id;
      if (consultationId) {
        toast.info("Invio richiesta in corso...", { duration: 2000 });
        
        // Invoke the edge function to notify the expert via chat and email
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
        
        // Automatically navigate to the chat tab
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
      // If AI is not selected and user not authenticated, redirect to login
      if (!isAuthenticated) {
        navigate('/auth');
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
      navigate('/auth');
      return;
    }
    
    // Navigate to chat tab with user's plant information and image
    navigate('/');
    
    // Prepare data for chat
    const plantData = {
      image: uploadedImage,
      plantInfo: {
        isIndoor: plantInfo.isIndoor,
        wateringFrequency: plantInfo.wateringFrequency,
        lightExposure: plantInfo.lightExposure,
        symptoms: plantInfo.symptoms
      }
    };
    
    // Store data temporarily for chat view
    sessionStorage.setItem('plantDataForChat', JSON.stringify(plantData));
    
    // Using a slight timeout to ensure navigation completes before tab selection
    setTimeout(() => {
      const event = new CustomEvent('switchTab', { detail: 'chat' });
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
    </div>
  );
};

export default DiagnoseTab;
