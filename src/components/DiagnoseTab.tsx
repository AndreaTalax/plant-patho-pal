
import { Camera, Upload, Loader2, MessageCircle, Check, AlertTriangle, ShoppingBag, Book, X } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/sonner';
import { analyzeImage, diseaseDetails, diseaseSymptoms } from '@/utils/aiDiagnosisUtils';

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
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [diagnosisResult, setDiagnosisResult] = useState<string | null>(null);
  const [diagnosedDisease, setDiagnosedDisease] = useState<typeof PLANT_DISEASES[0] | null>(null);
  const [activeResultTab, setActiveResultTab] = useState('overview');
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [showCamera, setShowCamera] = useState(false);
  const [analysisDetails, setAnalysisDetails] = useState<any>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const navigate = useNavigate();
  const streamRef = useRef<MediaStream | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  // Cleanup function for camera stream when component unmounts
  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, []);

  const takePicture = () => {
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

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw the current video frame to canvas
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert to data URL
        const imageDataUrl = canvas.toDataURL('image/jpeg');
        setUploadedImage(imageDataUrl);
        
        // Stop camera stream
        stopCameraStream();
        
        // Analyze the captured image
        analyzeUploadedImage();
      }
    }
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

  const navigateToChat = () => {
    navigate('/');
    setTimeout(() => {
      const chatTabButton = document.querySelector('[data-tab="chat"]');
      if (chatTabButton) {
        (chatTabButton as HTMLElement).click();
      }
    }, 100);
  };

  const navigateToShop = (event?: React.MouseEvent<HTMLButtonElement> | string) => {
    let productId: string | undefined;
    
    if (typeof event === 'string') {
      productId = event;
    }
    
    navigate('/');
    setTimeout(() => {
      const shopTabButton = document.querySelector('[data-tab="shop"]');
      if (shopTabButton) {
        (shopTabButton as HTMLElement).click();
      }
    }, 100);
  };

  const navigateToLibrary = (event?: React.MouseEvent<HTMLButtonElement> | string) => {
    let resourceId: string | undefined;
    
    if (typeof event === 'string') {
      resourceId = event;
    }
    
    navigate('/');
    setTimeout(() => {
      const libraryTabButton = document.querySelector('[data-tab="library"]');
      if (libraryTabButton) {
        (libraryTabButton as HTMLElement).click();
      }
    }, 100);
  };

  return (
    <div className="flex flex-col items-center justify-start px-4 pt-6 pb-24 min-h-full">
      <h2 className="text-2xl font-bold mb-6 text-drplant-green">Plant Diagnosis</h2>
      
      {showCamera && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex flex-col items-center justify-center p-4">
          <div className="bg-white rounded-2xl overflow-hidden max-w-md w-full">
            <div className="p-4 bg-drplant-green text-white flex justify-between items-center">
              <h3 className="font-semibold">Take a Photo</h3>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-white hover:bg-drplant-green-dark" 
                onClick={stopCameraStream}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="relative aspect-square bg-black w-full">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                className="absolute inset-0 w-full h-full object-cover"
              ></video>
            </div>
            
            <div className="p-4 flex gap-4">
              <Button 
                variant="outline" 
                className="flex-1" 
                onClick={stopCameraStream}
              >
                Cancel
              </Button>
              <Button 
                className="flex-1 bg-drplant-green hover:bg-drplant-green-dark" 
                onClick={captureImage}
              >
                <Camera className="mr-2 h-5 w-5" /> Capture
              </Button>
            </div>
          </div>
          <canvas ref={canvasRef} className="hidden"></canvas>
        </div>
      )}
      
      {!uploadedImage ? (
        <div className="space-y-6 w-full max-w-md">
          <Card className="bg-white p-6 shadow-md rounded-2xl text-center">
            <div className="bg-drplant-blue/10 rounded-full p-6 inline-flex mx-auto mb-4">
              <Camera size={48} className="text-drplant-blue" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Take a Photo</h3>
            <p className="text-gray-600 mb-4">
              Use your camera to take a clear photo of the affected plant part
            </p>
            <Button 
              className="w-full bg-drplant-blue hover:bg-drplant-blue-dark"
              onClick={takePicture}
            >
              <Camera className="mr-2 h-5 w-5" /> Take Photo
            </Button>
          </Card>

          <div className="text-center text-gray-500 my-4">OR</div>

          <Card className="bg-white p-6 shadow-md rounded-2xl text-center">
            <div className="bg-drplant-green/10 rounded-full p-6 inline-flex mx-auto mb-4">
              <Upload size={48} className="text-drplant-green" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Upload a Photo</h3>
            <p className="text-gray-600 mb-4">
              Select an image from your gallery to analyze
            </p>
            <Button 
              className="w-full bg-drplant-green hover:bg-drplant-green-dark"
              onClick={() => document.getElementById('file-upload')?.click()}
            >
              <Upload className="mr-2 h-5 w-5" /> Upload Image
            </Button>
            <input
              id="file-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
          </Card>

          <div className="mt-6 text-center text-gray-600">
            <p>Our AI can help identify common plant diseases</p>
            <p className="text-sm mt-2 text-gray-400">
              For the most accurate results, take clear, well-lit photos of affected areas
            </p>
          </div>
        </div>
      ) : (
        <Card className="bg-white p-6 shadow-md rounded-2xl w-full max-w-2xl">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="md:w-2/5">
              <div className="aspect-square w-full overflow-hidden rounded-xl mb-4">
                <img 
                  src={uploadedImage} 
                  alt="Uploaded plant" 
                  className="w-full h-full object-cover"
                />
              </div>
              
              <div className="flex gap-2 mt-4">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={resetDiagnosis}
                >
                  New Diagnosis
                </Button>
                {diagnosisResult && diagnosedDisease && (
                  <Button 
                    className="flex-1 bg-drplant-blue hover:bg-drplant-blue-dark"
                    onClick={navigateToChat}
                  >
                    <MessageCircle className="mr-2 h-4 w-4" /> Expert Consult
                  </Button>
                )}
              </div>
            </div>

            <div className="md:w-3/5">
              {isAnalyzing ? (
                <div className="flex flex-col items-center justify-center py-4 h-full">
                  <Loader2 className="h-8 w-8 text-drplant-blue animate-spin mb-4" />
                  <p className="text-drplant-blue font-medium mb-2">Analyzing your plant...</p>
                  <div className="w-full max-w-xs">
                    <Progress value={analysisProgress} className="h-2" />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Our AI is examining leaf patterns, spots, and discoloration
                  </p>
                </div>
              ) : diagnosisResult && diagnosedDisease ? (
                <div className="h-full">
                  <div className="flex items-center gap-2 mb-4">
                    <Badge className="bg-amber-500">{Math.round(diagnosedDisease.confidence * 100)}% Confidence</Badge>
                    {diagnosedDisease.confidence > 0.9 ? (
                      <Badge className="bg-green-500">High Reliability</Badge>
                    ) : diagnosedDisease.confidence > 0.7 ? (
                      <Badge className="bg-yellow-500">Medium Reliability</Badge>
                    ) : (
                      <Badge className="bg-red-500">Low Reliability</Badge>
                    )}
                  </div>
                
                  <Tabs defaultValue="overview" value={activeResultTab} onValueChange={setActiveResultTab} className="w-full">
                    <TabsList className="grid grid-cols-4 mb-4">
                      <TabsTrigger value="overview">Overview</TabsTrigger>
                      <TabsTrigger value="details">Details</TabsTrigger>
                      <TabsTrigger value="treatment">Treatment</TabsTrigger>
                      <TabsTrigger value="products">Products</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="overview" className="h-full">
                      <h3 className="text-xl font-bold text-drplant-blue mb-2">{diagnosedDisease.name}</h3>
                      <p className="text-gray-700 mb-4">{diagnosedDisease.description}</p>
                      
                      <h4 className="font-semibold text-gray-900 mb-2">Causes:</h4>
                      <p className="text-gray-700 mb-4">{diagnosedDisease.causes}</p>
                      
                      {analysisDetails && (
                        <div className="mt-4 bg-blue-50 p-3 rounded-lg">
                          <h4 className="font-semibold text-drplant-blue mb-2">Identified Symptoms:</h4>
                          <ul className="space-y-1 text-sm text-gray-700">
                            {analysisDetails.identifiedFeatures.map((feature: string, index: number) => (
                              <li key={index} className="flex items-start gap-2">
                                <span className="text-green-500">•</span>
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      <div className="flex justify-between mt-4">
                        <Button variant="outline" size="sm" onClick={() => setActiveResultTab('details')}>
                          View Details
                        </Button>
                        <Button 
                          size="sm"
                          className="bg-drplant-green hover:bg-drplant-green-dark"
                          onClick={() => navigateToLibrary(diagnosedDisease?.resources?.[0])}
                        >
                          <Book className="mr-2 h-4 w-4" /> Learn More
                        </Button>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="details">
                      <h3 className="text-xl font-bold text-drplant-blue mb-4">Disease Details</h3>
                      
                      {diagnosedDisease.id in diseaseDetails && (
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-1">Scientific Name:</h4>
                            <p className="text-gray-700 italic">
                              {diseaseDetails[diagnosedDisease.id as keyof typeof diseaseDetails].scientificName}
                            </p>
                          </div>
                          
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-1">Common Host Plants:</h4>
                            <div className="flex flex-wrap gap-2">
                              {diseaseDetails[diagnosedDisease.id as keyof typeof diseaseDetails].hostPlants.map((plant, index) => (
                                <Badge key={index} variant="outline" className="bg-gray-100">
                                  {plant}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-1">Environmental Conditions:</h4>
                            <p className="text-gray-700">
                              {diseaseDetails[diagnosedDisease.id as keyof typeof diseaseDetails].environmentalConditions}
                            </p>
                          </div>
                          
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-1">How It Spreads:</h4>
                            <p className="text-gray-700">
                              {diseaseDetails[diagnosedDisease.id as keyof typeof diseaseDetails].spreadMechanism}
                            </p>
                          </div>
                          
                          {analysisDetails && analysisDetails.alternativeDiagnoses.length > 0 && (
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-1">Alternative Diagnoses:</h4>
                              <ul className="space-y-2">
                                {analysisDetails.alternativeDiagnoses.map((alt: any, index: number) => (
                                  <li key={index} className="text-gray-700">
                                    {PLANT_DISEASES.find(d => d.id === alt.disease)?.name || alt.disease} 
                                    <span className="text-gray-500 ml-2">
                                      ({Math.round(alt.probability * 100)}% confidence)
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {analysisDetails && analysisDetails.recommendedAdditionalTests && (
                            <div className="bg-yellow-50 p-3 rounded-lg">
                              <h4 className="font-semibold text-amber-700 mb-1">Recommended Additional Tests:</h4>
                              <ul className="space-y-1 text-sm text-amber-800">
                                {analysisDetails.recommendedAdditionalTests.map((test: string, index: number) => (
                                  <li key={index} className="flex items-start gap-2">
                                    <span>•</span>
                                    <span>{test}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                      
                      <div className="flex justify-between mt-6">
                        <Button variant="outline" size="sm" onClick={() => setActiveResultTab('overview')}>
                          Back to Overview
                        </Button>
                        <Button 
                          size="sm"
                          className="bg-drplant-blue hover:bg-drplant-blue-dark"
                          onClick={() => setActiveResultTab('treatment')}
                        >
                          View Treatment
                        </Button>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="treatment">
                      <h3 className="text-xl font-bold text-drplant-blue mb-4">Treatment Plan</h3>
                      <ul className="space-y-3">
                        {diagnosedDisease.treatments.map((treatment, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                            <span>{treatment}</span>
                          </li>
                        ))}
                      </ul>
                      
                      {diagnosedDisease.id in diseaseDetails && (
                        <div className="mt-6">
                          <h4 className="font-semibold text-gray-900 mb-2">Prevention Tips:</h4>
                          <ul className="space-y-2">
                            {diseaseDetails[diagnosedDisease.id as keyof typeof diseaseDetails].preventionTips.map((tip, index) => (
                              <li key={index} className="flex items-start gap-2">
                                <span className="text-blue-500">✓</span> 
                                <span className="text-gray-700">{tip}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {diagnosedDisease.confidence < 0.85 && (
                        <div className="flex items-start gap-2 mt-6 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                          <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0" />
                          <p className="text-sm text-amber-700">
                            This diagnosis has medium confidence. Consider consulting with a plant expert for confirmation.
                          </p>
                        </div>
                      )}
                      
                      <div className="flex justify-between mt-6">
                        <Button variant="outline" size="sm" onClick={() => setActiveResultTab('details')}>
                          Back to Details
                        </Button>
                        <Button 
                          size="sm"
                          className="bg-drplant-blue hover:bg-drplant-blue-dark"
                          onClick={() => setActiveResultTab('products')}
                        >
                          <ShoppingBag className="mr-2 h-4 w-4" /> Recommended Products
                        </Button>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="products">
                      <h3 className="text-xl font-bold text-drplant-blue mb-4">Recommended Products</h3>
                      
                      <div className="space-y-4">
                        {diagnosedDisease.products.includes('1') && (
                          <div className="border rounded-lg p-3 flex gap-3">
                            <div className="w-16 h-16 bg-gray-100 rounded-md flex-shrink-0 overflow-hidden">
                              <img 
                                src="https://images.unsplash.com/photo-1585687433492-9c648106f131?q=80&w=100&h=100&auto=format&fit=crop" 
                                alt="Organic Neem Oil" 
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium">Organic Neem Oil</h4>
                              <p className="text-sm text-gray-500 mb-1">Natural fungicide for powdery mildew</p>
                              <Button 
                                size="sm" 
                                className="bg-drplant-green hover:bg-drplant-green-dark"
                                onClick={() => navigateToShop('1')}
                              >
                                <ShoppingBag className="mr-1 h-3 w-3" /> View in Shop
                              </Button>
                            </div>
                          </div>
                        )}
                        
                        {diagnosedDisease.products.includes('2') && (
                          <div className="border rounded-lg p-3 flex gap-3">
                            <div className="w-16 h-16 bg-gray-100 rounded-md flex-shrink-0 overflow-hidden">
                              <img 
                                src="https://images.unsplash.com/photo-1625246333195-78d73c0c15b1?q=80&w=100&h=100&auto=format&fit=crop" 
                                alt="Plant Vitality Boost" 
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium">Plant Vitality Boost</h4>
                              <p className="text-sm text-gray-500 mb-1">Enhances plant immunity and recovery</p>
                              <Button 
                                size="sm" 
                                className="bg-drplant-green hover:bg-drplant-green-dark"
                                onClick={() => navigateToShop('2')}
                              >
                                <ShoppingBag className="mr-1 h-3 w-3" /> View in Shop
                              </Button>
                            </div>
                          </div>
                        )}
                        
                        {diagnosedDisease.products.includes('3') && (
                          <div className="border rounded-lg p-3 flex gap-3">
                            <div className="w-16 h-16 bg-gray-100 rounded-md flex-shrink-0 overflow-hidden">
                              <img 
                                src="https://images.unsplash.com/photo-1635348424978-142afa11e458?q=80&w=100&h=100&auto=format&fit=crop" 
                                alt="Copper Fungicide" 
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium">Copper Fungicide</h4>
                              <p className="text-sm text-gray-500 mb-1">Effective against leaf spots</p>
                              <Button 
                                size="sm" 
                                className="bg-drplant-green hover:bg-drplant-green-dark"
                                onClick={() => navigateToShop('3')}
                              >
                                <ShoppingBag className="mr-1 h-3 w-3" /> View in Shop
                              </Button>
                            </div>
                          </div>
                        )}
                        
                        {diagnosedDisease.products.includes('4') && (
                          <div className="border rounded-lg p-3 flex gap-3">
                            <div className="w-16 h-16 bg-gray-100 rounded-md flex-shrink-0 overflow-hidden">
                              <img 
                                src="https://images.unsplash.com/photo-1588196749597-9ff075ee6b5b?q=80&w=100&h=100&auto=format&fit=crop" 
                                alt="Insecticidal Soap" 
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium">Insecticidal Soap</h4>
                              <p className="text-sm text-gray-500 mb-1">Controls aphids and mites</p>
                              <Button 
                                size="sm" 
                                className="bg-drplant-green hover:bg-drplant-green-dark"
                                onClick={() => navigateToShop('4')}
                              >
                                <ShoppingBag className="mr-1 h-3 w-3" /> View in Shop
                              </Button>
                            </div>
                          </div>
                        )}
                        
                        {diagnosedDisease.products.includes('5') && (
                          <div className="border rounded-lg p-3 flex gap-3">
                            <div className="w-16 h-16 bg-gray-100 rounded-md flex-shrink-0 overflow-hidden">
                              <img 
                                src="https://images.unsplash.com/photo-1603912699214-92627f304eb6?q=80&w=100&h=100&auto=format&fit=crop" 
                                alt="Soil pH Tester Kit" 
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium">Soil pH Tester Kit</h4>
                              <p className="text-sm text-gray-500 mb-1">Essential for diagnosing root issues</p>
                              <Button 
                                size="sm" 
                                className="bg-drplant-green hover:bg-drplant-green-dark"
                                onClick={() => navigateToShop('5')}
                              >
                                <ShoppingBag className="mr-1 h-3 w-3" /> View in Shop
                              </Button>
                            </div>
                          </div>
                        )}
                        
                        {diagnosedDisease.products.length === 0 && (
                          <p className="text-gray-500">No specific products recommended for this condition.</p>
                        )}
                      </div>
                      
                      <div className="flex justify-between mt-6">
                        <Button variant="outline" size="sm" onClick={() => setActiveResultTab('treatment')}>
                          Back to Treatment
                        </Button>
                        <Button 
                          size="sm"
                          className="bg-drplant-blue hover:bg-drplant-blue-dark"
                          onClick={navigateToShop}
                        >
                          Browse All Products
                        </Button>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-4 h-full">
                  <p className="text-gray-500">Upload an image to start diagnosis</p>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default DiagnoseTab;
