import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfidenceBadge } from './ConfidenceBadge';
import { CheckCircle, AlertTriangle, Eye, TrendingUp } from 'lucide-react';
import type { EnhancedAnalysisResult } from '@/services/enhancedPlantAnalysisService';

interface EnhancedResultsViewProps {
  result: EnhancedAnalysisResult;
  imageUrl: string;
  onSendToExpert: () => void;
  onNewAnalysis: () => void;
}

export const EnhancedResultsView: React.FC<EnhancedResultsViewProps> = ({
  result,
  imageUrl,
  onSendToExpert,
  onNewAnalysis
}) => {
  const { consensus } = result;
  const isHighConfidence = consensus.finalConfidence >= 75;
  
  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 90) {
      return <Badge className="bg-green-600 text-white">Altissima Affidabilità ({confidence}%)</Badge>;
    } else if (confidence >= 75) {
      return <Badge className="bg-blue-600 text-white">Alta Affidabilità ({confidence}%)</Badge>;
    } else if (confidence >= 60) {
      return <Badge className="bg-yellow-600 text-white">Media Affidabilità ({confidence}%)</Badge>;
    } else {
      return <Badge className="bg-red-600 text-white">Bassa Affidabilità ({confidence}%)</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header con consenso generale */}
      <Card className={`border-2 ${isHighConfidence ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3">
              {consensus.finalConfidence >= 75 ? (
                <CheckCircle className="h-6 w-6 text-green-600" />
              ) : (
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
              )}
              <span>Analisi Multi-AI Completata</span>
            </CardTitle>
            {getConfidenceBadge(consensus.finalConfidence)}
          </div>
          <div className="space-y-2">
            <p className="text-gray-600">
              Provider migliore: <strong>{consensus.bestProvider}</strong> • 
              Accordo: <strong>{consensus.agreementScore}%</strong> • 
              Provider utilizzati: <strong>{result.analysisMetadata?.aiProvidersUsed?.length || 0}</strong>
            </p>
          </div>
        </CardHeader>
      </Card>

      {/* Identificazione Pianta */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Identificazione Pianta
          </CardTitle>
        </CardHeader>
        <CardContent>
          {result.plantIdentification.length > 0 ? (
            <div className="space-y-4">
              {result.plantIdentification.map((plant, index) => (
                <div key={index} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-lg">{plant.plantName}</h3>
                      {plant.scientificName && (
                        <p className="text-gray-600 italic">{plant.scientificName}</p>
                      )}
                      <p className="text-sm text-gray-500">Provider: {plant.provider}</p>
                    </div>
                    <ConfidenceBadge confidence={plant.confidence} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">Nessuna identificazione disponibile</p>
          )}
        </CardContent>
      </Card>

      {/* Rilevamento Malattie/Problemi */}
      {result.diseaseDetection.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Problemi Rilevati
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {result.diseaseDetection.map((disease, index) => (
                <div key={index} className="border rounded-lg p-4 bg-red-50">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-red-800">{disease.disease}</h3>
                    <Badge variant="destructive">{disease.confidence}%</Badge>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-red-700">
                      <strong>Severità:</strong> {disease.severity}
                    </p>
                    <p className="text-sm text-red-700">
                      <strong>Sintomi:</strong> {disease.symptoms.join(', ')}
                    </p>
                    <p className="text-sm text-red-700">
                      <strong>Trattamenti:</strong> {disease.treatments.join(', ')}
                    </p>
                    <p className="text-xs text-red-600">
                      Provider: {disease.provider}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Consenso Ponderato - Mostra informazioni sui provider */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Provider AI Utilizzati
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {result.analysisMetadata?.aiProvidersUsed?.map((provider, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">{provider}</span>
                <Badge variant="outline">Utilizzato</Badge>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Consenso Multi-AI:</strong> Ogni provider AI contribuisce al risultato finale. 
              Il consenso è calcolato combinando tutti i risultati per la massima accuratezza.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Azioni */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Button 
          onClick={onSendToExpert}
          className="w-full bg-drplant-green hover:bg-drplant-green-dark"
        >
          Invia Risultati all'Esperto
        </Button>
        <Button 
          onClick={onNewAnalysis}
          variant="outline"
          className="w-full"
        >
          Nuova Analisi
        </Button>
      </div>
    </div>
  );
};