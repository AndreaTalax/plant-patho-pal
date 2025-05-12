
import { useState, createRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowUpFromLine } from 'lucide-react';
import AIPredictionService from './AIPredictionService';
import { PlantDiagnosisResult } from '@/utils/plantDiagnosisService';

interface PytorchAnalysisProps {
  uploadedImageUrl: string | null;
  onPredictionComplete: (result: PlantDiagnosisResult) => void;
}

const PytorchAnalysis = ({ uploadedImageUrl, onPredictionComplete }: PytorchAnalysisProps) => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const fileInputRef = createRef<HTMLInputElement>();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <Card className="p-4 mt-4 bg-white shadow-md rounded-lg">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">Analisi PyTorch</h3>
        <Badge className="bg-blue-600">Avanzato</Badge>
      </div>
      
      <p className="text-sm mb-4">
        Scegli un'immagine da analizzare con il nostro modello PyTorch per un'identificazione
        più accurata delle malattie delle piante.
      </p>

      <div className="space-y-4">
        {!imageFile && !uploadedImageUrl && (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
            <ArrowUpFromLine className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-600">
              Carica un'immagine per l'analisi
            </p>
            <Button 
              variant="outline" 
              className="mt-2"
              onClick={triggerFileInput}
            >
              Seleziona file
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
          </div>
        )}

        {(imageFile || uploadedImageUrl) && (
          <div className="space-y-4">
            <div className="aspect-square w-full max-w-xs mx-auto overflow-hidden rounded-lg">
              <img 
                src={imageFile ? URL.createObjectURL(imageFile) : uploadedImageUrl!}
                alt="Selected plant" 
                className="w-full h-full object-cover"
              />
            </div>
            
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-600">
                {imageFile ? imageFile.name : 'Immagine caricata'}
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={triggerFileInput}
              >
                Cambia
              </Button>
            </div>
          </div>
        )}

        <AIPredictionService 
          imageFile={imageFile} 
          onPredictionComplete={onPredictionComplete}
        />
      </div>
    </Card>
  );
};

export default PytorchAnalysis;
