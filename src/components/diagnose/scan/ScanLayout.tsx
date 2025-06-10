
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, Camera } from 'lucide-react';

interface ScanLayoutProps {
  onTakePhoto: () => void;
  onUploadPhoto: () => void;
}

const ScanLayout = ({ onTakePhoto, onUploadPhoto }: ScanLayoutProps) => {
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
          onClick={onTakePhoto}
          className="w-full h-24 text-lg bg-drplant-blue hover:bg-drplant-blue-dark"
          size="lg"
        >
          <Camera className="mr-3 h-6 w-6" />
          Scatta Foto
        </Button>

        {/* Bottone per caricare foto */}
        <Button 
          onClick={onUploadPhoto}
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
