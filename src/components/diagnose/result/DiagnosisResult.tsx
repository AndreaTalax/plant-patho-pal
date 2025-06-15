import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Loader2, 
  CheckCircle, 
  AlertTriangle, 
  Repeat, 
  MessageCircle,
  Brain,
  Camera,
  Eye
} from 'lucide-react';
import { DiagnosedDisease, AnalysisDetails, PlantInfo } from '../types';
import EppoDataPanel from './EppoDataPanel';

interface DiagnosisResultProps {
  imageSrc: string;
  plantInfo: PlantInfo;
  analysisData: DiagnosedDisease | null;
  isAnalyzing: boolean;
  onStartNewAnalysis: () => void;
  onChatWithExpert: () => void;
  analysisDetails?: AnalysisDetails;
}

/**
 * Displays diagnosis analysis results based on provided data.
 * @example
 * DiagnosisResult({
 *   imageSrc: 'plantImage.jpg',
 *   plantInfo: {...},
 *   analysisData: {...},
 *   isAnalyzing: true,
 *   onStartNewAnalysis: () => {...},
 *   onChatWithExpert: () => {...},
 *   analysisDetails: {...}
 * })
 * Returns a JSX component displaying the diagnosis status and results.
 * @param {Object} DiagnosisResultProps - Object containing the necessary properties for diagnosis results.
 * @param {string} DiagnosisResultProps.imageSrc - Source URL for the image being analyzed.
 * @param {Object} DiagnosisResultProps.plantInfo - Information about the plant.
 * @param {Object} DiagnosisResultProps.analysisData - Data resulting from the plant analysis.
 * @param {boolean} DiagnosisResultProps.isAnalyzing - Flag indicating if analysis is currently in progress.
 * @param {Function} DiagnosisResultProps.onStartNewAnalysis - Function to initiate a new analysis.
 * @param {Function} DiagnosisResultProps.onChatWithExpert - Function to contact an expert for further advice.
 * @param {Object} DiagnosisResultProps.analysisDetails - Additional details from the AI analysis.
 * @returns {JSX.Element} JSX component displaying the plant analysis status and results.
 * @description
 *   - Displays a loader and message during the plant analysis process.
 *   - Provides visual feedback with icons and colors based on analysis confidence and health status.
 *   - Offers actionable buttons for retrying analysis or consulting an expert.
 *   - Includes specific sections like symptoms, treatments, and detailed AI analysis if data is available.
 */
const DiagnosisResult = ({
  imageSrc,
  plantInfo,
  analysisData,
  isAnalyzing,
  onStartNewAnalysis,
  onChatWithExpert,
  analysisDetails
}: DiagnosisResultProps) => {
  if (isAnalyzing) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-8">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-drplant-blue" />
            <h3 className="text-xl font-semibold">Analisi in corso...</h3>
            <p className="text-gray-600 text-center">
              Stiamo analizzando la tua pianta con l'intelligenza artificiale
            </p>
            {imageSrc && (
              <div className="w-64 h-64 rounded-lg overflow-hidden border">
                <img 
                  src={imageSrc} 
                  alt="Pianta in analisi" 
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analysisData) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-8">
          <div className="flex flex-col items-center space-y-4">
            <AlertTriangle className="h-12 w-12 text-yellow-500" />
            <h3 className="text-xl font-semibold">Analisi non completata</h3>
            <p className="text-gray-600 text-center">
              Non siamo riusciti ad analizzare la tua pianta. Riprova o contatta un esperto.
            </p>
            <div className="flex gap-3">
              <Button onClick={onStartNewAnalysis} variant="outline">
                <Repeat className="mr-2 h-4 w-4" />
                Riprova
              </Button>
              <Button onClick={onChatWithExpert} className="bg-drplant-blue hover:bg-drplant-blue-dark">
                <MessageCircle className="mr-2 h-4 w-4" />
                Chat con Esperto
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const confidencePercentage = Math.round(analysisData.confidence * 100);
  const isHighConfidence = analysisData.confidence >= 0.8;

  return (
    <div className="space-y-6">
      {/* Immagine e risultato principale */}
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              {analysisData.healthy ? (
                <CheckCircle className="h-6 w-6 text-green-600" />
              ) : (
                <AlertTriangle className="h-6 w-6 text-red-600" />
              )}
              {analysisData.name}
            </CardTitle>
            <Badge variant={isHighConfidence ? "default" : "secondary"}>
              {confidencePercentage}% accuratezza
            </Badge>
          </div>
          <CardDescription>
            {analysisData.description}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Immagine */}
          {imageSrc && (
            <div className="aspect-square w-full max-w-sm mx-auto overflow-hidden rounded-xl border">
              <img 
                src={imageSrc} 
                alt="Pianta analizzata" 
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Disclaimer se accuratezza bassa */}
          {analysisData.disclaimer && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <p className="text-sm text-yellow-800">{analysisData.disclaimer}</p>
              </div>
            </div>
          )}

          {/* Sintomi */}
          {analysisData.symptoms && analysisData.symptoms.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">Sintomi rilevati:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                {analysisData.symptoms.map((symptom, index) => (
                  <li key={index}>{symptom}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Trattamenti */}
          {analysisData.treatments && analysisData.treatments.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">
                {analysisData.healthy ? 'Cure consigliate:' : 'Trattamenti suggeriti:'}
              </h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                {analysisData.treatments.map((treatment, index) => (
                  <li key={index}>{treatment}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Dettagli analisi */}
          {analysisDetails && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Brain className="h-4 w-4" />
                Dettagli analisi AI
              </h4>
              <div className="text-sm text-gray-600 space-y-1">
                {analysisDetails.analysisTechnology && (
                  <p><strong>Tecnologia:</strong> {analysisDetails.analysisTechnology}</p>
                )}
                {analysisDetails.multiServiceInsights?.plantPart && (
                  <p><strong>Parte analizzata:</strong> {analysisDetails.multiServiceInsights.plantPart}</p>
                )}
                {analysisDetails.sistemaDigitaleFoglia && (
                  <Badge variant="outline" className="mt-2">
                    <Eye className="h-3 w-3 mr-1" />
                    Sistema Digitale Foglia
                  </Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* SEZIONE: Diagnosi dal database EPPO */}
      {analysisDetails?.eppoData?.diseaseMatches && Array.isArray(analysisDetails.eppoData.diseaseMatches) && analysisDetails.eppoData.diseaseMatches.length > 0 && (
        <div className="w-full max-w-2xl mx-auto">
          <EppoDataPanel
            analysisDetails={analysisDetails}
            userInput={
              (analysisData.symptoms && analysisData.symptoms.length > 0)
                ? analysisData.symptoms.join(', ')
                : plantInfo.symptoms || ''
            }
            eppoData={analysisDetails.eppoData.diseaseMatches}
          />
        </div>
      )}

      {/* Azioni */}
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={onStartNewAnalysis} 
              variant="outline" 
              className="flex-1"
            >
              <Camera className="mr-2 h-4 w-4" />
              Nuova Analisi
            </Button>
            
            <Button 
              onClick={onChatWithExpert} 
              className="flex-1 bg-drplant-blue hover:bg-drplant-blue-dark"
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              {analysisData.recommendExpertConsultation ? 
                'Consulta Esperto (Consigliato)' : 
                'Chat con Esperto'
              }
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DiagnosisResult;
