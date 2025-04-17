
import { Camera, Upload, Loader2, MessageCircle } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const DiagnoseTab = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [diagnosisResult, setDiagnosisResult] = useState<string | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedImage(event.target?.result as string);
        simulateDiagnosis();
      };
      reader.readAsDataURL(file);
    }
  };

  const simulateDiagnosis = () => {
    setIsAnalyzing(true);
    setDiagnosisResult(null);
    
    // Simulate AI analysis
    setTimeout(() => {
      setIsAnalyzing(false);
      setDiagnosisResult("Possible Powdery Mildew detected. This fungal disease affects many plant species. Would you like to connect with an expert for confirmation?");
    }, 3000);
  };

  const resetDiagnosis = () => {
    setUploadedImage(null);
    setDiagnosisResult(null);
  };

  return (
    <div className="flex flex-col items-center justify-start px-4 pt-6 pb-24 min-h-full">
      <h2 className="text-2xl font-bold mb-6 text-drplant-green">Plant Diagnosis</h2>
      
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
            <Button className="w-full bg-drplant-blue hover:bg-drplant-blue-dark">
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
          </div>
        </div>
      ) : (
        <Card className="bg-white p-6 shadow-md rounded-2xl w-full max-w-md">
          <div className="aspect-square w-full overflow-hidden rounded-xl mb-4">
            <img 
              src={uploadedImage} 
              alt="Uploaded plant" 
              className="w-full h-full object-cover"
            />
          </div>

          {isAnalyzing ? (
            <div className="flex flex-col items-center justify-center py-4">
              <Loader2 className="h-8 w-8 text-drplant-blue animate-spin mb-2" />
              <p className="text-drplant-blue font-medium">Analyzing your plant...</p>
            </div>
          ) : diagnosisResult && (
            <div className="border-l-4 border-drplant-blue p-4 bg-drplant-blue/10 rounded-r-lg mb-4">
              <h3 className="font-bold text-drplant-blue-dark">Diagnosis Result:</h3>
              <p className="text-gray-700">{diagnosisResult}</p>
            </div>
          )}

          <div className="flex gap-2 mt-4">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={resetDiagnosis}
            >
              New Diagnosis
            </Button>
            {diagnosisResult && (
              <Button 
                className="flex-1 bg-drplant-blue hover:bg-drplant-blue-dark"
              >
                <MessageCircle className="mr-2 h-4 w-4" /> Talk to Expert
              </Button>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

export default DiagnoseTab;
