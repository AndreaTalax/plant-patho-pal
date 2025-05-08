
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/sonner';
import { analyzeImage } from '@/utils/aiDiagnosisUtils';
import { usePlantInfo } from '@/context/PlantInfoContext';

// Importing our newly created components
import PlantInfoForm, { PlantInfoFormValues } from './diagnose/PlantInfoForm';
import PlantInfoSummary from './diagnose/PlantInfoSummary';
import CameraCapture from './diagnose/CameraCapture';
import ImageCaptureMethods from './diagnose/ImageCaptureMethods';
import DiagnosisResult from './diagnose/DiagnosisResult';
import { DiagnosedDisease, AnalysisDetails } from './diagnose/types';

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
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const navigate = useNavigate();
  const streamRef = useRef<MediaStream | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!plantInfo.infoComplete) {
      toast.error("Prima di continuare, inserisci le informazioni sulla pianta");
      return;
    }
    
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedImage(event.target?.result as string);
        analyzeUploadedImage();
      };
      reader.readAsDataURL(file);
    }
  };

  const takePicture = () => {
    if (!plantInfo.infoComplete) {
      toast.error("Prima di continuare, inserisci le informazioni sulla pianta");
      return;
    }
    
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
          toast.success("Camera activated successfully");
        }
      })
      .catch(err => {
        console.error("Error accessing camera:", err);
        toast.error("Could not access camera. Please check permissions.");
        setShowCamera(false);
      });
    } else {
      toast.error("Camera not supported in your browser or device");
      setShowCamera(false);
    }
  };

  const captureImage = (imageDataUrl: string) => {
    setUploadedImage(imageDataUrl);
    stopCameraStream();
    analyzeUploadedImage();
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

  const analyzeUploadedImage = async () => {
    setIsAnalyzing(true);
    setDiagnosisResult(null);
    setDiagnosedDisease(null);
    setAnalysisProgress(0);
    setAnalysisDetails(null);
    
    try {
      // Progress simulation
      const progressInterval = setInterval(() => {
        setAnalysisProgress(prev => {
          const newProgress = prev + Math.random() * 15;
          return newProgress > 95 ? 95 : newProgress;
        });
      }, 300);

      // Perform advanced AI analysis
      const result = await analyzeImage(uploadedImage!);
      clearInterval(progressInterval);
      setAnalysisProgress(100);
      
      console.log("AI Diagnosis Result:", result);
      
      // Find the disease in our database
      const disease = PLANT_DISEASES.find(d => d.id === result.diseaseId);
      
      if (disease) {
        // Update confidence with the one from analysis
        const diseaseWithUpdatedConfidence = {
          ...disease,
          confidence: result.confidence
        };
        
        setDiagnosedDisease(diseaseWithUpdatedConfidence);
        setDiagnosisResult(`Detected ${disease.name} with ${Math.round(result.confidence * 100)}% confidence.`);
        setAnalysisDetails(result.analysisDetails);
      } else {
        setDiagnosisResult("Unable to identify the disease with confidence. Please consult with an expert.");
      }
      
      setIsAnalyzing(false);
    } catch (error) {
      console.error("Error during image analysis:", error);
      setDiagnosisResult("An error occurred during analysis. Please try again.");
      setIsAnalyzing(false);
      setAnalysisProgress(0);
      toast.error("Analysis failed. Please try again with a clearer image.");
    }
  };

  const resetDiagnosis = () => {
    setUploadedImage(null);
    setDiagnosisResult(null);
    setDiagnosedDisease(null);
    setAnalysisProgress(0);
    setActiveResultTab('overview');
    setAnalysisDetails(null);
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
      <h2 className="text-2xl font-bold mb-6 text-drplant-green">Plant Diagnosis</h2>
      
      {showCamera && (
        <CameraCapture 
          onCapture={captureImage} 
          onCancel={stopCameraStream}
          videoRef={videoRef}
          canvasRef={canvasRef}
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
  );
};

export default DiagnoseTab;
