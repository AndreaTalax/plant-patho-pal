
import React from 'react';
import { Camera, Upload, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface ScanMethodsProps {
  onTakePhoto: () => void;
  onUploadPhoto: () => void;
}

/**
* Renders a component with options to either take a photo or upload an image.
* @example
* renderPhotoOptions({ onTakePhoto: handleTakePhoto, onUploadPhoto: handleUploadPhoto })
* // Renders the interface allowing the user to choose between taking a photo or uploading one.
* @param {function} onTakePhoto - Callback function to be executed when the "Take Photo" option is selected.
* @param {function} onUploadPhoto - Callback function to be executed when the "Upload Image" option is selected.
* @returns {JSX.Element} A JSX element representing the component interface with two options for photo management.
* @description
*   - Utilizes the Camera and Upload icons to visually differentiate options.
*   - Alterations in the style on hover to indicate interactivity.
*/
const ScanMethods: React.FC<ScanMethodsProps> = ({ onTakePhoto, onUploadPhoto }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
      <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={onTakePhoto}>
        <div className="text-center">
          <div className="bg-blue-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Camera className="h-8 w-8 text-blue-600" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Take Photo</h3>
          <p className="text-gray-600 mb-4">
            Use your camera to capture your plant's condition in real-time
          </p>
          <Button className="w-full bg-blue-600 hover:bg-blue-700">
            <Camera className="mr-2 h-4 w-4" />
            Open Camera
          </Button>
        </div>
      </Card>

      <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={onUploadPhoto}>
        <div className="text-center">
          <div className="bg-green-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Upload className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Upload Image</h3>
          <p className="text-gray-600 mb-4">
            Choose an existing photo from your device's gallery
          </p>
          <Button variant="outline" className="w-full border-green-600 text-green-600 hover:bg-green-50">
            <Upload className="mr-2 h-4 w-4" />
            Choose File
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default ScanMethods;
