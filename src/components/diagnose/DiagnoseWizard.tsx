import { useState } from "react";
import PlantInfoForm from "./PlantInfoForm";
import ImageCaptureMethods from "./ImageCaptureMethods";
import DiagnosisOptions from "./DiagnosisOptions";
import CameraCapture from "./CameraCapture";
import DiagnosisResult from "./result/DiagnosisResult";
import PlantInfoSummary from "./PlantInfoSummary";
import { usePlantDiagnosis } from "@/hooks/usePlantDiagnosis";
import { usePlantInfo } from "@/context/PlantInfoContext";
import { dataURLtoFile } from "@/utils/plant-analysis";
import { toast } from "sonner";
import type { PlantInfo } from "./types";

export default function DiagnoseWizard() {
  const [step, setStep] = useState(0); // 0: info, 1: capture, 2: options, 3: result
  const [showCamera, setShowCamera] = useState(false);
  const { plantInfo, setPlantInfo } = usePlantInfo();
  
  const {
    uploadedImage,
    setUploadedImage,
    diagnosisResult,
    diagnosedDisease,
    analysisDetails,
    isAnalyzing,
    captureImage,
    handleImageUpload,
    analyzeUploadedImage,
    resetDiagnosis,
    saveDiagnosis,
    isSaving
  } = usePlantDiagnosis();

  // Step 1: Plant info completed
  const handlePlantInfoComplete = (data: PlantInfo) => {
    setPlantInfo(data);
    setStep(1); // Go to image capture
  };

  // Step 2: Photo methods
  const handleTakePhoto = () => {
    setShowCamera(true);
  };

  const handleUploadPhoto = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        handleImageUpload(file, plantInfo);
        setStep(2); // Go to options after upload
      }
    };
    input.click();
  };

  // Camera capture completed
  const handleCaptureComplete = (imageDataUrl: string) => {
    setShowCamera(false);
    captureImage(imageDataUrl, plantInfo);
    setStep(2); // Go to options after capture
  };

  const handleCancelCamera = () => {
    setShowCamera(false);
  };

  // Step 3: AI or Expert choice
  const handleSelectAI = async () => {
    if (!uploadedImage) {
      toast.error("Nessuna immagine disponibile per l'analisi");
      return;
    }

    try {
      // Convert image to file if it's a data URL
      let fileToAnalyze: File;
      if (uploadedImage.startsWith('data:')) {
        fileToAnalyze = dataURLtoFile(uploadedImage, 'plant-image.jpg');
      } else {
        // If it's a blob URL, we need to fetch it
        const response = await fetch(uploadedImage);
        const blob = await response.blob();
        fileToAnalyze = new File([blob], 'plant-image.jpg', { type: 'image/jpeg' });
      }

      await analyzeUploadedImage(fileToAnalyze);
      setStep(3); // Go to results
    } catch (error) {
      console.error('Error in AI analysis:', error);
      toast.error('Errore durante l\'analisi AI');
    }
  };

  const handleSelectExpert = () => {
    // Mark that expert chat was selected
    setPlantInfo({
      ...plantInfo,
      sendToExpert: true,
      useAI: false
    });
    setStep(3); // Go to results (will show expert consultation confirmation)
  };

  // Edit plant info
  const handleEditPlantInfo = () => {
    setStep(0);
  };

  // Start new analysis
  const handleStartNewAnalysis = () => {
    resetDiagnosis();
    setStep(0);
  };

  // Navigate to chat
  const handleChatWithExpert = () => {
    // This will be handled by the parent component or navigation system
    console.log('Navigate to expert chat');
  };

  // Show camera if active
  if (showCamera) {
    return (
      <CameraCapture 
        onCapture={handleCaptureComplete}
        onCancel={handleCancelCamera}
      />
    );
  }

  // Step 0: Plant Information Form
  if (step === 0) {
    return <PlantInfoForm onComplete={handlePlantInfoComplete} />;
  }

  // Step 1: Image Capture Methods
  if (step === 1) {
    return (
      <div className="space-y-6">
        <PlantInfoSummary 
          plantInfo={plantInfo}
          onEdit={handleEditPlantInfo}
        />
        <ImageCaptureMethods 
          onTakePhoto={handleTakePhoto}
          onUploadPhoto={handleUploadPhoto}
        />
      </div>
    );
  }

  // Step 2: Diagnosis Options (AI vs Expert)
  if (step === 2) {
    return (
      <div className="space-y-6">
        <PlantInfoSummary 
          plantInfo={plantInfo}
          onEdit={handleEditPlantInfo}
        />
        
        {uploadedImage && (
          <div className="w-full max-w-md mx-auto">
            <div className="aspect-square overflow-hidden rounded-xl border">
              <img 
                src={uploadedImage} 
                alt="Immagine caricata" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}

        <DiagnosisOptions
          onOptionChange={(option) => {}}
          uploadedImage={uploadedImage}
          onStartDiagnosis={handleSelectAI}
          onSelectAI={handleSelectAI}
          onSelectExpert={handleSelectExpert}
          hasAIAccess={true}
        />
      </div>
    );
  }

  // Step 3: Results
  if (step === 3) {
    // Expert consultation result
    if (plantInfo.sendToExpert && !plantInfo.useAI) {
      return (
        <div className="space-y-4">
          <PlantInfoSummary 
            plantInfo={plantInfo}
            onEdit={handleEditPlantInfo}
          />
          
          <div className="border rounded-lg p-4 bg-white shadow">
            <h3 className="font-medium text-lg mb-3 flex items-center gap-2">
              ✅ Richiesta inviata all'esperto
            </h3>
            
            {uploadedImage && (
              <div className="aspect-square w-full max-w-xs mx-auto overflow-hidden rounded-xl mb-4 border-2 border-green-200">
                <img 
                  src={uploadedImage} 
                  alt="Immagine inviata all'esperto" 
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 my-4">
              <p className="text-green-800 font-medium">
                La tua richiesta è stata inviata al fitopatologo Marco Nigro
              </p>
              <p className="text-green-700 text-sm mt-1">
                Riceverai una risposta personalizzata entro 24 ore nella sezione Chat.
              </p>
            </div>
            
            <div className="space-y-3 mt-4">
              <button 
                onClick={handleChatWithExpert}
                className="w-full bg-drplant-blue hover:bg-drplant-blue-dark text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                💬 Vai alla Chat
              </button>
              
              <button 
                onClick={handleStartNewAnalysis} 
                className="w-full border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                🔄 Nuova Analisi
              </button>
            </div>
          </div>
        </div>
      );
    }
    
    // AI diagnosis result
    return (
      <div className="space-y-4">
        <PlantInfoSummary 
          plantInfo={plantInfo}
          onEdit={handleEditPlantInfo}
        />
        
        <DiagnosisResult
          imageSrc={uploadedImage || ''}
          plantInfo={plantInfo}
          analysisData={diagnosedDisease}
          isAnalyzing={isAnalyzing}
          onStartNewAnalysis={handleStartNewAnalysis}
          onChatWithExpert={handleChatWithExpert}
          analysisDetails={analysisDetails}
        />
      </div>
    );
  }

  return null;
}
