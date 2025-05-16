
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/sonner';
import { modelInfo } from '@/utils/aiDiagnosisUtils';
import { usePlantInfo } from '@/context/PlantInfoContext';
import { usePlantDiagnosis } from '@/hooks/usePlantDiagnosis';
import { PlantInfoFormValues } from './diagnose/PlantInfoForm';

// Importing our components
import DiagnoseHeader from './diagnose/DiagnoseHeader';
import DiagnosisStages from './diagnose/stages/DiagnosisStages';
import ModelInfoPanel from './diagnose/ModelInfoPanel';

const DiagnoseTab = () => {
  const { plantInfo, setPlantInfo } = usePlantInfo();
  const [showCamera, setShowCamera] = useState(false);
  const [showModelInfo, setShowModelInfo] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const navigate = useNavigate();
  
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

  const handleImageUploadEvent = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!plantInfo.infoComplete) {
      toast.error("Please enter plant information before continuing");
      return;
    }
    
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const takePicture = () => {
    if (!plantInfo.infoComplete) {
      toast.error("Please enter plant information before continuing");
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
          toast.success("Camera activated successfully");
        }
      })
      .catch(err => {
        console.error("Error accessing camera:", err);
        toast.error("Could not access camera. Please check permissions.");
        setShowCamera(false);
      });
    } else {
      toast.error("Camera not supported in your browser or device");
      setShowCamera(false);
    }
  };

  const handlePlantInfoSubmit = (data: PlantInfoFormValues) => {
    setPlantInfo({
      isIndoor: data.isIndoor,
      inSunlight: data.inSunlight,
      wateringFrequency: data.wateringFrequency,
      infoComplete: true
    });
  };

  const handleCaptureImage = (imageDataUrl: string) => {
    setShowCamera(false);
    captureImage(imageDataUrl);
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
          onPlantInfoEdit={() => setPlantInfo({ infoComplete: false })}
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
        accept="image/*"
        className="hidden"
        onChange={handleImageUploadEvent}
      />
    </div>
  );
};

export default DiagnoseTab;
