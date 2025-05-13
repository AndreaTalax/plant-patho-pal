
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

  // Controlla se abbiamo dati di HuggingFace
  const hasHuggingFaceData = analysisDetails?.multiServiceInsights?.huggingFaceResult;

  if (!hasAiServiceData && !hasHuggingFaceData || isAnalyzing) {
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
          
          {/* Diamo priorità ai dati di HuggingFace se presenti */}
          {hasHuggingFaceData && (
            <div className="mt-2 pt-2 border-t-2 border-blue-200 bg-blue-50 p-2 rounded mb-3">
              <h5 className="font-semibold text-blue-700 mb-1">HuggingFace Analysis</h5>
              <div className="flex justify-between">
                <span>Rilevato:</span>
                <span className="font-medium">{analysisDetails?.multiServiceInsights?.huggingFaceResult?.label}</span>
              </div>
              <div className="flex justify-between">
                <span>Confidenza:</span>
                <span className="font-medium">
                  {Math.round((analysisDetails?.multiServiceInsights?.huggingFaceResult?.score || 0) * 100)}%
                </span>
              </div>
              <div className="text-xs text-blue-600 mt-1 italic">
                Analisi effettuata tramite modello VineetJohn/plant-disease-detection
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
          
          {analysisDetails?.multiServiceInsights && (
            <div className="mt-2 pt-2 border-t">
              <div className="flex justify-between">
                <span>Punteggio Affidabilità:</span>
                <span className="font-medium">{analysisDetails.multiServiceInsights.agreementScore}%</span>
              </div>
              <div className="flex justify-between">
                <span>Servizio Principale:</span>
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
