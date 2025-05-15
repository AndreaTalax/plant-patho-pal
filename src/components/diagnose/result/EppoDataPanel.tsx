
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Database, Leaf, ExternalLink } from 'lucide-react';
import { eppoApiService, EppoPest, EppoPlant, EppoDiseases } from '@/utils/eppoApiService';
import { AnalysisDetails } from '../types';
import { Skeleton } from '@/components/ui/skeleton';

interface EppoDataPanelProps {
  analysisDetails: AnalysisDetails | null;
}

export const EppoDataPanel = ({ analysisDetails }: EppoDataPanelProps) => {
  const [loading, setLoading] = useState(false);
  const [eppoData, setEppoData] = useState<
    { type: 'pest' | 'disease' | 'plant', data: EppoPest | EppoDiseases | EppoPlant | null }
  >(null);
  const [showPanel, setShowPanel] = useState(false);

  const searchEppoDatabase = async () => {
    if (!analysisDetails) return;
    
    setLoading(true);
    setShowPanel(true);
    
    try {
      // Determina se cercare parassiti, malattie o piante
      const isHealthy = analysisDetails.multiServiceInsights?.isHealthy;
      const plantName = analysisDetails.multiServiceInsights?.plantName || '';
      
      if (isHealthy) {
        // Se la pianta è sana, cerca informazioni sulla pianta
        const plants = await eppoApiService.searchPlants(plantName);
        
        if (plants && plants.length > 0) {
          const plantDetails = await eppoApiService.getPlantDetails(plants[0].eppoCode);
          setEppoData({ type: 'plant', data: plantDetails });
        } else {
          setEppoData({ type: 'plant', data: null });
        }
      } else {
        // Se non è sana, cerca informazioni sulla malattia/parassita
        const diseaseLabel = analysisDetails.multiServiceInsights?.huggingFaceResult?.label || '';
        
        // Prima prova a cercare tra le malattie
        const diseases = await eppoApiService.searchDiseases(diseaseLabel);
        
        if (diseases && diseases.length > 0) {
          const diseaseDetails = await eppoApiService.getDiseaseDetails(diseases[0].eppoCode);
          setEppoData({ type: 'disease', data: diseaseDetails });
        } else {
          // Se non trova malattie, cerca tra i parassiti
          const pests = await eppoApiService.searchPests(diseaseLabel);
          
          if (pests && pests.length > 0) {
            const pestDetails = await eppoApiService.getPestDetails(pests[0].eppoCode);
            setEppoData({ type: 'pest', data: pestDetails });
          } else {
            // Se non trova nemmeno parassiti, prova con termini generici dalla malattia
            const terms = diseaseLabel.split(' ');
            let found = false;
            
            for (const term of terms) {
              if (term.length < 4) continue; // Salta termini troppo corti
              
              const pests = await eppoApiService.searchPests(term);
              if (pests && pests.length > 0) {
                const pestDetails = await eppoApiService.getPestDetails(pests[0].eppoCode);
                setEppoData({ type: 'pest', data: pestDetails });
                found = true;
                break;
              }
            }
            
            if (!found) {
              setEppoData({ type: 'pest', data: null });
            }
          }
        }
      }
    } catch (error) {
      console.error('Error searching EPPO database:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!showPanel) {
    return (
      <Button 
        variant="outline" 
        size="sm" 
        className="w-full mb-4 mt-2"
        onClick={searchEppoDatabase}
        disabled={loading || !analysisDetails}
      >
        <Database className="mr-2 h-4 w-4" />
        Cerca dati EPPO ufficiali
      </Button>
    );
  }

  return (
    <Card className="mb-4 border-blue-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center">
          <Database className="mr-2 h-4 w-4 text-blue-600" />
          Database EPPO Global
          {loading && <Skeleton className="h-4 w-20 ml-2" />}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 text-xs">
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ) : eppoData && eppoData.data ? (
          <div>
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-semibold">{eppoData.data.preferredName}</h4>
              <div className="text-xs text-blue-600">
                {eppoData.type === 'pest' && 'Parassita'}
                {eppoData.type === 'disease' && 'Malattia'}
                {eppoData.type === 'plant' && 'Pianta'}
              </div>
            </div>
            
            {eppoData.type === 'pest' && (
              <div className="space-y-1">
                {(eppoData.data as EppoPest).category && (
                  <div className="flex justify-between">
                    <span>Categoria:</span>
                    <span>{(eppoData.data as EppoPest).category}</span>
                  </div>
                )}
                
                {(eppoData.data as EppoPest).hosts && (eppoData.data as EppoPest).hosts.length > 0 && (
                  <div>
                    <span>Ospiti:</span>
                    <ul className="list-disc list-inside pl-2">
                      {(eppoData.data as EppoPest).hosts.slice(0, 3).map((host, idx) => (
                        <li key={idx} className="truncate">{host}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {(eppoData.data as EppoPest).regulatoryStatus && (eppoData.data as EppoPest).regulatoryStatus.length > 0 && (
                  <div className="mt-2 p-1.5 bg-red-50 rounded-sm border border-red-200">
                    <div className="flex items-center">
                      <AlertTriangle className="h-3 w-3 text-red-600 mr-1" />
                      <span className="font-medium text-red-700">Stato Regolamentare:</span>
                    </div>
                    <ul className="list-disc list-inside pl-2 text-red-800">
                      {(eppoData.data as EppoPest).regulatoryStatus.map((status, idx) => (
                        <li key={idx} className="truncate">{status}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
            
            {eppoData.type === 'disease' && (
              <div className="space-y-1">
                {(eppoData.data as EppoDiseases).scientificName && (
                  <div className="flex justify-between">
                    <span>Nome scientifico:</span>
                    <span className="italic">{(eppoData.data as EppoDiseases).scientificName}</span>
                  </div>
                )}
                
                {(eppoData.data as EppoDiseases).causalAgents && (eppoData.data as EppoDiseases).causalAgents.length > 0 && (
                  <div>
                    <span>Agenti causali:</span>
                    <ul className="list-disc list-inside pl-2">
                      {(eppoData.data as EppoDiseases).causalAgents.slice(0, 2).map((agent, idx) => (
                        <li key={idx} className="truncate">{agent}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {(eppoData.data as EppoDiseases).symptoms && (eppoData.data as EppoDiseases).symptoms.length > 0 && (
                  <div>
                    <span>Sintomi:</span>
                    <ul className="list-disc list-inside pl-2">
                      {(eppoData.data as EppoDiseases).symptoms.slice(0, 3).map((symptom, idx) => (
                        <li key={idx} className="truncate">{symptom}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {(eppoData.data as EppoDiseases).regulatoryStatus && (eppoData.data as EppoDiseases).regulatoryStatus.length > 0 && (
                  <div className="mt-2 p-1.5 bg-red-50 rounded-sm border border-red-200">
                    <div className="flex items-center">
                      <AlertTriangle className="h-3 w-3 text-red-600 mr-1" />
                      <span className="font-medium text-red-700">Stato Regolamentare:</span>
                    </div>
                    <ul className="list-disc list-inside pl-2 text-red-800">
                      {(eppoData.data as EppoDiseases).regulatoryStatus.map((status, idx) => (
                        <li key={idx} className="truncate">{status}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
            
            {eppoData.type === 'plant' && (
              <div className="space-y-1">
                {(eppoData.data as EppoPlant).scientificName && (
                  <div className="flex justify-between">
                    <span>Nome scientifico:</span>
                    <span className="italic">{(eppoData.data as EppoPlant).scientificName}</span>
                  </div>
                )}
                
                {(eppoData.data as EppoPlant).taxonomy && (
                  <div>
                    <span>Tassonomia:</span>
                    {(eppoData.data as EppoPlant).taxonomy.family && (
                      <div className="flex justify-between pl-2">
                        <span>Famiglia:</span>
                        <span>{(eppoData.data as EppoPlant).taxonomy.family}</span>
                      </div>
                    )}
                    {(eppoData.data as EppoPlant).taxonomy.genus && (
                      <div className="flex justify-between pl-2">
                        <span>Genere:</span>
                        <span>{(eppoData.data as EppoPlant).taxonomy.genus}</span>
                      </div>
                    )}
                  </div>
                )}
                
                {(eppoData.data as EppoPlant).otherNames && (eppoData.data as EppoPlant).otherNames.length > 0 && (
                  <div>
                    <span>Altri nomi:</span>
                    <div className="pl-2 italic">
                      {(eppoData.data as EppoPlant).otherNames.slice(0, 3).join(", ")}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <div className="mt-3 text-center">
              <a 
                href={`https://gd.eppo.int/taxon/${eppoData.data.eppoCode}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 flex items-center justify-center text-xs"
              >
                Vedi scheda completa su EPPO <ExternalLink className="ml-1 h-3 w-3" />
              </a>
            </div>
          </div>
        ) : (
          <div className="text-center py-2">
            <Leaf className="h-8 w-8 text-blue-200 mx-auto mb-2" />
            <p>Nessun dato trovato nel database EPPO per questa analisi.</p>
            <p className="text-xs text-gray-500 mt-1">
              I risultati potrebbero non corrispondere a parassiti o malattie regolamentate.
            </p>
          </div>
        )}
        
        <div className="mt-3 flex justify-between">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-xs h-7 px-2"
            onClick={() => setShowPanel(false)}
          >
            Chiudi
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            className="text-xs h-7 px-2" 
            onClick={searchEppoDatabase}
            disabled={loading}
          >
            <Database className="mr-1 h-3 w-3" />
            Aggiorna
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default EppoDataPanel;
