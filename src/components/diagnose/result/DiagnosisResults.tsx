
import React from 'react';
import {
  AlertTriangle,
  Database,
  Leaf,
  Search,
  Info,
  Lightbulb,
  Globe,
  MapPin,
  Activity,
  Shield,
  TreePine
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/sonner';
import { ConfidenceBadge } from '@/components/diagnose/ConfidenceBadge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { type CombinedAnalysisResult } from '@/types/analysis';
import { GBIFService } from '@/services/gbifService';

interface DiagnosisResultsProps {
  results: CombinedAnalysisResult & {
    gbifInfo?: any;
    cropHealthAnalysis?: any;
  };
  isFallback?: boolean;
}

export const DiagnosisResults: React.FC<DiagnosisResultsProps> = ({ results, isFallback = false }) => {
  const { mostLikelyPlant } = results.consensus;

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-green-50 to-blue-50 rounded-xl border border-green-200">
      {/* Alert per suggerimenti di fallback */}
      {isFallback && (
        <Alert className="bg-amber-50 border-amber-200">
          <Info className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <strong>Identificazione incerta:</strong> Non siamo riusciti a identificare con certezza la tua pianta. 
            I risultati mostrati sono suggerimenti basati sulle piante più comuni e sui problemi tipici.
            Ti consigliamo di consultare un esperto per una diagnosi precisa.
          </AlertDescription>
        </Alert>
      )}

      {/* Identificazione principale della pianta con informazioni geografiche e descrizione */}
      {mostLikelyPlant && (
        <div className="bg-white rounded-lg p-6 border border-green-200 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Leaf className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-xl font-bold text-gray-900">{mostLikelyPlant.plantName}</h3>
                <ConfidenceBadge confidence={mostLikelyPlant.confidence} />
              </div>
              
              {mostLikelyPlant.scientificName && (
                <p className="text-gray-600 italic text-sm mb-3">{mostLikelyPlant.scientificName}</p>
              )}

              {/* Informazioni geografiche */}
              {results.gbifInfo && !isFallback && (
                <div className="mb-4">
                  <div className="flex items-start gap-2 mb-2">
                    <MapPin className="h-4 w-4 text-blue-500 mt-1 flex-shrink-0" />
                    <div className="text-sm text-gray-700">
                      <span className="font-medium">Distribuzione geografica: </span>
                      {results.gbifInfo.nativeCountries?.length > 0 ? (
                        <>
                          Nativa di: <span className="text-green-700 font-medium">
                            {results.gbifInfo.nativeCountries.slice(0, 3).join(', ')}
                            {results.gbifInfo.nativeCountries.length > 3 && ` e altri ${results.gbifInfo.nativeCountries.length - 3} paesi`}
                          </span>
                          {results.gbifInfo.introducedCountries?.length > 0 && (
                            <>. Coltivata in: <span className="text-blue-700">
                              {results.gbifInfo.introducedCountries.slice(0, 2).join(', ')}
                              {results.gbifInfo.introducedCountries.length > 2 && ` e altri ${results.gbifInfo.introducedCountries.length - 2} paesi`}
                            </span></>
                          )}
                        </>
                      ) : (
                        'Distribuzione globale nelle regioni temperate e tropicali'
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Descrizione della pianta */}
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-green-600 mt-1 flex-shrink-0" />
                  <div className="text-sm text-green-800">
                    <p className="font-medium mb-1">Informazioni sulla pianta:</p>
                    <p>
                      {results.gbifInfo?.family && (
                        <>Appartiene alla famiglia delle <span className="font-medium">{results.gbifInfo.family}</span>. </>
                      )}
                      {mostLikelyPlant.plantName.toLowerCase().includes('pothos') && 
                        "È una pianta tropicale sempreverde, molto popolare come pianta d'appartamento per la sua resistenza e facilità di cura. Cresce bene in condizioni di luce indiretta e richiede annaffiature moderate."
                      }
                      {mostLikelyPlant.plantName.toLowerCase().includes('monstera') && 
                        "È una pianta tropicale originaria delle foreste pluviali dell'America Centrale. Caratterizzata dalle sue grandi foglie fenestrate, è molto apprezzata come pianta ornamentale d'interno."
                      }
                      {mostLikelyPlant.plantName.toLowerCase().includes('ficus') && 
                        "È un genere di piante che comprende sia specie d'appartamento che alberi ornamentali. Generalmente preferisce posizioni luminose ma non sole diretto e annaffiature regolari ma moderate."
                      }
                      {mostLikelyPlant.plantName.toLowerCase().includes('sansevieria') && 
                        "Conosciuta anche come 'lingua di suocera', è una pianta succulenta molto resistente, originaria dell'Africa tropicale. È ideale per principianti grazie alla sua capacità di tollerare neglect e condizioni di scarsa illuminazione."
                      }
                      {!mostLikelyPlant.plantName.toLowerCase().match(/(pothos|monstera|ficus|sansevieria)/) && 
                        "È una specie vegetale che può essere coltivata sia in interno che in esterno, a seconda delle condizioni climatiche della zona. Per informazioni specifiche sulla cura, consulta guide specializzate per questa specie."
                      }
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                <span className="text-xs text-gray-500">Identificata da: {mostLikelyPlant.provider}</span>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Tutte le identificazioni trovate */}
      {results.plantIdentification.length > 1 && (
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Search className="h-4 w-4" />
            {isFallback ? 'Altri Suggerimenti Possibili' : 'Altre Identificazioni Trovate'}
          </h4>
          <div className="space-y-2">
            {results.plantIdentification.slice(1).map((plant, index) => (
              <div key={index} className={`flex justify-between items-center p-2 rounded ${
                isFallback ? 'bg-amber-50' : 'bg-gray-50'
              }`}>
                <div>
                  <span className="font-medium">{plant.plantName}</span>
                  {plant.scientificName && (
                    <span className="text-gray-600 text-sm ml-2 italic">
                      {plant.scientificName}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <ConfidenceBadge confidence={plant.confidence} />
                  <span className="text-xs text-gray-500">{plant.provider}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Problemi e malattie identificati */}
      {results.diseaseDetection.length > 0 && (
        <div className="bg-white rounded-lg p-4 border border-red-100">
          <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            {isFallback ? 'Possibili Problemi Comuni' : 'Problemi Identificati'}
          </h4>
          {isFallback && (
            <p className="text-sm text-amber-700 mb-3 bg-amber-50 p-2 rounded">
              Questi sono problemi comuni delle piante d'appartamento. Osserva attentamente la tua pianta per verificare se presenta questi sintomi.
            </p>
          )}
          <div className="space-y-4">
            {results.diseaseDetection.map((disease, index) => (
              <div key={index} className="border-l-4 border-red-200 pl-4 bg-red-50 p-3 rounded-r">
                <div className="flex justify-between items-start mb-2">
                  <h5 className="font-medium text-red-800">{disease.disease}</h5>
                  <div className="flex items-center gap-2">
                    <ConfidenceBadge confidence={disease.confidence} />
                    <span className="text-xs text-gray-500">{disease.provider}</span>
                  </div>
                </div>
                
                {/* Causa */}
                {disease.additionalInfo?.cause && (
                  <div className="mb-2">
                    <span className="text-sm font-medium text-gray-700">Causa: </span>
                    <span className="text-sm text-gray-600">{disease.additionalInfo.cause}</span>
                  </div>
                )}
                
                {/* Sintomi */}
                {disease.symptoms.length > 0 && (
                  <div className="mb-2">
                    <span className="text-sm font-medium text-gray-700">Sintomi: </span>
                    <span className="text-sm text-gray-600">{disease.symptoms.join(', ')}</span>
                  </div>
                )}
                
                {/* Trattamenti */}
                {disease.treatments.length > 0 && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">Trattamenti consigliati: </span>
                    <span className="text-sm text-gray-600">{disease.treatments.join(', ')}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Statistiche analisi */}
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <h4 className="font-semibold text-gray-800 mb-2">Statistiche Analisi</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Fonti consultate:</span>
            <span className="font-medium ml-1">{results.consensus.providersUsed.length}</span>
          </div>
          <div>
            <span className="text-gray-600">Accordo tra fonti:</span>
            <span className="font-medium ml-1">{results.consensus.agreementScore}%</span>
          </div>
        </div>
        {isFallback && (
          <div className="mt-2 text-xs text-amber-700 bg-amber-50 p-2 rounded">
            I dati mostrati sono suggerimenti generici basati su problemi comuni delle piante.
          </div>
        )}
      </div>

      {/* Distribuzione geografica GBIF */}
      {results.gbifInfo && !isFallback && (
        <div className="bg-white rounded-lg p-4 border border-blue-100">
          <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Globe className="h-4 w-4 text-blue-500" />
            Distribuzione Geografica
          </h4>
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
              <div>
                <p className="text-sm text-gray-700 mb-2">
                  {GBIFService.formatDistributionText(results.gbifInfo)}
                </p>
                {results.gbifInfo.nativeCountries?.length > 0 && (
                  <div className="mb-2">
                    <span className="text-sm font-medium text-gray-700">Nativa di: </span>
                    <span className="text-sm text-gray-600">
                      {results.gbifInfo.nativeCountries.slice(0, 5).join(', ')}
                      {results.gbifInfo.nativeCountries.length > 5 && ` e altri ${results.gbifInfo.nativeCountries.length - 5} paesi`}
                    </span>
                  </div>
                )}
                {results.gbifInfo.introducedCountries?.length > 0 && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">Introdotta in: </span>
                    <span className="text-sm text-gray-600">
                      {results.gbifInfo.introducedCountries.slice(0, 3).join(', ')}
                      {results.gbifInfo.introducedCountries.length > 3 && ` e altri ${results.gbifInfo.introducedCountries.length - 3} paesi`}
                    </span>
                  </div>
                )}
              </div>
            </div>
            {results.gbifInfo.family && (
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <TreePine className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">Classificazione Tassonomica</span>
                </div>
                <div className="text-sm text-blue-700">
                  <span className="font-medium">Famiglia:</span> {results.gbifInfo.family}
                  {results.gbifInfo.genus && (
                    <>, <span className="font-medium">Genere:</span> {results.gbifInfo.genus}</>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Analisi Crop Health */}
      {results.cropHealthAnalysis && !isFallback && (
        <div className="bg-white rounded-lg p-4 border border-emerald-100">
          <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Activity className="h-4 w-4 text-emerald-500" />
            Analisi Salute Avanzata
          </h4>
          
          {/* Stato di salute generale */}
          <div className="mb-4">
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-4 h-4 rounded-full ${
                results.cropHealthAnalysis.isHealthy 
                  ? 'bg-green-500' 
                  : results.cropHealthAnalysis.healthScore > 50 
                  ? 'bg-yellow-500' 
                  : 'bg-red-500'
              }`}></div>
              <span className="font-medium">
                Stato di salute: {results.cropHealthAnalysis.healthScore}%
              </span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                results.cropHealthAnalysis.isHealthy 
                  ? 'bg-green-100 text-green-800' 
                  : results.cropHealthAnalysis.healthScore > 50 
                  ? 'bg-yellow-100 text-yellow-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {results.cropHealthAnalysis.isHealthy ? 'Sana' : 'Problemi rilevati'}
              </span>
            </div>
          </div>

          {/* Malattie specifiche rilevate da crop.health */}
          {results.cropHealthAnalysis.diseases?.length > 0 && (
            <div className="mb-4">
              <h5 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Malattie Rilevate (Crop Health Analysis)
              </h5>
              <div className="space-y-3">
                {results.cropHealthAnalysis.diseases.slice(0, 3).map((disease: any, index: number) => (
                  <div key={index} className="bg-red-50 border-l-4 border-red-300 p-3 rounded-r">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-medium text-red-800">{disease.name}</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        disease.severity === 'high' 
                          ? 'bg-red-200 text-red-800'
                          : disease.severity === 'medium'
                          ? 'bg-yellow-200 text-yellow-800'
                          : 'bg-green-200 text-green-800'
                      }`}>
                        {disease.probability}% - {disease.severity}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{disease.description}</p>
                    {disease.symptoms.length > 0 && (
                      <p className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">Sintomi:</span> {disease.symptoms.join(', ')}
                      </p>
                    )}
                    <p className="text-sm text-green-700">
                      <span className="font-medium">Trattamento:</span> {disease.treatment}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suggerimenti */}
          {results.cropHealthAnalysis.suggestions?.length > 0 && (
            <div className="bg-emerald-50 p-3 rounded-lg">
              <h5 className="font-medium text-emerald-800 mb-2">Raccomandazioni</h5>
              <ul className="text-sm text-emerald-700 space-y-1">
                {results.cropHealthAnalysis.suggestions.map((suggestion: string, index: number) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-emerald-500 mt-1">•</span>
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Pulsante per salvare */}
      <div className="text-center pt-4 border-t border-gray-200">
        <Button 
          onClick={() => {
            // Qui sarà implementato il salvataggio
            toast.success(isFallback ? 'Suggerimenti salvati!' : 'Diagnosi salvata con successo!');
          }}
          className={`${isFallback ? 'bg-amber-600 hover:bg-amber-700' : 'bg-green-600 hover:bg-green-700'} text-white`}
        >
          {isFallback ? 'Salva Suggerimenti' : 'Salva Diagnosi'}
        </Button>
        {isFallback && (
          <p className="text-sm text-gray-600 mt-2">
            Ti consigliamo di consultare un esperto per una diagnosi precisa
          </p>
        )}
      </div>
    </div>
  );
};
