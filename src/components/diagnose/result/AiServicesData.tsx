
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, Check, X } from 'lucide-react';
import { AnalysisDetails } from '../types';

interface AiServicesDataProps {
  analysisDetails: AnalysisDetails | null;
  isAnalyzing: boolean;
}

const AiServicesData = ({ analysisDetails, isAnalyzing }: AiServicesDataProps) => {
  const [showAiServices, setShowAiServices] = useState(false);
  
  // Check if we have AI service-specific results
  const hasAiServiceData = analysisDetails?.plantVerification?.aiServices &&
                          analysisDetails.plantVerification.aiServices.length > 0;
                          
  if (!hasAiServiceData || isAnalyzing) {
    return null;
  }

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
          <h4 className="font-semibold mb-1">AI Service Results</h4>
          <div className="space-y-1.5">
            {analysisDetails.plantVerification?.aiServices?.map((service, index) => (
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
          </div>
          
          {analysisDetails.multiServiceInsights && (
            <div className="mt-2 pt-2 border-t">
              <div className="flex justify-between">
                <span>Agreement Score:</span>
                <span className="font-medium">{analysisDetails.multiServiceInsights.agreementScore}%</span>
              </div>
              <div className="flex justify-between">
                <span>Primary Service:</span>
                <span className="font-medium">{analysisDetails.multiServiceInsights.primaryService}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AiServicesData;
