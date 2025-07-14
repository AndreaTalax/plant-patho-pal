
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Shield, Info } from 'lucide-react';

interface EppoDataPanelProps {
  analysisDetails: any;
  userInput?: string;
  eppoData?: any[];
}

const EppoDataPanel = ({ analysisDetails, userInput, eppoData }: EppoDataPanelProps) => {
  // Extract EPPO results from analysis details
  const eppoResultsCount = analysisDetails?.eppoResultsCount || 0;
  const eppoPlantData = analysisDetails?.multiServiceInsights?.eppoPlantIdentification;
  const hasEppoData = eppoResultsCount > 0 || (eppoData && eppoData.length > 0) || eppoPlantData;
  
  if (!hasEppoData) {
    return null;
  }

  // Function to get probability display
  const getProbabilityDisplay = (issue: any) => {
    let probRaw = issue.probability ?? issue.confidence;
    if (typeof probRaw === "number") {
      probRaw = probRaw <= 1 ? (probRaw * 100) : probRaw;
      return `${Math.round(probRaw)}%`;
    }
    return "–%";
  };

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-800">
          <Shield className="h-5 w-5" />
          Database EPPO - Diagnosi Avanzata
        </CardTitle>
        <p className="text-sm text-blue-700">
          Risultati dal database europeo EPPO (European and Mediterranean Plant Protection Organization) 
          per una diagnosi più accurata e completa.
        </p>
        {userInput && (
          <p className="text-xs text-blue-600 italic">
            Sintomi analizzati: "{userInput}"
          </p>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Plant Identification from EPPO */}
        {eppoPlantData && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="text-green-600 mt-1">
                <Info className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-green-800 mb-2">
                  🌿 Identificazione Pianta - Database EPPO
                </h4>
                <div className="space-y-2">
                  <p className="text-green-700">
                    <strong>Nome preferito:</strong> {eppoPlantData.preferredName}
                  </p>
                  {eppoPlantData.scientificName && (
                    <p className="text-green-700">
                      <strong>Nome scientifico:</strong> <em>{eppoPlantData.scientificName}</em>
                    </p>
                  )}
                  <p className="text-green-700">
                    <strong>Codice EPPO:</strong> <code className="bg-green-100 px-1 rounded">{eppoPlantData.eppoCode}</code>
                  </p>
                  {eppoPlantData.otherNames && eppoPlantData.otherNames.length > 0 && (
                    <p className="text-green-700">
                      <strong>Altri nomi:</strong> {eppoPlantData.otherNames.join(', ')}
                    </p>
                  )}
                  {eppoPlantData.taxonomy && (
                    <div className="text-green-600 text-sm">
                      <strong>Tassonomia:</strong>
                      {eppoPlantData.taxonomy.family && (
                        <span className="ml-2">Famiglia: {eppoPlantData.taxonomy.family}</span>
                      )}
                      {eppoPlantData.taxonomy.genus && (
                        <span className="ml-2">Genere: {eppoPlantData.taxonomy.genus}</span>
                      )}
                    </div>
                  )}
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Verificato EPPO Database
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Analysis Enhancement Info */}
        <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
          <Info className="h-4 w-4 text-green-600" />
          <div className="text-sm">
            <span className="font-medium text-green-800">Diagnosi Potenziata:</span>
            <span className="text-green-700 ml-1">
              {eppoResultsCount} corrispondenze trovate nel database EPPO
              {eppoPlantData && " + identificazione pianta"}
            </span>
          </div>
        </div>

        {/* EPPO Results Display */}
        {eppoData && eppoData.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold text-blue-800">Risultati Specifici EPPO:</h4>
            {eppoData.map((issue, idx) => (
              <div key={idx} className="rounded-lg border border-blue-200 bg-white p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-blue-900">
                      {issue.name ?? "Problema non identificato"}
                    </span>
                    {issue.isRegulated && (
                      <Badge variant="destructive" className="text-xs">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        REGOLAMENTATO
                      </Badge>
                    )}
                  </div>
                  <Badge variant="outline" className="text-blue-700">
                    {getProbabilityDisplay(issue)} accuratezza
                  </Badge>
                </div>
                
                <div className="text-sm text-gray-700 mb-2">
                  {issue.description}
                </div>
                
                {issue.treatment && (
                  <div className="text-sm">
                    <span className="font-medium text-green-700">Trattamento: </span>
                    <span className="text-green-600">{issue.treatment}</span>
                  </div>
                )}
                
                {issue.category && (
                  <div className="text-xs text-gray-500 mt-2">
                    Categoria: {issue.category === 'pest' ? 'Parassita' : 
                              issue.category === 'disease' ? 'Malattia' : 'Altro'}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Confidence Enhancement Info */}
        {analysisDetails?.enhancedConfidence && analysisDetails?.originalConfidence && (
          <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="text-sm text-yellow-800">
              <span className="font-medium">Miglioramento Precisione:</span>
              <span className="ml-1">
                {Math.round(analysisDetails.originalConfidence * 100)}% → {Math.round(analysisDetails.enhancedConfidence * 100)}%
              </span>
            </div>
          </div>
        )}

        {/* Warning for regulated organisms */}
        {eppoData?.some(issue => issue.isRegulated) && (
          <div className="p-3 bg-red-50 rounded-lg border border-red-200">
            <div className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-medium text-sm">
                Attenzione: Rilevati organismi regolamentati. 
                Consultazione esperta urgente raccomandata.
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EppoDataPanel;
