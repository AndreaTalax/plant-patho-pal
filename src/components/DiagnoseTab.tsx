
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
  const [symptomsText, setSymptomsText] = useState<string>('');
  const [currentStage, setCurrentStage] = useState<'info' | 'symptoms' | 'capture' | 'plan' | 'result'>('info');
  const [userSubscriptionPlan, setUserSubscriptionPlan] = useState<'free' | 'premium'>('free');
  
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

  // Check if user has completed profile
  useEffect(() => {
    if (!userProfile?.hasCompletedProfile) {
      navigate('/complete-profile');
    }
  }, [userProfile, navigate]);

  // Mock function to check subscription status - replace with actual implementation
  useEffect(() => {
    // This would be an API call to check subscription in a real scenario
    const checkSubscription = async () => {
      try {
        // Example: get user subscription from database
        const { data, error } = await supabase
          .from('profiles')
          .select('subscription_plan')
          .eq('id', userProfile?.id)
          .single();

        if (!error && data) {
          setUserSubscriptionPlan(data.subscription_plan === 'premium' ? 'premium' : 'free');
        }
      } catch (error) {
        console.error('Error checking subscription:', error);
        // Default to free plan on error
        setUserSubscriptionPlan('free');
      }
    };

    if (userProfile?.id) {
      checkSubscription();
    }
  }, [userProfile?.id]);
  
  const {
    isAnalyzing,
    uploadedImage,
    diagnosedDisease,
    analysisDetails,
    resetDiagnosis,
    captureImage,
    handleImageUpload,
    stopCameraStream,
    setUploadedImage,
    analyzeUploadedImage,
    setAnalysisDetails
  } = usePlantDiagnosis();

  const handleImageUploadEvent = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!plantInfo.infoComplete) {
      toast.warning("Per favore inserisci le informazioni sulla pianta prima di continuare", {
        dismissible: true,
        duration: 3000
      });
      return;
    }
    
    const file = e.target.files?.[0];
    if (file) {
      setUploadedImage(URL.createObjectURL(file));
      setCurrentStage('plan');
    }
  };

  const takePicture = () => {
    if (!plantInfo.infoComplete) {
      toast.warning("Per favore inserisci le informazioni sulla pianta prima di continuare", {
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
        toast.error("Impossibile accedere alla fotocamera. Controlla i permessi.", {
          dismissible: true,
          duration: 4000
        });
        setShowCamera(false);
      });
    } else {
      toast.error("Fotocamera non supportata dal tuo browser o dispositivo", {
        dismissible: true,
        duration: 4000
      });
      setShowCamera(false);
    }
  };

  const handlePlantInfoSubmit = (data: PlantInfoFormValues) => {
    setPlantInfo({
      isIndoor: data.isIndoor,
      wateringFrequency: data.wateringFrequency,
      infoComplete: true
    });
    
    // Move to symptoms stage after completing plant info
    setCurrentStage('symptoms');
  };

  const handleSymptomSubmit = (symptoms: string) => {
    setSymptomsText(symptoms);
    
    // Update the analysis details to include symptoms
    setAnalysisDetails(prev => {
      return { 
        ...prev, 
        symptoms 
      };
    });
    
    // After submitting symptoms, move to capture stage
    setCurrentStage('capture');
    
    // Automatically scroll to the next section
    setTimeout(() => {
      window.scrollTo({
        top: window.scrollY + 200,
        behavior: 'smooth'
      });
    }, 300);
  };

  const handleCaptureImage = (imageDataUrl: string) => {
    setShowCamera(false);
    setUploadedImage(imageDataUrl);
    setCurrentStage('plan');
  };

  const handleCancelCamera = () => {
    stopCameraStream();
    setShowCamera(false);
  };

  const handleChooseAI = () => {
    if (uploadedImage) {
      // Convert dataURL to File object for analysis
      const imageFile = dataURLtoFile(uploadedImage, "camera-capture.jpg");
      analyzeUploadedImage(imageFile);
      setCurrentStage('result');
    }
  };

  const handleChooseExpert = async () => {
    if (!uploadedImage) {
      toast.error("Per favore carica un'immagine prima di continuare");
      return;
    }

    toast.success("Richiesta inviata al fitopatologo", {
      description: "Riceverai una risposta entro 24-48 ore",
    });

    try {
      // This would send the data to the fitopatologo
      // Example: Save diagnosis request to database
      const { error } = await supabase
        .from('expert_consultations')
        .insert({
          user_id: userProfile?.id,
          image_url: uploadedImage,
          symptoms: symptomsText,
          plant_info: {
            isIndoor: plantInfo.isIndoor,
            wateringFrequency: plantInfo.wateringFrequency
          },
          status: 'pending'
        });

      if (error) {
        throw error;
      }

      // Send notification email to expert (mock)
      console.log("Email sent to fitopatologo with:", {
        imageUrl: uploadedImage,
        symptoms: symptomsText,
        plantInfo: {
          isIndoor: plantInfo.isIndoor,
          wateringFrequency: plantInfo.wateringFrequency
        },
        userData: {
          name: userProfile?.firstName,
          email: userProfile?.email
        }
      });

      // Navigate to chat tab after submitting
      navigateToChat();
    } catch (error) {
      console.error("Error sending consultation request:", error);
      toast.error("Si è verificato un errore nell'invio della richiesta", {
        description: "Per favore riprova più tardi"
      });
    }
  };

  const handleUpgradeSubscription = () => {
    // Mock function - this would open a payment flow in a real app
    toast.info("Upgrade al piano Premium", {
      description: "Funzionalità in sviluppo. Presto disponibile!",
      duration: 5000
    });
    
    // For demo purposes, let's pretend the user upgraded
    setUserSubscriptionPlan('premium');
  };

  const handleStartOver = () => {
    resetDiagnosis();
    setSymptomsText('');
    setCurrentStage('info');
    setPlantInfo({ infoComplete: false });
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
          onPlantInfoEdit={() => setCurrentStage('info')}
          onSymptomSubmit={handleSymptomSubmit}
          onTakePhoto={takePicture}
          onUploadPhoto={() => document.getElementById('file-upload')?.click()}
          onCapture={handleCaptureImage}
          onCancelCamera={handleCancelCamera}
          onStartNewAnalysis={handleStartOver}
          onChooseAI={handleChooseAI}
          onChooseExpert={handleChooseExpert}
          onUpgradeSubscription={handleUpgradeSubscription}
          userSubscriptionPlan={userSubscriptionPlan}
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
    </div>
  );
};

export default DiagnoseTab;
