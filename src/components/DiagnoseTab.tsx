
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
  const { userProfile } = useAuth();
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
    stopCameraStream
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
      handleImageUpload(file);
      
      // Notify expert if not using AI
      if (!plantInfo.useAI) {
        await notifyExpert(file);
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

  // Function to notify plant pathologist
  const notifyExpert = async (imageFile?: File, imageDataUrl?: string) => {
    try {
      if (!userProfile?.email) {
        console.error("User not logged in");
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
          user_id: userProfile.email, // Use email instead of id
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
        return;
      }
      
      // Send email notification to expert (using edge function)
      const consultationId = consultationData?.[0]?.id;
      if (consultationId) {
        // Notification would be sent via edge function
        console.log("Notification would be sent for consultation:", consultationId);
        
        toast.success("Richiesta inviata al fitopatologo", {
          description: "Riceverai una risposta al più presto.",
          duration: 5000
        });
      }
    } catch (error) {
      console.error("Error notifying expert:", error);
    }
  };

  const handlePlantInfoSubmit = (data: PlantInfoFormValues) => {
    setPlantInfo({
      isIndoor: data.isIndoor,
      wateringFrequency: data.wateringFrequency,
      lightExposure: data.lightExposure,
      symptoms: data.symptoms,
      useAI: data.useAI || false,
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
    captureImage(imageDataUrl);
    
    // Notify expert if not using AI
    if (!plantInfo.useAI) {
      await notifyExpert(undefined, imageDataUrl);
    }
  };

  const handleCancelCamera = () => {
    stopCameraStream();
    setShowCamera(false);
  };

  const navigateToChat = () => {
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
