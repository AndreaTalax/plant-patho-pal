
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import { analyzePlantImage, PlantDiagnosisResult } from '@/utils/plantDiagnosisService';
import { toast } from '@/components/ui/use-toast';

interface AIPredictionServiceProps {
  imageFile: File | null;
  onPredictionComplete: (result: PlantDiagnosisResult) => void;
}

const AIPredictionService = ({ imageFile, onPredictionComplete }: AIPredictionServiceProps) => {
  const [isPredicting, setIsPredicting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRunPrediction = async () => {
    if (!imageFile) {
      toast({
        title: "Nessuna immagine",
        description: "Carica un'immagine prima di eseguire l'analisi",
        variant: "destructive"
      });
      return;
    }

    setIsPredicting(true);
    setError(null);

    try {
      const result = await analyzePlantImage(imageFile);
      onPredictionComplete(result);
      toast({
        title: "Analisi completata",
        description: `Rilevato: ${result.disease} su ${result.plant}`,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Si è verificato un errore durante l\'analisi';
      setError(errorMessage);
      toast({
        title: "Errore",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsPredicting(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="font-medium text-lg">Analisi avanzata con PyTorch</h3>
      
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Errore</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="flex space-x-2">
        <Button 
          onClick={handleRunPrediction} 
          disabled={!imageFile || isPredicting}
          className="flex items-center gap-2"
        >
          {isPredicting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Analisi in corso...
            </>
          ) : (
            'Esegui analisi PyTorch'
          )}
        </Button>
      </div>
      
      <p className="text-xs text-gray-500">
        L'immagine verrà inviata al nostro modello PyTorch per un'analisi dettagliata delle malattie della pianta.
      </p>
    </div>
  );
};

export default AIPredictionService;
