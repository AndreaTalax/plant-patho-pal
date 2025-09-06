import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, Camera, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { PlantInfoForm } from '@/components/diagnose/PlantInfoForm';
import PlantInfoForm from './diagnose/PlantInfoForm';
import PlantInfoSummary from './diagnose/PlantInfoSummary';
import DiagnosisOptions from './diagnose/DiagnosisOptions';
import PhotoInstructions from './diagnose/PhotoInstructions';
import ScanLayout from './diagnose/scan/ScanLayout';
import CameraCapture from './diagnose/CameraCapture';
import { usePlantDiagnosis } from '@/hooks/usePlantDiagnosis';
import { AutoExpertNotificationService } from './chat/AutoExpertNotificationService';
import { PlantDataSyncService } from '@/services/chat/plantDataSyncService';
import { ChatDataManager } from './chat/user/ChatDataManager';
import { uploadPlantImage } from '@/utils/imageStorage';
import { PlantInfo } from './diagnose/types';
import { usePremiumStatus } from '@/services/premiumService';
import { verifyImageContainsPlant, analyzeImageQuality } from '@/utils/plant-analysis/plantImageVerification';
import { useImageValidation } from '@/hooks/useImageValidation';
import { ImageValidationFeedback } from './diagnose/ImageValidationFeedback';
import { PaymentRequiredModal } from './subscription/PaymentRequiredModal';
import DiagnosisResult from './diagnose/result/DiagnosisResult';
import { useDiagnosisLimits } from '@/hooks/useDiagnosisLimits';
import { AIApiSetup } from './diagnose/AIApiSetup';
import { ApiKeyManager } from './diagnose/ApiKeyManager';
import { supabase } from '@/integrations/supabase/client';


const DiagnoseTab = () => {
  const { userProfile, hasActiveSubscription } = useAuth();
  const { plantInfo, setPlantInfo } = usePlantInfo();
  const { results, structuredResults, analyzeImage, analyzeWithUserData, clearResults, isAnalyzing, progress } = usePlantAnalysis();
  const { hasAIAccess } = usePremiumStatus();
  
  // Hook per gestione limiti diagnosi gratuite
  const {
    canUseFreeDiagnosis,
    getRemainingFreeDiagnoses,
    incrementDiagnosisUsage,
    isLoading: isDiagnosisLoading,
    FREE_DIAGNOSES_LIMIT
  } = useDiagnosisLimits();
  
  // Utilizzo del hook per la diagnosi
  const {
    isAnalyzing,
    uploadedImage,
    diagnosisResult,
    diagnosedDisease,
    analysisProgress,
    analysisDetails,
    retryCount,
    streamRef,
    isSaving,
    resetDiagnosis,
    captureImage,
    handleImageUpload,
    analyzeUploadedImage,
    stopCameraStream,
    setUploadedImage,
    saveDiagnosis,
  } = usePlantDiagnosis();
  
  // Component states
  const { validateImage, isValidating, validationResult } = useImageValidation();
  const [currentStage, setCurrentStage] = useState<'info' | 'capture' | 'options' | 'analyzing' | 'result' | 'api-setup'>('info');
  const [showCamera, setShowCamera] = useState(false);
  const [dataSentToExpert, setDataSentToExpert] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [cameraStoppedByUser, setCameraStoppedByUser] = useState(false);
  const [apiStatus, setApiStatus] = useState<any>(null);
  const [checkingApis, setCheckingApis] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check API status on mount
  useEffect(() => {
    const checkApiStatus = async () => {
      setCheckingApis(true);
      try {
        const { data } = await supabase.functions.invoke('check-api-status');
        setApiStatus(data);
        
        // Se nessuna API è configurata, mostra la configurazione
        if (data && !data.openai && !data.plantid && !data.eppo) {
          setCurrentStage('api-setup');
        }
      } catch (error) {
        console.error('❌ Errore verifica API:', error);
      } finally {
        setCheckingApis(false);
      }
    };
    
    checkApiStatus();
  }, []);

  // Monitor analysis state
  useEffect(() => {
    if (isAnalyzing) {
      setCurrentStage('analyzing');
    } else if (diagnosisResult && currentStage === 'analyzing') {
      setCurrentStage('result');
    }
  }, [isAnalyzing, diagnosisResult, currentStage]);

  // Plant info completion handler
  const handlePlantInfoComplete = useCallback((data: PlantInfo) => {
    setPlantInfo(data);

    // Segna definitivamente che l'utente ha completato almeno una diagnosi (persistente per utente)
    try {
      if (data.infoComplete) {
        localStorage.setItem('firstDiagnosisDone', 'true');
        if (userProfile?.id) {
          localStorage.setItem(`firstDiagnosisDone:${userProfile.id}`, 'true');
        }
      }
    } catch {}

    setCurrentStage('capture');
    toast.success('Informazioni pianta salvate! Ora scatta o carica una foto.');
  }, [setPlantInfo, userProfile?.id]);

  // File upload handler - NON avvia automaticamente la diagnosi
  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Carica un file immagine valido');
      return;
    }

    // Verifica che l'immagine contenga una pianta usando il nuovo sistema
    const validationResult = await validateImage(file);
    if (!validationResult.isValid) {
      return; // Stop se non contiene una pianta
    }

    try {
      // Crea URL temporaneo SENZA avviare l'analisi
      const tempUrl = URL.createObjectURL(file);
      setUploadedImage(tempUrl);
      
      // Salva il file per uso futuro (quando l'utente sceglie il metodo di diagnosi)
      const updatedPlantInfo = { 
        ...plantInfo, 
        uploadedFile: file,
        uploadedImageUrl: tempUrl
      };
      setPlantInfo(updatedPlantInfo);
      
      setCurrentStage('options');
      toast.success('Immagine verificata e caricata! Ora scegli il metodo di diagnosi.');
    } catch (error) {
      console.error('Errore caricamento file:', error);
      toast.error('Errore nel caricamento immagine');
    }
  }, [plantInfo, setPlantInfo, setUploadedImage, validateImage]);

  // Camera capture handler - NON avvia automaticamente la diagnosi
  const handleCameraCapture = useCallback(async (imageDataUrl: string) => {
    try {
      // Converti data URL in file per la verifica
      const response = await fetch(imageDataUrl);
      const blob = await response.blob();
      const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
      
      // Verifica che l'immagine contenga una pianta usando il nuovo sistema
      const validationResult = await validateImage(file);
      if (!validationResult.isValid) {
        // NON chiudere la fotocamera - permetti di scattare un'altra foto
        console.log('🔄 Pianta non rilevata, fotocamera rimane attiva per nuovi tentativi');
        return; // Esci senza chiudere la fotocamera
      }
      
      // Solo se la pianta è stata rilevata, procedi
      setUploadedImage(imageDataUrl);
      
      // Salva il file per uso futuro
      const updatedPlantInfo = { 
        ...plantInfo, 
        uploadedFile: file,
        uploadedImageUrl: imageDataUrl
      };
      setPlantInfo(updatedPlantInfo);
      
      setShowCamera(false);
      setCameraStoppedByUser(false);
      setCurrentStage('options');
      toast.success('Foto verificata e scattata! Ora scegli il metodo di diagnosi.');
    } catch (error) {
      console.error('Errore verifica foto catturata:', error);
      toast.error('Errore nella verifica della foto. Riprova.');
    }
  }, [plantInfo, setPlantInfo, setUploadedImage, validateImage]);

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
        uploadedImage,
        plantInfo.uploadedFile // Pass the uploaded file for storage upload
      );

      if (synced.success) {
        console.log('✅ Dati sincronizzati con successo alla chat');
        setDataSentToExpert(true);
        
        // La diagnosi AI viene inviata solo quando l'utente clicca esplicitamente "Chat con l'esperto"

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
  }, [userProfile, uploadedImage, plantInfo, diagnosedDisease, dataSentToExpert, hasActiveSubscription]);

  // AI diagnosis selection con controllo limiti
  const handleSelectAI = useCallback(async () => {
    // Controllo se è un utente guest o senza abbonamento
    if (!userProfile?.id) {
      toast.error('Accesso richiesto per la diagnosi AI');
      return;
    }

    // Controllo limiti diagnosi gratuite
    if (!canUseFreeDiagnosis() && !hasActiveSubscription()) {
      const remaining = getRemainingFreeDiagnoses();
      toast.error(`Hai esaurito le tue ${FREE_DIAGNOSES_LIMIT} diagnosi gratuite!`, {
        description: 'Acquista un abbonamento per continuare ad usare la diagnosi AI.',
        duration: 8000
      });
      setShowPaymentModal(true);
      return;
    }

    if (!plantInfo.uploadedFile) {
      toast.error('Nessuna immagine disponibile per l\'analisi');
      return;
    }

    try {
      console.log('🤖 Avvio diagnosi AI selezionata dall\'utente...');
      
      // Incrementa il contatore di diagnosi usate (solo se non è abbonato)
      if (!hasActiveSubscription()) {
        const incremented = await incrementDiagnosisUsage();
        if (!incremented) {
          toast.error('Errore nel tracciamento delle diagnosi. Riprova.');
          return;
        }
        
        const remaining = getRemainingFreeDiagnoses();
        if (remaining > 0) {
          toast.info(`Diagnosi gratuita utilizzata. Ne rimangono ${remaining}`, {
            duration: 4000
          });
        } else {
          toast.warning('Ultima diagnosi gratuita utilizzata! Prossima volta dovrai abbonarti.', {
            duration: 6000
          });
        }
      }
      
      // Usa il file salvato precedentemente
      await analyzeUploadedImage(plantInfo.uploadedFile);
      
      toast.info('🤖 Analisi AI avviata...', {
        description: 'Utilizzo dell\'AI più avanzata per la diagnosi fitopatologica'
      });
      
    } catch (error) {
      console.error('❌ Errore analisi AI:', error);
      toast.error(`Analisi fallita: ${error.message}`);
    }
  }, [
    plantInfo, 
    userProfile?.id,
    canUseFreeDiagnosis, 
    getRemainingFreeDiagnoses,
    incrementDiagnosisUsage,
    hasActiveSubscription,
    analyzeUploadedImage
  ]);

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

  // Reset to start new analysis
  const handleNewAnalysis = useCallback(() => {
    setCurrentStage('info');
    resetDiagnosis();
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
  }, [resetDiagnosis, setPlantInfo]);

  // Navigate to chat
  const handleNavigateToChat = useCallback(() => {
    console.log("🔄 Navigating to chat...");
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('switchTab', { detail: 'chat' }));
    }, 100);
  }, []);

  // Handle expert consultation from results
  const handleExpertConsultation = useCallback(async () => {
    const sent = await sendDataToExpert(true);
    if (sent) {
      console.log("🔄 Navigating to expert chat after diagnosis...");
      
      // Aspetta che l'evento plantDataSynced venga processato
      const handleDataSynced = () => {
        setTimeout(() => {
          if (userProfile?.role === 'expert' || userProfile?.role === 'admin') {
            window.dispatchEvent(new CustomEvent('switchTab', { detail: 'expert' }));
          } else {
            window.dispatchEvent(new CustomEvent('switchTab', { detail: 'chat' }));
          }
        }, 500);
        window.removeEventListener('plantDataSynced', handleDataSynced);
      };
      
      window.addEventListener('plantDataSynced', handleDataSynced);
      
      // Fallback nel caso l'evento non venga emesso
      setTimeout(() => {
        if (userProfile?.role === 'expert' || userProfile?.role === 'admin') {
          window.dispatchEvent(new CustomEvent('switchTab', { detail: 'expert' }));
        } else {
          window.dispatchEvent(new CustomEvent('switchTab', { detail: 'chat' }));
        }
        window.removeEventListener('plantDataSynced', handleDataSynced);
      }, 3000);
    }
  }, [sendDataToExpert, userProfile?.role]);

  // Render based on current stage
  const renderCurrentStage = () => {
    switch (currentStage) {
      case 'info':
        return (
          <div className="animate-fade-in">
            <PlantInfoForm 
              onComplete={handlePlantInfoComplete}
              initialData={plantInfo}
            />
            <ChatDataManager />
          </div>
        );

      case 'capture':
        return (
          <div className="space-y-6 animate-slide-in-right">
            <PlantInfoSummary 
              plantInfo={plantInfo} 
              onEdit={() => setCurrentStage('info')} 
            />
            
            <PhotoInstructions />
            
            <Card className="w-full max-w-2xl mx-auto hover-scale transition-all duration-300 shadow-lg hover:shadow-xl">
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
                    className="h-32 flex flex-col items-center justify-center gap-3 border-2 border-dashed border-gray-300 hover:border-gray-400 transition-all duration-300 hover:scale-105 hover:shadow-lg group"
                  >
                    <Upload className="h-8 w-8 text-gray-500 group-hover:text-primary transition-colors duration-300" />
                    <span className="text-sm group-hover:text-primary transition-colors duration-300">Carica da Galleria</span>
                  </Button>
                  
                  <Button
                    onClick={() => {
                      setShowCamera(true);
                      setCameraStoppedByUser(false);
                    }}
                    variant="outline"
                    className="h-32 flex flex-col items-center justify-center gap-3 border-2 border-dashed border-gray-300 hover:border-gray-400 transition-all duration-300 hover:scale-105 hover:shadow-lg group"
                  >
                    <Camera className="h-8 w-8 text-gray-500 group-hover:text-primary transition-colors duration-300" />
                    <span className="text-sm group-hover:text-primary transition-colors duration-300">Scatta Foto</span>
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
          <div className="space-y-6 animate-fade-in">
            <PlantInfoSummary 
              plantInfo={plantInfo} 
              onEdit={() => setCurrentStage('info')} 
            />
            
            {/* Feedback di validazione dell'immagine */}
            <ImageValidationFeedback 
              isValidating={isValidating}
              validationResult={validationResult}
              imageFile={plantInfo.uploadedFile}
            />
            
            {uploadedImage && (
              <Card className="w-full max-w-2xl mx-auto animate-scale-in hover-scale transition-all duration-300 shadow-lg hover:shadow-xl">
                <div className="p-4">
                  <h3 className="text-lg font-semibold mb-3">✅ Immagine Verificata</h3>
                  <div className="aspect-square max-w-xs mx-auto rounded-lg overflow-hidden">
                    <img 
                      src={uploadedImage} 
                      alt="Pianta verificata" 
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                    />
                  </div>
                  <p className="text-center text-sm text-green-600 mt-2 animate-bounce">
                    Pianta rilevata correttamente nell'immagine
                  </p>
                </div>
              </Card>
            )}
            
            
            <DiagnosisOptions
              onSelectAI={handleSelectAI}
              onSelectExpert={handleSelectExpert}
              hasAIAccess={hasAIAccess}
              canUseFreeDiagnosis={canUseFreeDiagnosis()}
              remainingFreeDiagnoses={getRemainingFreeDiagnoses()}
              hasActiveSubscription={hasActiveSubscription()}
            />
          </div>
        );

      case 'analyzing':
        return (
          <div className="animate-fade-in">
            <ScanLayout
              isAnalyzing={isAnalyzing}
              plantInfo={plantInfo}
              uploadedImage={uploadedImage}
            />
          </div>
        );

      case 'result':
        if (uploadedImage && (diagnosedDisease || analysisDetails)) {
          return (
            <div className="animate-slide-in-right">
              <DiagnosisResult
                imageSrc={uploadedImage}
                plantInfo={plantInfo}
                analysisData={diagnosedDisease || undefined}
                isAnalyzing={false}
                onStartNewAnalysis={handleNewAnalysis}
                onChatWithExpert={handleExpertConsultation}
                analysisDetails={analysisDetails}
              />
            </div>
          );
        } else {
          // Expert consultation result (nessun risultato AI disponibile da mostrare)
          return (
            <div className="text-center space-y-6 py-12 animate-fade-in">
              <CheckCircle className="h-20 w-20 text-green-500 mx-auto animate-bounce" />
              <h2 className="text-2xl font-bold text-gray-900 animate-scale-in">
                Dati Inviati all'Esperto
              </h2>
              <p className="text-gray-600 max-w-md mx-auto animate-fade-in animation-delay-200">
                Marco Nigro ha ricevuto tutte le informazioni sulla tua pianta e ti risponderà a breve nella chat.
              </p>
              <div className="space-y-3 animate-fade-in animation-delay-300">
                <Button onClick={handleNavigateToChat} className="mr-4 hover-scale transition-all duration-300">
                  Vai alla Chat
                </Button>
                <Button onClick={handleNewAnalysis} variant="outline" className="hover-scale transition-all duration-300">
                  Nuova Diagnosi
                </Button>
              </div>
            </div>
          );
        }

      case 'api-setup':
        const missingApis = apiStatus?.summary?.missing || [];
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2 animate-scale-in">
                🔧 Configurazione API per Diagnosi AI
              </h2>
              <p className="text-gray-600 animate-fade-in animation-delay-100">
                Per abilitare la diagnosi AI delle piante, configura almeno una delle API seguenti.
              </p>
            </div>
            
            <ApiKeyManager 
              missingApis={missingApis}
              onConfigured={async () => {
                // Ricontrolla stato API dopo configurazione
                const { data } = await supabase.functions.invoke('check-api-status');
                setApiStatus(data);
                
                // Se almeno una API è configurata, passa alla fase info
                if (data && (data.openai || data.plantid || data.eppo)) {
                  setCurrentStage('info');
                  toast.success('API configurate! Ora puoi iniziare la diagnosi.');
                }
              }}
            />
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
    <div className="min-h-screen bg-gradient-to-br from-green-50/70 via-blue-50/30 to-purple-50/50 p-4 transition-all duration-1000">
      <div className="max-w-4xl mx-auto">
        <div className="transition-all duration-500 ease-in-out">
          {renderCurrentStage()}
        </div>
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
