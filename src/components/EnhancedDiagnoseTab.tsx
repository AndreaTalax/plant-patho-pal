import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, Camera, Leaf, Brain, User } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { usePlantInfo } from '@/context/PlantInfoContext';
import { usePlantAnalysis } from '@/hooks/usePlantAnalysis';
import { StructuredDiagnosisDisplay } from '@/components/diagnose/StructuredDiagnosisDisplay';
import PlantInfoForm from '@/components/diagnose/PlantInfoForm';
import DiagnosisResult from '@/components/diagnose/result/DiagnosisResult';

type AnalysisStep = 'info' | 'image' | 'analysis' | 'results';

const EnhancedDiagnoseTab = () => {
  const { user } = useAuth();
  const { plantInfo, setPlantInfo } = usePlantInfo();
  const { results, structuredResults, analyzeImage, analyzeWithUserData, clearResults, isAnalyzing, progress } = usePlantAnalysis();
  
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

  // Reset dell'analisi
  const handleStartNew = () => {
    clearResults();
    setUploadedImage(null);
    setImageFile(null);
    setCurrentStep('info');
    
    // Reset plant info
    setPlantInfo({
      isIndoor: true,
      wateringFrequency: '',
      lightExposure: '',
      symptoms: [],
      useAI: false,
      sendToExpert: false,
      name: '',
      infoComplete: false,
      uploadedFile: null,
      uploadedImageUrl: null
    });
  };

  // Funzione per passare al passo successivo
  const handleNextStep = () => {
    if (currentStep === 'info') {
      setCurrentStep('image');
    } else if (currentStep === 'image' && imageFile) {
      setCurrentStep('analysis');
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Progress Indicator */}
      <div className="flex items-center justify-center space-x-4 mb-6">
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
          currentStep === 'info' ? 'bg-blue-100 text-blue-800' : 
          ['image', 'analysis', 'results'].includes(currentStep) ? 'bg-green-100 text-green-800' : 
          'bg-gray-100 text-gray-600'
        }`}>
          <User className="h-4 w-4" />
          <span className="text-sm font-medium">1. Informazioni Pianta</span>
        </div>
        
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
          currentStep === 'image' ? 'bg-blue-100 text-blue-800' : 
          ['analysis', 'results'].includes(currentStep) ? 'bg-green-100 text-green-800' : 
          'bg-gray-100 text-gray-600'
        }`}>
          <Camera className="h-4 w-4" />
          <span className="text-sm font-medium">2. Carica Immagine</span>
        </div>
        
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
          currentStep === 'analysis' ? 'bg-blue-100 text-blue-800' : 
          currentStep === 'results' ? 'bg-green-100 text-green-800' : 
          'bg-gray-100 text-gray-600'
        }`}>
          <Brain className="h-4 w-4" />
          <span className="text-sm font-medium">3. Analisi AI</span>
        </div>
        
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
          currentStep === 'results' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
        }`}>
          <Leaf className="h-4 w-4" />
          <span className="text-sm font-medium">4. Risultati</span>
        </div>
      </div>

      {/* Step 1: Plant Information */}
      {currentStep === 'info' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-6 w-6 text-blue-600" />
              Informazioni sulla tua pianta
            </CardTitle>
            <p className="text-gray-600">
              Fornisci informazioni dettagliate sulla tua pianta per una diagnosi più accurata.
              L'AI utilizzerà questi dati insieme all'analisi dell'immagine.
            </p>
          </CardHeader>
          <CardContent>
            <PlantInfoForm onComplete={() => {}} />
            <div className="mt-6 flex justify-end">
              <Button 
                onClick={handleNextStep}
                disabled={!plantInfo.name || plantInfo.name.trim().length < 2}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Continua al Caricamento Immagine
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Image Upload */}
      {currentStep === 'image' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-6 w-6 text-blue-600" />
              Carica un'immagine della pianta
            </CardTitle>
            <p className="text-gray-600">
              Carica una foto chiara della pianta, concentrandoti sulle foglie e sui sintomi visibili.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Image Preview */}
            {uploadedImage && (
              <div className="text-center">
                <img 
                  src={uploadedImage} 
                  alt="Pianta caricata" 
                  className="max-w-full h-64 object-contain mx-auto rounded-lg shadow-md"
                />
                <p className="text-sm text-green-600 mt-2">✅ Immagine caricata con successo</p>
              </div>
            )}

            {/* Upload Button */}
            <div className="text-center">
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-blue-500 transition-colors">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">
                    Clicca per caricare un'immagine o trascina qui
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    PNG, JPG fino a 10MB
                  </p>
                </div>
              </label>
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-6">
              <Button 
                variant="outline" 
                onClick={() => setCurrentStep('info')}
              >
                ← Torna alle Informazioni
              </Button>
              
              {uploadedImage && (
                <Button 
                  onClick={handleNextStep}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Procedi all'Analisi →
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Analysis */}
      {currentStep === 'analysis' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-6 w-6 text-blue-600" />
              Analisi AI Strutturata
            </CardTitle>
            <p className="text-gray-600">
              L'AI analizzerà l'immagine considerando le informazioni che hai fornito sulla pianta.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Riepilogo dati utente */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-800 mb-2">📋 Dati utilizzati per l'analisi:</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Nome pianta:</span> {plantInfo.name}
                </div>
                <div>
                  <span className="font-medium">Ambiente:</span> {plantInfo.isIndoor ? 'Interno' : 'Esterno'}
                </div>
                <div>
                  <span className="font-medium">Irrigazione:</span> {plantInfo.wateringFrequency || 'Non specificata'}
                </div>
                <div>
                  <span className="font-medium">Luce:</span> {plantInfo.lightExposure || 'Non specificata'}
                </div>
              </div>
              {plantInfo.symptoms && (
                <div className="mt-3">
                  <span className="font-medium">Sintomi:</span>
                  <p className="text-gray-700">{plantInfo.symptoms}</p>
                </div>
              )}
            </div>

            {/* Progress durante l'analisi */}
            {isAnalyzing && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-yellow-600"></div>
                  <span className="font-medium text-yellow-800">{progress.step}</span>
                </div>
                <div className="w-full bg-yellow-200 rounded-full h-2 mb-2">
                  <div 
                    className="bg-yellow-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress.progress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-yellow-700">{progress.message}</p>
              </div>
            )}

            {/* Pulsante analisi */}
            <div className="text-center">
              <Button 
                onClick={startAnalysis}
                disabled={isAnalyzing || !imageFile}
                className="bg-green-600 hover:bg-green-700 px-8 py-3 text-lg"
              >
                {isAnalyzing ? 'Analisi in corso...' : '🔬 Avvia Analisi Strutturata'}
              </Button>
            </div>

            {/* Navigation */}
            <div className="flex justify-between">
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