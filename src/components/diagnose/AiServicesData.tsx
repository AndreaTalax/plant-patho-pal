import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, Check, X, Brain } from 'lucide-react';
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
            <EyeOff className="h-4 w-4" /> Nascondi Dati Servizi AI
          </>
        ) : (
          <>
            <Eye className="h-4 w-4" /> Mostra Dati Servizi AI
          </>
        )}
      </Button>
      
      {showAiServices && (
        <div className="mt-2 border rounded-lg p-2 text-xs bg-gray-50">
          <h4 className="font-semibold mb-1">Risultati Servizi AI</h4>
          
          {/* Prioritize HuggingFace data if present */}
          {hasHuggingFaceData && (
            <div className="mt-2 pt-2 border-t-2 border-blue-200 bg-blue-50 p-2 rounded mb-3">
              <div className="flex justify-between items-center mb-1">
                <h5 className="font-semibold text-blue-700">Analisi PictureThis™ AI</h5>
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
                <span>Rilevato:</span>
                <span className="font-medium">{analysisDetails?.multiServiceInsights?.huggingFaceResult?.label}</span>
              </div>
              <div className="flex justify-between">
                <span>Affidabilità:</span>
                <span className="font-medium">
                  {Math.round((analysisDetails?.multiServiceInsights?.huggingFaceResult?.score || 0) * 100)}%
                </span>
              </div>
              <div className="text-xs text-blue-600 mt-1 italic">
                Analisi effettuata con modelli PictureThis e HuggingFace
              </div>
            </div>
          )}
          
          {/* Services data */}
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
          
          {/* Multi service insights */}
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
            </div>
          )}
          
          {/* Plantix insights */}
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
