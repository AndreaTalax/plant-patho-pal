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
import CameraCapture from './diagnose/CameraCapture';
import { RealPlantAnalysisService, PlantAnalysisResult as AnalysisResult } from '@/services/realPlantAnalysisService';
import { AutoExpertNotificationService } from './chat/AutoExpertNotificationService';
import { PlantDataSyncService } from '@/services/chat/plantDataSyncService';
import { ChatDataManager } from './chat/user/ChatDataManager';
import { uploadPlantImage } from '@/utils/imageStorage';
import { PlantInfo } from './diagnose/types';
import { usePremiumStatus } from '@/services/premiumService';

const DiagnoseTab = () => {
  const { userProfile } = useAuth();
  const { plantInfo, setPlantInfo } = usePlantInfo();
  const { hasAIAccess } = usePremiumStatus();
  
  // Component states
  const [currentStage, setCurrentStage] = useState<'info' | 'capture' | 'options' | 'analyzing' | 'result'>('info');
  const [showCamera, setShowCamera] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [dataSentToExpert, setDataSentToExpert] = useState(false); // Cambiato da autoSentToExpert
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Plant info completion handler
  const handlePlantInfoComplete = useCallback((data: PlantInfo) => {
    setPlantInfo(data);
    setCurrentStage('capture');
    toast.success('Informazioni pianta salvate! Ora scatta o carica una foto.');
  }, [setPlantInfo]);

  // File upload handler
  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Carica un file immagine valido');
      return;
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
        toast.success('Immagine caricata! Ora scegli il metodo di diagnosi.');
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Errore caricamento file:', error);
      toast.error('Errore nel caricamento immagine');
    }
  }, [setPlantInfo, plantInfo]);

  // Camera capture handler
  const handleCameraCapture = useCallback((imageDataUrl: string) => {
    setUploadedImage(imageDataUrl);
    
    // Update plant info with captured image
    setPlantInfo({
      ...plantInfo,
      uploadedImageUrl: imageDataUrl
    });
    
    setShowCamera(false);
    setCurrentStage('options');
    toast.success('Foto scattata! Ora scegli il metodo di diagnosi.');
  }, [setPlantInfo, plantInfo]);

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

  // AI diagnosis selection
  const handleSelectAI = useCallback(async () => {
    if (!hasAIAccess) {
      toast.error('La diagnosi AI richiede un account Premium');
      return;
    }

    if (!uploadedImage) {
      toast.error('Nessuna immagine disponibile per l\'analisi');
      return;
    }

    setCurrentStage('analyzing');
    
    // Convert dataURL to file for upload
    fetch(uploadedImage)
      .then(res => res.blob())
      .then(blob => {
        const file = new File([blob], 'uploaded-image.jpg', { type: 'image/jpeg' });
        performAnalysis(file, uploadedImage);
      })
      .catch(error => {
        console.error('Errore conversione immagine:', error);
        toast.error('Errore nell\'elaborazione dell\'immagine');
        setCurrentStage('options');
      });
  }, [uploadedImage, hasAIAccess]);

  // Expert consultation selection - MODIFICATO: non invia automaticamente
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

      // NON inviare automaticamente - l'utente deve scegliere
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
    setDataSentToExpert(false);
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

  // Handler for expert consultation with full data sending logic
  const handleExpertConsultation = useCallback(async () => {
    await sendDataToExpert(true);
  }, [sendDataToExpert]);

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
            {/* Add ChatDataManager for automatic sync */}
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
                  Questo passaggio è obbligatorio per procedere con la diagnosi
                </p>
                
                <ScanLayout
                  onTakePhoto={() => setShowCamera(true)}
                  onUploadPhoto={() => fileInputRef.current?.click()}
                />
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
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
              <div className="w-full max-w-md mx-auto">
                <div className="aspect-square overflow-hidden rounded-xl border">
                  <img 
                    src={uploadedImage} 
                    alt="Immagine caricata" 
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}

            <Card className="w-full max-w-4xl mx-auto">
              <div className="p-6">
                <h3 className="text-xl font-semibold text-center mb-4">
                  🔬 Scegli il metodo di diagnosi
                </h3>
                <p className="text-center text-gray-600 mb-6">
                  Ora che hai caricato l'immagine, scegli come vuoi procedere
                </p>
                
                <DiagnosisOptions
                  onSelectAI={handleSelectAI}
                  onSelectExpert={handleSelectExpert}
                />
                
                <div className="mt-6 text-center">
                  <Button 
                    variant="outline" 
                    onClick={() => setCurrentStage('capture')}
                    className="text-sm"
                  >
                    ← Cambia foto
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        );

      case 'analyzing':
        return (
          <Card className="p-8 bg-white/80 backdrop-blur-sm">
            <div className="flex flex-col items-center space-y-6">
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-r from-drplant-green to-drplant-blue rounded-full flex items-center justify-center">
                  <Loader2 className="h-10 w-10 animate-spin text-white" />
                </div>
              </div>
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Analisi in corso</h2>
                <p className="text-gray-600">
                  Utilizzo di servizi AI avanzati per analizzare la tua pianta...
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  I tuoi dati verranno inviati automaticamente all'esperto per conferma
                </p>
              </div>
              {uploadedImage && (
                <div className="w-64 h-64 rounded-xl overflow-hidden border-2 border-drplant-green/20">
                  <img 
                    src={uploadedImage} 
                    alt="Pianta in analisi" 
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
          </Card>
        );

      case 'result':
        // Show expert consultation result
        if (plantInfo.sendToExpert && !plantInfo.useAI) {
          return (
            <div className="space-y-6">
              <PlantInfoSummary 
                plantInfo={plantInfo} 
                onEdit={() => setCurrentStage('info')} 
              />
              
              <Card className="p-6 bg-white/80 backdrop-blur-sm">
                <div className="text-center space-y-4">
                  <div className="flex justify-center">
                    <CheckCircle className="h-16 w-16 text-green-600" />
                  </div>
                  
                  <h3 className="text-2xl font-bold text-gray-900">
                    Dati inviati con successo!
                  </h3>
                  
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-medium text-green-800 mb-2">📋 Dati inviati:</h4>
                    <ul className="text-sm text-green-700 space-y-1 text-left">
                      <li>✅ Informazioni della pianta (ambiente, irrigazione, luce)</li>
                      <li>✅ Descrizione dettagliata dei sintomi</li>
                      <li>✅ Fotografia della pianta</li>
                      <li>✅ Richiesta di consulenza professionale</li>
                    </ul>
                  </div>
                  
                  {uploadedImage && (
                    <div className="w-64 h-64 mx-auto rounded-xl overflow-hidden border-2 border-green-200">
                      <img 
                        src={uploadedImage} 
                        alt="Immagine inviata" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  
                  <div className="space-y-3">
                    <Button 
                      onClick={handleNavigateToChat}
                      className="w-full bg-drplant-blue hover:bg-drplant-blue-dark text-white"
                    >
                      Vai alla chat con Marco Nigro
                    </Button>
                    
                    <Button 
                      variant="outline"
                      onClick={handleNewAnalysis}
                      className="w-full"
                    >
                      Inizia nuova analisi
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          );
        }
        
        // AI diagnosis result with option to send to expert
        return (
          <div className="space-y-6">
            {analysisResult && uploadedImage && (
              <>
                <PlantAnalysisResultComponent
                  analysisResult={analysisResult}
                  imageUrl={uploadedImage}
                  onNewAnalysis={handleNewAnalysis}
                  autoSentToExpert={dataSentToExpert}
                  plantInfo={plantInfo}
                  onSendToExpert={handleExpertConsultation}
                />
                
                {/* Pulsante per inviare all'esperto DOPO la diagnosi AI */}
                {!dataSentToExpert && (
                  <Card className="p-4 bg-blue-50/80 backdrop-blur-sm border-blue-200">
                    <div className="text-center space-y-3">
                      <h4 className="font-medium text-blue-800">
                        💡 Vuoi una seconda opinione?
                      </h4>
                      <p className="text-sm text-blue-700">
                        Invia i risultati dell'analisi AI a Marco Nigro per una conferma professionale
                      </p>
                      <Button
                        onClick={() => sendDataToExpert(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        Invia all'esperto per conferma
                      </Button>
                    </div>
                  </Card>
                )}
                
                {dataSentToExpert && (
                  <Card className="p-4 bg-green-50/80 backdrop-blur-sm border-green-200">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="text-green-800 font-medium">
                        Diagnosi inviata all'esperto Marco Nigro!
                      </span>
                    </div>
                    <div className="mt-2">
                      <Button
                        onClick={handleNavigateToChat}
                        variant="outline"
                        size="sm"
                        className="text-green-700 border-green-300"
                      >
                        Vai alla chat
                      </Button>
                    </div>
                  </Card>
                )}
              </>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  if (showCamera) {
    return (
      <CameraCapture
        onCapture={handleCameraCapture}
        onCancel={() => setShowCamera(false)}
      />
    );
  }

  return (
    <div className="min-h-[calc(100vh-8rem)] bg-gradient-to-br from-gray-50/50 via-white/30 to-drplant-green/5">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-r from-drplant-green to-drplant-blue rounded-full flex items-center justify-center">
                <Camera className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-drplant-green to-drplant-blue bg-clip-text text-transparent mb-2">
              Diagnosi Malattie delle Piante
            </h1>
            <p className="text-gray-600 text-lg">
              Analisi AI avanzata con invio automatico all'esperto
            </p>
            
            {/* Progress indicator */}
            <div className="flex items-center justify-center space-x-2 mt-4">
              <div className={`w-3 h-3 rounded-full ${currentStage === 'info' ? 'bg-drplant-blue' : currentStage === 'capture' || currentStage === 'options' || currentStage === 'analyzing' || currentStage === 'result' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
              <div className={`w-8 h-1 ${currentStage === 'capture' || currentStage === 'options' || currentStage === 'analyzing' || currentStage === 'result' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
              <div className={`w-3 h-3 rounded-full ${currentStage === 'capture' ? 'bg-drplant-blue' : currentStage === 'options' || currentStage === 'analyzing' || currentStage === 'result' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
              <div className={`w-8 h-1 ${currentStage === 'options' || currentStage === 'analyzing' || currentStage === 'result' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
              <div className={`w-3 h-3 rounded-full ${currentStage === 'options' ? 'bg-drplant-blue' : currentStage === 'analyzing' || currentStage === 'result' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
              <div className={`w-8 h-1 ${currentStage === 'result' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
              <div className={`w-3 h-3 rounded-full ${currentStage === 'result' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
            </div>
            <div className="flex justify-center space-x-8 mt-2 text-xs text-gray-600">
              <span className={currentStage === 'info' ? 'font-medium text-drplant-blue' : ''}>Info</span>
              <span className={currentStage === 'capture' ? 'font-medium text-drplant-blue' : ''}>Foto</span>
              <span className={currentStage === 'options' ? 'font-medium text-drplant-blue' : ''}>Metodo</span>
              <span className={currentStage === 'result' ? 'font-medium text-green-600' : ''}>Risultato</span>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-lg border border-drplant-green/10 overflow-hidden">
            <div className="p-8">
              {renderCurrentStage()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiagnoseTab;
