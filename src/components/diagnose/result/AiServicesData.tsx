
import React from 'react';
import { Card } from "@/components/ui/card";
import { AnalysisDetails } from '../types';
import { Info, Leaf, AlertTriangle } from 'lucide-react';

interface AiServicesDataProps {
  analysisDetails: AnalysisDetails | null;
  isAnalyzing: boolean;
}

const AiServicesData: React.FC<AiServicesDataProps> = ({ analysisDetails, isAnalyzing }) => {
  if (!analysisDetails || isAnalyzing) {
    return null;
  }

  const insights = analysisDetails.multiServiceInsights;
  
  // Check if we have data from either Flora Incognita or PlantSnap
  const hasFloraIncognita = !!insights?.floraIncognitaMatch;
  const hasPlantSnap = !!insights?.plantSnapMatch;
  
  // Check if we have Sistema Digitale Foglia analysis
  const hasLeafAnalysis = !!insights?.leafAnalysis || !!insights?.advancedLeafAnalysis;

  return (
    <Card className="p-4 bg-white shadow rounded-lg">
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-drplant-green flex items-center gap-2">
          <Info className="h-5 w-5" />
          AI Service Insights
        </h3>
        
        {insights?.primaryService && (
          <div className="mt-2">
            <h4 className="font-medium text-gray-700">Primary Analysis Service</h4>
            <div className="flex items-center mt-1">
              <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
                {insights.primaryService}
              </span>
              {insights.agreementScore !== undefined && (
                <span className="ml-2 text-sm text-gray-500">
                  {insights.agreementScore}% confidence
                </span>
              )}
            </div>
            {insights.dataSource && (
              <p className="text-xs text-gray-500 mt-1">Data Source: {insights.dataSource}</p>
            )}
          </div>
        )}
        
        {/* Sistema Digitale Foglia Analysis Results */}
        {hasLeafAnalysis && (
          <div className="bg-green-50 p-3 rounded-lg border border-green-100 mt-3">
            <h4 className="font-medium text-green-800 flex items-center">
              <Leaf className="h-4 w-4 mr-1.5 text-green-600" />
              Sistema Digitale Foglia Analysis
            </h4>
            
            {insights.leafAnalysis && (
              <div className="mt-2 text-sm grid grid-cols-2 gap-x-4 gap-y-2">
                <div>
                  <p className="text-gray-500">Leaf Health</p>
                  <p className={`font-medium ${
                    insights.leafAnalysis.healthStatus === 'healthy' ? 'text-green-600' : 
                    insights.leafAnalysis.healthStatus === 'diseased' ? 'text-red-600' : 
                    'text-amber-600'
                  }`}>
                    {insights.leafAnalysis.healthStatus === 'healthy' ? 'Healthy' : 
                     insights.leafAnalysis.healthStatus === 'diseased' ? 'Diseased' : 
                     insights.leafAnalysis.healthStatus === 'stressed' ? 'Stressed' : 'Unknown'}
                  </p>
                </div>
                
                {insights.leafAnalysis.leafColor && (
                  <div>
                    <p className="text-gray-500">Leaf Color</p>
                    <p className="font-medium">{insights.leafAnalysis.leafColor}</p>
                  </div>
                )}
                
                {insights.leafAnalysis.patternDetected && (
                  <div className="col-span-2">
                    <p className="text-gray-500">Pattern Detected</p>
                    <p className="font-medium">{insights.leafAnalysis.patternDetected}</p>
                  </div>
                )}
                
                {insights.leafAnalysis.leafType && (
                  <div>
                    <p className="text-gray-500">Leaf Type</p>
                    <p className="font-medium">{insights.leafAnalysis.leafType}</p>
                  </div>
                )}
                
                {insights.leafAnalysis.details?.symptomDescription && (
                  <div className="col-span-2 mt-1">
                    <p className="text-gray-500">Symptom Details</p>
                    <p className="font-medium text-xs">{insights.leafAnalysis.details.symptomDescription}</p>
                  </div>
                )}
              </div>
            )}
            
            {insights.leafDiagnosticCapabilities && (
              <div className="mt-2 text-xs text-green-700">
                <p className="font-medium">Advanced Capabilities:</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {insights.leafDiagnosticCapabilities.map((capability: string, idx: number) => (
                    <span key={idx} className="bg-green-100 text-green-800 px-2 py-0.5 rounded">
                      {capability}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Flora Incognita Results */}
        {hasFloraIncognita && (
          <div className="border-t pt-3 mt-3">
            <h4 className="font-medium text-gray-700 flex items-center">
              <Leaf className="h-4 w-4 mr-1.5 text-green-600" />
              Flora Incognita Analysis
            </h4>
            <div className="mt-2 text-sm">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <p className="text-gray-500">Species</p>
                  <p className="font-medium">{insights.floraIncognitaMatch.species}</p>
                </div>
                <div>
                  <p className="text-gray-500">Family</p>
                  <p className="font-medium">{insights.floraIncognitaMatch.family}</p>
                </div>
                <div>
                  <p className="text-gray-500">Confidence</p>
                  <p className="font-medium">{Math.round(insights.floraIncognitaMatch.score * 100)}%</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">Source: {insights.floraIncognitaMatch.source}</p>
            </div>
          </div>
        )}
        
        {/* PlantSnap Results */}
        {hasPlantSnap && (
          <div className="border-t pt-3 mt-3">
            <h4 className="font-medium text-gray-700 flex items-center">
              <Leaf className="h-4 w-4 mr-1.5 text-blue-600" />
              PlantSnap Analysis
            </h4>
            <div className="mt-2 text-sm">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <p className="text-gray-500">Species</p>
                  <p className="font-medium">{insights.plantSnapMatch.species}</p>
                </div>
                <div>
                  <p className="text-gray-500">Family</p>
                  <p className="font-medium">{insights.plantSnapMatch.family}</p>
                </div>
                <div>
                  <p className="text-gray-500">Confidence</p>
                  <p className="font-medium">{Math.round(insights.plantSnapMatch.score * 100)}%</p>
                </div>
              </div>
              
              {insights.plantSnapMatch.details?.common_names && insights.plantSnapMatch.details.common_names.length > 0 && (
                <div className="mt-2">
                  <p className="text-gray-500">Common Names</p>
                  <p className="font-medium">{insights.plantSnapMatch.details.common_names.join(", ")}</p>
                </div>
              )}
              
              {(insights.plantSnapMatch.details?.edible !== undefined || 
                insights.plantSnapMatch.details?.toxic !== undefined) && (
                <div className="mt-2 flex gap-4">
                  {insights.plantSnapMatch.details?.edible !== undefined && (
                    <div>
                      <p className="text-gray-500">Edible</p>
                      <p className={`font-medium ${insights.plantSnapMatch.details.edible ? 'text-green-600' : 'text-gray-600'}`}>
                        {insights.plantSnapMatch.details.edible ? 'Yes' : 'No'}
                      </p>
                    </div>
                  )}
                  
                  {insights.plantSnapMatch.details?.toxic !== undefined && (
                    <div>
                      <p className="text-gray-500">Toxic</p>
                      <p className={`font-medium ${insights.plantSnapMatch.details.toxic ? 'text-red-600' : 'text-gray-600'}`}>
                        {insights.plantSnapMatch.details.toxic ? 'Yes' : 'No'}
                      </p>
                    </div>
                  )}
                </div>
              )}
              
              <p className="text-xs text-gray-500 mt-2">Source: {insights.plantSnapMatch.source}</p>
            </div>
          </div>
        )}
        
        {/* Original HuggingFace/API Results */}
        {insights?.huggingFaceResult && (
          <div className={`${hasFloraIncognita || hasPlantSnap ? 'border-t pt-3 mt-3' : ''}`}>
            <h4 className="font-medium text-gray-700">AI Model Classification</h4>
            <div className="mt-2 text-sm">
              <p>
                <span className="text-gray-500">Result:</span>{' '}
                <span className="font-medium">{insights.huggingFaceResult.label}</span>
              </p>
              <p>
                <span className="text-gray-500">Confidence:</span>{' '}
                <span className="font-medium">
                  {Math.round(insights.huggingFaceResult.score * 100)}%
                </span>
              </p>
            </div>
          </div>
        )}
        
        {/* AI Services Used */}
        {analysisDetails.plantVerification?.aiServices && analysisDetails.plantVerification.aiServices.length > 0 && (
          <div className="border-t pt-3 mt-3">
            <h4 className="font-medium text-gray-700">AI Services Used</h4>
            <div className="mt-2 space-y-2">
              {analysisDetails.plantVerification.aiServices.map((service, index) => (
                <div key={index} className="flex items-center text-sm">
                  <div className={`h-2 w-2 rounded-full mr-2 ${service.result ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  <span>{service.serviceName}</span>
                  {service.confidence > 0 && (
                    <span className="ml-auto text-xs text-gray-500">
                      {Math.round(service.confidence * 100)}% confidence
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Warning about reliability */}
        {insights?.isReliable === false && (
          <div className="mt-4 p-2 bg-amber-50 border border-amber-200 rounded-md flex items-start">
            <AlertTriangle className="h-4 w-4 text-amber-500 mr-2 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">
              The analysis results have low confidence. Consider uploading a clearer image of the plant.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};

export default AiServicesData;
