
import React, { useState } from 'react';
import { usePlantInfo } from '@/context/PlantInfoContext';
import PlantInfoForm from '../PlantInfoForm';
import PlantInfoSummary from '../PlantInfoSummary';
import ImageCaptureMethods from '../ImageCaptureMethods';
import DiagnosisResult from '../result/DiagnosisResult';
import CameraCapture from '../CameraCapture';
import { DiagnosedDisease } from '../types';
import SymptomForm from '../SymptomForm';
import PhotoInstructions from '../PhotoInstructions';
import SubscriptionPlanCard from '../SubscriptionPlanCard';

interface DiagnosisStagesProps {
  stage: 'info' | 'symptoms' | 'capture' | 'plan' | 'result';
  showCamera: boolean;
  uploadedImage: string | null;
  isAnalyzing: boolean;
  diagnosedDisease: DiagnosedDisease | null;
  analysisDetails: any;
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  onPlantInfoComplete: (data: any) => void;
  onPlantInfoEdit: () => void;
  onSymptomSubmit: (symptoms: string) => void;
  onTakePhoto: () => void;
  onUploadPhoto: () => void;
  onCapture: (imageDataUrl: string) => void;
  onCancelCamera: () => void;
  onStartNewAnalysis: () => void;
  onChooseAI: () => void;
  onChooseExpert: () => void;
  onUpgradeSubscription: () => void;
  userSubscriptionPlan: 'free' | 'premium';
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
  onSymptomSubmit,
  onTakePhoto,
  onUploadPhoto,
  onCapture,
  onCancelCamera,
  onStartNewAnalysis,
  onChooseAI,
  onChooseExpert,
  onUpgradeSubscription,
  userSubscriptionPlan
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

  if (stage === 'symptoms') {
    return (
      <>
        <PlantInfoSummary 
          plantInfo={{
            isIndoor: plantInfo.isIndoor,
            wateringFrequency: plantInfo.wateringFrequency
          }}
          onEdit={onPlantInfoEdit}
        />

        <SymptomForm onSubmit={onSymptomSubmit} />
      </>
    );
  }

  if (stage === 'capture') {
    return (
      <>
        <PlantInfoSummary 
          plantInfo={{
            isIndoor: plantInfo.isIndoor,
            wateringFrequency: plantInfo.wateringFrequency
          }}
          onEdit={onPlantInfoEdit}
        />

        <PhotoInstructions />

        <ImageCaptureMethods
          onTakePhoto={onTakePhoto}
          onUploadPhoto={onUploadPhoto}
        />
      </>
    );
  }

  if (stage === 'plan') {
    return (
      <SubscriptionPlanCard
        currentPlan={userSubscriptionPlan}
        onUpgrade={onUpgradeSubscription}
        onProceedWithAI={onChooseAI}
        onConsultExpert={onChooseExpert}
      />
    );
  }

  if (stage === 'result') {
    return (
      <DiagnosisResult
        imageSrc={uploadedImage || ''}
        plantInfo={{
          isIndoor: plantInfo.isIndoor,
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
