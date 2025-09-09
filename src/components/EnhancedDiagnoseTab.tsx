import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, Camera, Leaf, Brain, User } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { usePlantInfo } from '@/context/PlantInfoContext';
import { usePlantAnalysis } from '@/hooks/usePlantAnalysis';
import { useSaveDiagnosis } from '@/hooks/useSaveDiagnosis';
import { StructuredDiagnosisDisplay } from '@/components/diagnose/StructuredDiagnosisDisplay';
import PlantInfoForm from '@/components/diagnose/PlantInfoForm';
import DiagnosisResult from '@/components/diagnose/result/DiagnosisResult';

type AnalysisStep = 'info' | 'image' | 'analysis' | 'results';

const EnhancedDiagnoseTab = () => {
  const { user } = useAuth();
  const { plantInfo, setPlantInfo } = usePlantInfo();
  const { results, structuredResults, analyzeImage, analyzeWithUserData, clearResults, isAnalyzing, progress } = usePlantAnalysis();
  const { saveDiagnosis, isSaving } = useSaveDiagnosis();
  
  const [currentStep, setCurrentStep] = useState<AnalysisStep>('info');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [useCamera, setUseCamera] = useState(false);

  // Gestione upload immagine
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Verifica che sia un'immagine
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    try {
      const imageUrl = URL.createObjectURL(file);
      setUploadedImage(imageUrl);
      setImageFile(file);
      setCurrentStep('analysis');
      
      toast.success('Immagine caricata con successo!');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Errore nel caricamento dell\'immagine');
    }
  };

  // Avvio analisi AI strutturata
  const startAnalysis = async () => {
    if (!imageFile) {
      toast.error('Nessuna immagine disponibile per l\'analisi');
      return;
    }

    if (!user) {
      toast.error('Devi essere autenticato per usare l\'analisi AI');
      return;
    }

    try {
      console.log('🚀 Avvio analisi strutturata...');
      console.log('Dati pianta completi:', plantInfo.infoComplete);
      console.log('Nome pianta:', plantInfo.name);

      // Utilizza il nuovo sistema di diagnosi strutturata se i dati sono completi
      if (plantInfo.infoComplete && plantInfo.name && plantInfo.name.trim().length > 2) {
        console.log('📋 Usando diagnosi strutturata con dati utente');
        await analyzeWithUserData(imageFile, plantInfo);
      } else {
        console.log('🤖 Usando analisi AI standard');
        await analyzeImage(imageFile);
      }

      setCurrentStep('results');
    } catch (error) {
      console.error('Errore durante l\'analisi:', error);
      toast.error('Errore durante l\'analisi. Riprova.');
    }
  };

  // Salva diagnosi nel profilo
  const handleSaveDiagnosis = async () => {
    if (!results && !structuredResults) {
      toast.error('Nessuna diagnosi da salvare');
      return;
    }

    try {
      await saveDiagnosis({
        plant_type: plantInfo?.name || 'Non specificato',
        plant_variety: '', // Non presente nell'interfaccia PlantInfo
        symptoms: plantInfo?.symptoms || [],
        image_url: uploadedImage || '',
        diagnosis_result: structuredResults || results,
        status: 'completed'
      });
    } catch (error) {
      console.error('Error saving diagnosis:', error);
    }
  };

  // Gestione reset completo
  const handleStartNew = () => {
    clearResults();
    setUploadedImage(null);
    setImageFile(null);
    setCurrentStep('info');
    setPlantInfo({
      name: '',
      wateringFrequency: '',
      lightExposure: '',
      symptoms: [],
      isIndoor: true,
      infoComplete: false,
      useAI: false,
      sendToExpert: false
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* Step 1: Plant Info */}
      {currentStep === 'info' && (
        <PlantInfoForm
          onComplete={() => setCurrentStep('image')}
        />
      )}

      {/* Step 2: Image Upload */}
      {currentStep === 'image' && (
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Camera className="h-6 w-6" />
              Carica foto della pianta
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Upload da file */}
              <Card className="border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors">
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <Upload className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Carica da dispositivo</h3>
                  <p className="text-gray-500 text-center mb-4">
                    Seleziona una foto dalla tua galleria
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <Button asChild>
                    <label htmlFor="file-upload" className="cursor-pointer">
                      Scegli File
                    </label>
                  </Button>
                </CardContent>
              </Card>

              {/* Camera */}
              <Card className="border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors">
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <Camera className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Usa la fotocamera</h3>
                  <p className="text-gray-500 text-center mb-4">
                    Scatta una foto direttamente
                  </p>
                  <Button onClick={() => setUseCamera(true)}>
                    Apri Fotocamera
                  </Button>
                </CardContent>
              </Card>
            </div>

            {uploadedImage && (
              <div className="text-center">
                <img 
                  src={uploadedImage} 
                  alt="Uploaded plant"
                  className="max-w-md mx-auto rounded-lg border-2 border-gray-200"
                />
                <div className="mt-4 space-x-3">
                  <Button onClick={() => setCurrentStep('analysis')}>
                    Continua con questa immagine
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setUploadedImage(null);
                      setImageFile(null);
                    }}
                  >
                    Cambia immagine
                  </Button>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => setCurrentStep('info')}
              >
                ← Modifica informazioni pianta
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Analysis */}
      {currentStep === 'analysis' && (
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Brain className="h-6 w-6" />
              Analisi AI
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {uploadedImage && (
              <div className="text-center">
                <img 
                  src={uploadedImage} 
                  alt="Plant to analyze"
                  className="max-w-sm mx-auto rounded-lg border-2 border-gray-200 mb-4"
                />
              </div>
            )}

            <div className="text-center space-y-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">Modalità di Analisi Avanzata</h3>
                <p className="text-blue-800 text-sm">
                  L'AI utilizzerà le informazioni fornite per una diagnosi più precisa
                </p>
              </div>

              {isAnalyzing ? (
                <div className="space-y-4">
                  <div className="animate-pulse">
                    <Leaf className="h-16 w-16 mx-auto text-green-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Analisi in corso...</h3>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${typeof progress === 'object' ? progress.progress : progress}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      {typeof progress === 'object' ? `${progress.progress}% - ${progress.message}` : `${progress}% completato`}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <Button 
                    onClick={startAnalysis}
                    size="lg"
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Brain className="mr-2 h-5 w-5" />
                    Avvia Analisi AI
                  </Button>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => setCurrentStep('image')}
                disabled={isAnalyzing}
              >
                ← Cambia Immagine
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Results */}
      {currentStep === 'results' && (
        <div className="space-y-6">
          {structuredResults ? (
            <StructuredDiagnosisDisplay 
              diagnosis={structuredResults}
              onStartNew={handleStartNew}
              onSaveDiagnosis={handleSaveDiagnosis}
              saveLoading={isSaving}
            />
          ) : results ? (
            <DiagnosisResult 
              diagnosedDisease={results.consensus.mostLikelyPlant}
              plantInfo={plantInfo}
              imageSrc={uploadedImage || ''}
              onStartNewAnalysis={handleStartNew}
              isAnalyzing={false}
            />
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-gray-500">Nessun risultato disponibile</p>
                <Button onClick={handleStartNew} className="mt-4">
                  Inizia Nuova Diagnosi
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default EnhancedDiagnoseTab;