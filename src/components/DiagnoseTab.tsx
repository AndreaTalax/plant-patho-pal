import React, { useState, useRef, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, Camera, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { usePlantInfo } from '@/context/PlantInfoContext';
import PlantInfoForm from './diagnose/PlantInfoForm';
import PlantInfoSummary from './diagnose/PlantInfoSummary';
import DiagnosisOptions from './diagnose/DiagnosisOptions';
import PhotoInstructions from './diagnose/PhotoInstructions';
import ScanLayout from './diagnose/scan/ScanLayout';
import PlantAnalysisResultComponent from './diagnose/PlantAnalysisResult';
import { EnhancedResultsView } from './diagnose/EnhancedResultsView';
import CameraCapture from './diagnose/CameraCapture';
import { RealPlantAnalysisService, PlantAnalysisResult as AnalysisResult } from '@/services/realPlantAnalysisService';
import { EnhancedPlantAnalysisService, type AnalysisProgress } from '@/services/enhancedPlantAnalysisService';
import { AutoExpertNotificationService } from './chat/AutoExpertNotificationService';
import { PlantDataSyncService } from '@/services/chat/plantDataSyncService';
import { ChatDataManager } from './chat/user/ChatDataManager';
import { uploadPlantImage } from '@/utils/imageStorage';
import { PlantInfo } from './diagnose/types';
import { usePremiumStatus } from '@/services/premiumService';
import { verifyImageContainsPlant, analyzeImageQuality } from '@/utils/plant-analysis/plantImageVerification';
import { PaymentRequiredModal } from './subscription/PaymentRequiredModal';

const DiagnoseTab = () => {
  const { userProfile, hasActiveSubscription } = useAuth();
  const { plantInfo, setPlantInfo } = usePlantInfo();
  const { hasAIAccess } = usePremiumStatus();
  
  // Component states
  const [currentStage, setCurrentStage] = useState<'info' | 'capture' | 'options' | 'analyzing' | 'result'>('info');
  const [showCamera, setShowCamera] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState<AnalysisProgress | null>(null);
  const [enhancedResult, setEnhancedResult] = useState<any>(null);
  const [dataSentToExpert, setDataSentToExpert] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [cameraStoppedByUser, setCameraStoppedByUser] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Verifica che l'immagine contenga una pianta prima di procedere
  const verifyPlantInImage = async (file: File): Promise<boolean> => {
    try {
      console.log('🔍 Verifica se l\'immagine contiene una pianta...');
      
      // Analisi qualità immagine
      const qualityCheck = analyzeImageQuality(file);
      if (!qualityCheck.isGoodQuality) {
        toast.warning('Problemi di qualità dell\'immagine', {
          description: qualityCheck.issues.join(', ') + '. ' + qualityCheck.recommendations.join(', '),
          duration: 6000
        });
      }
      
      // Verifica presenza pianta
      const plantVerification = await verifyImageContainsPlant(file);
      
      if (!plantVerification.isPlant || plantVerification.confidence < 40) {
        toast.error('❌ Nessuna pianta rilevata nell\'immagine', {
          description: `${plantVerification.reason}. Scatta una foto che mostri chiaramente una pianta.`,
          duration: 8000
        });
        return false;
      }
      
      if (plantVerification.confidence < 70) {
        toast.warning('⚠️ Pianta rilevata con bassa confidenza', {
          description: `${plantVerification.reason}. Per risultati migliori, usa un\'immagine più chiara della pianta.`,
          duration: 6000
        });
      } else {
        toast.success('✅ Pianta rilevata nell\'immagine', {
          description: `${plantVerification.reason}`,
          duration: 4000
        });
      }
      
      return true;
    } catch (error) {
      console.error('Errore verifica pianta:', error);
      toast.error('Errore nella verifica dell\'immagine');
      return false;
    }
  };

  // Plant info completion handler
  const handlePlantInfoComplete = useCallback((data: PlantInfo) => {
    setPlantInfo(data);
    setCurrentStage('capture');
    toast.success('Informazioni pianta salvate! Ora scatta o carica una foto.');
  }, [setPlantInfo]);

  // File upload handler con verifica pianta
  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Carica un file immagine valido');
      return;
    }

    // Verifica che l'immagine contenga una pianta
    const containsPlant = await verifyPlantInImage(file);
    if (!containsPlant) {
      return; // Stop se non contiene una pianta
    }

    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setUploadedImage(result);
        
        // Update plant info with uploaded image
        setPlantInfo({
          ...plantInfo,
          uploadedFile: file,
          uploadedImageUrl: result
        });
        
        setCurrentStage('options');
        toast.success('Immagine verificata e caricata! Ora scegli il metodo di diagnosi.');
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Errore caricamento file:', error);
      toast.error('Errore nel caricamento immagine');
    }
  }, [setPlantInfo, plantInfo]);

  // Camera capture handler migliorato per permettere nuove foto
  const handleCameraCapture = useCallback(async (imageDataUrl: string) => {
    try {
      // Converti data URL in file per la verifica
      const response = await fetch(imageDataUrl);
      const blob = await response.blob();
      const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
      
      // Verifica che l'immagine contenga una pianta
      const containsPlant = await verifyPlantInImage(file);
      if (!containsPlant) {
        // NON chiudere la fotocamera - permetti di scattare un'altra foto
        console.log('🔄 Pianta non rilevata, fotocamera rimane attiva per nuovi tentativi');
        toast.error('Pianta non rilevata. Prova a scattare un\'altra foto con una pianta ben visibile.', {
          duration: 5000
        });
        return; // Esci senza chiudere la fotocamera
      }
      
      // Solo se la pianta è stata rilevata, procedi con la chiusura della fotocamera
      setUploadedImage(imageDataUrl);
      
      // Update plant info with captured image
      setPlantInfo({
        ...plantInfo,
        uploadedImageUrl: imageDataUrl
      });
      
      setShowCamera(false);
      setCameraStoppedByUser(false);
      setCurrentStage('options');
      toast.success('Foto verificata e scattata! Ora scegli il metodo di diagnosi.');
    } catch (error) {
      console.error('Errore verifica foto catturata:', error);
      toast.error('Errore nella verifica della foto. Riprova.');
    }
  }, [setPlantInfo, plantInfo]);

  // Gestione chiusura fotocamera da parte dell'utente
  const handleCameraCancel = useCallback(() => {
    setShowCamera(false);
    setCameraStoppedByUser(true);
    setCurrentStage('capture');
  }, []);

  // Send data to expert with automatic sync
  const sendDataToExpert = useCallback(async (includeAnalysis: boolean = false) => {
    if (!userProfile?.id || !uploadedImage || dataSentToExpert) {
      console.log('❌ Condizioni non soddisfatte per invio esperto:', { 
        userProfile: !!userProfile?.id, 
        uploadedImage: !!uploadedImage, 
        dataSentToExpert 
      });
      return false;
    }

    // 🔒 CONTROLLO ABBONAMENTO - Blocca se non abbonato
    if (!hasActiveSubscription()) {
      console.log('❌ Abbonamento richiesto per invio esperto');
      setShowPaymentModal(true);
      return false;
    }

    try {
      console.log('📨 Invio dati all\'esperto...');
      
      // Sincronizza i dati usando PlantDataSyncService
      const synced = await PlantDataSyncService.syncPlantDataToChat(
        userProfile.id,
        plantInfo,
        uploadedImage
      );

      if (synced) {
        console.log('✅ Dati sincronizzati con successo alla chat');
        setDataSentToExpert(true);
        
        // Se c'è un'analisi AI, invia anche quella
        if (includeAnalysis && analysisResult) {
          const diagnosisData = {
            plantType: plantInfo.name || 'Pianta non specificata',
            plantVariety: plantInfo.name,
            symptoms: plantInfo.symptoms || 'Nessun sintomo specificato',
            imageUrl: uploadedImage,
            analysisResult: analysisResult,
            confidence: analysisResult.confidence || 0,
            isHealthy: analysisResult.isHealthy || false,
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

        toast.success('Dati inviati all\'esperto!', {
          description: 'Marco Nigro riceverà tutte le informazioni nella chat.'
        });
        return true;
      }

      return false;
    } catch (error) {
      console.error('❌ Errore invio dati all\'esperto:', error);
      toast.error('Errore nell\'invio all\'esperto');
      return false;
    }
  }, [userProfile, uploadedImage, plantInfo, analysisResult, dataSentToExpert]);

  // Implementazione handleAIAnalysis con EnhancedPlantAnalysisService
  const handleAIAnalysis = async () => {
    if (!hasAIAccess) {
      toast.error('La diagnosi AI richiede un account Premium');
      return;
    }

    if (!uploadedImage) {
      toast.error('Nessuna immagine disponibile per l\'analisi');
      return;
    }

    setCurrentStage('analyzing');
    setIsAnalyzing(true);
    setAnalysisProgress({ step: 'start', progress: 0, message: 'Inizializzazione analisi...' });
    
    try {
      console.log('🔍 Avvio analisi migliorata con EnhancedPlantAnalysisService...');
      
      // Avvia analisi multi-AI con progress in tempo reale
      const result = await EnhancedPlantAnalysisService.analyzeImage(
        uploadedImage.split(',')[1], // Rimuovi prefisso data:image
        (progress) => setAnalysisProgress(progress) // Aggiorna progress in tempo reale
      );
      
      // Converti risultato per compatibilità
      const analysisResult: AnalysisResult = {
        plantName: result.consensus.mostLikelyPlant?.plantName || 'Pianta identificata',
        scientificName: result.consensus.mostLikelyPlant?.scientificName,
        confidence: result.consensus.finalConfidence / 100,
        isHealthy: result.diseaseDetection.length === 0,
        diseases: result.diseaseDetection.map(disease => ({
          name: disease.disease,
          probability: disease.confidence / 100,
          description: disease.symptoms.join(', '),
          treatment: disease.treatments.join(', ')
        })),
        recommendations: result.consensus.mostLikelyPlant?.careInstructions || [],
        analysisDetails: {
          source: 'Enhanced Multi-AI Analysis',
          timestamp: result.analysisMetadata?.timestamp
        }
      };

      setCurrentStage('result');
      setEnhancedResult(result); // Salva anche il risultato completo
      
      toast.success('Analisi completata con successo!', {
        description: `Provider migliore: ${result.consensus.bestProvider} - Confidenza: ${result.consensus.finalConfidence}%`
      });

    } catch (error) {
      console.error('❌ Analisi fallita:', error);
      toast.error(`Errore durante l'analisi: ${error.message}`);
      setCurrentStage('options');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Expert consultation selection
  const handleSelectExpert = useCallback(async () => {
    console.log('🩺 Selezione consulenza esperto...');
    
    // Update plant info to indicate expert consultation
    const updatedPlantInfo = { 
      ...plantInfo, 
      sendToExpert: true, 
      useAI: false 
    };
    setPlantInfo(updatedPlantInfo);
    
    // Invia dati solo ora, quando l'utente sceglie esplicitamente
    const sent = await sendDataToExpert(false);
    
    if (sent) {
      setCurrentStage('result');
      
      // Navigate to chat tab after a short delay
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('switchTab', { detail: 'chat' }));
      }, 2000);
      
      toast.success('Reindirizzamento alla chat con l\'esperto...', {
        description: 'Tutte le informazioni sono state inviate'
      });
    }
  }, [sendDataToExpert, setPlantInfo, plantInfo]);

  // Main analysis function with real APIs
  const performAnalysis = useCallback(async (file: File, imageDataUrl: string) => {
    if (!userProfile?.id) {
      toast.error('Effettua il login per eseguire l\'analisi');
      return;
    }

    setIsAnalyzing(true);
    setDataSentToExpert(false);

    try {
      console.log('🔍 Avvio analisi pianta...');
      
      // Upload image to storage
      const imageUrl = await uploadPlantImage(file, userProfile.id);
      console.log('📸 Immagine caricata:', imageUrl);

      // Perform real AI analysis
      const analysis = await RealPlantAnalysisService.analyzePlantWithRealAPIs(
        imageDataUrl,
        plantInfo
      );

      // Save to database
      await RealPlantAnalysisService.saveAnalysisToDatabase(
        userProfile.id,
        imageUrl,
        analysis,
        plantInfo
      );

      setAnalysisResult(analysis);
      
      // Update plant info to indicate AI analysis
      setPlantInfo({
        ...plantInfo,
        useAI: true,
        sendToExpert: false
      });
      
      setCurrentStage('result');

      toast.success('Analisi completata!', {
        description: 'Puoi ora consultare i risultati o inviarli all\'esperto.'
      });

    } catch (error) {
      console.error('❌ Analisi fallita:', error);
      toast.error(`Analisi fallita: ${error.message}`);
      setCurrentStage('options');
    } finally {
      setIsAnalyzing(false);
    }
  }, [userProfile, plantInfo, setPlantInfo]);

  // Reset to start new analysis
  const handleNewAnalysis = useCallback(() => {
    setCurrentStage('info');
    setUploadedImage(null);
    setAnalysisResult(null);
    setEnhancedResult(null);
    setPlantInfo({
      isIndoor: true,
      wateringFrequency: '',
      lightExposure: '',
      symptoms: '',
      useAI: false,
      sendToExpert: false,
      name: '',
      infoComplete: false,
      uploadedFile: null,
      uploadedImageUrl: null
    });
  }, [setPlantInfo]);

  // Navigate to chat
  const handleNavigateToChat = useCallback(() => {
    console.log("🔄 Navigating to chat...");
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('switchTab', { detail: 'chat' }));
    }, 100);
  }, []);

  // Render based on current stage
  const renderCurrentStage = () => {
    switch (currentStage) {
      case 'info':
        return (
          <>
            <PlantInfoForm 
              onComplete={handlePlantInfoComplete}
              initialData={plantInfo}
            />
            <ChatDataManager />
          </>
        );

      case 'capture':
        return (
          <div className="space-y-6">
            <PlantInfoSummary 
              plantInfo={plantInfo} 
              onEdit={() => setCurrentStage('info')} 
            />
            
            <PhotoInstructions />
            
            <Card className="w-full max-w-2xl mx-auto">
              <div className="p-6">
                <h3 className="text-xl font-semibold text-center mb-4">
                  📸 Carica una foto della pianta
                </h3>
                <p className="text-center text-gray-600 mb-6">
                  Questo passaggio è obbligatorio per procedere con la diagnosi.
                  <br />
                  <strong>La foto deve mostrare chiaramente una pianta per procedere.</strong>
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    className="h-32 flex flex-col items-center justify-center gap-3 border-2 border-dashed border-gray-300 hover:border-gray-400"
                  >
                    <Upload className="h-8 w-8 text-gray-500" />
                    <span className="text-sm">Carica da Galleria</span>
                  </Button>
                  
                  <Button
                    onClick={() => {
                      setShowCamera(true);
                      setCameraStoppedByUser(false);
                    }}
                    variant="outline"
                    className="h-32 flex flex-col items-center justify-center gap-3 border-2 border-dashed border-gray-300 hover:border-gray-400"
                  >
                    <Camera className="h-8 w-8 text-gray-500" />
                    <span className="text-sm">Scatta Foto</span>
                  </Button>
                </div>
                
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />

                {/* Messaggio di incoraggiamento se la fotocamera è stata chiusa senza successo */}
                {cameraStoppedByUser && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      💡 <strong>Suggerimento:</strong> Assicurati che la pianta sia ben illuminata e chiaramente visibile nell'inquadratura. Puoi riprovare con la fotocamera o caricare un'immagine dalla galleria.
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        );

      case 'options':
        return (
          <div className="space-y-6">
            <PlantInfoSummary 
              plantInfo={plantInfo} 
              onEdit={() => setCurrentStage('info')} 
            />
            
            {uploadedImage && (
              <Card className="w-full max-w-2xl mx-auto">
                <div className="p-4">
                  <h3 className="text-lg font-semibold mb-3">✅ Immagine Verificata</h3>
                  <div className="aspect-square max-w-xs mx-auto rounded-lg overflow-hidden">
                    <img 
                      src={uploadedImage} 
                      alt="Pianta verificata" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="text-center text-sm text-green-600 mt-2">
                    Pianta rilevata correttamente nell'immagine
                  </p>
                </div>
              </Card>
            )}
            
            <DiagnosisOptions
              onSelectAI={handleAIAnalysis}
              onSelectExpert={handleSelectExpert}
              hasAIAccess={hasAIAccess}
            />
          </div>
        );

      case 'analyzing':
        return (
          <div className="space-y-6">
            <PlantInfoSummary 
              plantInfo={plantInfo} 
              onEdit={() => setCurrentStage('info')} 
            />
            
            <Card className="w-full max-w-2xl mx-auto">
              <div className="p-8 text-center">
                <div className="flex flex-col items-center space-y-4">
                  <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold">
                      🤖 Analisi AI Multi-Provider in corso...
                    </h3>
                    {analysisProgress && (
                      <>
                        <p className="text-gray-600">{analysisProgress.message}</p>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                            style={{ width: `${analysisProgress.progress}%` }}
                          ></div>
                        </div>
                        <p className="text-sm text-gray-500">
                          {analysisProgress.step} - {analysisProgress.progress}%
                        </p>
                      </>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 max-w-md">
                    Stiamo analizzando la tua pianta usando provider AI multipli per darti 
                    la diagnosi più accurata possibile...
                  </p>
                </div>
              </div>
            </Card>
          </div>
        );

      case 'result':
        return (
          <div className="space-y-6">
            {enhancedResult ? (
              <EnhancedResultsView
                result={enhancedResult}
                imageUrl={uploadedImage || ''}
                onSendToExpert={() => sendDataToExpert(true)}
                onNewAnalysis={handleNewAnalysis}
              />
            ) : analysisResult && uploadedImage ? (
              <PlantAnalysisResultComponent
                analysisResult={analysisResult}
                imageUrl={uploadedImage}
                onNewAnalysis={handleNewAnalysis}
              />
            ) : (
              <div className="text-center space-y-6 py-12">
                <CheckCircle className="h-20 w-20 text-green-500 mx-auto" />
                <h2 className="text-2xl font-bold text-gray-900">
                  Dati Inviati all'Esperto
                </h2>
                <p className="text-gray-600 max-w-md mx-auto">
                  Marco Nigro ha ricevuto tutte le informazioni sulla tua pianta e ti risponderà a breve nella chat.
                </p>
                <div className="space-y-3">
                  <Button onClick={handleNavigateToChat} className="mr-4">
                    Vai alla Chat
                  </Button>
                  <Button onClick={handleNewAnalysis} variant="outline">
                    Nuova Diagnosi
                  </Button>
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  // Show camera component if active
  if (showCamera) {
    return (
      <CameraCapture
        onCapture={handleCameraCapture}
        onCancel={handleCameraCancel}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto">
        {renderCurrentStage()}
      </div>
      
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

export default DiagnoseTab;
