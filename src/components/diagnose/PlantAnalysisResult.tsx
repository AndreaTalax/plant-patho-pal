
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw, 
  MessageSquare,
  Leaf,
  Activity,
  Database,
  ArrowRight
} from 'lucide-react';
import { PlantAnalysisResult } from '@/services/realPlantAnalysisService';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { PlantDataSyncService } from '@/services/chat/plantDataSyncService';
import { AutoExpertNotificationService } from '@/components/chat/AutoExpertNotificationService';
import { toast } from 'sonner';

interface PlantAnalysisResultProps {
  analysisResult: PlantAnalysisResult;
  imageUrl: string;
  onNewAnalysis: () => void;
  autoSentToExpert?: boolean;
  plantInfo?: any;
  onSendToExpert?: () => void;
}

const PlantAnalysisResultComponent: React.FC<PlantAnalysisResultProps> = ({
  analysisResult,
  imageUrl,
  onNewAnalysis,
  autoSentToExpert = false,
  plantInfo,
  onSendToExpert
}) => {
  const navigate = useNavigate();
  const { userProfile } = useAuth();

  // Semplice navigazione alla chat - NESSUNA logica di invio dati
  const handleGoToChat = () => {
    navigate('/');
    setTimeout(() => {
      const event = new CustomEvent('switchTab', { detail: 'chat' });
      window.dispatchEvent(event);
    }, 100);
  };

  // Logica completa per invio all'esperto con tutti i dati
  const handleSendToExpert = async () => {
    if (!userProfile?.id) {
      toast.error('Devi essere autenticato per contattare l\'esperto');
      return;
    }

    try {
      console.log('📨 Invio risultati analisi all\'esperto...');
      
      // Sincronizza i dati usando PlantDataSyncService
      const synced = await PlantDataSyncService.syncPlantDataToChat(
        userProfile.id,
        plantInfo,
        imageUrl
      );

      if (synced) {
        console.log('✅ Dati sincronizzati con successo alla chat');
        
        // Invia anche i risultati dell'analisi AI
        const diagnosisData = {
          plantType: plantInfo?.name || 'Pianta non specificata',
          plantVariety: plantInfo?.name,
          symptoms: plantInfo?.symptoms || 'Nessun sintomo specificato',
          imageUrl: imageUrl,
          analysisResult: analysisResult,
          confidence: analysisResult.confidence || 0,
          isHealthy: analysisResult.isHealthy || false,
          plantInfo: {
            environment: plantInfo?.isIndoor ? 'Interno' : 'Esterno',
            watering: plantInfo?.wateringFrequency,
            lightExposure: plantInfo?.lightExposure,
            symptoms: plantInfo?.symptoms
          }
        };

        await AutoExpertNotificationService.sendDiagnosisToExpert(
          userProfile.id,
          diagnosisData
        );

        toast.success('Analisi inviata all\'esperto!', {
          description: 'Marco Nigro riceverà tutti i risultati nella chat.'
        });

        if (onSendToExpert) {
          onSendToExpert();
        }
      } else {
        toast.error('Errore nell\'invio all\'esperto');
      }
    } catch (error) {
      console.error('❌ Errore invio all\'esperto:', error);
      toast.error('Errore nell\'invio all\'esperto');
    }
  };

  const confidenceColor = analysisResult.confidence >= 0.8 
    ? 'bg-green-500' 
    : analysisResult.confidence >= 0.6 
    ? 'bg-yellow-500' 
    : 'bg-red-500';

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Analysis Results</h1>
          <p className="text-gray-600">AI-powered plant health assessment</p>
        </div>

        {/* Main Result Card */}
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
                  {analysisResult.plantName}
                </h2>
                {analysisResult.scientificName && (
                  <p className="text-white/80 italic">
                    {analysisResult.scientificName}
                  </p>
                )}
              </div>
              <div className="ml-auto">
                <Badge className={`${confidenceColor} text-white text-lg px-3 py-1`}>
                  {Math.round(analysisResult.confidence * 100)}% confidence
                </Badge>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Image Section */}
              <div className="space-y-4">
                <div className="aspect-square rounded-xl overflow-hidden shadow-md">
                  <img 
                    src={imageUrl} 
                    alt="Analyzed plant" 
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-green-50 p-3 rounded-lg text-center">
                    <Leaf className="h-6 w-6 text-green-600 mx-auto mb-1" />
                    <p className="text-xs text-green-600 font-medium">
                      {analysisResult.isHealthy ? 'Healthy' : 'Issues'}
                    </p>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg text-center">
                    <Activity className="h-6 w-6 text-blue-600 mx-auto mb-1" />
                    <p className="text-xs text-blue-600 font-medium">
                      {Math.round(analysisResult.confidence * 100)}% AI
                    </p>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-lg text-center">
                    <Database className="h-6 w-6 text-purple-600 mx-auto mb-1" />
                    <p className="text-xs text-purple-600 font-medium">
                      Real APIs
                    </p>
                  </div>
                </div>
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
                    {analysisResult.isHealthy ? 'Plant Appears Healthy' : 'Potential Issues Detected'}
                  </h3>
                  <p className="text-sm text-gray-700">
                    {analysisResult.isHealthy 
                      ? 'The AI analysis indicates your plant is in good health. Continue with regular care and monitoring.'
                      : 'The analysis has detected potential issues. Professional consultation is recommended for accurate treatment.'}
                  </p>
                </div>

                {/* Diseases Section */}
                {analysisResult.diseases && analysisResult.diseases.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <h3 className="font-semibold text-red-800 mb-3">Detected Issues:</h3>
                    <div className="space-y-3">
                      {analysisResult.diseases.map((disease, index) => (
                        <div key={index} className="bg-white rounded-lg p-3 shadow-sm">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium text-gray-900">{disease.name}</h4>
                            <Badge variant="outline" className="text-xs">
                              {Math.round(disease.probability * 100)}% probability
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{disease.description}</p>
                          {disease.treatment && (
                            <p className="text-sm font-medium text-green-700">
                              Treatment: {disease.treatment}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {analysisResult.recommendations && analysisResult.recommendations.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <h3 className="font-semibold text-blue-800 mb-3">Recommendations:</h3>
                    <ul className="space-y-2">
                      {analysisResult.recommendations.map((rec, index) => (
                        <li key={index} className="text-sm text-blue-700 flex items-start">
                          <span className="w-2 h-2 bg-blue-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                          {rec}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Button 
            onClick={onNewAnalysis} 
            variant="outline" 
            className="h-14 text-base border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50"
          >
            <RefreshCw className="mr-3 h-5 w-5" />
            Analyze Another Plant
          </Button>
          
          {/* Pulsante Chat semplice - SOLO navigazione */}
          <Button 
            onClick={handleGoToChat} 
            className="h-14 text-base bg-drplant-blue hover:bg-drplant-blue/90 text-white shadow-lg"
          >
            <MessageSquare className="mr-3 h-5 w-5" />
            Chat with Expert
          </Button>
        </div>

        {/* Sezione per seconda opinione - CON TUTTA LA LOGICA */}
        {!autoSentToExpert && (
          <Card className="p-6 bg-blue-50/80 backdrop-blur-sm border-blue-200">
            <div className="text-center space-y-4">
              <h4 className="font-medium text-blue-800 text-lg">
                💡 Vuoi una seconda opinione?
              </h4>
              <p className="text-blue-700">
                Invia i risultati dell'analisi AI a Marco Nigro per una conferma professionale
              </p>
              <Button
                onClick={handleSendToExpert}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 text-base"
              >
                Invia all'esperto per conferma
              </Button>
            </div>
          </Card>
        )}

        {/* Conferma invio */}
        {autoSentToExpert && (
          <Card className="p-4 bg-green-50/80 backdrop-blur-sm border-green-200">
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-green-800 font-medium">
                Analisi inviata all'esperto Marco Nigro!
              </span>
            </div>
          </Card>
        )}

        {/* API Sources Footer */}
        <Card className="p-6 bg-gray-50 border-dashed">
          <div className="text-center">
            <h4 className="font-medium text-gray-900 mb-3">Analysis powered by:</h4>
            <div className="flex flex-wrap justify-center gap-3">
              <Badge variant="secondary" className="bg-white shadow-sm">Plant.id API</Badge>
              <Badge variant="secondary" className="bg-white shadow-sm">Hugging Face AI</Badge>
              <Badge variant="secondary" className="bg-white shadow-sm">EPPO Database</Badge>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default PlantAnalysisResultComponent;
