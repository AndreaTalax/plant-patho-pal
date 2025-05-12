
import React, { useState, createRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowUpFromLine, Loader2 } from 'lucide-react';
import AIPredictionService from './AIPredictionService';
import { PlantDiagnosisResult } from '@/utils/plantDiagnosisService';
import { supabase } from '@/integrations/supabase/client';

interface PytorchAnalysisProps {
  uploadedImageUrl: string | null;
  onPredictionComplete: (result: PlantDiagnosisResult) => void;
}

const PytorchAnalysis = ({ uploadedImageUrl, onPredictionComplete }: PytorchAnalysisProps) => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isPredicting, setIsPredicting] = useState(false);
  const [result, setResult] = useState<PlantDiagnosisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = createRef<HTMLInputElement>();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
      setResult(null);
      setError(null);
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleAnalyze = async () => {
    if (!imageFile) return;

    setIsPredicting(true);
    setError(null);
    
    const formData = new FormData();
    formData.append("file", imageFile);

    try {
      // Use the Supabase Edge Function instead of direct fetch
      const { data, error } = await supabase.functions.invoke('plant-diagnosis', {
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (error) {
        throw error;
      }
      
      // Convert the response format
      const convertedResult: PlantDiagnosisResult = {
        plant: data.plant || data.pianta,
        disease: data.disease || data.malattia,
        probability: data.probability || data.probabilita,
        suggestions: data.suggestions || data.suggerimenti,
        error: data.error
      };
      
      setResult(convertedResult);
      
      if (!data.error) {
        onPredictionComplete(convertedResult);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Si è verificato un errore durante l\'analisi';
      setError(errorMessage);
    } finally {
      setIsPredicting(false);
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

        <div className="space-y-4">
          <div className="flex space-x-2">
            <Button 
              onClick={handleAnalyze} 
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
          
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
              <p className="font-medium">Errore</p>
              <p className="text-sm">{error}</p>
            </div>
          )}
          
          {result && !error && (
            <div className="p-3 bg-green-50 border border-green-200 text-green-800 rounded-md">
              <h3 className="text-lg font-semibold mb-2">Risultato Analisi</h3>
              <p><strong>Pianta:</strong> {result.plant}</p>
              <p><strong>Malattia:</strong> {result.disease}</p>
              <p><strong>Probabilità:</strong> {Math.round(result.probability * 100)}%</p>
              
              {result.suggestions && result.suggestions.length > 0 && (
                <>
                  <h4 className="mt-2 font-semibold">Suggerimenti:</h4>
                  <ul className="list-disc list-inside">
                    {result.suggestions.map((s, idx) => (
                      <li key={idx}>{s}</li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          )}
          
          <p className="text-xs text-gray-500">
            L'immagine verrà inviata al nostro modello PyTorch per un'analisi dettagliata delle malattie della pianta.
          </p>
        </div>

        <AIPredictionService 
          imageFile={imageFile} 
          onPredictionComplete={onPredictionComplete}
        />
      </div>
    </Card>
  );
};

export default PytorchAnalysis;
