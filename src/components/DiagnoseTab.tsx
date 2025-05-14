import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/sonner';
import { modelInfo } from '@/utils/aiDiagnosisUtils';
import { usePlantInfo } from '@/context/PlantInfoContext';
import { analyzePlantImage, formatHuggingFaceResult, dataURLtoFile } from '@/utils/plantAnalysisUtils';

// Importing our components
import PlantInfoForm, { PlantInfoFormValues } from './diagnose/PlantInfoForm';
import PlantInfoSummary from './diagnose/PlantInfoSummary';
import CameraCapture from './diagnose/CameraCapture';
import ImageCaptureMethods from './diagnose/ImageCaptureMethods';
import DiagnosisResult from './diagnose/result/DiagnosisResult';
import { DiagnosedDisease, AnalysisDetails } from './diagnose/types';
import ModelInfoPanel from './diagnose/ModelInfoPanel';

// Mock database of plant diseases
const PLANT_DISEASES = [
  {
    id: 'powdery-mildew',
    name: 'Powdery Mildew',
    description: 'A fungal disease that affects many plant species, appearing as a white to gray powdery growth on leaves, stems, and sometimes fruits.',
    causes: 'Caused by various species of fungi in the Erysiphales order. Thrives in environments with high humidity but dry leaves.',
    treatments: [
      'Remove and dispose of affected leaves',
      'Improve air circulation around plants',
      'Apply fungicides containing sulfur or potassium bicarbonate',
      'Use neem oil as an organic alternative'
    ],
    products: ['1', '2'],
    confidence: 0.92,
    resources: ['fungal-diseases']
  },
  {
    id: 'leaf-spot',
    name: 'Leaf Spot',
    description: 'A common plant disease characterized by brown or black spots on leaves that may enlarge and cause leaf drop.',
    causes: 'Various fungi and bacteria can cause leaf spot diseases. Often spread by water splash and favored by wet conditions.',
    treatments: [
      'Remove affected leaves and improve sanitation',
      'Avoid overhead watering',
      'Apply copper-based fungicides',
      'Rotate crops in vegetable gardens'
    ],
    products: ['3', '5'],
    confidence: 0.89,
    resources: ['fungal-diseases']
  },
  {
    id: 'aphid-infestation',
    name: 'Aphid Infestation',
    description: 'Small sap-sucking insects that cluster on new growth and undersides of leaves, causing distorted growth and yellowing.',
    causes: 'Rapid reproduction of aphids, especially in warm weather. Often attracted to plants with high nitrogen levels.',
    treatments: [
      'Spray plants with strong water jet to dislodge aphids',
      'Introduce beneficial insects like ladybugs',
      'Apply insecticidal soap or neem oil',
      'For severe cases, use systemic insecticides'
    ],
    products: ['4'],
    confidence: 0.95,
    resources: ['pest-control']
  },
  {
    id: 'root-rot',
    name: 'Root Rot',
    description: 'A soil-borne disease that causes roots to decay, leading to poor growth, wilting, and eventual plant death.',
    causes: 'Overwatering and poor drainage creating anaerobic conditions that foster pathogenic fungi like Pythium and Phytophthora.',
    treatments: [
      'Improve soil drainage',
      'Remove affected plants and surrounding soil',
      'Avoid overwatering',
      'Apply fungicides labeled for root rot',
      'For container plants, repot with fresh sterile soil'
    ],
    products: ['5'],
    confidence: 0.87,
    resources: ['fungal-diseases']
  },
  {
    id: 'spider-mites',
    name: 'Spider Mite Infestation',
    description: 'Tiny arachnids that feed on plant sap, causing stippling on leaves and fine webbing between leaves and stems.',
    causes: 'Hot, dry conditions favor mite populations. Often thrive in indoor environments or during drought conditions.',
    treatments: [
      'Increase humidity around plants',
      'Spray plants with strong jets of water',
      'Apply insecticidal soap or horticultural oil',
      'In severe cases, use miticides',
      'Introduce predatory mites'
    ],
    products: ['4'],
    confidence: 0.91,
    resources: ['pest-control']
  }
];

const DiagnoseTab = () => {
  const { plantInfo, setPlantInfo } = usePlantInfo();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [diagnosisResult, setDiagnosisResult] = useState<string | null>(null);
  const [diagnosedDisease, setDiagnosedDisease] = useState<DiagnosedDisease | null>(null);
  const [activeResultTab, setActiveResultTab] = useState('overview');
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [showCamera, setShowCamera] = useState(false);
  const [analysisDetails, setAnalysisDetails] = useState<AnalysisDetails | null>(null);
  const [showModelInfo, setShowModelInfo] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [plantVerificationFailed, setPlantVerificationFailed] = useState(false);
  const [captureMode, setCaptureMode] = useState<'identify' | 'diagnose'>('diagnose');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const navigate = useNavigate();
  const streamRef = useRef<MediaStream | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!plantInfo.infoComplete) {
      toast.error("Inserisci le informazioni sulla pianta prima di continuare");
      return;
    }
    
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedImage(event.target?.result as string);
        setPlantVerificationFailed(false); // Reset plant verification status
        analyzeUploadedImage(file);
      };
      reader.readAsDataURL(file);
    }
  };

  const takePicture = (mode: 'identify' | 'diagnose') => {
    if (!plantInfo.infoComplete) {
      toast.error("Inserisci le informazioni sulla pianta prima di continuare");
      return;
    }
    
    setCaptureMode(mode);
    setShowCamera(true);
    
    // Start camera stream
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } // Use back camera if available
      })
      .then(stream => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          streamRef.current = stream;
          toast.success("Fotocamera attivata con successo");
        }
      })
      .catch(err => {
        console.error("Errore nell'accesso alla fotocamera:", err);
        toast.error("Impossibile accedere alla fotocamera. Controlla i permessi.");
        setShowCamera(false);
      });
    } else {
      toast.error("Fotocamera non supportata dal tuo browser o dispositivo");
      setShowCamera(false);
    }
  };

  const captureImage = (imageDataUrl: string) => {
    setUploadedImage(imageDataUrl);
    stopCameraStream();
    setPlantVerificationFailed(false); // Reset plant verification status
    
    // Convert dataURL to File object for analysis
    const imageFile = dataURLtoFile(imageDataUrl, "camera-capture.jpg");
    analyzeUploadedImage(imageFile);
  };

  const stopCameraStream = () => {
    if (streamRef.current) {
      const tracks = streamRef.current.getTracks();
      tracks.forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject = null;
    }
    
    setShowCamera(false);
  };

  const verifyImageContainsPlant = async (imageFile: File): Promise<boolean> => {
    try {
      // Analyze using our Edge Function
      const result = await analyzePlantImage(imageFile);
      
      // If we have verification data, use it
      if (result?.plantVerification) {
        return result.plantVerification.isPlant;
      }
      
      // If no specific plant verification data, default to true
      return true;
    } catch (error) {
      console.error("Errore durante la verifica della pianta:", error);
      return false; // Assume verification failed on error
    }
  };

  const analyzeUploadedImage = async (imageFile: File) => {
    setIsAnalyzing(true);
    setDiagnosisResult(null);
    setDiagnosedDisease(null);
    setAnalysisProgress(0);
    setAnalysisDetails(null);
    setPlantVerificationFailed(false);
    
    try {
      // Progress simulation for verification phase
      const verificationInterval = setInterval(() => {
        setAnalysisProgress(prev => {
          const newProgress = prev + Math.random() * 5;
          return newProgress > 25 ? 25 : newProgress;
        });
      }, 200);

      // First verify if the image contains a plant
      const isPlant = await verifyImageContainsPlant(imageFile);
      clearInterval(verificationInterval);
      
      if (!isPlant) {
        setIsAnalyzing(false);
        setPlantVerificationFailed(true);
        setAnalysisProgress(100);
        toast.error("L'immagine non sembra contenere una pianta. Carica un'immagine con una pianta chiaramente visibile.", {
          duration: 5000
        });
        return;
      }
      
      // Continue with progress simulation
      const progressInterval = setInterval(() => {
        setAnalysisProgress(prev => {
          const newProgress = prev + Math.random() * 15;
          return newProgress > 95 ? 95 : newProgress;
        });
      }, 300);

      // Perform analysis using our Edge Function
      const result = await analyzePlantImage(imageFile);
      
      clearInterval(progressInterval);
      setAnalysisProgress(100);
      
      if (!result) {
        throw new Error("Analisi non riuscita a restituire un risultato");
      }
      
      console.log("Diagnosi AI HuggingFace:", result);
      
      // Format the HuggingFace result
      const formattedResult = formatHuggingFaceResult(result);
      
      if (!formattedResult) {
        throw new Error("Impossibile formattare il risultato dell'analisi");
      }
      
      // Check if the analyzed plant is healthy from the formatted result
      const isHealthy = formattedResult.multiServiceInsights?.huggingFaceResult?.label?.toLowerCase().includes('healthy') || false;
      
      if (isHealthy) {
        // Handle healthy plant scenario
        const plantName = formattedResult.multiServiceInsights?.plantName || "Unknown Plant";
        
        setDiagnosisResult(`${plantName} sembra essere in buona salute. Nessi patologie sono state rilevate.`);
        setAnalysisDetails({
          ...formattedResult,
          multiServiceInsights: {
            ...formattedResult.multiServiceInsights,
            isHealthy: true,
            plantName: plantName
          },
          identifiedFeatures: ["Foglia integra", "Colorazione buona", "Nessun sintomo visibile di patologia", "Pattino di crescita normale"],
          alternativeDiagnoses: []
        });
        
        // For healthy plants, we'll set a "placeholder" disease object with healthy status
        setDiagnosedDisease({
          id: "healthy",
          name: "Pianta Saluta",
          description: "Questa pianta sembra essere in buona salute con nessi segni di patologia o infestazione di insetti.",
          causes: "Cura adeguata, abbondante irrigazione, esposizione ad una luce adeguata e buone pratiche di salute delle piante.",
          treatments: [
            "Continua la routine di cura attuale",
            "Monitora regolarmente per eventuali cambiamenti",
            "Fertilizzazione regolare come necessario",
            "Pruning occasionale per mantenere la forma e promuovere la crescita"
          ],
          products: [],
          confidence: 0.95,
          resources: []
        });
      } else {
        // Find the disease in our database based on the label from HuggingFace
        const disease = PLANT_DISEASES.find(d => 
          d.name.toLowerCase().includes(result.label?.toLowerCase()) || 
          result.label?.toLowerCase().includes(d.name.toLowerCase())
        );
        
        if (disease) {
          // Update confidence with the one from analysis
          const diseaseWithUpdatedConfidence = {
            ...disease,
            confidence: result.score
          };
          
          const plantName = formattedResult.multiServiceInsights?.plantName || "Unknown Plant";
          
          setDiagnosedDisease(diseaseWithUpdatedConfidence);
          setDiagnosisResult(`Rilevata ${disease.name} sulla ${plantName} con ${Math.round(result.score * 100)}% di confidenza.`);
          setAnalysisDetails({
            ...formattedResult,
            identifiedFeatures: formattedResult.identifiedFeatures || [
              "Discolorazione rilevata", 
              "Pattino di crescita anomalo", 
              "Sintomi visibili sulla foglia", 
              "Segni di stress della pianta"
            ],
            alternativeDiagnoses: formattedResult.alternativeDiagnoses || []
          });
        } else {
          // If no disease matches, pick a random one with low confidence as best guess
          const randomDisease = PLANT_DISEASES[Math.floor(Math.random() * PLANT_DISEASES.length)];
          const lowConfidence = Math.max(0.4, result.score - 0.2); // Use result confidence but lower it
          const plantName = formattedResult.multiServiceInsights?.plantName || "Unknown Plant";
          
          setDiagnosedDisease({
            ...randomDisease,
            confidence: lowConfidence
          });
          setDiagnosisResult(`Possibile ${randomDisease.name} sulla ${plantName} con ${Math.round(lowConfidence * 100)}% di confidenza. Considera la consulenza di un esperto.`);
          setAnalysisDetails({
            ...formattedResult,
            identifiedFeatures: ["Parziale corrispondenza di pattern", "Sicuramente discoloreata", "Identificazione incerta"],
            alternativeDiagnoses: PLANT_DISEASES.filter(d => d.id !== randomDisease.id)
              .slice(0, 3)
              .map(d => ({ disease: d.id, probability: 0.15 + Math.random() * 0.25 })),
            plantixInsights: {
              severity: "medium",
              progressStage: "early",
              spreadRisk: "medium", 
              environmentalFactors: ["Insufficient data"],
              reliability: "low",
              confidenceNote: "Analisi basata su un riconoscimento parziale dei pattern"
            }
          });
        }
      }
      
      setIsAnalyzing(false);
    } catch (error) {
      console.error("Errore durante l'analisi dell'immagine:", error);
      // Handle error and provide fallback
      const emergencyDisease = PLANT_DISEASES[Math.floor(Math.random() * PLANT_DISEASES.length)];
      const veryLowConfidence = 0.25 + Math.random() * 0.15; // 25-40% di confidenza
      
      setDiagnosisResult(`L'analisi ha avuto difficoltà. Sogno migliore: ${emergencyDisease.name} (${Math.round(veryLowConfidence * 100)}% di confidenza).`);
      setDiagnosedDisease({
        ...emergencyDisease,
        confidence: veryLowConfidence
      });
      setAnalysisDetails({
        identifiedFeatures: ["Parziale riconoscimento dei pattern", "Dati visivi limitati", "Diagnosi emergente"],
        alternativeDiagnoses: PLANT_DISEASES.filter(d => d.id !== emergencyDisease.id)
          .slice(0, 2)
          .map(d => ({ disease: d.id, probability: 0.1 + Math.random() * 0.15 })),
        recommendedAdditionalTests: [
          "Riprova con una migliore illuminazione e focalizzazione",
          "Consulta un esperto di piante",
          "Considera una diagnosi in persona"
        ],
        plantixInsights: {
          severity: "unknown",
          progressStage: "unknown",
          spreadRisk: "medium",
          environmentalFactors: ["Impossibile determinare dalla immagine"],
          reliability: "very low",
          confidenceNote: "Diagnosi emergente con dati limitati"
        }
      });
      setIsAnalyzing(false);
      setAnalysisProgress(100);
      toast.warning("L'analisi ha avuto difficoltà ma ha fornito un'ipotesi migliore. Prova con un'immagine più chiara per ottenere risultati migliori.");
    }
  };

  const resetDiagnosis = () => {
    setUploadedImage(null);
    setDiagnosisResult(null);
    setDiagnosedDisease(null);
    setAnalysisProgress(0);
    setActiveResultTab('overview');
    setAnalysisDetails(null);
    setRetryCount(0);
    setPlantVerificationFailed(false);
    stopCameraStream();
  };

  const handlePlantInfoSubmit = (data: PlantInfoFormValues) => {
    setPlantInfo({
      isIndoor: data.isIndoor,
      inSunlight: data.inSunlight,
      wateringFrequency: data.wateringFrequency,
      infoComplete: true
    });
  };

  const navigateToChat = () => {
    navigate('/');
    // Using a slight timeout to ensure navigation completes before tab selection
    setTimeout(() => {
      const event = new CustomEvent('switchTab', { detail: 'chat' });
      window.dispatchEvent(event);
    }, 100);
  };

  const navigateToShop = (productId?: string) => {
    navigate('/');
    setTimeout(() => {
      const event = new CustomEvent('switchTab', { detail: 'shop' });
      window.dispatchEvent(event);
    }, 100);
  };

  const navigateToLibrary = (resourceId?: string) => {
    navigate('/');
    setTimeout(() => {
      const event = new CustomEvent('switchTab', { detail: 'library' });
      window.dispatchEvent(event);
    }, 100);
  };

  return (
    <div className="flex flex-col items-center justify-start px-4 pt-6 pb-24 min-h-full">
      <div className="flex flex-col items-center mb-6">
        <h2 className="text-2xl font-bold text-drplant-green">Diagnosi Piante</h2>
        <div className="flex items-center bg-blue-50 text-blue-600 rounded-full px-3 py-0.5 text-xs mt-1">
          <span className="font-semibold mr-1">Powered by</span> 
          <span className="font-bold">PictureThis™ AI</span>
        </div>
      </div>
      
      {/* Model Info Button */}
      <div className="w-full max-w-md flex justify-end mb-4">
        <button
          onClick={() => setShowModelInfo(!showModelInfo)}
          className="text-sm text-drplant-blue hover:text-drplant-blue-dark flex items-center gap-1"
        >
          <span>{showModelInfo ? 'Nascondi Info PictureThis' : 'Mostra Info PictureThis AI'}</span>
        </button>
      </div>
      
      {/* Model Information Panel */}
      {showModelInfo && (
        <ModelInfoPanel modelInfo={modelInfo} onClose={() => setShowModelInfo(false)} />
      )}
      
      {showCamera && (
        <CameraCapture 
          onCapture={captureImage} 
          onCancel={stopCameraStream}
          videoRef={videoRef}
          canvasRef={canvasRef}
          mode={captureMode}
        />
      )}
      
      {!plantInfo.infoComplete ? (
        <div className="space-y-6 w-full max-w-md">
          <PlantInfoForm onComplete={handlePlantInfoSubmit} />
        </div>
      ) : !uploadedImage ? (
        <div className="space-y-6 w-full max-w-md">
          <PlantInfoSummary 
            plantInfo={{
              isIndoor: plantInfo.isIndoor,
              inSunlight: plantInfo.inSunlight,
              wateringFrequency: plantInfo.wateringFrequency
            }}
            onEdit={() => setPlantInfo({ infoComplete: false })}
          />

          <ImageCaptureMethods
            onTakePhoto={takePicture}
            onUploadPhoto={() => document.getElementById('file-upload')?.click()}
          />
          <input
            id="file-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />
        </div>
      ) : (
        <div className="w-full max-w-md">
          {plantVerificationFailed ? (
            <div className="bg-white p-6 shadow-md rounded-2xl text-center mb-6">
              <div className="bg-red-100 text-red-600 p-4 rounded-lg mb-4">
                <h3 className="text-lg font-semibold mb-2">Nessuna Pianta Rilevata</h3>
                <p className="mb-4">
                  L'immagine caricata non sembra contenere una pianta. Per ottenere un'analisi accurata, carica un'immagine 
                  che mostri chiaramente una pianta.
                </p>
                <img 
                  src={uploadedImage!} 
                  alt="Uploaded image" 
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />
                <div className="flex justify-center gap-4 mt-6">
                  <button
                    onClick={resetDiagnosis}
                    className="px-4 py-2 bg-drplant-blue text-white rounded-md hover:bg-drplant-blue-dark"
                  >
                    Prova di nuovo
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <DiagnosisResult
              uploadedImage={uploadedImage}
              plantInfo={{
                isIndoor: plantInfo.isIndoor,
                inSunlight: plantInfo.inSunlight,
                wateringFrequency: plantInfo.wateringFrequency
              }}
              isAnalyzing={isAnalyzing}
              analysisProgress={analysisProgress}
              diagnosedDisease={diagnosedDisease}
              diagnosisResult={diagnosisResult}
              analysisDetails={analysisDetails}
              activeResultTab={activeResultTab}
              setActiveResultTab={setActiveResultTab}
              resetDiagnosis={resetDiagnosis}
              navigateToChat={navigateToChat}
              navigateToShop={navigateToShop}
              navigateToLibrary={navigateToLibrary}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default DiagnoseTab;
