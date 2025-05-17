
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AnalysisDetails } from '../types';
import { eppoApiService } from '@/utils/eppoApiService';
import { Loader2, ExternalLink, Search, Database } from 'lucide-react';
import { toast } from 'sonner';

interface EppoDataPanelProps {
  analysisDetails: AnalysisDetails | null;
}

const EppoDataPanel: React.FC<EppoDataPanelProps> = ({ analysisDetails }) => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  
  const handleEppoSearch = async () => {
    if (!analysisDetails?.multiServiceInsights?.plantName) {
      toast.error("Nome della pianta non disponibile per la ricerca");
      return;
    }
    
    setLoading(true);
    try {
      const plantName = analysisDetails.multiServiceInsights.plantName;
      toast.info(`Ricerca in corso per "${plantName}" nel database EPPO...`);
      
      // First try plants search
      const plantResults = await eppoApiService.searchPlants(plantName);
      
      if (plantResults && plantResults.length > 0) {
        setResults(plantResults);
        setShowResults(true);
        toast.success(`Trovati ${plantResults.length} risultati per "${plantName}" nel database EPPO`);
      } else {
        // If no plant results, try pests search
        const pestResults = await eppoApiService.searchPests(plantName);
        
        if (pestResults && pestResults.length > 0) {
          setResults(pestResults);
          setShowResults(true);
          toast.success(`Trovati ${pestResults.length} risultati per "${plantName}" nel database EPPO (categoria parassiti)`);
        } else {
          // If no pest results, try diseases search
          const diseaseResults = await eppoApiService.searchDiseases(plantName);
          
          if (diseaseResults && diseaseResults.length > 0) {
            setResults(diseaseResults);
            setShowResults(true);
            toast.success(`Trovati ${diseaseResults.length} risultati per "${plantName}" nel database EPPO (categoria malattie)`);
          } else {
            toast.warning(`Nessun risultato trovato per "${plantName}" nel database EPPO`);
            setResults([]);
            setShowResults(false);
          }
        }
      }
    } catch (error) {
      console.error("Errore nella ricerca EPPO:", error);
      toast.error("Errore durante la ricerca nel database EPPO");
    } finally {
      setLoading(false);
    }
  };

  const viewEppoDetails = (eppoCode: string) => {
    window.open(`https://gd.eppo.int/taxon/${eppoCode}`, '_blank');
  };
  
  const closeResults = () => {
    setShowResults(false);
    setResults([]);
  };

  return (
    <div>
      <Button 
        variant="outline" 
        className="w-full flex items-center justify-center gap-2 py-4 transition-colors"
        onClick={handleEppoSearch}
        disabled={loading || !analysisDetails?.multiServiceInsights?.plantName}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin mr-1" />
        ) : (
          <Database className="h-4 w-4 mr-1" />
        )}
        <span className={loading ? "text-gray-400" : "text-gray-600"}>
          {loading ? "Ricerca in corso..." : "Ricerca nel database EPPO"}
        </span>
      </Button>
      
      {showResults && results.length > 0 && (
        <div className="mt-3 bg-white rounded-lg shadow-md p-3 border border-gray-200">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-medium">Risultati EPPO ({results.length})</h3>
            <Button variant="ghost" size="sm" onClick={closeResults} className="h-6 w-6 p-0">✕</Button>
          </div>
          
          <div className="max-h-60 overflow-y-auto">
            {results.map((item, index) => (
              <div 
                key={index} 
                className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0"
              >
                <div>
                  <p className="text-sm font-medium">{item.preferredName}</p>
                  <p className="text-xs text-gray-500">{item.eppoCode}</p>
                </div>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => viewEppoDetails(item.eppoCode)}
                  className="flex items-center gap-1 text-xs"
                >
                  Dettagli <ExternalLink className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EppoDataPanel;
