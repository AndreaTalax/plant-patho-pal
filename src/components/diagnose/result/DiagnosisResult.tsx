
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PlantInfoFormValues } from '../PlantInfoForm';
import { DiagnosedDisease, AnalysisDetails } from '../types';
import DiagnosisTabs from '../DiagnosisTabs';
import ImageDisplay from './ImageDisplay';
import AiServicesData from './AiServicesData';
import PlantInfoCard from './PlantInfoCard';
import ActionButtons from './ActionButtons';
import AnalysisLoader from './AnalysisLoader';

interface DiagnosisResultProps {
  uploadedImage: string;
  plantInfo: PlantInfoFormValues;
  isAnalyzing: boolean;
  analysisProgress: number;
  diagnosedDisease: DiagnosedDisease | null;
  diagnosisResult: string | null;
  analysisDetails: AnalysisDetails | null;
  activeResultTab: string;
  setActiveResultTab: (tab: string) => void;
  resetDiagnosis: () => void;
  navigateToChat: () => void;
  navigateToShop: (productId?: string) => void;
  navigateToLibrary: (resourceId?: string) => void;
}

const DiagnosisResult = ({
  uploadedImage,
  plantInfo,
  isAnalyzing,
  analysisProgress,
  diagnosedDisease,
  diagnosisResult,
  analysisDetails,
  activeResultTab,
  setActiveResultTab,
  resetDiagnosis,
  navigateToChat,
  navigateToShop,
  navigateToLibrary
}: DiagnosisResultProps) => {
  return (
    <Card className="bg-white p-6 shadow-md rounded-2xl w-full max-w-2xl">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-2/5">
          <ImageDisplay 
            uploadedImage={uploadedImage} 
            analysisDetails={analysisDetails} 
            isAnalyzing={isAnalyzing} 
          />
          
          <AiServicesData 
            analysisDetails={analysisDetails} 
            isAnalyzing={isAnalyzing} 
          />
          
          <PlantInfoCard plantInfo={plantInfo} />
          
          <ActionButtons 
            resetDiagnosis={resetDiagnosis} 
            navigateToChat={navigateToChat} 
            diagnosisResult={diagnosisResult} 
            diagnosedDisease={diagnosedDisease} 
          />
        </div>

        <div className="md:w-3/5">
          {isAnalyzing ? (
            <AnalysisLoader analysisProgress={analysisProgress} />
          ) : diagnosisResult && diagnosedDisease ? (
            <div className="h-full">
              <div className="flex items-center gap-2 mb-4">
                <Badge className="bg-amber-500">{Math.round(diagnosedDisease.confidence * 100)}% Confidence</Badge>
                {diagnosedDisease.confidence > 0.9 ? (
                  <Badge className="bg-green-500">High Reliability</Badge>
                ) : diagnosedDisease.confidence > 0.7 ? (
                  <Badge className="bg-yellow-500">Medium Reliability</Badge>
                ) : (
                  <Badge className="bg-red-500">Low Reliability</Badge>
                )}
                
                {/* Aggiungiamo badge per indicare l'uso di HuggingFace */}
                {analysisDetails?.multiServiceInsights?.huggingFaceResult && (
                  <Badge className="bg-blue-500 flex items-center gap-1">
                    <span className="text-xs">HuggingFace</span>
                  </Badge>
                )}
              </div>
              
              <DiagnosisTabs
                disease={diagnosedDisease}
                analysisDetails={analysisDetails}
                activeTab={activeResultTab}
                onTabChange={setActiveResultTab}
                onNavigateToLibrary={navigateToLibrary}
                onNavigateToShop={navigateToShop}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-4 h-full">
              <p className="text-gray-500">Upload an image to start diagnosis</p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default DiagnosisResult;
