
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
import { Leaf, AlertTriangle } from 'lucide-react';

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
  // Check if image is a valid plant image
  const isValidPlantImage = analysisDetails?.plantVerification?.isPlant !== false &&
                           analysisDetails?.multiServiceInsights?.isValidPlantImage !== false;
  
  // Check if the diagnosis has sufficient confidence
  const hasSufficientConfidence = diagnosedDisease?.confidence !== undefined && 
                                 diagnosedDisease.confidence >= 0.6;
  
  return (
    <Card className="bg-white p-6 shadow-md rounded-2xl w-full max-w-2xl">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-2/5">
          <ImageDisplay 
            uploadedImage={uploadedImage} 
            analysisDetails={analysisDetails} 
            isAnalyzing={isAnalyzing} 
          />
          
          {!isAnalyzing && !isValidPlantImage && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center gap-2 text-red-600 font-medium mb-1">
                <AlertTriangle className="h-4 w-4" />
                <span>No Plant Detected</span>
              </div>
              <p className="text-sm text-red-700">
                The image does not appear to contain a plant. Please upload a valid plant photo.
              </p>
            </div>
          )}
          
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
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {/* Plant species badge */}
                {analysisDetails?.multiServiceInsights?.plantName && (
                  <Badge className="bg-green-600 flex items-center gap-1">
                    <Leaf className="h-3 w-3" />
                    <span className="text-xs">{analysisDetails.multiServiceInsights.plantName}</span>
                  </Badge>
                )}
                
                {/* Plant health status */}
                {analysisDetails?.multiServiceInsights?.isHealthy && (
                  <Badge className="bg-green-500">Healthy Plant</Badge>
                )}
                
                {/* Confidence badge - only display if plant is not healthy */}
                {!analysisDetails?.multiServiceInsights?.isHealthy && (
                  <Badge className={`${diagnosedDisease.confidence >= 0.6 ? 'bg-amber-500' : 'bg-red-500'}`}>
                    {Math.round(diagnosedDisease.confidence * 100)}% Confidence
                  </Badge>
                )}
                
                {/* Reliability badge - only display if plant is not healthy */}
                {!analysisDetails?.multiServiceInsights?.isHealthy && diagnosedDisease.confidence > 0.9 ? (
                  <Badge className="bg-green-500">High Reliability</Badge>
                ) : !analysisDetails?.multiServiceInsights?.isHealthy && diagnosedDisease.confidence > 0.7 ? (
                  <Badge className="bg-yellow-500">Medium Reliability</Badge>
                ) : !analysisDetails?.multiServiceInsights?.isHealthy && (
                  <Badge className="bg-red-500">Low Reliability</Badge>
                )}
                
                {/* Dataset badge */}
                {analysisDetails?.multiServiceInsights?.dataSource && (
                  <Badge className="bg-blue-500 flex items-center gap-1">
                    <span className="text-xs">{
                      analysisDetails.multiServiceInsights.plantPart === 'leaf' ? 
                      'Leaf Disease Dataset' : 'PlantDoc AI'
                    }</span>
                  </Badge>
                )}
              </div>
              
              {(!isValidPlantImage || !hasSufficientConfidence) ? (
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <h3 className="text-xl font-semibold mb-4">Diagnosis Not Available</h3>
                  
                  {!isValidPlantImage ? (
                    <div className="space-y-2">
                      <p>To get an accurate plant diagnosis:</p>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Make sure your image contains a clearly visible plant</li>
                        <li>Ensure good lighting when taking the photo</li>
                        <li>Focus on the plant, avoiding cluttered backgrounds</li>
                        <li>Include the affected areas if your plant has visible symptoms</li>
                      </ul>
                    </div>
                  ) : !hasSufficientConfidence ? (
                    <div className="space-y-2">
                      <p>For a more reliable diagnosis:</p>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Take a clearer photo of the affected plant</li>
                        <li>Ensure proper lighting to show details clearly</li>
                        <li>Focus directly on the symptoms or affected areas</li>
                        <li>Take multiple pictures from different angles</li>
                      </ul>
                    </div>
                  ) : null}
                </div>
              ) : (
                <DiagnosisTabs
                  disease={diagnosedDisease}
                  analysisDetails={analysisDetails}
                  activeTab={activeResultTab}
                  onTabChange={setActiveResultTab}
                  onNavigateToLibrary={navigateToLibrary}
                  onNavigateToShop={navigateToShop}
                />
              )}
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
