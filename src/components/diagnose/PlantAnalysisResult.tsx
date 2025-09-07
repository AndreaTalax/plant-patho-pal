
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConfidenceBadge } from './ConfidenceBadge';
import { 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw, 
  MessageCircle,
  Camera,
  Lightbulb,
  Shield,
  Clock,
  Users
} from 'lucide-react';
import { RealPlantAnalysisService, PlantAnalysisResult } from '@/services/realPlantAnalysisService';
import { useAuth } from '@/context/AuthContext';
import { getSymptomsAsString } from '@/utils/plantInfoUtils';
import { usePlantInfo } from '@/context/PlantInfoContext';
import { PaymentRequiredModal } from '../subscription/PaymentRequiredModal';
import { PlantDataSyncService } from '@/services/chat/plantDataSyncService';
import { AutoExpertNotificationService } from '@/components/chat/AutoExpertNotificationService';
import { toast } from 'sonner';

interface PlantAnalysisResultComponentProps {
  analysisResult: PlantAnalysisResult;
  imageUrl: string;
  onNewAnalysis: () => void;
}

const PlantAnalysisResultComponent: React.FC<PlantAnalysisResultComponentProps> = ({
  analysisResult,
  imageUrl,
  onNewAnalysis
}) => {
  const { userProfile, hasActiveSubscription } = useAuth();
  const { plantInfo } = usePlantInfo();
  const [dataSentToExpert, setDataSentToExpert] = useState(false);
  const [sendingToExpert, setSendingToExpert] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Function to safely display probability percentages
  const getProbabilityDisplay = (probability: number | undefined | null): string => {
    if (probability === undefined || probability === null || isNaN(probability)) {
      return "N/A";
    }
    // Handle both 0-1 range and 0-100 range
    const percent = probability <= 1 ? probability * 100 : probability;
    return `${Math.round(percent)}%`;
  };

  const confidencePercent = Math.round(analysisResult.confidence * 100);
  const isHighConfidence = analysisResult.confidence >= 0.7;
  const isLowConfidence = analysisResult.confidence < 0.5;

  // Funzione per inviare dati all'esperto
  const handleSendToExpert = async () => {
    if (!userProfile?.id || dataSentToExpert) {
      return;
    }

    // 🔒 CONTROLLO ABBONAMENTO - Blocca se non abbonato
    if (!hasActiveSubscription()) {
      setShowPaymentModal(true);
      return;
    }

    setSendingToExpert(true);
    
    try {
      console.log('📨 Invio dati AI + pianta all\'esperto...');
      
      // Sincronizza i dati della pianta
      const synced = await PlantDataSyncService.syncPlantDataToChat(
        userProfile.id,
        plantInfo,
        imageUrl
      );

      if (synced) {
        // Invia anche i risultati dell'analisi AI
        const diagnosisData = {
          plantType: analysisResult.plantName || 'Pianta non identificata',
          plantVariety: analysisResult.scientificName,
          symptoms: getSymptomsAsString(plantInfo.symptoms) || 'Analisi AI completata',
          imageUrl: imageUrl,
          analysisResult: analysisResult,
          confidence: analysisResult.confidence,
          isHealthy: analysisResult.isHealthy,
          plantInfo: {
            environment: plantInfo.isIndoor ? 'Interno' : 'Esterno',
            watering: plantInfo.wateringFrequency,
            lightExposure: plantInfo.lightExposure,
            symptoms: Array.isArray(plantInfo.symptoms) ? plantInfo.symptoms.join(', ') : plantInfo.symptoms
          }
        };

        await AutoExpertNotificationService.sendDiagnosisToExpert(
          userProfile.id,
          diagnosisData
        );

        setDataSentToExpert(true);
        toast.success('Analisi AI e dati pianta inviati all\'esperto!', {
          description: 'Marco Nigro riceverà tutti i risultati nella chat'
        });

        // Naviga alla chat dopo un breve delay
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('switchTab', { detail: 'chat' }));
        }, 2000);
      } else {
        toast.error('Errore nell\'invio all\'esperto');
      }
    } catch (error) {
      console.error('❌ Errore invio all\'esperto:', error);
      toast.error('Errore nell\'invio all\'esperto');
    } finally {
      setSendingToExpert(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4">
      {/* Header con stato analisi */}
      <Card className={`border-2 ${isHighConfidence ? 'border-green-200 bg-green-50' : isLowConfidence ? 'border-amber-200 bg-amber-50' : 'border-blue-200 bg-blue-50'}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3">
              {analysisResult.isHealthy ? (
                <CheckCircle className="h-6 w-6 text-green-600" />
              ) : (
                <AlertTriangle className="h-6 w-6 text-amber-600" />
              )}
              <span className="text-xl">Analisi Completata</span>
            </CardTitle>
            <ConfidenceBadge confidence={confidencePercent} />
          </div>
          <p className="text-gray-600">
            {isHighConfidence 
              ? "Analisi ad alta confidenza - Risultati affidabili"
              : isLowConfidence 
              ? "Analisi a bassa confidenza - Consulenza esperto raccomandata"
              : "Analisi a confidenza moderata - Verifica con esperto consigliata"
            }
          </p>
        </CardHeader>
      </Card>

      {/* Immagine analizzata */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Immagine Analizzata
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="aspect-square max-w-md mx-auto rounded-lg overflow-hidden border">
            <img 
              src={imageUrl} 
              alt="Pianta analizzata" 
              className="w-full h-full object-cover"
            />
          </div>
        </CardContent>
      </Card>

      {/* Risultati identificazione */}
      <Card>
        <CardHeader>
          <CardTitle>🌿 Identificazione Pianta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <h3 className="font-semibold text-lg">{analysisResult.plantName}</h3>
            {analysisResult.scientificName && (
              <p className="text-gray-600 italic">{analysisResult.scientificName}</p>
            )}
          </div>
          
          {analysisResult.diseases && analysisResult.diseases.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">
                {analysisResult.plantName === "Non è una pianta" ? "Problema di Validazione:" : "Problemi Rilevati:"}
              </h4>
              {analysisResult.diseases.map((disease, index) => (
                <div 
                  key={index} 
                  className={`border rounded-lg p-3 ${
                    analysisResult.plantName === "Non è una pianta" 
                      ? "bg-yellow-50 border-yellow-300" 
                      : "bg-red-50 border-red-300"
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h5 className={`font-medium ${
                      analysisResult.plantName === "Non è una pianta" 
                        ? "text-yellow-800" 
                        : "text-red-800"
                    }`}>
                      {disease.name}
                    </h5>
                    <Badge 
                      variant={analysisResult.plantName === "Non è una pianta" ? "secondary" : "destructive"} 
                      className="text-xs"
                    >
                      {getProbabilityDisplay(disease.probability)}
                    </Badge>
                  </div>
                  {disease.description && (
                    <p className={`text-sm mb-2 ${
                      analysisResult.plantName === "Non è una pianta" 
                        ? "text-yellow-700" 
                        : "text-red-700"
                    }`}>
                      {disease.description}
                    </p>
                  )}
                  {disease.treatment && (
                    <p className={`text-sm ${
                      analysisResult.plantName === "Non è una pianta" 
                        ? "text-yellow-600" 
                        : "text-red-600"
                    }`}>
                      <strong>
                        {analysisResult.plantName === "Non è una pianta" ? "Suggerimento:" : "Trattamento:"}
                      </strong> {disease.treatment}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Raccomandazioni */}
      {analysisResult.recommendations && analysisResult.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-600" />
              Raccomandazioni
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {analysisResult.recommendations.map((rec, index) => (
                <li key={index} className="flex items-start gap-2">
                  <Shield className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{rec}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Pulsanti azione */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Invia all'Esperto */}
        <Card className="border-2 border-drplant-green">
          <CardContent className="p-4">
            <div className="flex items-start gap-3 mb-3">
              <Users className="h-5 w-5 text-drplant-green mt-0.5" />
              <div>
                <h3 className="font-semibold text-drplant-green">Consulenza Esperto</h3>
                <p className="text-sm text-gray-600">
                  Invia risultati AI + dati pianta al fitopatologo
                </p>
              </div>
            </div>
            
            {dataSentToExpert ? (
              <div className="text-center py-2">
                <div className="flex items-center justify-center gap-2 text-green-600 mb-2">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Dati inviati con successo!</span>
                </div>
                <Button 
                  onClick={() => window.dispatchEvent(new CustomEvent('switchTab', { detail: 'chat' }))}
                  className="w-full bg-drplant-green hover:bg-drplant-green-dark"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Vai alla Chat
                </Button>
              </div>
            ) : (
              <Button 
                onClick={handleSendToExpert}
                disabled={sendingToExpert}
                className="w-full bg-drplant-green hover:bg-drplant-green-dark"
              >
                {sendingToExpert ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Invio in corso...
                  </>
                ) : (
                  <>
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Invia all'Esperto
                  </>
                )}
              </Button>
            )}
            
            <p className="text-xs text-gray-500 text-center mt-2">
              Analisi AI + foto + dati personali della pianta
            </p>
          </CardContent>
        </Card>

        {/* Nuova Analisi */}
        <Card className="border-2 border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3 mb-3">
              <RefreshCw className="h-5 w-5 text-gray-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-gray-800">Nuova Analisi</h3>
                <p className="text-sm text-gray-600">
                  Analizza un'altra pianta
                </p>
              </div>
            </div>
            
            <Button 
              onClick={onNewAnalysis}
              variant="outline"
              className="w-full"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Analizza Altra Pianta
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Avviso confidenza bassa */}
      {isLowConfidence && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-amber-800">Confidenza Bassa</h3>
                <p className="text-sm text-amber-700">
                  L'analisi AI ha una confidenza del {confidencePercent}%. 
                  Ti consigliamo fortemente di consultare il nostro esperto fitopatologo 
                  per una diagnosi più accurata.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}


      {/* Payment Required Modal */}
      <PaymentRequiredModal 
        open={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSubscribed={() => {
          setShowPaymentModal(false);
          toast.success('Abbonamento attivato! Ora puoi contattare l\'esperto.');
        }}
      />
    </div>
  );
};

export default PlantAnalysisResultComponent;
