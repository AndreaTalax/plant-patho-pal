
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, Upload } from 'lucide-react';
import React from 'react';

interface ImageCaptureMethodsProps {
  onTakePhoto: () => void;
  onUploadPhoto: () => void;
}

const ImageCaptureMethods = ({ onTakePhoto, onUploadPhoto }: ImageCaptureMethodsProps) => {
  return (
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
          onClick={onTakePhoto}
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
          onClick={onUploadPhoto}
        >
          <Upload className="mr-2 h-5 w-5" /> Upload Image
        </Button>
      </Card>

      <div className="mt-6 text-center text-gray-600">
        <p>Our AI can help identify common plant diseases</p>
        <p className="text-sm mt-2 text-gray-400">
          For the most accurate results, take clear, well-lit photos of affected areas
        </p>
      </div>
    </div>
  );
};

export default ImageCaptureMethods;
