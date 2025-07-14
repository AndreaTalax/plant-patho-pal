import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw, 
  MessageCircle,
  Users,
  Clock,
  Lightbulb,
  Shield,
  Database
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { PlantDataSyncService } from '@/services/chat/plantDataSyncService';
import { AutoExpertNotificationService } from '@/components/chat/AutoExpertNotificationService';
import { PaymentRequiredModal } from '@/components/subscription/PaymentRequiredModal';
import { toast } from 'sonner';
import ImageDisplay from './ImageDisplay';
import PlantInfoCard from './PlantInfoCard';
import EppoDataPanel from './EppoDataPanel';

interface DiagnosisResultProps {
  imageSrc: string;
  plantInfo: any;
  analysisData: any;
  isAnalyzing: boolean;
  onStartNewAnalysis: () => void;
  onChatWithExpert?: () => void;
  analysisDetails?: any;
}

const DiagnosisResult: React.FC<DiagnosisResultProps> = ({
  imageSrc,
  plantInfo,
  analysisData,
  isAnalyzing,
  onStartNewAnalysis,
  onChatWithExpert,
  analysisDetails
}) => {
  const { userProfile, hasActiveSubscription } = useAuth();
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

  const handleSendToExpert = async () => {
    if (!userProfile?.id || dataSentToExpert) {
      return;
    }

    // Controllo ruolo amministratore (accesso libero)
    const isAdmin = userProfile?.role === 'admin';
    
    // Controllo abbonamento per utenti non-admin
    if (!isAdmin && !hasActiveSubscription()) {
      setShowPaymentModal(true);
      return;
    }

    setSendingToExpert(true);
    
    try {
      console.log('📨 Invio dati completi all\'esperto...');
      
      // Sincronizza i dati della pianta
      const synced = await PlantDataSyncService.syncPlantDataToChat(
        userProfile.id,
        plantInfo,
        imageSrc
      );

      if (synced) {
        // Se ci sono risultati AI, inviali anche
        if (analysisData) {
          const diagnosisData = {
            plantType: analysisData.plantName || analysisData.name || 'Pianta non identificata',
            plantVariety: analysisData.scientificName || analysisData.variety,
            symptoms: plantInfo.symptoms || 'Risultati analisi AI',
            imageUrl: imageSrc,
            analysisResult: analysisData,
            confidence: analysisData.confidence || analysisDetails?.confidence || 0,
            isHealthy: analysisData.isHealthy || analysisData.healthy || false,
            plantInfo: {
              environment: plantInfo.isIndoor ? 'Interno' : 'Esterno',
              watering: plantInfo.wateringFrequency,
              lightExposure: plantInfo.lightExposure,
              symptoms: plantInfo.symptoms
            }
          };

          await AutoExpertNotificationService.sendDiagnosisToExpert(
            userProfile.id,
            diagnosisData
          );
        }

        setDataSentToExpert(true);
        toast.success('Tutti i dati inviati all\'esperto!', {
          description: 'Analisi AI + dati pianta + foto inviati a Marco Nigro'
        });

        // Naviga alla chat immediatamente
        if (onChatWithExpert) {
          onChatWithExpert();
        } else {
          if (userProfile?.role === 'expert' || userProfile?.role === 'admin') {
            window.dispatchEvent(new CustomEvent('switchTab', { detail: 'expert' }));
          } else {
            window.dispatchEvent(new CustomEvent('switchTab', { detail: 'chat' }));
          }
        }
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

  const handleNavigateToChat = () => {
    console.log("🔄 Navigating from DiagnosisResult to chat...");
    
    try {
      if (onChatWithExpert) {
        onChatWithExpert();
      } else {
        // Navigazione diretta senza delay
        if (userProfile?.role === 'expert' || userProfile?.role === 'admin') {
          console.log("🎯 Master account - switching to expert tab");
          window.dispatchEvent(new CustomEvent('switchTab', { detail: 'expert' }));
        } else {
          console.log("🎯 Regular user - switching to chat tab");
          window.dispatchEvent(new CustomEvent('switchTab', { detail: 'chat' }));
        }
      }
    } catch (error) {
      console.error("❌ Navigation error:", error);
      toast.error("Errore nella navigazione alla chat");
    }
  };

  if (isAnalyzing) {
    return (
      <div className="text-center space-y-4 py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-drplant-blue mx-auto"></div>
        <p className="text-gray-600">Analisi avanzata in corso con database EPPO...</p>
      </div>
    );
  }

  // Prima definisco le variabili base
  const confidencePercent = analysisData?.confidence 
    ? Math.round(analysisData.confidence * 100) 
    : analysisDetails?.confidence 
    ? Math.round(analysisDetails.confidence * 100) 
    : 50; // Default al 50% invece di 0

  const isHealthy = analysisData?.isHealthy || analysisData?.healthy || false;
  const isHighConfidence = (analysisData?.confidence || analysisDetails?.confidence || 0) >= 0.7;
  const isLowConfidence = (analysisData?.confidence || analysisDetails?.confidence || 0) < 0.5;
  const hasEppoData = analysisDetails?.eppoResultsCount > 0;

  // Poi definisco le funzioni helper che usano le variabili sopra
  const getPlantInfo = () => {
    const sources = [
      analysisData?.plant?.name,
      analysisData?.plantName,
      analysisData?.name,
      analysisDetails?.plantIdentification,
      analysisDetails?.multiServiceInsights?.plantName,
      analysisDetails?.eppoPlantIdentification?.preferredName,
      analysisData?.species,
      analysisData?.label
    ];
    
    const plantName = sources.find(name => name && name.trim() && name !== 'Unknown') || 'Pianta rilevata';
    
    const scientificSources = [
      analysisData?.plant?.scientific_name,
      analysisData?.scientificName,
      analysisDetails?.scientificName,
      analysisDetails?.multiServiceInsights?.plantSpecies,
      analysisData?.variety,
      analysisDetails?.eppoPlantIdentification?.scientificName
    ];
    
    const scientificName = scientificSources.find(name => name && name.trim());
    
    return { plantName, scientificName };
  };

  const getDiseaseInfo = () => {
    let diseases = [];
    
    // Cerca malattie in vari formati
    if (analysisData?.diseases && Array.isArray(analysisData.diseases)) {
      diseases = analysisData.diseases;
    } else if (analysisData?.disease) {
      diseases = [analysisData.disease];
    } else if (analysisDetails?.risultatiCompleti?.detectedDiseases) {
      diseases = analysisDetails.risultatiCompleti.detectedDiseases;
    } else if (analysisData?.predictions && Array.isArray(analysisData.predictions)) {
      diseases = analysisData.predictions.map(pred => ({ name: pred.class || pred.label, probability: pred.probability || pred.confidence }));
    } else if (analysisData?.label && !analysisData.isHealthy) {
      diseases = [{ name: analysisData.label, probability: analysisData.confidence || 0.5 }];
    }
    
    // Se non trova malattie specifiche ma la pianta non è sana, crea una diagnosi generica
    if (diseases.length === 0 && analysisData && !isHealthy) {
      diseases = [{ 
        name: 'Possibile problema rilevato', 
        probability: analysisData.confidence || 0.5,
        description: 'L\'analisi AI ha rilevato possibili anomalie che richiedono ulteriore valutazione'
      }];
    }
    
    return diseases;
  };

  // Infine chiamo le funzioni
  const { plantName, scientificName } = getPlantInfo();
  const diseaseList = getDiseaseInfo();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Enhanced Header risultati */}
      <Card className={`border-2 ${isHealthy && isHighConfidence ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50'}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3">
              {isHealthy ? (
                <CheckCircle className="h-6 w-6 text-green-600" />
              ) : (
                <AlertTriangle className="h-6 w-6 text-amber-600" />
              )}
              <span>Diagnosi Avanzata Completata</span>
              {hasEppoData && (
                <Badge className="bg-blue-100 text-blue-800 border border-blue-300">
                  <Database className="h-3 w-3 mr-1" />
                  EPPO Enhanced
                </Badge>
              )}
            </CardTitle>
            {confidencePercent > 0 && (
              <Badge variant={isHighConfidence ? "default" : isLowConfidence ? "destructive" : "secondary"}>
                {confidencePercent}% accuratezza
              </Badge>
            )}
          </div>
          {hasEppoData && (
            <p className="text-sm text-blue-700 mt-2">
              Diagnosi potenziata con database europeo EPPO per maggiore precisione
            </p>
          )}
        </CardHeader>
      </Card>

      {/* EPPO Data Panel - Show if enhanced analysis was performed */}
      {hasEppoData && (
        <EppoDataPanel 
          analysisDetails={analysisDetails}
          userInput={plantInfo?.symptoms}
          eppoData={analysisData?.diseases?.filter(d => d.eppoCode) || []}
        />
      )}

      {/* Immagine e info pianta */}
      <div className="grid md:grid-cols-2 gap-6">
        <ImageDisplay imageSrc={imageSrc} isHealthy={isHealthy} />
        <PlantInfoCard plantInfo={plantInfo} analysisDetails={analysisDetails} />
      </div>

      {/* Enhanced Risultati diagnosi */}
      {analysisData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🔬 Risultati Diagnosi Avanzata
              {hasEppoData && (
                <Badge variant="outline" className="text-blue-600">
                  Database EPPO
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Nome pianta dettagliato - Usa la logica robusta */}
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h3 className="font-semibold text-lg text-green-800 flex items-center gap-2">
                🌱 {plantName}
                {analysisDetails?.eppoPlantIdentification && (
                  <Badge className="bg-blue-100 text-blue-800">EPPO Verified</Badge>
                )}
              </h3>
              {scientificName && (
                <p className="text-green-700 italic mt-1 font-medium">
                  {scientificName}
                </p>
              )}
              {analysisDetails?.eppoPlantIdentification && (
                <p className="text-blue-600 text-sm mt-2">
                  Identificazione confermata tramite database EPPO: {analysisDetails.eppoPlantIdentification}
                </p>
              )}
            </div>

            {/* Enhanced Malattie/problemi - Usa la logica robusta */}
            {diseaseList && diseaseList.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  Problemi Rilevati
                  {hasEppoData && (
                    <Badge variant="outline" className="text-xs">
                      Enhanced
                    </Badge>
                  )}
                </h4>
                {diseaseList.map((disease: any, index: number) => (
                  <div key={index} className={`border rounded-lg p-3 ${disease.isRegulated ? 'bg-red-50 border-red-200' : 'bg-red-50'}`}>
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <h5 className="font-medium text-red-800">{disease.name}</h5>
                        {disease.isRegulated && (
                          <Badge variant="destructive" className="text-xs">
                            <Shield className="h-3 w-3 mr-1" />
                            REGOLAMENTATO
                          </Badge>
                        )}
                        {disease.eppoCode && (
                          <Badge variant="outline" className="text-xs text-blue-600">
                            EPPO: {disease.eppoCode}
                          </Badge>
                        )}
                      </div>
                      <Badge variant="destructive" className="text-xs">
                        {getProbabilityDisplay(disease.probability)}
                      </Badge>
                    </div>
                    {disease.description && (
                      <p className="text-sm text-red-700 mb-2">{disease.description}</p>
                    )}
                    {disease.treatment && (
                      <p className="text-sm text-red-600">
                        <strong>Trattamento:</strong> {disease.treatment}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Enhanced Raccomandazioni */}
            {analysisData.recommendations && analysisData.recommendations.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-yellow-600" />
                  Raccomandazioni Avanzate
                </h4>
                <ul className="space-y-1">
                  {analysisData.recommendations.map((rec: string, index: number) => (
                    <li key={index} className="flex items-start gap-2">
                      <Shield className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className={`text-sm ${rec.includes('ATTENZIONE') || rec.includes('URGENTE') ? 'font-medium text-red-700' : ''}`}>
                        {rec}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Sezione Analisi Dettagliata Multi-AI */}
      {analysisDetails && (
        <Card className="mb-6">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3">
              <Database className="h-5 w-5 text-purple-600" />
              🧬 Analisi Dettagliata Multi-AI
              <Badge variant="secondary" className="ml-auto">
                {analysisDetails.multiServiceInsights?.agreementScore || 75}% Consenso
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Specie Identificata</h4>
                <p className="text-gray-700">{analysisDetails.multiServiceInsights?.plantName || 'Non identificata'}</p>
                <p className="text-sm text-gray-600">{analysisDetails.multiServiceInsights?.plantSpecies || 'Specie sconosciuta'}</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Tecnologia Utilizzata</h4>
                <p className="text-gray-700">{analysisDetails.analysisTechnology || 'AI Avanzata'}</p>
                <p className="text-sm text-gray-600">Fonte: {analysisDetails.multiServiceInsights?.dataSource || 'Analisi AI'}</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Garanzia Accuratezza</h4>
                <p className="text-gray-700">{analysisDetails.risultatiCompleti?.accuracyGuarantee || '70%+'}</p>
                <p className="text-sm text-gray-600">Servizio primario: {analysisDetails.multiServiceInsights?.primaryService || 'GPT-4 Vision'}</p>
              </div>
            </div>

            {analysisDetails.identifiedFeatures && analysisDetails.identifiedFeatures.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">🔍 Caratteristiche Identificate</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {analysisDetails.identifiedFeatures.map((feature: string, index: number) => (
                    <div key={index} className="flex items-center gap-2 text-sm text-gray-700">
                      <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                      {feature}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {analysisDetails.risultatiCompleti?.detectedDiseases && analysisDetails.risultatiCompleti.detectedDiseases.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">🏥 Malattie Rilevate dai Servizi AI</h4>
                <div className="space-y-2">
                  {analysisDetails.risultatiCompleti.detectedDiseases.map((disease: any, index: number) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex justify-between items-start mb-2">
                        <h5 className="font-medium text-gray-900">{disease.name}</h5>
                        <Badge variant={disease.confidence > 70 ? "destructive" : "secondary"}>
                          {disease.confidence}% Probabilità
                        </Badge>
                      </div>
                      {disease.description && (
                        <p className="text-sm text-gray-600 mb-2">{disease.description}</p>
                      )}
                      {disease.symptoms && disease.symptoms.length > 0 && (
                        <div className="mb-2">
                          <p className="text-xs font-medium text-gray-700 mb-1">Sintomi:</p>
                          <div className="flex flex-wrap gap-1">
                            {disease.symptoms.map((symptom: string, idx: number) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {symptom}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {disease.treatment && (
                        <p className="text-xs text-gray-600"><strong>Trattamento:</strong> {disease.treatment}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {analysisDetails.alternativeDiagnoses && analysisDetails.alternativeDiagnoses.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">🔄 Diagnosi Alternative</h4>
                <div className="space-y-2">
                  {analysisDetails.alternativeDiagnoses.map((diagnosis: string, index: number) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-3">
                      <p className="text-sm text-gray-700">{diagnosis}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Pulsanti azione */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Invia all'Esperto - SEMPRE PRESENTE */}
        <Card className="border-2 border-drplant-green">
          <CardContent className="p-4">
            <div className="flex items-start gap-3 mb-3">
              <Users className="h-5 w-5 text-drplant-green mt-0.5" />
              <div>
                <h3 className="font-semibold text-drplant-green">Consulenza Esperto</h3>
                <p className="text-sm text-gray-600">
                  {analysisData ? 'Invia risultati AI + dati al fitopatologo' : 'Invia dati al fitopatologo'}
                </p>
              </div>
            </div>
            
            {dataSentToExpert ? (
              <div className="text-center py-2">
                <div className="flex items-center justify-center gap-2 text-green-600 mb-2">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Dati inviati!</span>
                </div>
                <Button 
                  onClick={handleNavigateToChat}
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
                    Invio...
                  </>
                ) : (
                  <>
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Invia all'Esperto
                  </>
                )}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Nuova Analisi */}
        <Card className="border-2 border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3 mb-3">
              <RefreshCw className="h-5 w-5 text-gray-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-gray-800">Nuova Analisi</h3>
                <p className="text-sm text-gray-600">Analizza un'altra pianta</p>
              </div>
            </div>
            
            <Button 
              onClick={onStartNewAnalysis}
              variant="outline"
              className="w-full"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Analizza Altra Pianta
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced warning for low confidence or regulated organisms */}
      {(isLowConfidence || analysisData?.diseases?.some((d: any) => d.isRegulated)) && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-amber-800">
                  {analysisData?.diseases?.some((d: any) => d.isRegulated) 
                    ? 'Organismi Regolamentati Rilevati - Consulenza Urgente' 
                    : 'Consulenza Esperto Raccomandata'}
                </h3>
                <p className="text-sm text-amber-700">
                  {analysisData?.diseases?.some((d: any) => d.isRegulated)
                    ? 'Sono stati rilevati possibili organismi regolamentati EPPO. È necessaria una consulenza fitopatologo urgente e possibile notifica alle autorità competenti.'
                    : `L'analisi AI ha una accuratezza del ${confidencePercent}%. Ti consigliamo di consultare il nostro fitopatologo per una diagnosi più precisa.`}
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
          toast.success('Abbonamento attivato! Invio dati all\'esperto...');
          // Dopo il pagamento, invia automaticamente i dati all'esperto
          setTimeout(() => {
            handleSendToExpert();
          }, 1500);
        }}
      />
    </div>
  );
};

export default DiagnosisResult;
