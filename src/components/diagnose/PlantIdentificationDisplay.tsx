import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Leaf, 
  BookOpen, 
  Target, 
  Database, 
  Droplets, 
  Sun, 
  Thermometer,
  Scissors,
  AlertCircle,
  CheckCircle,
  Info
} from 'lucide-react';

interface PlantIdentificationDisplayProps {
  identification: any;
  className?: string;
}

export const PlantIdentificationDisplay: React.FC<PlantIdentificationDisplayProps> = ({ 
  identification,
  className = ""
}) => {
  if (!identification?.identificazioneSuccesso || !identification?.consensus?.mostProbabile) {
    return (
      <Card className={`border-yellow-200 bg-yellow-50 ${className}`}>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-yellow-700">
            <AlertCircle className="h-5 w-5" />
            <span className="font-medium">Identificazione non disponibile</span>
          </div>
          <p className="text-sm text-yellow-600 mt-1">
            Non è stato possibile identificare con certezza questa pianta.
          </p>
        </CardContent>
      </Card>
    );
  }

  const { consensus, dettagliTecnici, informazioniCura, curiosita, identifications } = identification;
  const plantInfo = consensus.mostProbabile;
  const confidence = plantInfo.confidenza || 0;
  
  const getConfidenceColor = (conf: number) => {
    if (conf >= 80) return "text-green-600 bg-green-100 border-green-300";
    if (conf >= 60) return "text-yellow-600 bg-yellow-100 border-yellow-300";
    return "text-red-600 bg-red-100 border-red-300";
  };

  const getConfidenceIcon = (conf: number) => {
    if (conf >= 80) return <CheckCircle className="h-4 w-4" />;
    if (conf >= 60) return <AlertCircle className="h-4 w-4" />;
    return <AlertCircle className="h-4 w-4" />;
  };

  return (
    <Card className={`border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold text-green-800 flex items-center gap-2">
            <Leaf className="h-6 w-6" />
            Identificazione Pianta
          </CardTitle>
          <div className={`flex items-center gap-1 px-3 py-1 rounded-full border text-sm font-medium ${getConfidenceColor(confidence)}`}>
            {getConfidenceIcon(confidence)}
            {confidence}% affidabile
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Informazioni principali della pianta */}
        <div className="bg-white p-4 rounded-lg border border-green-200">
          <div className="text-center mb-4">
            <h2 className="text-2xl font-bold text-green-800 mb-1">
              🌱 {plantInfo.nomeComune}
            </h2>
            {plantInfo.nomeScientifico && plantInfo.nomeScientifico !== plantInfo.nomeComune && (
              <p className="text-lg italic text-green-600">
                {plantInfo.nomeScientifico}
              </p>
            )}
            {(dettagliTecnici.famiglia || plantInfo.famiglia) && (
              <p className="text-sm text-gray-600 mt-1">
                Famiglia: {dettagliTecnici.famiglia || plantInfo.famiglia}
              </p>
            )}
          </div>
          
          {plantInfo.descrizione && (
            <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded border">
              <p>{plantInfo.descrizione}</p>
            </div>
          )}
        </div>

        {/* Fonti di identificazione */}
        {identifications && identifications.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Database className="h-4 w-4 text-blue-600" />
              <h3 className="font-semibold text-gray-800">Fonti di Identificazione</h3>
            </div>
            <div className="space-y-2">
              {identifications.slice(0, 3).map((id: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-2 bg-white rounded border border-gray-200">
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-700">{id.fonte}</span>
                    {id.nomeComune !== plantInfo.nomeComune && (
                      <p className="text-xs text-gray-500">"{id.nomeComune}"</p>
                    )}
                  </div>
                  <Badge variant={id.confidenza >= 70 ? "default" : "secondary"} className="text-xs">
                    {id.confidenza}%
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Informazioni di cura (se disponibili) */}
        {informazioniCura && Object.values(informazioniCura).some(v => v) && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="h-4 w-4 text-green-600" />
              <h3 className="font-semibold text-gray-800">Consigli di Cura</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {informazioniCura.irrigazione && (
                <div className="flex items-start gap-2 p-3 bg-blue-50 rounded border border-blue-200">
                  <Droplets className="h-4 w-4 text-blue-600 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-blue-800">Irrigazione</p>
                    <p className="text-xs text-blue-700">{informazioniCura.irrigazione}</p>
                  </div>
                </div>
              )}
              
              {informazioniCura.luce && (
                <div className="flex items-start gap-2 p-3 bg-yellow-50 rounded border border-yellow-200">
                  <Sun className="h-4 w-4 text-yellow-600 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">Luce</p>
                    <p className="text-xs text-yellow-700">{informazioniCura.luce}</p>
                  </div>
                </div>
              )}
              
              {informazioniCura.temperatura && (
                <div className="flex items-start gap-2 p-3 bg-orange-50 rounded border border-orange-200">
                  <Thermometer className="h-4 w-4 text-orange-600 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-orange-800">Temperatura</p>
                    <p className="text-xs text-orange-700">{informazioniCura.temperatura}</p>
                  </div>
                </div>
              )}
              
              {informazioniCura.potatura && (
                <div className="flex items-start gap-2 p-3 bg-purple-50 rounded border border-purple-200">
                  <Scissors className="h-4 w-4 text-purple-600 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-purple-800">Potatura</p>
                    <p className="text-xs text-purple-700">{informazioniCura.potatura}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Curiosità (se disponibili) */}
        {curiosita && curiosita.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Info className="h-4 w-4 text-indigo-600" />
              <h3 className="font-semibold text-gray-800">Curiosità</h3>
            </div>
            <div className="space-y-2">
              {curiosita.slice(0, 2).map((fatto: string, index: number) => (
                <div key={index} className="p-3 bg-indigo-50 rounded border border-indigo-200">
                  <p className="text-sm text-indigo-800">💡 {fatto}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Disclaimer */}
        <div className="bg-gray-50 border border-gray-200 rounded p-3">
          <p className="text-xs text-gray-600 text-center">
            <strong>Nota:</strong> L'identificazione è basata su analisi AI e database botanici. 
            Per identificazioni critiche o scientifiche, consulta un botanico esperto.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};