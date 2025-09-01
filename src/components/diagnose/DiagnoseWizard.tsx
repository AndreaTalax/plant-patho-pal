
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, Upload, ArrowLeft } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { usePlantDiagnosis } from "@/hooks/usePlantDiagnosis";
import DiagnosisResult from "./result/DiagnosisResult";
import CameraCapture from "./CameraCapture";
import { PlantInfo } from "./types";

interface DiagnoseWizardProps {
  onBack?: () => void;
}

const DiagnoseWizard = ({ onBack }: DiagnoseWizardProps) => {
  const { userProfile } = useAuth();
  const [currentStep, setCurrentStep] = useState<'method' | 'camera' | 'result'>('method');
  const [showCamera, setShowCamera] = useState(false);
  
  const {
    uploadedImage,
    diagnosisResult,
    diagnosedDisease,
    analysisProgress,
    analysisDetails,
    isAnalyzing,
    handleImageUpload,
    captureImage,
    resetDiagnosis,
    saveDiagnosis,
    isSaving
  } = usePlantDiagnosis();

  // Salta direttamente alla selezione del metodo dato che abbiamo i dati utente dall'auth
  const plantInfo: PlantInfo = {
    name: userProfile?.firstName || userProfile?.first_name || 'Utente',
    isIndoor: true,
    wateringFrequency: '',
    lightExposure: '',
    symptoms: '',
    infoComplete: true,
    useAI: true,
    sendToExpert: false
  };

  const handleMethodSelect = (method: 'camera' | 'upload') => {
    if (method === 'camera') {
      setShowCamera(true);
      setCurrentStep('camera');
    } else {
      // Trigger file input for upload
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          handleImageUpload(file);
          setCurrentStep('result');
        }
      };
      input.click();
    }
  };

  const handleCameraCapture = async () => {
    await captureImage('', null);
    setShowCamera(false);
    setCurrentStep('result');
  };

  const handleStartOver = () => {
    resetDiagnosis();
    setCurrentStep('method');
    setShowCamera(false);
  };

  if (currentStep === 'camera' && showCamera) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setShowCamera(false);
              setCurrentStep('method');
            }}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Indietro
          </Button>
          <h2 className="text-xl font-semibold">Scatta una foto</h2>
        </div>
        
        <CameraCapture
          onCapture={handleCameraCapture}
          onCancel={() => {
            setShowCamera(false);
            setCurrentStep('method');
          }}
        />
      </div>
    );
  }

  if (currentStep === 'result' && (uploadedImage || isAnalyzing)) {
    return (
      <DiagnosisResult
        imageSrc={uploadedImage || ''}
        diagnosedDisease={diagnosedDisease}
        analysisDetails={analysisDetails}
        plantInfo={plantInfo}
        isAnalyzing={isAnalyzing}
        onStartNewAnalysis={handleStartOver}
        onSaveDiagnosis={saveDiagnosis}
        saveLoading={isSaving}
      />
    );
  }

  return (
    <div className="space-y-6">
      {onBack && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Indietro
        </Button>
      )}

      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">Diagnosi della Pianta</h2>
        <p className="text-gray-600">
          Scegli come vuoi acquisire l'immagine della tua pianta
        </p>
      </div>

      <div className="grid gap-4">
        <Card className="cursor-pointer hover:bg-gray-50 transition-colors">
          <CardContent className="p-6" onClick={() => handleMethodSelect('camera')}>
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-drplant-green/10 rounded-full">
                <Camera className="h-6 w-6 text-drplant-green" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-lg">Scatta una foto</CardTitle>
                <CardDescription>
                  Usa la fotocamera del dispositivo per catturare l'immagine
                </CardDescription>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:bg-gray-50 transition-colors">
          <CardContent className="p-6" onClick={() => handleMethodSelect('upload')}>
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-drplant-blue/10 rounded-full">
                <Upload className="h-6 w-6 text-drplant-blue" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-lg">Carica foto</CardTitle>
                <CardDescription>
                  Seleziona un'immagine dalla galleria del dispositivo
                </CardDescription>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="text-center text-sm text-gray-500 mt-6">
        <p>💡 Per migliori risultati, assicurati che l'immagine sia ben illuminata e mostri chiaramente i sintomi della pianta</p>
      </div>
    </div>
  );
};

export default DiagnoseWizard;
