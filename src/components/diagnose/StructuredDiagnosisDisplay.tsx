import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Leaf, 
  AlertTriangle, 
  CheckCircle, 
  Droplets, 
  Sun, 
  Thermometer,
  Calendar,
  RefreshCw,
  BookOpen,
  MessageCircle 
} from 'lucide-react';
import { StructuredDiagnosisResult } from '@/services/structuredPlantDiagnosisService';
import { useNavigate } from 'react-router-dom';

interface StructuredDiagnosisDisplayProps {
  diagnosis: StructuredDiagnosisResult;
  onStartNew: () => void;
}

export const StructuredDiagnosisDisplay: React.FC<StructuredDiagnosisDisplayProps> = ({
  diagnosis,
  onStartNew
}) => {
  const navigate = useNavigate();

  const goToExpertChat = () => {
    navigate('/');
    setTimeout(() => {
      const event = new CustomEvent('switchTab', { detail: 'chat' });
      window.dispatchEvent(event);
    }, 100);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header con identificazione pianta */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Leaf className="h-8 w-8 text-green-600" />
              <div>
                <CardTitle className="text-2xl text-green-800">
                  {diagnosis.plantIdentification.name}
                </CardTitle>
                {diagnosis.plantIdentification.scientificName && (
                  <p className="text-sm text-green-600 italic">
                    {diagnosis.plantIdentification.scientificName}
                  </p>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className={`text-2xl font-bold ${getConfidenceColor(diagnosis.plantIdentification.confidence)}`}>
                {diagnosis.plantIdentification.confidence}%
              </div>
              <p className="text-sm text-gray-600">Confidenza identificazione</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-sm">
              {diagnosis.plantIdentification.source === 'combined' ? '👤 + 🤖 Dati Utente + AI' :
               diagnosis.plantIdentification.source === 'user-provided' ? '👤 Dati Utente' : '🤖 Analisi AI'}
            </Badge>
            {diagnosis.plantIdentification.userConfirmation !== undefined && (
              <Badge variant={diagnosis.plantIdentification.userConfirmation ? "default" : "secondary"}>
                {diagnosis.plantIdentification.userConfirmation ? '✅ Confermato' : '❓ Da verificare'}
              </Badge>
            )}
            <Badge variant="outline" className="text-xs">
              Accuratezza: {diagnosis.analysisMetadata.recommendationAccuracy}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Stato di salute */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {diagnosis.healthAssessment.isHealthy ? (
              <CheckCircle className="h-6 w-6 text-green-600" />
            ) : (
              <AlertTriangle className="h-6 w-6 text-red-600" />
            )}
            Stato di Salute
            <span className={`text-lg font-bold ${getConfidenceColor(diagnosis.healthAssessment.confidence)}`}>
              ({diagnosis.healthAssessment.confidence}% confidenza)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {diagnosis.healthAssessment.isHealthy ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800 font-medium">La pianta appare in buona salute! 🌿</p>
              <p className="text-green-600 text-sm mt-1">
                Non sono stati rilevati problemi significativi. Continua con le cure attuali.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-red-800 font-medium">
                Sono stati rilevati {diagnosis.healthAssessment.problems.length} problemi:
              </p>
              {diagnosis.healthAssessment.problems.map((problem, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-lg">{problem.name}</h4>
                    <div className="flex items-center gap-2">
                      <Badge className={getSeverityColor(problem.severity)}>
                        {problem.severity.toUpperCase()}
                      </Badge>
                      <span className={`text-sm font-medium ${getConfidenceColor(problem.confidence)}`}>
                        {problem.confidence}%
                      </span>
                    </div>
                  </div>
                  
                  {problem.symptoms.length > 0 && (
                    <div className="mb-3">
                      <p className="text-sm font-medium text-gray-700 mb-1">Sintomi:</p>
                      <ul className="text-sm text-gray-600 list-disc list-inside">
                        {problem.symptoms.map((symptom, i) => (
                          <li key={i}>{symptom}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {problem.possibleCauses.length > 0 && (
                    <div className="mb-3">
                      <p className="text-sm font-medium text-gray-700 mb-1">Possibili cause:</p>
                      <ul className="text-sm text-gray-600 list-disc list-inside">
                        {problem.possibleCauses.map((cause, i) => (
                          <li key={i}>{cause}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {problem.treatments.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Trattamenti consigliati:</p>
                      <div className="space-y-2">
                        {problem.treatments.map((treatment, i) => (
                          <div key={i} className="bg-blue-50 border border-blue-200 rounded p-3">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="text-xs">
                                {treatment.type === 'immediate' ? '🚨 Immediato' :
                                 treatment.type === 'ongoing' ? '🔄 Continuativo' : '🛡️ Preventivo'}
                              </Badge>
                              <span className="font-medium text-sm">{treatment.action}</span>
                            </div>
                            <p className="text-sm text-gray-600">{treatment.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Raccomandazioni di cura */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-blue-600" />
            Raccomandazioni di Cura Personalizzate
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Irrigazione */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Droplets className="h-5 w-5 text-blue-600" />
              <h4 className="font-medium">Irrigazione</h4>
            </div>
            <div className="space-y-2">
              <p><span className="font-medium">Frequenza:</span> {diagnosis.careRecommendations.watering.frequency}</p>
              <p><span className="font-medium">Metodo:</span> {diagnosis.careRecommendations.watering.method}</p>
              {diagnosis.careRecommendations.watering.warnings.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
                  <p className="text-sm font-medium text-yellow-800 mb-1">⚠️ Attenzioni:</p>
                  <ul className="text-sm text-yellow-700 list-disc list-inside">
                    {diagnosis.careRecommendations.watering.warnings.map((warning, i) => (
                      <li key={i}>{warning}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Illuminazione */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Sun className="h-5 w-5 text-yellow-600" />
              <h4 className="font-medium">Illuminazione</h4>
            </div>
            <div className="space-y-2">
              <p><span className="font-medium">Requisiti:</span> {diagnosis.careRecommendations.lighting.requirements}</p>
              {diagnosis.careRecommendations.lighting.recommendations.length > 0 && (
                <div>
                  <p className="font-medium text-sm mb-1">Raccomandazioni:</p>
                  <ul className="text-sm text-gray-600 list-disc list-inside">
                    {diagnosis.careRecommendations.lighting.recommendations.map((rec, i) => (
                      <li key={i}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Ambiente */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Thermometer className="h-5 w-5 text-green-600" />
              <h4 className="font-medium">Ambiente</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="font-medium">Umidità</p>
                <p className="text-gray-600">{diagnosis.careRecommendations.environment.humidity}</p>
              </div>
              <div>
                <p className="font-medium">Temperatura</p>
                <p className="text-gray-600">{diagnosis.careRecommendations.environment.temperature}</p>
              </div>
              <div>
                <p className="font-medium">Posizione</p>
                <p className="text-gray-600">{diagnosis.careRecommendations.environment.location}</p>
              </div>
            </div>
          </div>

          {/* Nutrizione */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="h-5 w-5 text-purple-600" />
              <h4 className="font-medium">Nutrizione</h4>
            </div>
            <div className="space-y-2">
              <p><span className="font-medium">Fertilizzante:</span> {diagnosis.careRecommendations.nutrition.fertilizer}</p>
              <p><span className="font-medium">Programma:</span> {diagnosis.careRecommendations.nutrition.schedule}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metadata e azioni */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-gray-500">
              <p>Analisi completata il {new Date(diagnosis.analysisMetadata.timestamp).toLocaleString('it-IT')}</p>
              <p>Fonti dati: {diagnosis.analysisMetadata.dataSourcesUsed.join(', ')}</p>
              <p>Confidenza globale: {diagnosis.analysisMetadata.confidenceScore}%</p>
            </div>
          </div>
          
          <Separator className="my-4" />
          
          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={onStartNew} variant="outline" className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Nuova Diagnosi
            </Button>
            
            <Button onClick={goToExpertChat} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700">
              <MessageCircle className="h-4 w-4" />
              Consulta Esperto
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};