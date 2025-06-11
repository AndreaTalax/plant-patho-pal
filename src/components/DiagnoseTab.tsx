
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
import ScanLayout from './diagnose/scan/ScanLayout';
import PlantAnalysisResultComponent from './diagnose/PlantAnalysisResult';
import CameraCapture from './diagnose/CameraCapture';
import { RealPlantAnalysisService, PlantAnalysisResult as AnalysisResult } from '@/services/realPlantAnalysisService';
import { AutoExpertNotificationService } from './chat/AutoExpertNotificationService';
import { uploadPlantImage } from '@/utils/imageStorage';
import { PlantInfo } from './diagnose/types';

const DiagnoseTab = () => {
  const { userProfile } = useAuth();
  const { plantInfo, setPlantInfo } = usePlantInfo();
  
  // Component states - Updated flow: info -> capture -> options -> analyzing -> result
  const [currentStage, setCurrentStage] = useState<'info' | 'capture' | 'options' | 'analyzing' | 'result'>('info');
  const [showCamera, setShowCamera] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [autoSentToExpert, setAutoSentToExpert] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Plant info completion handler - now goes to capture stage
  const handlePlantInfoComplete = useCallback((data: PlantInfo) => {
    setPlantInfo({ ...data, infoComplete: true });
    setCurrentStage('capture'); // Always go to capture stage after info
    toast.success('Informazioni pianta salvate! Ora scatta o carica una foto.');
  }, [setPlantInfo]);

  // File upload handler - now goes to options stage
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
        setCurrentStage('options'); // Go to options after image upload
        toast.success('Immagine caricata! Ora scegli il metodo di diagnosi.');
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Errore caricamento file:', error);
      toast.error('Errore nel caricamento immagine');
    }
  }, []);

  // Camera capture handler - now goes to options stage
  const handleCameraCapture = useCallback((imageDataUrl: string) => {
    setUploadedImage(imageDataUrl);
    setShowCamera(false);
    setCurrentStage('options'); // Go to options after camera capture
    toast.success('Foto scattata! Ora scegli il metodo di diagnosi.');
  }, []);

  // AI diagnosis selection
  const handleSelectAI = useCallback(async () => {
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
  }, [uploadedImage]);

  // Expert consultation selection
  const handleSelectExpert = useCallback(() => {
    // Update plant info to indicate expert consultation
    setPlantInfo(prev => ({ ...prev, sendToExpert: true }));
    // Navigate to chat tab
    window.dispatchEvent(new CustomEvent('switchTab', { detail: 'chat' }));
    toast.success('Reindirizzamento alla chat con l\'esperto...');
  }, [setPlantInfo]);

  // Main analysis function with real APIs
  const performAnalysis = useCallback(async (file: File, imageDataUrl: string) => {
    if (!userProfile?.id) {
      toast.error('Effettua il login per eseguire l\'analisi');
      return;
    }

    setIsAnalyzing(true);
    setAutoSentToExpert(false);

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
      setCurrentStage('result');

      // Automatically send to expert if enabled or confidence is low
      const shouldAutoSend = !analysis.isHealthy || analysis.confidence < 0.8;
      
      if (shouldAutoSend) {
        console.log('📨 Invio automatico diagnosi all\'esperto...');
        const sent = await AutoExpertNotificationService.sendDiagnosisToExpert(
          userProfile.id,
          {
            plantType: analysis.plantName,
            plantVariety: analysis.scientificName,
            symptoms: plantInfo.symptoms || 'Sintomi visivi rilevati nell\'immagine',
            imageUrl: imageUrl,
            analysisResult: analysis,
            confidence: analysis.confidence,
            isHealthy: analysis.isHealthy
          }
        );
        setAutoSentToExpert(sent);
      }

    } catch (error) {
      console.error('❌ Analisi fallita:', error);
      toast.error(`Analisi fallita: ${error.message}`);
      setCurrentStage('options');
    } finally {
      setIsAnalyzing(false);
    }
  }, [userProfile, plantInfo]);

  // Reset to start new analysis
  const handleNewAnalysis = useCallback(() => {
    setCurrentStage('info');
    setUploadedImage(null);
    setAnalysisResult(null);
    setAutoSentToExpert(false);
    setPlantInfo({
      isIndoor: true,
      wateringFrequency: '',
      lightExposure: '',
      symptoms: '',
      useAI: false,
      sendToExpert: false,
      name: '',
      infoComplete: false
    });
  }, [setPlantInfo]);

  // Render based on current stage
  const renderCurrentStage = () => {
    switch (currentStage) {
      case 'info':
        return (
          <PlantInfoForm 
            onComplete={handlePlantInfoComplete}
            initialData={plantInfo}
          />
        );

      case 'capture':
        return (
          <div className="space-y-6">
            <PlantInfoSummary 
              plantInfo={plantInfo} 
              onEdit={() => setCurrentStage('info')} 
            />
            
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

            <Card className="w-full max-w-2xl mx-auto">
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
                
                <div className="mt-4 text-center">
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
        return (
          <div className="space-y-6">
            {autoSentToExpert && (
              <Card className="p-4 bg-green-50/80 backdrop-blur-sm border-green-200">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-green-800 font-medium">
                    Diagnosi inviata automaticamente all'esperto fitopatologo!
                  </span>
                </div>
              </Card>
            )}

            {analysisResult && uploadedImage && (
              <PlantAnalysisResultComponent
                analysisResult={analysisResult}
                imageUrl={uploadedImage}
                onNewAnalysis={handleNewAnalysis}
                autoSentToExpert={autoSentToExpert}
              />
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
        videoRef={videoRef}
        canvasRef={canvasRef}
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
              Analisi AI avanzata con database professionali
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
