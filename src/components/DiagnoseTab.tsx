
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
import { verifyImageContainsPlant, analyzeImageQuality } from '@/utils/plant-analysis/plantImageVerification';

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
  const [dataSentToExpert, setDataSentToExpert] = useState(false);
  
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
          description: `${plantVerification.reason}. Per risultati migliori, usa un'immagine più chiara della pianta.`,
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

  // Camera capture handler con verifica pianta
  const handleCameraCapture = useCallback(async (imageDataUrl: string) => {
    try {
      // Converti data URL in file per la verifica
      const response = await fetch(imageDataUrl);
      const blob = await response.blob();
      const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
      
      // Verifica che l'immagine contenga una pianta
      const containsPlant = await verifyPlantInImage(file);
      if (!containsPlant) {
        setShowCamera(true); // Mantieni la camera aperta
        return; // Stop se non contiene una pianta
      }
      
      setUploadedImage(imageDataUrl);
      
      // Update plant info with captured image
      setPlantInfo({
        ...plantInfo,
        uploadedImageUrl: imageDataUrl
      });
      
      setShowCamera(false);
      setCurrentStage('options');
      toast.success('Foto verificata e scattata! Ora scegli il metodo di diagnosi.');
    } catch (error) {
      console.error('Errore verifica foto catturata:', error);
      toast.error('Errore nella verifica della foto');
    }
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
                    onClick={() => setShowCamera(true)}
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
              onSelectAI={handleSelectAI}
              onSelectExpert={handleSelectExpert}
              hasAIAccess={hasAIAccess}
            />
          </div>
        );

      case 'analyzing':
        return (
          <ScanLayout 
            isAnalyzing={isAnalyzing}
            plantInfo={plantInfo}
            uploadedImage={uploadedImage}
          />
        );

      case 'result':
        if (analysisResult && uploadedImage) {
          return (
            <PlantAnalysisResultComponent
              analysisResult={analysisResult}
              imageUrl={uploadedImage}
              onNewAnalysis={handleNewAnalysis}
            />
          );
        } else {
          // Expert consultation result
          return (
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
          );
        }

      default:
        return null;
    }
  };

  // Show camera component if active
  if (showCamera) {
    return (
      <CameraCapture
        onCapture={handleCameraCapture}
        onCancel={() => setShowCamera(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto">
        {renderCurrentStage()}
      </div>
    </div>
  );
};

export default DiagnoseTab;
