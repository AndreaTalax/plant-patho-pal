
import React, { useState, useRef, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, Camera, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { usePlantInfo } from '@/context/PlantInfoContext';
import PlantInfoForm from './diagnose/PlantInfoForm';
import PlantAnalysisResultComponent from './diagnose/PlantAnalysisResult';
import CameraCapture from './diagnose/CameraCapture';
import { RealPlantAnalysisService, PlantAnalysisResult as AnalysisResult } from '@/services/realPlantAnalysisService';
import { AutoExpertNotificationService } from './chat/AutoExpertNotificationService';
import { uploadPlantImage } from '@/utils/imageStorage';

const DiagnoseTab = () => {
  const { userProfile } = useAuth();
  const { plantInfo, setPlantInfo } = usePlantInfo();
  
  // Component states
  const [currentStage, setCurrentStage] = useState<'info' | 'capture' | 'analyzing' | 'result'>('info');
  const [showCamera, setShowCamera] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [autoSentToExpert, setAutoSentToExpert] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Plant info completion handler
  const handlePlantInfoComplete = useCallback((data: any) => {
    setPlantInfo({ ...data, infoComplete: true });
    setCurrentStage('capture');
    toast.success('Plant information saved successfully!');
  }, [setPlantInfo]);

  // File upload handler
  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload a valid image file');
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
      console.error('File upload error:', error);
      toast.error('Failed to upload image');
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
        console.error('Camera capture processing error:', error);
        toast.error('Failed to process camera capture');
      });
  }, []);

  // Main analysis function with real APIs
  const performAnalysis = useCallback(async (file: File, imageDataUrl: string) => {
    if (!userProfile?.id) {
      toast.error('Please log in to perform analysis');
      return;
    }

    setIsAnalyzing(true);
    setAutoSentToExpert(false);

    try {
      console.log('🔍 Starting real plant analysis...');
      
      // Upload image to storage
      const imageUrl = await uploadPlantImage(file, userProfile.id);
      console.log('📸 Image uploaded:', imageUrl);

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
        console.log('📨 Auto-sending diagnosis to expert...');
        const sent = await AutoExpertNotificationService.sendDiagnosisToExpert(
          userProfile.id,
          {
            plantType: analysis.plantName,
            plantVariety: analysis.scientificName,
            symptoms: plantInfo.symptoms || 'Visual symptoms detected in image',
            imageUrl: imageUrl,
            analysisResult: analysis,
            confidence: analysis.confidence,
            isHealthy: analysis.isHealthy
          }
        );
        setAutoSentToExpert(sent);
      }

    } catch (error) {
      console.error('❌ Analysis failed:', error);
      toast.error(`Analysis failed: ${error.message}`);
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
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-6 text-center">Upload Plant Image</h2>
            
            <div className="space-y-4">
              {/* Upload Button */}
              <Button 
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-24 text-lg"
                variant="outline"
              >
                <Upload className="mr-2 h-6 w-6" />
                Upload Photo from Gallery
              </Button>

              {/* Camera Button */}
              <Button 
                onClick={() => setShowCamera(true)}
                className="w-full h-24 text-lg"
                variant="outline"
              >
                <Camera className="mr-2 h-6 w-6" />
                Take Photo with Camera
              </Button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          </Card>
        );

      case 'analyzing':
        return (
          <Card className="p-8">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
              <h2 className="text-2xl font-bold">Analyzing Your Plant</h2>
              <p className="text-gray-600 text-center">
                Using real AI services (Plant.id, Hugging Face, EPPO Database) to analyze your plant...
              </p>
              {uploadedImage && (
                <div className="w-64 h-64 rounded-lg overflow-hidden">
                  <img 
                    src={uploadedImage} 
                    alt="Plant being analyzed" 
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
                    Diagnosis automatically sent to phytopathologist expert!
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
            Plant Disease Diagnosis
          </h1>
          <p className="text-gray-600">
            Real AI-powered plant analysis using professional databases
          </p>
        </div>

        {renderCurrentStage()}
      </div>
    </div>
  );
};

export default DiagnoseTab;
