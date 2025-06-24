
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw, 
  Lightbulb,
  Eye,
  EyeOff,
  ArrowRight
} from 'lucide-react';
import { DiagnosedDisease, PlantInfo, AnalysisDetails } from './types';

interface PlantAnalysisResultProps {
  analysisResult: any;
  imageUrl: string;
  onNewAnalysis: () => void;
  autoSentToExpert: boolean;
  plantInfo: PlantInfo;
  onSendToExpert?: () => void;
}

const PlantAnalysisResult: React.FC<PlantAnalysisResultProps> = ({
  analysisResult,
  imageUrl,
  onNewAnalysis,
  autoSentToExpert,
  plantInfo,
  onSendToExpert
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [expertDataSent, setExpertDataSent] = useState(autoSentToExpert);

  const handleSendToExpert = async () => {
    if (onSendToExpert) {
      await onSendToExpert();
      setExpertDataSent(true);
      
      // Navigate to chat after sending data
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('switchTab', { detail: 'chat' }));
      }, 1500);
    }
  };

  if (!analysisResult) {
    return (
      <Card className="p-6 text-center">
        <p className="text-gray-600">Nessun risultato di analisi disponibile</p>
        <Button onClick={onNewAnalysis} className="mt-4">
          Inizia nuova analisi
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Analysis Card */}
      <Card className="overflow-hidden shadow-lg">
        <div className="bg-gradient-to-r from-drplant-green to-drplant-blue p-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            {analysisResult.isHealthy ? (
              <CheckCircle className="h-8 w-8" />
            ) : (
              <AlertTriangle className="h-8 w-8" />
            )}
            <div>
              <h2 className="text-2xl font-bold">
                {analysisResult.plantName || 'Pianta Analizzata'}
              </h2>
              <p className="text-white/80">
                Analisi completata con AI avanzata
              </p>
            </div>
            <div className="ml-auto">
              <Badge className={`text-white text-lg px-3 py-1 ${
                analysisResult.confidence >= 80 ? 'bg-green-500' :
                analysisResult.confidence >= 60 ? 'bg-yellow-500' : 'bg-red-500'
              }`}>
                {analysisResult.confidence}% precisione
              </Badge>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Image Section */}
            <div className="space-y-4">
              {imageUrl && (
                <div className="aspect-square rounded-xl overflow-hidden shadow-md">
                  <img 
                    src={imageUrl} 
                    alt="Pianta analizzata" 
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>

            {/* Analysis Results */}
            <div className="space-y-6">
              {/* Health Status */}
              <div className={`p-4 rounded-xl ${
                analysisResult.isHealthy 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-orange-50 border border-orange-200'
              }`}>
                <h3 className="font-semibold mb-2 text-gray-900">
                  {analysisResult.isHealthy ? 'Pianta Sana' : 'Problemi Rilevati'}
                </h3>
                <p className="text-sm text-gray-700 mb-3">
                  {analysisResult.description || analysisResult.diagnosis}
                </p>
                {analysisResult.disclaimer && (
                  <p className="text-xs text-gray-600 italic">
                    {analysisResult.disclaimer}
                  </p>
                )}
              </div>

              {/* Symptoms */}
              {analysisResult.symptoms && analysisResult.symptoms.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <h3 className="font-semibold text-blue-800 mb-3">Sintomi Rilevati:</h3>
                  <ul className="space-y-1">
                    {analysisResult.symptoms.map((symptom, index) => (
                      <li key={index} className="text-sm text-blue-700 flex items-start">
                        <span className="w-2 h-2 bg-blue-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        {symptom}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Treatments */}
              {analysisResult.treatments && analysisResult.treatments.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <h3 className="font-semibold text-green-800 mb-3">Raccomandazioni:</h3>
                  <ul className="space-y-2">
                    {analysisResult.treatments.map((treatment, index) => (
                      <li key={index} className="text-sm text-green-700 flex items-start">
                        <span className="w-2 h-2 bg-green-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        {treatment}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 gap-4">
        <Button 
          onClick={onNewAnalysis} 
          variant="outline" 
          className="h-14 text-base border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50"
        >
          <RefreshCw className="mr-3 h-5 w-5" />
          Analizza Altra Pianta
        </Button>
      </div>

      {/* Expert Consultation Card */}
      {!expertDataSent && onSendToExpert && (
        <Card className="p-6 bg-blue-50/80 backdrop-blur-sm border-blue-200">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <Lightbulb className="h-12 w-12 text-blue-600" />
            </div>
            <h4 className="font-medium text-blue-800 text-xl">
              💡 Vuoi una seconda opinione?
            </h4>
            <p className="text-blue-700 max-w-md mx-auto">
              Invia i risultati dell'analisi AI a Marco Nigro per una conferma professionale e consigli personalizzati
            </p>
            <Button
              onClick={handleSendToExpert}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-base"
            >
              Invia all'esperto per conferma
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </Card>
      )}

      {/* Confirmation Card */}
      {expertDataSent && (
        <Card className="p-4 bg-green-50/80 backdrop-blur-sm border-green-200">
          <div className="flex items-center space-x-3">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <div>
              <span className="text-green-800 font-medium">
                Analisi inviata all'esperto Marco Nigro!
              </span>
              <p className="text-green-700 text-sm">
                Reindirizzamento alla chat in corso...
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default PlantAnalysisResult;
