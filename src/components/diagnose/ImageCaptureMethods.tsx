
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, Upload, Info, Leaf, Bug } from 'lucide-react';
import React, { useState } from 'react';
import { AspectRatio } from '@/components/ui/aspect-ratio';

interface ImageCaptureMethodsProps {
  onTakePhoto: (mode: 'identify' | 'diagnose') => void;
  onUploadPhoto: () => void;
}

const ImageCaptureMethods = ({ onTakePhoto, onUploadPhoto }: ImageCaptureMethodsProps) => {
  const [showTips, setShowTips] = useState(false);
  
  return (
    <div className="space-y-6 w-full max-w-md">
      <div className="flex gap-4">
        <Card className="bg-white p-6 shadow-md rounded-2xl text-center flex-1">
          <div className="bg-drplant-green/10 rounded-full p-6 inline-flex mx-auto mb-4">
            <Leaf size={36} className="text-drplant-green" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Identifica Pianta</h3>
          <AspectRatio ratio={16/9} className="mb-4 bg-gray-100 rounded-lg">
            <div className="w-full h-full flex items-center justify-center">
              <img 
                src="/lovable-uploads/1cb629ef-f7f2-4b66-a48a-5f22564bb3fa.png" 
                alt="Identificazione pianta" 
                className="object-contain w-full h-full p-1"
              />
            </div>
          </AspectRatio>
          <Button 
            className="w-full bg-drplant-green hover:bg-drplant-green-dark"
            onClick={() => onTakePhoto('identify')}
          >
            <Camera className="mr-2 h-5 w-5" /> Identifica Pianta
          </Button>
        </Card>

        <Card className="bg-white p-6 shadow-md rounded-2xl text-center flex-1">
          <div className="bg-drplant-blue/10 rounded-full p-6 inline-flex mx-auto mb-4">
            <Bug size={36} className="text-drplant-blue" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Diagnosi Problema</h3>
          <AspectRatio ratio={16/9} className="mb-4 bg-gray-100 rounded-lg">
            <div className="w-full h-full flex items-center justify-center">
              <img 
                src="/lovable-uploads/c8ba9199-f82d-4a4f-a6ae-1c8e340ed1b5.png" 
                alt="Diagnosi pianta" 
                className="object-contain w-full h-full p-1"
              />
            </div>
          </AspectRatio>
          <Button 
            className="w-full bg-drplant-blue hover:bg-drplant-blue-dark"
            onClick={() => onTakePhoto('diagnose')}
          >
            <Camera className="mr-2 h-5 w-5" /> Diagnosi Problema
          </Button>
        </Card>
      </div>

      <div className="text-center text-gray-500 my-4 flex items-center justify-center">
        <div className="border-t border-gray-200 flex-grow"></div>
        <span className="px-4">OPPURE</span>
        <div className="border-t border-gray-200 flex-grow"></div>
      </div>

      <Card className="bg-white p-6 shadow-md rounded-2xl text-center">
        <div className="bg-gray-100 rounded-full p-6 inline-flex mx-auto mb-4">
          <Upload size={36} className="text-gray-600" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Carica una Foto</h3>
        <p className="text-gray-600 mb-4">
          Seleziona un'immagine dalla galleria per analizzare
        </p>
        <Button 
          className="w-full border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
          variant="outline"
          onClick={onUploadPhoto}
        >
          <Upload className="mr-2 h-5 w-5" /> Carica Immagine
        </Button>
      </Card>

      <Button
        variant="ghost"
        className="w-full flex items-center justify-center text-drplant-blue hover:bg-drplant-blue/5"
        onClick={() => setShowTips(!showTips)}
      >
        <Info className="mr-2 h-4 w-4" /> 
        {showTips ? "Nascondi Consigli Fotografici" : "Mostra Consigli Fotografici"}
      </Button>
      
      {showTips && (
        <div className="mt-2 p-4 bg-blue-50 rounded-lg border border-blue-100">
          <div className="flex items-start">
            <Info className="h-5 w-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium mb-1 text-blue-700">Per risultati migliori:</p>
              
              <div className="mb-3">
                <h4 className="text-blue-700 font-medium">Identificazione Piante:</h4>
                <ul className="list-disc list-inside space-y-1 text-blue-600 pl-1">
                  <li>Cattura l'intera struttura della pianta</li>
                  <li>Includi fiori e/o frutti se disponibili</li>
                  <li>Usa luce naturale senza ombre</li>
                  <li>Scatta da più angolazioni per maggiore precisione</li>
                </ul>
              </div>
              
              <div>
                <h4 className="text-blue-700 font-medium">Diagnosi Malattie:</h4>
                <ul className="list-disc list-inside space-y-1 text-blue-600 pl-1">
                  <li>Concentrati sulle aree che mostrano sintomi</li>
                  <li>Includi sia parti sane che malate per confronto</li>
                  <li>Scatta foto chiare, ben illuminate senza ombre</li>
                  <li>Cattura più parti affette se i sintomi variano</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageCaptureMethods;
