
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw, 
  MessageSquare,
  Lightbulb,
  Eye,
  EyeOff,
  ArrowRight
} from 'lucide-react';
import { DiagnosedDisease, PlantInfo, AnalysisDetails } from '../types';

interface DiagnosisResultProps {
  imageSrc: string;
  plantInfo: PlantInfo;
  analysisData: DiagnosedDisease | null;
  isAnalyzing: boolean;
  onStartNewAnalysis: () => void;
  onChatWithExpert: () => void;
  onSendToExpert?: () => void;
  analysisDetails?: AnalysisDetails | null;
}

const DiagnosisResult: React.FC<DiagnosisResultProps> = ({
  imageSrc,
  plantInfo,
  analysisData,
  isAnalyzing,
  onStartNewAnalysis,
  onChatWithExpert,
  onSendToExpert,
  analysisDetails
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [expertDataSent, setExpertDataSent] = useState(false);

  const handleSendToExpert = async () => {
    if (onSendToExpert) {
      await onSendToExpert();
      setExpertDataSent(true);
    }
  };

  if (isAnalyzing) {
    return (
      <Card className="p-8 bg-white/80 backdrop-blur-sm">
        <div className="flex flex-col items-center space-y-6">
          <div className="relative">
            <div className="w-20 h-20 bg-gradient-to-r from-drplant-green to-drplant-blue rounded-full flex items-center justify-center animate-pulse">
              <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Analisi in corso...</h2>
            <p className="text-gray-600">
              Stiamo analizzando la tua pianta utilizzando AI avanzata
            </p>
          </div>
          {imageSrc && (
            <div className="w-64 h-64 rounded-xl overflow-hidden border-2 border-drplant-green/20">
              <img 
                src={imageSrc} 
                alt="Pianta in analisi" 
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>
      </Card>
    );
  }

  if (!analysisData) {
    return (
      <Card className="p-6 text-center">
        <p className="text-gray-600">Nessun risultato di analisi disponibile</p>
        <Button onClick={onStartNewAnalysis} className="mt-4">
          Inizia nuova analisi
        </Button>
      </Card>
    );
  }

  const confidenceColor = analysisData.confidence >= 80 
    ? 'text-green-600 bg-green-100' 
    : analysisData.confidence >= 60 
    ? 'text-yellow-600 bg-yellow-100' 
    : 'text-red-600 bg-red-100';

  return (
    <div className="space-y-6">
      {/* Main Analysis Card */}
      <Card className="overflow-hidden shadow-lg">
        <div className="bg-gradient-to-r from-drplant-green to-drplant-blue p-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            {analysisData.healthy ? (
              <CheckCircle className="h-8 w-8" />
            ) : (
              <AlertTriangle className="h-8 w-8" />
            )}
            <div>
              <h2 className="text-2xl font-bold">
                {analysisData.name || 'Pianta Analizzata'}
              </h2>
              <p className="text-white/80">
                Analisi completata con AI avanzata
              </p>
            </div>
            <div className="ml-auto">
              <Badge className={`text-white text-lg px-3 py-1 ${
                analysisData.confidence >= 80 ? 'bg-green-500' :
                analysisData.confidence >= 60 ? 'bg-yellow-500' : 'bg-red-500'
              }`}>
                {analysisData.confidence}% precisione
              </Badge>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Image Section */}
            <div className="space-y-4">
              {imageSrc && (
                <div className="aspect-square rounded-xl overflow-hidden shadow-md">
                  <img 
                    src={imageSrc} 
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
                analysisData.healthy 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-orange-50 border border-orange-200'
              }`}>
                <h3 className="font-semibold mb-2 text-gray-900">
                  {analysisData.healthy ? 'Pianta Sana' : 'Problemi Rilevati'}
                </h3>
                <p className="text-sm text-gray-700 mb-3">
                  {analysisData.description}
                </p>
                {analysisData.disclaimer && (
                  <p className="text-xs text-gray-600 italic">
                    {analysisData.disclaimer}
                  </p>
                )}
              </div>

              {/* Symptoms */}
              {analysisData.symptoms && analysisData.symptoms.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <h3 className="font-semibold text-blue-800 mb-3">Sintomi Rilevati:</h3>
                  <ul className="space-y-1">
                    {analysisData.symptoms.map((symptom, index) => (
                      <li key={index} className="text-sm text-blue-700 flex items-start">
                        <span className="w-2 h-2 bg-blue-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        {symptom}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Treatments */}
              {analysisData.treatments && analysisData.treatments.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <h3 className="font-semibold text-green-800 mb-3">Raccomandazioni:</h3>
                  <ul className="space-y-2">
                    {analysisData.treatments.map((treatment, index) => (
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

          {/* Analysis Details Toggle */}
          {analysisDetails && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <Button
                variant="ghost"
                onClick={() => setShowDetails(!showDetails)}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
              >
                {showDetails ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {showDetails ? 'Nascondi dettagli tecnici' : 'Mostra dettagli tecnici'}
              </Button>

              {showDetails && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Informazioni Pianta:</h4>
                      <ul className="space-y-1 text-gray-600">
                        <li>Nome: {analysisDetails.multiServiceInsights?.plantName || 'N/A'}</li>
                        <li>Specie: {analysisDetails.multiServiceInsights?.plantSpecies || 'N/A'}</li>
                        <li>Sana: {analysisDetails.multiServiceInsights?.isHealthy ? 'Sì' : 'No'}</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Dettagli Analisi:</h4>
                      <ul className="space-y-1 text-gray-600">
                        <li>Servizio: {analysisDetails.multiServiceInsights?.primaryService || 'N/A'}</li>
                        <li>Precisione: {analysisDetails.risultatiCompleti?.accuracyGuarantee || 'N/A'}</li>
                        <li>Tecnologia: {analysisDetails.analysisTechnology || 'AI Avanzata'}</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Button 
          onClick={onStartNewAnalysis} 
          variant="outline" 
          className="h-14 text-base border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50"
        >
          <RefreshCw className="mr-3 h-5 w-5" />
          Analizza Altra Pianta
        </Button>
        
        {/* Chat with Expert button - SEMPLICE navigazione */}
        <Button 
          onClick={onChatWithExpert} 
          className="h-14 text-base bg-drplant-blue hover:bg-drplant-blue/90 text-white shadow-lg"
        >
          <MessageSquare className="mr-3 h-5 w-5" />
          Chat with Expert
        </Button>
      </div>

      {/* Expert Consultation Card - CON TUTTA LA LOGICA */}
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
                Riceverai una risposta professionale nella chat
              </p>
            </div>
          </div>
          <div className="mt-3">
            <Button
              onClick={onChatWithExpert}
              variant="outline"
              size="sm"
              className="text-green-700 border-green-300 hover:bg-green-100"
            >
              Vai alla chat
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default DiagnosisResult;
