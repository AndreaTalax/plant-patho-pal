
import React from 'react';
import {
  AlertTriangle,
  Database,
  Leaf,
  Search,
  Info,
  Lightbulb,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/sonner';
import { ConfidenceBadge } from '@/components/diagnose/ConfidenceBadge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { type CombinedAnalysisResult } from '@/types/analysis';

interface DiagnosisResultsProps {
  results: CombinedAnalysisResult;
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

      {/* Header con pianta identificata */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          {isFallback ? (
            <Lightbulb className="h-6 w-6 text-amber-600" />
          ) : (
            <Leaf className="h-6 w-6 text-green-600" />
          )}
          <h2 className="text-2xl font-bold text-gray-900">
            {isFallback ? 'Suggerimenti Identificazione' : 'Risultati Identificazione'}
          </h2>
        </div>
        
        {mostLikelyPlant && (
          <div className={`${isFallback ? 'bg-amber-50 border-amber-200' : 'bg-white border-green-100'} rounded-lg p-4 shadow-sm border`}>
            <h3 className={`text-xl font-semibold ${isFallback ? 'text-amber-800' : 'text-green-800'} mb-2`}>
              {isFallback ? 'Possibile: ' : ''}{mostLikelyPlant.plantName}
            </h3>
            {mostLikelyPlant.scientificName && (
              <p className="text-gray-600 italic mb-2">
                {mostLikelyPlant.scientificName}
              </p>
            )}
            <div className="flex items-center justify-center gap-4">
              <ConfidenceBadge confidence={mostLikelyPlant.confidence} />
              <span className="text-sm text-gray-500">
                {isFallback ? 'Suggerimento basato su' : 'Identificato da'}: {results.consensus.providersUsed.length} fonti
              </span>
            </div>
            {isFallback && (
              <p className="text-sm text-amber-700 mt-2">
                Questo è un suggerimento - verifica con un esperto per conferma
              </p>
            )}
          </div>
        )}
      </div>

      {/* Fonti di identificazione */}
      {results.consensus.providersUsed.length > 1 && (
        <div className="bg-white rounded-lg p-4 border border-blue-100">
          <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
            <Database className="h-4 w-4" />
            {isFallback ? 'Fonti dei Suggerimenti' : 'Fonti di Identificazione'}
          </h4>
          <div className="flex flex-wrap gap-2">
            {results.consensus.providersUsed.map((provider, index) => (
              <span
                key={index}
                className={`px-2 py-1 rounded-md text-sm ${
                  isFallback 
                    ? 'bg-amber-100 text-amber-800' 
                    : 'bg-blue-100 text-blue-800'
                }`}
              >
                {provider}
              </span>
            ))}
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
