
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, Check, X, Brain, AlertTriangle } from 'lucide-react';
import { AnalysisDetails } from '../types';
import { toast } from 'sonner';

interface AiServicesDataProps {
  analysisDetails: AnalysisDetails | null;
  isAnalyzing: boolean;
}

const AiServicesData = ({ analysisDetails, isAnalyzing }: AiServicesDataProps) => {
  const [showAiServices, setShowAiServices] = useState(false);
  
  // Check if we have AI service-specific results
  const hasAiServiceData = analysisDetails?.plantVerification?.aiServices &&
                         analysisDetails.plantVerification.aiServices.length > 0;

  // Check if we have HuggingFace data
  const hasHuggingFaceData = analysisDetails?.multiServiceInsights?.huggingFaceResult;
  
  // Check if we have EPPO regulated pest/disease data
  const hasEppoData = analysisDetails?.eppoData || 
                     analysisDetails?.multiServiceInsights?.eppoRegulated;

  if ((!hasAiServiceData && !hasHuggingFaceData) || isAnalyzing) {
    return null;
  }

  const copyDiagnosisToClipboard = () => {
    if (hasHuggingFaceData) {
      const diagnosis = analysisDetails?.multiServiceInsights?.huggingFaceResult;
      const diagnosisText = `Diagnosis: ${diagnosis?.label} (Confidence: ${Math.round((diagnosis?.score || 0) * 100)}%)`;
      navigator.clipboard.writeText(diagnosisText)
        .then(() => toast.success("Diagnosis copied to clipboard"))
        .catch(() => toast.error("Unable to copy diagnosis"));
    }
  };

  return (
    <div className="mb-4">
      <Button 
        variant="outline" 
        size="sm"
        onClick={() => setShowAiServices(!showAiServices)}
        className={`flex items-center gap-1.5 w-full ${showAiServices ? 'bg-green-50 text-green-700' : ''}`}
      >
        {showAiServices ? (
          <>
            <EyeOff className="h-4 w-4" /> Hide AI Services Data
          </>
        ) : (
          <>
            <Eye className="h-4 w-4" /> Show AI Services Data
          </>
        )}
      </Button>
      
      {showAiServices && (
        <div className="mt-2 border rounded-lg p-2 text-xs bg-gray-50">
          <h4 className="font-semibold mb-1">AI Services Results</h4>
          
          {/* EPPO Regulated Pest Warning if present */}
          {hasEppoData && (
            <div className="mt-2 mb-3 p-2 bg-red-50 border border-red-300 rounded-md text-red-800">
              <div className="flex items-center gap-1.5 mb-1 font-semibold">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <span>EPPO Regulated Pest/Disease Alert</span>
              </div>
              <p className="text-xs mb-1">
                Potential detection of a quarantine pest or disease that may require reporting to local authorities.
              </p>
              <div className="flex justify-between text-xs">
                <span>Regulation status:</span>
                <span className="font-medium">
                  {analysisDetails?.eppoData?.regulationStatus || 'Quarantine pest/disease'}
                </span>
              </div>
              {analysisDetails?.eppoData?.infoLink && (
                <div className="mt-1 text-center">
                  <a 
                    href={analysisDetails.eppoData.infoLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-red-700 underline text-xs"
                  >
                    EPPO Database Information
                  </a>
                </div>
              )}
            </div>
          )}
          
          {/* Prioritize HuggingFace data if present */}
          {hasHuggingFaceData && (
            <div className="mt-2 pt-2 border-t-2 border-blue-200 bg-blue-50 p-2 rounded mb-3">
              <div className="flex justify-between items-center mb-1">
                <h5 className="font-semibold text-blue-700">HuggingFace Analysis</h5>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="p-1 h-6" 
                  onClick={copyDiagnosisToClipboard}
                >
                  <Brain className="h-3 w-3 text-blue-600" />
                </Button>
              </div>
              <div className="flex justify-between">
                <span>Detected:</span>
                <span className="font-medium">{analysisDetails?.multiServiceInsights?.huggingFaceResult?.label}</span>
              </div>
              <div className="flex justify-between">
                <span>Confidence:</span>
                <span className="font-medium">
                  {Math.round((analysisDetails?.multiServiceInsights?.huggingFaceResult?.score || 0) * 100)}%
                </span>
              </div>
              <div className="text-xs text-blue-600 mt-1 italic">
                Analysis performed using {analysisDetails?.multiServiceInsights?.dataSource || 'PlantNet-based model'}
              </div>
            </div>
          )}
          
          {analysisDetails?.plantVerification?.aiServices?.map((service, index) => (
            <div key={index} className="flex items-center justify-between">
              <span>{service.serviceName}</span>
              <div className="flex items-center gap-1">
                {service.result ? (
                  <Check className="h-3 w-3 text-green-600" />
                ) : (
                  <X className="h-3 w-3 text-red-600" />
                )}
                <span className={service.result ? "text-green-600" : "text-red-600"}>
                  {Math.round(service.confidence * 100)}%
                </span>
              </div>
            </div>
          ))}
          
          {analysisDetails?.multiServiceInsights && !hasHuggingFaceData && (
            <div className="mt-2 pt-2 border-t">
              <div className="flex justify-between">
                <span>Reliability Score:</span>
                <span className="font-medium">{analysisDetails.multiServiceInsights.agreementScore}%</span>
              </div>
              <div className="flex justify-between">
                <span>Primary Service:</span>
                <span className="font-medium">{analysisDetails.multiServiceInsights.primaryService}</span>
              </div>
              {analysisDetails.multiServiceInsights.dataSource && (
                <div className="flex justify-between">
                  <span>Data Source:</span>
                  <span className="font-medium">{analysisDetails.multiServiceInsights.dataSource}</span>
                </div>
              )}
            </div>
          )}
          
          {/* Display PlantixInsights if available */}
          {analysisDetails?.plantixInsights && (
            <div className="mt-2 pt-2 border-t">
              <h5 className="font-semibold mb-1">Additional Insights</h5>
              {analysisDetails.plantixInsights.severity && (
                <div className="flex justify-between">
                  <span>Severity:</span>
                  <span className="font-medium">{analysisDetails.plantixInsights.severity}</span>
                </div>
              )}
              {analysisDetails.plantixInsights.spreadRisk && (
                <div className="flex justify-between">
                  <span>Spread Risk:</span>
                  <span className="font-medium">{analysisDetails.plantixInsights.spreadRisk}</span>
                </div>
              )}
              {analysisDetails.plantixInsights.confidenceNote && (
                <div className="text-xs italic mt-1 text-gray-600">
                  {analysisDetails.plantixInsights.confidenceNote}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AiServicesData;
