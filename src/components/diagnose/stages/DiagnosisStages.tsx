
import React from 'react';
import { usePlantInfo } from '@/context/PlantInfoContext';
import PlantInfoForm from '../PlantInfoForm';
import PlantInfoSummary from '../PlantInfoSummary';
import ImageCaptureMethods from '../ImageCaptureMethods';
import DiagnosisResult from '../result/DiagnosisResult';
import CameraCapture from '../CameraCapture';
import { DiagnosedDisease } from '../types';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface DiagnosisStagesProps {
  stage: 'info' | 'capture' | 'result';
  showCamera: boolean;
  uploadedImage: string | null;
  isAnalyzing: boolean;
  diagnosedDisease: DiagnosedDisease | null;
  analysisDetails: any;
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  onPlantInfoComplete: (data: any) => void;
  onPlantInfoEdit: () => void;
  onTakePhoto: () => void;
  onUploadPhoto: () => void;
  onCapture: (imageDataUrl: string) => void;
  onCancelCamera: () => void;
  onStartNewAnalysis: () => void;
  onChatWithExpert?: () => void;
}

const DiagnosisStages: React.FC<DiagnosisStagesProps> = ({
  stage,
  showCamera,
  uploadedImage,
  isAnalyzing,
  diagnosedDisease,
  analysisDetails,
  videoRef,
  canvasRef,
  onPlantInfoComplete,
  onPlantInfoEdit,
  onTakePhoto,
  onUploadPhoto,
  onCapture,
  onCancelCamera,
  onStartNewAnalysis,
  onChatWithExpert
}) => {
  const { plantInfo } = usePlantInfo();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleChatWithExpert = () => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }
    
    if (onChatWithExpert) {
      onChatWithExpert();
    }
  };

  if (showCamera) {
    return (
      <CameraCapture 
        onCapture={onCapture} 
        onCancel={onCancelCamera}
        videoRef={videoRef}
        canvasRef={canvasRef}
      />
    );
  }

  if (stage === 'info') {
    return <PlantInfoForm onComplete={onPlantInfoComplete} />;
  }

  if (stage === 'capture') {
    return (
      <>
        <PlantInfoSummary 
          plantInfo={{
            isIndoor: plantInfo.isIndoor,
            wateringFrequency: plantInfo.wateringFrequency,
            lightExposure: plantInfo.lightExposure,
            symptoms: plantInfo.symptoms
          }}
          onEdit={onPlantInfoEdit}
        />

        <ImageCaptureMethods
          onTakePhoto={onTakePhoto}
          onUploadPhoto={onUploadPhoto}
        />
      </>
    );
  }

  if (stage === 'result') {
    // If the user did not select the AI option, don't show the AI diagnosis UI
    if (!plantInfo.useAI && uploadedImage) {
      return (
        <div className="space-y-4">
          <div className="border rounded-lg p-4 bg-white shadow">
            <h3 className="font-medium text-lg mb-3">Richiesta inviata al fitopatologo</h3>
            
            <div className="aspect-square w-full max-w-xs mx-auto overflow-hidden rounded-xl mb-4">
              <img 
                src={uploadedImage} 
                alt="Immagine inviata" 
                className="w-full h-full object-cover"
              />
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 my-4">
              <p className="text-green-800 font-medium">
                La tua richiesta è stata inviata con successo al fitopatologo.
              </p>
              <p className="text-green-700 text-sm mt-1">
                Riceverai una risposta al più presto nella sezione Chat.
              </p>
            </div>
            
            <div className="space-y-3 mt-4">
              <button 
                onClick={handleChatWithExpert} 
                className="w-full bg-drplant-blue hover:bg-drplant-blue-dark text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
                <span>Vai alla chat con il fitopatologo</span>
              </button>
              
              <button 
                onClick={onStartNewAnalysis} 
                className="w-full border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
                </svg>
                <span>Inizia nuova analisi</span>
              </button>
            </div>
          </div>
        </div>
      );
    }
    
    // Otherwise show the regular AI diagnosis result
    return (
      <DiagnosisResult
        imageSrc={uploadedImage || ''}
        plantInfo={{
          isIndoor: plantInfo.isIndoor,
          wateringFrequency: Number(plantInfo.wateringFrequency), // Convert to number explicitly
          lightExposure: plantInfo.lightExposure,
          symptoms: plantInfo.symptoms,
          useAI: plantInfo.useAI
        }}
        analysisData={diagnosedDisease}
        isAnalyzing={isAnalyzing}
        onStartNewAnalysis={onStartNewAnalysis}
        onChatWithExpert={onChatWithExpert}
      />
    );
  }

  return null;
};

export default DiagnosisStages;
