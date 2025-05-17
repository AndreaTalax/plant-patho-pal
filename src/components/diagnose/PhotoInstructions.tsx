
import { Image } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const PhotoInstructions = () => {
  return (
    <Alert className="bg-blue-50 text-blue-800 border-blue-200 mb-4">
      <Image className="h-4 w-4 mt-1" />
      <AlertTitle className="text-blue-800 font-medium">Istruzioni per le foto</AlertTitle>
      <AlertDescription className="text-blue-700">
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li>Fotografa l'intera pianta, compresi il fusto e le foglie</li>
          <li>Se la pianta è in vaso, includi il vaso e la terra visibile</li>
          <li>Se la pianta è in terra, includi il terreno circostante</li>
          <li>Assicurati che la foto sia ben illuminata e nitida</li>
          <li>Scatta foto aggiuntive dei dettagli dei sintomi (foglie malate, macchie, ecc.)</li>
        </ul>
      </AlertDescription>
    </Alert>
  );
};

export default PhotoInstructions;
