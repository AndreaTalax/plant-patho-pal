
import React from 'react';
import { usePlantInfo } from '@/context/PlantInfoContext';
import PlantInfoForm from '../PlantInfoForm';
import PlantInfoSummary from '../PlantInfoSummary';
import ImageCaptureMethods from '../ImageCaptureMethods';
import DiagnosisResult from '../result/DiagnosisResult';
import CameraCapture from '../CameraCapture';
import { DiagnosedDisease } from '../types';

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
  onStartNewAnalysis
}) => {
  const { plantInfo } = usePlantInfo();

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
            inSunlight: plantInfo.inSunlight,
            wateringFrequency: plantInfo.wateringFrequency
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
    return (
      <DiagnosisResult
        imageSrc={uploadedImage || ''}
        plantInfo={{
          isIndoor: plantInfo.isIndoor,
          inSunlight: plantInfo.inSunlight,
          wateringFrequency: plantInfo.wateringFrequency
        }}
        analysisData={diagnosedDisease}
        isAnalyzing={isAnalyzing}
        onStartNewAnalysis={onStartNewAnalysis}
      />
    );
  }

  return null;
};

export default DiagnosisStages;
