
import React from 'react';
import { Button } from '@/components/ui/button';
import { AnalysisDetails } from '../types';
import { eppoApiService } from '@/utils/eppoApiService';

interface EppoDataPanelProps {
  analysisDetails: AnalysisDetails | null;
}

const EppoDataPanel: React.FC<EppoDataPanelProps> = ({ analysisDetails }) => {
  const [loading, setLoading] = React.useState(false);
  
  const handleEppoSearch = async () => {
    if (!analysisDetails?.multiServiceInsights?.plantName) {
      console.log("Nome della pianta non disponibile per la ricerca");
      return;
    }
    
    setLoading(true);
    try {
      const plantName = analysisDetails.multiServiceInsights.plantName;
      const results = await eppoApiService.searchPlants(plantName);
      
      if (results && results.length > 0) {
        console.log(`Trovati ${results.length} risultati per "${plantName}" nel database EPPO`);
        // Here you would typically open a modal or navigate to results page
      } else {
        console.log(`Nessun risultato trovato per "${plantName}" nel database EPPO`);
      }
    } catch (error) {
      console.error("Errore nella ricerca EPPO:", error);
    } finally {
      setLoading(false);
    }
  };

  // Always enable the button, regardless of analysis details
  return (
    <Button 
      variant="outline" 
      className="w-full flex items-center justify-center gap-2 py-6" 
      onClick={handleEppoSearch}
      disabled={loading}
    >
      <span className={loading ? "text-gray-400" : "text-gray-600"}>
        {loading ? "Ricerca in corso..." : "Cerca dati EPPO ufficiali"}
      </span>
    </Button>
  );
};

export default EppoDataPanel;
