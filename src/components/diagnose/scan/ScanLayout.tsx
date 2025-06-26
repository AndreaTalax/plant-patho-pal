
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, Camera, Loader2 } from 'lucide-react';
import { PlantInfo } from '../types';

interface ScanLayoutProps {
  isAnalyzing: boolean;
  plantInfo: PlantInfo;
  uploadedImage: string | null;
}

const ScanLayout = ({ isAnalyzing, plantInfo, uploadedImage }: ScanLayoutProps) => {
  if (isAnalyzing) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Analisi in corso...</CardTitle>
          <CardDescription className="text-center">
            Stiamo analizzando la tua pianta
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-drplant-blue" />
          <p className="text-gray-600">Attendere prego...</p>
          
          {uploadedImage && (
            <div className="aspect-square max-w-xs mx-auto rounded-lg overflow-hidden">
              <img 
                src={uploadedImage} 
                alt="Immagine in analisi" 
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">Carica Foto della Pianta</CardTitle>
        <CardDescription className="text-center">
          Scatta una foto o carica un'immagine per iniziare la diagnosi
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Bottone per scattare foto */}
        <Button 
          className="w-full h-24 text-lg bg-drplant-blue hover:bg-drplant-blue-dark"
          size="lg"
        >
          <Camera className="mr-3 h-6 w-6" />
          Scatta Foto
        </Button>

        {/* Bottone per caricare foto */}
        <Button 
          variant="outline"
          className="w-full h-24 text-lg"
          size="lg"
        >
          <Upload className="mr-3 h-6 w-6" />
          Carica da Galleria
        </Button>
      </CardContent>
    </Card>
  );
};

export default ScanLayout;
