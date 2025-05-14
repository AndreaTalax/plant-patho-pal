
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, Upload, Info } from 'lucide-react';
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
        <h3 className="text-lg font-semibold mb-2">Plant Scanner</h3>
        <p className="text-gray-600 mb-4">
          Use your camera to scan a plant and get instant identification and health analysis
        </p>
        <Button 
          className="w-full bg-drplant-blue hover:bg-drplant-blue-dark"
          onClick={onTakePhoto}
        >
          <Camera className="mr-2 h-5 w-5" /> Scan Plant
        </Button>
      </Card>

      <div className="text-center text-gray-500 my-4">OR</div>

      <Card className="bg-white p-6 shadow-md rounded-2xl text-center">
        <div className="bg-drplant-green/10 rounded-full p-6 inline-flex mx-auto mb-4">
          <Upload size={48} className="text-drplant-green" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Upload Plant Photo</h3>
        <p className="text-gray-600 mb-4">
          Select an existing plant image from your gallery
        </p>
        <Button 
          className="w-full bg-drplant-green hover:bg-drplant-green-dark"
          onClick={onUploadPhoto}
        >
          <Upload className="mr-2 h-5 w-5" /> Upload Image
        </Button>
      </Card>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
        <div className="flex items-start">
          <Info className="h-5 w-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
          <div className="text-sm text-blue-700">
            <p className="font-medium mb-1">Plant Scanner Tips:</p>
            <ul className="list-disc list-inside space-y-1 text-blue-600 pl-1">
              <li>Take clear, well-lit photos of the plant</li>
              <li>Include both healthy and affected areas for accurate diagnosis</li>
              <li>Capture close-ups of any visible symptoms</li>
              <li>Hold your phone steady for best scanning results</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageCaptureMethods;
