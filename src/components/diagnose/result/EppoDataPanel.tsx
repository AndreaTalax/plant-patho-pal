
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface EppoDataPanelProps {
  analysisDetails: any;
  userInput?: string;
  eppoData?: any;
}

const EppoDataPanel = ({ analysisDetails, userInput, eppoData: initialEppoData }: EppoDataPanelProps) => {
  const [eppoData, setEppoData] = useState<any>(initialEppoData || null);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch EPPO data when analysis details or user input changes
  useEffect(() => {
    if (initialEppoData) {
      // If eppoData was provided through props, use it
      setEppoData(initialEppoData);
      setIsLoading(false);
    } else if (analysisDetails && userInput) {
      fetchEppoData();
    }
  }, [analysisDetails, userInput, initialEppoData]);

  const fetchEppoData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get disease or pest name from analysis details
      let pestsQuery = "";
      if (analysisDetails?.multiServiceInsights?.plantName) {
        pestsQuery = `name=${encodeURIComponent(analysisDetails.multiServiceInsights.plantName)}`;
      }

      // Call our edge function to query the EPPO API
      const { data, error } = await supabase.functions.invoke('eppo-api', {
        body: {
          endpoint: 'pests',
          query: pestsQuery,
          userInput: userInput
        }
      });

      if (error) {
        setError("Errore nella richiesta all'API EPPO");
        console.error("EPPO API error:", error);
      } else {
        setEppoData(data.data);
        setExplanation(data.explanation);
      }
    } catch (err) {
      console.error("Error fetching EPPO data:", err);
      setError("Si è verificato un errore durante il recupero dei dati");
    } finally {
      setIsLoading(false);
    }
  };

  if (!analysisDetails || !userInput) {
    return null;
  }

  return (
    <Card className="p-4 bg-white">
      <div className="mb-3">
        <h3 className="text-lg font-medium">Diagnosi basata sul Database EPPO</h3>
        <p className="text-sm text-gray-600">
          Analisi basata sui sintomi descritti e il database europeo di protezione delle piante
        </p>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-8">
          <Loader2 className="h-8 w-8 text-green-500 animate-spin mb-2" />
          <p className="text-sm text-gray-500">Consultando il database EPPO...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-red-700 text-sm">{error}</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2" 
            onClick={fetchEppoData}
          >
            Riprova
          </Button>
        </div>
      ) : (
        <>
          {explanation && (
            <div className="mb-4 bg-green-50 rounded-md p-4 border border-green-100">
              <h4 className="font-medium text-green-800 mb-2">Spiegazione diagnostica:</h4>
              <p className="text-sm text-green-700 whitespace-pre-line">{explanation}</p>
            </div>
          )}
          
          {eppoData && Array.isArray(eppoData) && eppoData.length > 0 && (
            <div className="mt-4 space-y-3">
              <h4 className="font-medium text-gray-800">Possibili problemi rilevati:</h4>
              {eppoData.slice(0, 3).map((pest: any, index: number) => (
                <div key={index} className="border rounded-md p-3 bg-gray-50">
                  <p className="font-medium">{pest.preferredname || pest.name}</p>
                  {pest.taxonomy && (
                    <p className="text-xs text-gray-500">{pest.taxonomy}</p>
                  )}
                  {pest.description && (
                    <p className="text-sm mt-1">{pest.description}</p>
                  )}
                </div>
              ))}
            </div>
          )}
          
          {(!eppoData || (Array.isArray(eppoData) && eppoData.length === 0)) && !explanation && (
            <p className="text-sm text-gray-500 italic">
              Non sono stati trovati risultati specifici nel database EPPO per i sintomi descritti.
            </p>
          )}
        </>
      )}
      
      <div className="mt-4 pt-4 border-t border-gray-100">
        <p className="text-xs text-gray-500">
          I dati provengono dal database EPPO (European and Mediterranean Plant Protection Organization), 
          la principale organizzazione per la protezione delle piante in Europa.
        </p>
      </div>
    </Card>
  );
};

export default EppoDataPanel;
