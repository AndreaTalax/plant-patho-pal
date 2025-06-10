
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

/**
* Provides advanced plant disease diagnostics through AI and expert consultations
* @example
* diagnoseComponent()
* Renders the Diagnosis Malattie delle Piante interface in various stages of analysis
* @param {Function} useAuth - Provides user authentication context.
* @param {Function} usePlantInfo - Manages the state related to plant information.
* @returns {JSX.Element} Rendered component for plant disease diagnostics.
* @description
*   - React hooks are employed for state management, including `useState`, `useRef`, and `useCallback`.
*   - The component stages (‘info’, ‘options’, ‘capture’, ‘analyzing’, ‘result’) drive conditional rendering.
*   - Incorporates mechanisms to upload images, capture photos, and verify image validity.
*   - Automatically sends diagnosis to an expert if the plant health is questionable or analysis confidence is low.
*/
const DiagnoseTab = () => {
  const { userProfile } = useAuth();
  const { plantInfo, setPlantInfo } = usePlantInfo();
  
  // Component states
  const [currentStage, setCurrentStage] = useState<'info' | 'options' | 'capture' | 'analyzing' | 'result'>('info');
  const [showCamera, setShowCamera] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [autoSentToExpert, setAutoSentToExpert] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Plant info completion handler
  const handlePlantInfoComplete = useCallback((data: PlantInfo) => {
    setPlantInfo({ ...data, infoComplete: true });
    
    // If user chose expert consultation, go directly to chat
    if (data.sendToExpert) {
      window.dispatchEvent(new CustomEvent('switchTab', { detail: 'chat' }));
      return;
    }
    
    // If user chose AI diagnosis, proceed to capture
    if (data.useAI) {
      setCurrentStage('capture');
    } else {
      setCurrentStage('options');
    }
    
    toast.success('Informazioni pianta salvate con successo!');
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
        setCurrentStage('analyzing');
        performAnalysis(file, result);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Errore caricamento file:', error);
      toast.error('Errore nel caricamento immagine');
    }
  }, []);

  // Camera capture handler
  const handleCameraCapture = useCallback((imageDataUrl: string) => {
    setUploadedImage(imageDataUrl);
    setShowCamera(false);
    setCurrentStage('analyzing');
    
    // Convert dataURL to file for upload
    fetch(imageDataUrl)
      .then(res => res.blob())
      .then(blob => {
        const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
        performAnalysis(file, imageDataUrl);
      })
      .catch(error => {
        console.error('Errore elaborazione foto:', error);
        toast.error('Errore nell\'elaborazione della foto');
      });
  }, []);

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
      setCurrentStage('capture');
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
  /**
   * Renders various stages of a plant diagnosis workflow.
   * @example
   * renderStage('info')
   * // Returns the PlantInfoForm component for the 'info' stage.
   * @param {string} currentStage - Current stage in the diagnosis workflow, dictating the rendered component.
   * @returns {JSX.Element|null} Returns the corresponding JSX element for the stage, or null if the stage is not recognized.
   * @description
   *   - Supports multiple stages such as 'info', 'options', 'capture', 'analyzing', and 'result'.
   *   - Dynamically renders components based on the value of currentStage.
   *   - Handles file uploads and interactions with AI services for plant analysis in specific stages.
   *   - Automatically sends diagnosis to an expert pathologist in the 'result' stage if applicable.
   */
  const renderCurrentStage = () => {
    switch (currentStage) {
      case 'info':
        return (
          <PlantInfoForm 
            onComplete={handlePlantInfoComplete}
            initialData={plantInfo}
          />
        );

      case 'options':
        return (
          <div className="space-y-4">
            <PlantInfoSummary 
              plantInfo={plantInfo} 
              onEdit={() => setCurrentStage('info')} 
            />
            <DiagnosisOptions
              onSelectAI={() => setCurrentStage('capture')}
              onSelectExpert={() => window.dispatchEvent(new CustomEvent('switchTab', { detail: 'chat' }))}
            />
          </div>
        );

      case 'capture':
        return (
          <div className="space-y-4">
            <PlantInfoSummary 
              plantInfo={plantInfo} 
              onEdit={() => setCurrentStage('info')} 
            />
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
        );

      case 'analyzing':
        return (
          <Card className="p-8">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
              <h2 className="text-2xl font-bold">Analisi in corso</h2>
              <p className="text-gray-600 text-center">
                Utilizzo di servizi AI reali (Plant.id, Hugging Face, Database EPPO) per analizzare la tua pianta...
              </p>
              {uploadedImage && (
                <div className="w-64 h-64 rounded-lg overflow-hidden">
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
          <div className="space-y-4">
            {autoSentToExpert && (
              <Card className="p-4 bg-green-50 border-green-200">
                <div className="flex items-center space-x-2">
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
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Diagnosi Malattie delle Piante
          </h1>
          <p className="text-gray-600">
            Analisi AI avanzata con database professionali
          </p>
        </div>

        {renderCurrentStage()}
      </div>
    </div>
  );
};

export default DiagnoseTab;
